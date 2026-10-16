"""
Invoicing, Sibling Discount Engine, Arrears Compounding, and General Ledger Service.
"""
from decimal import Decimal
from datetime import date, timedelta
from typing import List, Optional
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.core.models import School, AcademicSession, Campus
from apps.academics.models import Grade, Section, StudentEnrollment
from apps.authentication.models import StudentProfile, GuardianLink, User
from apps.finance.models import (
    Account, JournalEntry, JournalItem,
    FeeHead, FeeStructure, DiscountRule, LateFeeConfig,
    FeeInvoice, FeeInvoiceItem, FeePayment, FeeWaiver
)


def ensure_default_chart_of_accounts(school: School) -> dict:
    """
    Ensures default baseline Chart of Accounts exists for a school.
    Returns dictionary of standard accounts.
    """
    defaults = [
        ('1010', 'Cash on Hand', 'asset'),
        ('1020', 'Bank Operating Account', 'asset'),
        ('1100', 'Accounts Receivable - Student Fees', 'asset'),
        ('2010', 'Security Deposits Payable', 'liability'),
        ('3010', 'Retained School Earnings', 'equity'),
        ('4010', 'Tuition Fee Income', 'income'),
        ('4020', 'Transport Fee Income', 'income'),
        ('4030', 'Admission & Registration Fee Income', 'income'),
        ('4040', 'Examination Fee Income', 'income'),
        ('4090', 'Miscellaneous & Late Fee Income', 'income'),
        ('5010', 'Faculty & Staff Salaries', 'expense'),
    ]
    accounts = {}
    for code, name, acct_type in defaults:
        account, _ = Account.objects.get_or_create(
            school=school,
            code=code,
            defaults={
                'name': name,
                'account_type': acct_type,
                'is_active': True,
                'is_closed': False,
            }
        )
        accounts[code] = account
    return accounts


