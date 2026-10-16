"""
Finance, Fee Schedules, Invoicing, General Ledger, Waivers, and Gateway Models.
Protected by multi-tenant PostgreSQL Row-Level Security (RLS).
"""
import uuid
from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.conf import settings
from apps.core.models import BaseTenantModel, School, Campus, AcademicSession
from apps.academics.models import Grade, Section
from apps.authentication.models import StudentProfile

User = settings.AUTH_USER_MODEL


class Account(BaseTenantModel):
    """
    Chart of Accounts (COA) for double-entry school bookkeeping.
    Supports parent/child hierarchies and prevents postings to closed accounts.
    """
    TYPE_CHOICES = [
        ('asset', 'Asset (e.g. Cash, Bank, Student Receivables)'),
        ('liability', 'Liability (e.g. Security Deposits, Advance Fees)'),
        ('equity', 'Equity / Retained Earnings'),
        ('income', 'Income (e.g. Tuition, Transport, Exam Fees)'),
        ('expense', 'Expense (e.g. Salaries, Utilities, Supplies)'),
    ]

    code = models.CharField(max_length=32, db_index=True)
    name = models.CharField(max_length=150)
    account_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='sub_accounts')
    is_active = models.BooleanField(default=True)
    is_closed = models.BooleanField(default=False, help_text="Closed accounts block new postings.")
    description = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = 'Chart of Accounts Item'
        verbose_name_plural = 'Chart of Accounts Items'
        unique_together = ('school', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name} ({self.account_type.upper()})"

    @property
    def current_balance(self) -> Decimal:
        """
        Dynamically calculates running balance:
        - Asset / Expense: Total Debits - Total Credits
        - Liability / Equity / Income: Total Credits - Total Debits
        """
        debits = self.journal_items.filter(entry_type='debit').aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
        credits = self.journal_items.filter(entry_type='credit').aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
        if self.account_type in ('asset', 'expense'):
            return debits - credits
        else:
            return credits - debits


class JournalEntry(BaseTenantModel):
    """
    Double-entry accounting journal transaction header.
    Total debits must strictly equal total credits.
    """
    entry_number = models.CharField(max_length=64, db_index=True)
    entry_date = models.DateField(default=timezone.now)
    reference = models.CharField(max_length=128, blank=True, default="", help_text="e.g. INV-2026-001 or PAY-001")
    description = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        verbose_name = 'Journal Entry'
        verbose_name_plural = 'Journal Entries'
        unique_together = ('school', 'entry_number')
        ordering = ['-entry_date', '-created_at']

    def __str__(self):
        return f"{self.entry_number} ({self.entry_date})"

    def clean(self):
        super().clean()
        if self.pk:
            debits = self.items.filter(entry_type='debit').aggregate(t=models.Sum('amount'))['t'] or Decimal('0.00')
            credits = self.items.filter(entry_type='credit').aggregate(t=models.Sum('amount'))['t'] or Decimal('0.00')
            if debits != credits:
                raise ValidationError("Double-entry violation: Total debits must equal total credits.")


class JournalItem(BaseTenantModel):
    """
    Individual debit or credit posting line.
    """
    ENTRY_CHOICES = [
        ('debit', 'Debit'),
        ('credit', 'Credit'),
    ]

    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='items')
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='journal_items')
    entry_type = models.CharField(max_length=10, choices=ENTRY_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'Journal Item'
        verbose_name_plural = 'Journal Items'

    def clean(self):
        super().clean()
        if self.account.is_closed:
            raise ValidationError(f"Cannot post transaction: Account '{self.account.name}' is closed.")
        if self.amount <= Decimal('0.00'):
            raise ValidationError("Transaction amount must be strictly greater than zero.")


class FeeHead(BaseTenantModel):
    """
    Categories of fees charged to students (Tuition, Transport, Admission, Exam, Arrears, etc.).
    """
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=64, db_index=True)
    description = models.TextField(blank=True, default="")
    is_refundable = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    income_account = models.ForeignKey(
        Account, null=True, blank=True, on_delete=models.SET_NULL, related_name='fee_heads'
    )

    class Meta:
        verbose_name = 'Fee Head'
        verbose_name_plural = 'Fee Heads'
        unique_together = ('school', 'code')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class FeeStructure(BaseTenantModel):
    """
    Fee schedule defining baseline tariffs per Academic Session and Grade/Campus.
    """
    FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('term', 'Term-Wise'),
        ('annual', 'Annual'),
        ('one_time', 'One-Time (e.g. Admission)'),
    ]

    session = models.ForeignKey(AcademicSession, on_delete=models.PROTECT, related_name='fee_structures')
    grade = models.ForeignKey(Grade, null=True, blank=True, on_delete=models.PROTECT, related_name='fee_structures')
    fee_head = models.ForeignKey(FeeHead, on_delete=models.PROTECT, related_name='structures')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    billing_frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Fee Structure'
        verbose_name_plural = 'Fee Structures'
        unique_together = ('school', 'session', 'grade', 'fee_head')
        ordering = ['grade', 'fee_head']

    def __str__(self):
        grade_name = self.grade.name if self.grade else "All Grades"
        return f"{grade_name} - {self.fee_head.name}: {self.amount} ({self.billing_frequency})"


