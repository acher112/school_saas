"""
Django REST Framework Serializers for Finance, Invoicing, General Ledger & Payments.
"""
from rest_framework import serializers
from apps.finance.models import (
    Account, JournalEntry, JournalItem,
    FeeHead, FeeStructure, DiscountRule, LateFeeConfig,
    FeeInvoice, FeeInvoiceItem, FeePayment, FeeWaiver, PaymentGatewayConfig
)


class AccountSerializer(serializers.ModelSerializer):
    current_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Account
        fields = [
            'id', 'code', 'name', 'account_type', 'parent',
            'is_active', 'is_closed', 'description', 'current_balance',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'current_balance']


class JournalItemSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = JournalItem
        fields = ['id', 'account', 'account_code', 'account_name', 'entry_type', 'amount']


class JournalEntrySerializer(serializers.ModelSerializer):
    items = JournalItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = JournalEntry
        fields = [
            'id', 'entry_number', 'entry_date', 'reference', 'description',
            'created_by', 'created_by_name', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FeeHeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeHead
        fields = ['id', 'name', 'code', 'description', 'is_refundable', 'is_active', 'income_account']
        read_only_fields = ['id']


class FeeStructureSerializer(serializers.ModelSerializer):
    fee_head_name = serializers.CharField(source='fee_head.name', read_only=True)
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    session_name = serializers.CharField(source='session.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'session', 'session_name', 'grade', 'grade_name',
            'fee_head', 'fee_head_name', 'amount', 'billing_frequency', 'is_active'
        ]
        read_only_fields = ['id']


class DiscountRuleSerializer(serializers.ModelSerializer):
    fee_head_name = serializers.CharField(source='applies_to_fee_head.name', read_only=True)

    class Meta:
        model = DiscountRule
        fields = [
            'id', 'name', 'discount_type', 'value', 'applies_to_sibling_order',
            'applies_to_fee_head', 'fee_head_name', 'is_active'
        ]
        read_only_fields = ['id']


class LateFeeConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = LateFeeConfig
        fields = [
            'id', 'is_enabled', 'calculation_type', 'amount_or_percent',
            'grace_period_days', 'max_cap_amount'
        ]
        read_only_fields = ['id']


class FeeInvoiceItemSerializer(serializers.ModelSerializer):
    fee_head_name = serializers.CharField(source='fee_head.name', read_only=True)

    class Meta:
        model = FeeInvoiceItem
        fields = ['id', 'fee_head', 'fee_head_name', 'description', 'amount', 'discount_amount', 'net_amount']
        read_only_fields = ['id', 'net_amount']


class FeeInvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    roll_number = serializers.SerializerMethodField()
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    items = FeeInvoiceItemSerializer(many=True, read_only=True)

    def get_roll_number(self, obj):
        from apps.academics.models import StudentEnrollment
        enr = StudentEnrollment.objects.filter(student=obj.student.user, session=obj.session, status='enrolled').first()
        return enr.roll_number if enr and enr.roll_number else "N/A"

    class Meta:
        model = FeeInvoice
        fields = [
            'id', 'invoice_number', 'student', 'student_name', 'roll_number', 'admission_number',
            'session', 'month', 'title', 'issue_date', 'due_date', 'grace_period_days',
            'status', 'subtotal', 'discount_amount', 'arrears_amount', 'late_fee_amount',
            'total_amount', 'paid_amount', 'balance_due', 'challan_number',
            'bank_name', 'bank_account_number', 'bank_branch', 'items', 'created_at'
        ]
        read_only_fields = [
            'id', 'subtotal', 'discount_amount', 'total_amount', 'balance_due', 'created_at'
        ]


class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    collected_by_name = serializers.CharField(source='collected_by.get_full_name', read_only=True)

    class Meta:
        model = FeePayment
        fields = [
            'id', 'payment_number', 'invoice', 'invoice_number', 'student', 'student_name',
            'amount_paid', 'payment_date', 'payment_method', 'transaction_reference',
            'receipt_number', 'collected_by', 'collected_by_name', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'payment_number', 'receipt_number', 'created_at']


class FeeWaiverSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    waived_by_name = serializers.CharField(source='waived_by.get_full_name', read_only=True)

    class Meta:
        model = FeeWaiver
        fields = [
            'id', 'invoice', 'invoice_number', 'waived_amount', 'reason',
            'waived_by', 'waived_by_name', 'waived_at'
        ]
        read_only_fields = ['id', 'waived_by', 'waived_at']


class PaymentGatewayConfigSerializer(serializers.ModelSerializer):
    gateway_display = serializers.CharField(source='get_gateway_display', read_only=True)

    class Meta:
        model = PaymentGatewayConfig
        fields = [
            'id', 'gateway', 'gateway_display', 'is_active', 'is_sandbox',
            'merchant_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