class InvoicingService:
    @staticmethod
    def calculate_sibling_order(student: StudentProfile) -> int:
        """
        Determines student's sibling order (1st child, 2nd child, 3rd child, etc.)
        based on active enrolled siblings sharing the same primary guardian.
        """
        primary_link = GuardianLink.objects.filter(student=student.user, is_primary=True).first()
        if not primary_link:
            return 1

        guardian = primary_link.parent
        sibling_links = GuardianLink.objects.filter(
            parent=guardian,
            school=student.school
        ).select_related('student', 'student__student_profile').order_by(
            'student__student_profile__date_of_birth', 'created_at'
        )

        sibling_ids = [link.student_id for link in sibling_links]
        if student.user_id in sibling_ids:
            return sibling_ids.index(student.user_id) + 1
        return 1

    @classmethod
    def generate_monthly_invoices(
        cls,
        school: School,
        session: AcademicSession,
        month: str,  # Format "YYYY-MM"
        due_date: date,
        grade: Optional[Grade] = None,
        campus: Optional[Campus] = None,
        created_by: Optional[User] = None
    ) -> List[FeeInvoice]:
        """
        Batch generates monthly fee invoices for all active enrollments in a session/grade.
        Automatically applies sibling discounts and rolls forward previous unpaid arrears.
        """
        enrollments_qs = StudentEnrollment.objects.filter(
            school=school,
            session=session,
            status='enrolled',
            student__is_active=True
        ).select_related('student', 'section', 'section__grade', 'campus')

        if grade:
            enrollments_qs = enrollments_qs.filter(section__grade=grade)
        if campus:
            enrollments_qs = enrollments_qs.filter(campus=campus)

        late_config = LateFeeConfig.objects.filter(school=school).first()
        grace_days = late_config.grace_period_days if late_config else 5

        # Preload active fee structures for this session
        structures = list(FeeStructure.objects.filter(
            school=school,
            session=session,
            is_active=True
        ).select_related('fee_head', 'grade'))

        # Preload active discount rules
        discount_rules = list(DiscountRule.objects.filter(school=school, is_active=True))

        created_invoices = []

        with transaction.atomic():
            # Get existing max invoice counter for this school and month
            seq = FeeInvoice.objects.filter(school=school, month=month).count()

            for enrollment in enrollments_qs:
                student_user = enrollment.student
                student_profile = getattr(student_user, 'student_profile', None)
                if not student_profile:
                    continue

                student_grade = enrollment.section.grade if enrollment.section else None
                student_campus = enrollment.campus or (student_grade.campus if student_grade else None)

                # Skip if student already has an invoice for this month
                if FeeInvoice.objects.filter(school=school, student=student_profile, month=month).exists():
                    continue

                seq += 1
                inv_num = f"INV-{month.replace('-', '')}-{seq:05d}"
                chl_num = f"CHL-{month.replace('-', '')}-{seq:05d}"

                # 1. Determine prior arrears
                prior_invoice = FeeInvoice.objects.filter(
                    school=school,
                    student=student_profile,
                    balance_due__gt=Decimal('0.00')
                ).exclude(month=month).order_by('-issue_date').first()
                prior_arrears = prior_invoice.balance_due if prior_invoice else Decimal('0.00')

                # 2. Determine sibling discount
                sibling_order = cls.calculate_sibling_order(student_profile)
                sibling_discount_rule = next(
                    (r for r in discount_rules if r.applies_to_sibling_order == sibling_order),
                    None
                )

                # 3. Create invoice header
                invoice = FeeInvoice.objects.create(
                    school=school,
                    campus=student_campus,
                    invoice_number=inv_num,
                    student=student_profile,
                    session=session,
                    month=month,
                    title=f"Monthly Fee Voucher - {month}",
                    issue_date=timezone.localdate(),
                    due_date=due_date,
                    grace_period_days=grace_days,
                    status='unpaid',
                    arrears_amount=prior_arrears,
                    challan_number=chl_num
                )

                # 4. Generate line items from fee structures
                applicable_structures = [
                    s for s in structures
                    if (s.grade is None or s.grade == student_grade)
                ]

                subtotal = Decimal('0.00')
                total_discount = Decimal('0.00')

                for struct in applicable_structures:
                    item_amount = struct.amount
                    item_discount = Decimal('0.00')

                    # Check if sibling discount applies to this fee head
                    if sibling_discount_rule:
                        if not sibling_discount_rule.applies_to_fee_head or sibling_discount_rule.applies_to_fee_head == struct.fee_head:
                            if sibling_discount_rule.discount_type == 'percentage':
                                item_discount = (item_amount * (sibling_discount_rule.value / Decimal('100.00'))).quantize(Decimal('0.01'))
                            else:
                                item_discount = min(item_amount, sibling_discount_rule.value)

                    FeeInvoiceItem.objects.create(
                        school=school,
                        campus=student_campus,
                        invoice=invoice,
                        fee_head=struct.fee_head,
                        description=f"{struct.fee_head.name} ({month})",
                        amount=item_amount,
                        discount_amount=item_discount,
                        net_amount=max(Decimal('0.00'), item_amount - item_discount)
                    )
                    subtotal += item_amount
                    total_discount += item_discount

                # If prior arrears exist, add as explicit line item if Arrears fee head exists
                if prior_arrears > Decimal('0.00'):
                    arrears_head, _ = FeeHead.objects.get_or_create(
                        school=school,
                        code='ARREARS',
                        defaults={'name': 'Arrears / Prior Balance', 'description': 'Unpaid previous cycle fee'}
                    )
                    FeeInvoiceItem.objects.create(
                        school=school,
                        campus=student_campus,
                        invoice=invoice,
                        fee_head=arrears_head,
                        description=f"Carried-forward Arrears from Prior Months",
                        amount=prior_arrears,
                        discount_amount=Decimal('0.00'),
                        net_amount=prior_arrears
                    )
                    subtotal += prior_arrears

                invoice.subtotal = subtotal
                invoice.discount_amount = total_discount
                invoice.total_amount = (subtotal - total_discount)
                invoice.balance_due = invoice.total_amount
                invoice.save()

                created_invoices.append(invoice)

        return created_invoices

    @staticmethod
    def apply_late_fees(school: School) -> int:
        """
        Inspects overdue invoices past the 5-day grace period and compounds configured late fees.
        """
        late_config = LateFeeConfig.objects.filter(school=school).first()
        if not late_config or not late_config.is_enabled:
            return 0

        today = timezone.localdate()
        invoices_to_check = FeeInvoice.objects.filter(
            school=school,
            status__in=['unpaid', 'partially_paid'],
            late_fee_amount=Decimal('0.00')
        )

        applied_count = 0
        with transaction.atomic():
            for inv in invoices_to_check:
                grace_expiry = inv.due_date + timedelta(days=inv.grace_period_days)
                if today > grace_expiry:
                    # Calculate late fee
                    if late_config.calculation_type == 'percentage':
                        # Percentage of unpaid tuition or balance due
                        calculated_fee = (inv.balance_due * (late_config.amount_or_percent / Decimal('100.00'))).quantize(Decimal('0.01'))
                    else:
                        calculated_fee = late_config.amount_or_percent

                    fee_applied = min(calculated_fee, late_config.max_cap_amount)
                    inv.late_fee_amount = fee_applied
                    inv.status = 'overdue'
                    inv.total_amount += fee_applied
                    inv.balance_due += fee_applied
                    inv.save()
                    applied_count += 1

        return applied_count

    @staticmethod
    def record_fee_payment(
        invoice: FeeInvoice,
        amount_paid: Decimal,
        payment_method: str = 'cash',
        transaction_reference: str = '',
        collected_by: Optional[User] = None,
        notes: str = ''
    ) -> FeePayment:
        """
        Records a fee payment, validates bounds, updates invoice balance and status,
        and posts double-entry journal items to the school's General Ledger.
        """
        if amount_paid <= Decimal('0.00'):
            raise ValidationError("Payment amount must be strictly greater than zero.")
        if amount_paid > invoice.balance_due:
            raise ValidationError(f"Payment amount ({amount_paid}) exceeds invoice balance due ({invoice.balance_due}).")

        school = invoice.school
        campus = invoice.campus
        coa = ensure_default_chart_of_accounts(school)

        with transaction.atomic():
            # Generate payment number
            pay_seq = FeePayment.objects.filter(school=school).count() + 1
            pay_num = f"PAY-{timezone.localdate().strftime('%Y%m')}-{pay_seq:05d}"
            rec_num = f"REC-{timezone.localdate().strftime('%Y%m')}-{pay_seq:05d}"

            payment = FeePayment.objects.create(
                school=school,
                campus=campus,
                payment_number=pay_num,
                invoice=invoice,
                student=invoice.student,
                amount_paid=amount_paid,
                payment_date=timezone.localdate(),
                payment_method=payment_method,
                transaction_reference=transaction_reference,
                receipt_number=rec_num,
                collected_by=collected_by,
                notes=notes
            )

            # Update invoice balance and status
            invoice.paid_amount += amount_paid
            invoice.balance_due = max(Decimal('0.00'), invoice.total_amount - invoice.paid_amount)
            if invoice.balance_due == Decimal('0.00'):
                invoice.status = 'paid'
            else:
                invoice.status = 'partially_paid'
            invoice.save()

            # Double-Entry General Ledger Posting
            # Debit: Cash (1010) or Bank (1020)
            # Credit: Accounts Receivable - Student Fees (1100)
            debit_account = coa['1020'] if payment_method in ('bank_transfer', 'jazzcash', 'easypaisa', 'safepay', 'payfast') else coa['1010']
            credit_account = coa['1100']

            j_seq = JournalEntry.objects.filter(school=school).count() + 1
            entry = JournalEntry.objects.create(
                school=school,
                campus=campus,
                entry_number=f"JE-{timezone.localdate().strftime('%Y%m')}-{j_seq:05d}",
                entry_date=timezone.localdate(),
                reference=payment.payment_number,
                description=f"Fee collection for {invoice.student.user.get_full_name()} (Inv: {invoice.invoice_number})",
                created_by=collected_by
            )

            JournalItem.objects.create(
                school=school,
                campus=campus,
                entry=entry,
                account=debit_account,
                entry_type='debit',
                amount=amount_paid
            )

            JournalItem.objects.create(
                school=school,
                campus=campus,
                entry=entry,
                account=credit_account,
                entry_type='credit',
                amount=amount_paid
            )

        return payment

    @staticmethod
    def apply_fee_waiver(
        invoice: FeeInvoice,
        waived_amount: Decimal,
        reason: str,
        waived_by: User
    ) -> FeeWaiver:
        """
        Applies an audited administrative fee waiver, updating invoice totals and logging justification.
        """
        if waived_amount <= Decimal('0.00'):
            raise ValidationError("Waiver amount must be strictly greater than zero.")
        if waived_amount > invoice.balance_due:
            raise ValidationError(f"Waiver amount ({waived_amount}) cannot exceed current balance due ({invoice.balance_due}).")
        if not reason or len(reason.strip()) < 5:
            raise ValidationError("A clear administrative justification is required to waive fees.")

        with transaction.atomic():
            waiver = FeeWaiver.objects.create(
                school=invoice.school,
                campus=invoice.campus,
                invoice=invoice,
                waived_amount=waived_amount,
                reason=reason.strip(),
                waived_by=waived_by
            )

            invoice.discount_amount += waived_amount
            invoice.total_amount = max(Decimal('0.00'), invoice.total_amount - waived_amount)
            invoice.balance_due = max(Decimal('0.00'), invoice.total_amount - invoice.paid_amount)
            if invoice.balance_due == Decimal('0.00'):
                invoice.status = 'waived' if invoice.paid_amount == Decimal('0.00') else 'paid'
            invoice.save()

        return waiver