class DiscountRule(BaseTenantModel):
    """
    Automated discount policy (e.g., Sibling discounts, Staff discounts, Scholarships).
    """
    TYPE_CHOICES = [
        ('percentage', 'Percentage (%)'),
        ('fixed_amount', 'Fixed Amount (PKR)'),
    ]

    name = models.CharField(max_length=150)
    discount_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='percentage')
    value = models.DecimalField(max_digits=10, decimal_places=2)
    applies_to_sibling_order = models.PositiveSmallIntegerField(
        default=0,
        help_text="2 for 2nd child (e.g. 20%), 3 for 3rd child+ (e.g. 50%); 0 if not sibling-based."
    )
    applies_to_fee_head = models.ForeignKey(
        FeeHead, null=True, blank=True, on_delete=models.SET_NULL, related_name='discount_rules',
        help_text="Applies strictly to this fee head (e.g. Tuition only). If empty, applies across total invoice."
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Discount Rule'
        verbose_name_plural = 'Discount Rules'

    def __str__(self):
        val_str = f"{self.value}%" if self.discount_type == 'percentage' else f"{self.value} PKR"
        return f"{self.name} ({val_str})"


class LateFeeConfig(BaseTenantModel):
    """
    Per-school policy configuration for overdue fines, grace periods, and caps.
    Late fees are disabled by default.
    """
    CALCULATION_CHOICES = [
        ('fixed', 'Fixed Surcharge'),
        ('percentage', 'Percentage of Unpaid Tuition'),
    ]

    is_enabled = models.BooleanField(default=False, help_text="Late fee assessment is disabled by default.")
    calculation_type = models.CharField(max_length=20, choices=CALCULATION_CHOICES, default='fixed')
    amount_or_percent = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('100.00'))
    grace_period_days = models.PositiveIntegerField(default=5, help_text="Default 5 days grace period.")
    max_cap_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('500.00'),
        help_text="Maximum late fee cap preventing runaway compounding."
    )

    class Meta:
        verbose_name = 'Late Fee Configuration'
        verbose_name_plural = 'Late Fee Configurations'
        unique_together = ('school',)

    def __str__(self):
        status = "Enabled" if self.is_enabled else "Disabled"
        return f"Late Fee Config ({status}) - {self.grace_period_days}d Grace, Cap {self.max_cap_amount}"


class FeeInvoice(BaseTenantModel):
    """
    Monthly or Term fee voucher issued to a student.
    Tracks arrears, discounts, payments, balance due, and challan print state.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('unpaid', 'Unpaid'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Fully Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
        ('waived', 'Waived'),
    ]

    invoice_number = models.CharField(max_length=64, db_index=True)
    student = models.ForeignKey(StudentProfile, on_delete=models.PROTECT, related_name='fee_invoices')
    session = models.ForeignKey(AcademicSession, on_delete=models.PROTECT, related_name='fee_invoices')
    month = models.CharField(max_length=7, db_index=True, help_text="Billing month in YYYY-MM format")
    title = models.CharField(max_length=200, help_text="e.g. Monthly Fee Challan - October 2026")
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    grace_period_days = models.PositiveIntegerField(default=5)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid', db_index=True)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    arrears_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="Unpaid dues from prior cycles.")
    late_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Bank Challan Credentials
    challan_number = models.CharField(max_length=64, blank=True, default="")
    bank_name = models.CharField(max_length=150, default="Habib Bank Limited (HBL)")
    bank_account_number = models.CharField(max_length=64, default="00427900123403")
    bank_branch = models.CharField(max_length=150, default="Main Branch")

    class Meta:
        verbose_name = 'Fee Invoice'
        verbose_name_plural = 'Fee Invoices'
        unique_together = ('school', 'invoice_number')
        ordering = ['-issue_date', 'student']

    def __str__(self):
        return f"{self.invoice_number} - {self.student.user.get_full_name()} ({self.month}) [{self.status.upper()}]"

    def recalculate_totals(self):
        """
        Recalculates subtotal, discounts, total_amount, and balance_due.
        """
        items_subtotal = Decimal('0.00')
        items_discount = Decimal('0.00')
        for item in self.items.all():
            items_subtotal += item.amount
            items_discount += item.discount_amount

        self.subtotal = items_subtotal
        self.discount_amount = items_discount
        self.total_amount = (self.subtotal - self.discount_amount) + self.arrears_amount + self.late_fee_amount
        self.balance_due = max(Decimal('0.00'), self.total_amount - self.paid_amount)

        if self.paid_amount >= self.total_amount and self.total_amount > Decimal('0.00'):
            self.status = 'paid'
        elif self.paid_amount > Decimal('0.00'):
            self.status = 'partially_paid'
        elif self.status not in ('draft', 'cancelled', 'waived'):
            # Check overdue based on due_date + grace_period_days
            today = timezone.localdate()
            grace_expiry = self.due_date + timezone.timedelta(days=self.grace_period_days)
            if today > grace_expiry:
                self.status = 'overdue'
            else:
                self.status = 'unpaid'


class FeeInvoiceItem(BaseTenantModel):
    """
    Line item for a FeeInvoice (Tuition, Transport, Admission, Arrears, etc.).
    """
    invoice = models.ForeignKey(FeeInvoice, on_delete=models.CASCADE, related_name='items')
    fee_head = models.ForeignKey(FeeHead, on_delete=models.PROTECT)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = 'Fee Invoice Item'
        verbose_name_plural = 'Fee Invoice Items'

    def clean(self):
        super().clean()
        if self.amount is not None:
            disc = self.discount_amount or Decimal('0.00')
            self.net_amount = max(Decimal('0.00'), self.amount - disc)


class FeePayment(BaseTenantModel):
    """
    Payment record made against a student's FeeInvoice.
    """
    METHOD_CHOICES = [
        ('cash', 'Cash (Counter Collection)'),
        ('bank_transfer', 'Bank Transfer / Deposit Slip'),
        ('cheque', 'Cheque'),
        ('jazzcash', 'JazzCash (Mobile Account / USSD / Card)'),
        ('easypaisa', 'Easypaisa (MA OTC / Wallet)'),
        ('safepay', 'Safepay Checkout'),
        ('payfast', 'PayFast (1Link / Bank Debit)'),
    ]

    payment_number = models.CharField(max_length=64, db_index=True)
    invoice = models.ForeignKey(FeeInvoice, on_delete=models.PROTECT, related_name='payments')
    student = models.ForeignKey(StudentProfile, on_delete=models.PROTECT, related_name='fee_payments')
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField(default=timezone.now)
    payment_method = models.CharField(max_length=32, choices=METHOD_CHOICES, default='cash')
    transaction_reference = models.CharField(max_length=128, blank=True, default="")
    receipt_number = models.CharField(max_length=64, blank=True, default="")
    collected_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    notes = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = 'Fee Payment'
        verbose_name_plural = 'Fee Payments'
        unique_together = ('school', 'payment_number')
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"{self.payment_number} - {self.amount_paid} PKR ({self.payment_method})"


class FeeWaiver(BaseTenantModel):
    """
    Audited administrative fee waiver granted by Principal or School Admin.
    """
    invoice = models.ForeignKey(FeeInvoice, on_delete=models.PROTECT, related_name='waivers')
    waived_amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(help_text="Mandatory administrative justification for waiving fees.")
    waived_by = models.ForeignKey(User, on_delete=models.PROTECT)
    waived_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Fee Waiver'
        verbose_name_plural = 'Fee Waivers'
        ordering = ['-waived_at']

    def __str__(self):
        return f"Waiver {self.waived_amount} PKR on {self.invoice.invoice_number}"


class PaymentGatewayConfig(BaseTenantModel):
    """
    Multi-tenant configuration for online payment gateways (JazzCash, Easypaisa, Safepay, PayFast).
    Each tenant configures their own merchant credentials.
    """
    GATEWAY_CHOICES = [
        ('jazzcash', 'JazzCash'),
        ('easypaisa', 'Easypaisa'),
        ('safepay', 'Safepay'),
        ('payfast', 'PayFast (APPS)'),
    ]

    gateway = models.CharField(max_length=32, choices=GATEWAY_CHOICES)
    is_active = models.BooleanField(default=False)
    is_sandbox = models.BooleanField(default=True, help_text="Whether to use sandbox/test endpoints.")
    merchant_id = models.CharField(max_length=128, blank=True, default="")
    secret_key_or_salt = models.CharField(max_length=255, blank=True, default="")
    webhook_secret = models.CharField(max_length=255, blank=True, default="")
    extra_credentials = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = 'Payment Gateway Configuration'
        verbose_name_plural = 'Payment Gateway Configurations'
        unique_together = ('school', 'gateway')

    def __str__(self):
        env = "Sandbox" if self.is_sandbox else "Production"
        status = "Active" if self.is_active else "Inactive"
        return f"{self.get_gateway_display()} ({status}, {env})"
