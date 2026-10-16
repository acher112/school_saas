"""
REST API ViewSets for Finance, Invoicing, General Ledger, Waivers, and Gateways.
"""
from decimal import Decimal
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.context import get_current_school
from apps.core.models import School, AcademicSession, Campus
from apps.academics.models import Grade
from apps.authentication.models import StudentProfile
from apps.finance.models import (
    Account, JournalEntry, FeeHead, FeeStructure,
    DiscountRule, LateFeeConfig, FeeInvoice, FeePayment,
    FeeWaiver, PaymentGatewayConfig
)
from apps.finance.serializers import (
    AccountSerializer, JournalEntrySerializer, FeeHeadSerializer,
    FeeStructureSerializer, DiscountRuleSerializer, LateFeeConfigSerializer,
    FeeInvoiceSerializer, FeePaymentSerializer, FeeWaiverSerializer,
    PaymentGatewayConfigSerializer
)
from apps.finance.services.invoicing import InvoicingService, ensure_default_chart_of_accounts
from apps.finance.services.challan_pdf import generate_fee_challan_pdf
from apps.finance.gateways.registry import get_payment_gateway


class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        school = get_current_school()
        if not school:
            return Account.objects.none()
        ensure_default_chart_of_accounts(school)
        return Account.objects.filter(school=school)

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class JournalEntryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        school = get_current_school()
        if not school:
            return JournalEntry.objects.none()
        return JournalEntry.objects.filter(school=school).select_related('created_by').prefetch_related('items__account')


class FeeHeadViewSet(viewsets.ModelViewSet):
    serializer_class = FeeHeadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        school = get_current_school()
        if not school:
            return FeeHead.objects.none()
        return FeeHead.objects.filter(school=school)

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class FeeStructureViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        school = get_current_school()
        if not school:
            return FeeStructure.objects.none()
        return FeeStructure.objects.filter(school=school).select_related('session', 'grade', 'fee_head')

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class DiscountRuleViewSet(viewsets.ModelViewSet):
    serializer_class = DiscountRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        school = get_current_school()
        if not school:
            return DiscountRule.objects.none()
        return DiscountRule.objects.filter(school=school).select_related('applies_to_fee_head')

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class LateFeeConfigViewSet(viewsets.ModelViewSet):
    serializer_class = LateFeeConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        school = get_current_school()
        if not school:
            return LateFeeConfig.objects.none()
        return LateFeeConfig.objects.filter(school=school)

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())


class FeeInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = FeeInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        school = get_current_school()
        if not school:
            return FeeInvoice.objects.none()

        qs = FeeInvoice.objects.filter(school=school).select_related(
            'student__user', 'session', 'campus'
        ).prefetch_related('items__fee_head')

        # Filter by student, status, month
        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student_id=student_id)

        inv_status = self.request.query_params.get('status')
        if inv_status:
            qs = qs.filter(status=inv_status)

        month = self.request.query_params.get('month')
        if month:
            qs = qs.filter(month=month)

        return qs

    def perform_create(self, serializer):
        serializer.save(school=get_current_school())

    @action(detail=False, methods=['post'], url_path='bulk-generate')
    def bulk_generate(self, request):
        """
        Batch generates monthly fee invoices for active students.
        """
        school = get_current_school()
        session_id = request.data.get('session_id')
        month = request.data.get('month')  # "YYYY-MM"
        due_date_str = request.data.get('due_date')
        grade_id = request.data.get('grade_id')
        campus_id = request.data.get('campus_id')

        if not session_id or not month or not due_date_str:
            return Response(
                {"error": "session_id, month (YYYY-MM), and due_date are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        session = AcademicSession.objects.filter(school=school, id=session_id).first()
        if not session:
            return Response({"error": "Invalid academic session."}, status=status.HTTP_400_BAD_REQUEST)

        grade = Grade.objects.filter(school=school, id=grade_id).first() if grade_id else None
        campus = Campus.objects.filter(school=school, id=campus_id).first() if campus_id else None

        from datetime import datetime
        due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()

        invoices = InvoicingService.generate_monthly_invoices(
            school=school,
            session=session,
            month=month,
            due_date=due_date,
            grade=grade,
            campus=campus,
            created_by=request.user
        )

        return Response({
            "message": f"Successfully generated {len(invoices)} invoices for {month}.",
            "generated_count": len(invoices),
            "invoice_ids": [str(inv.id) for inv in invoices]
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='apply-late-fees')
    def apply_late_fees(self, request):
        """
        Scans overdue invoices past grace period and applies configured fines.
        """
        school = get_current_school()
        applied = InvoicingService.apply_late_fees(school=school)
        return Response({
            "message": f"Late fees applied to {applied} overdue invoices.",
            "applied_count": applied
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='pay')
    def pay_invoice(self, request, pk=None):
        """
        Records a fee payment against this invoice.
        """
        invoice = self.get_object()
        amount_str = request.data.get('amount')
        method = request.data.get('payment_method', 'cash')
        ref = request.data.get('transaction_reference', '')
        notes = request.data.get('notes', '')

        if not amount_str:
            return Response({"error": "Payment amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount_str))
            payment = InvoicingService.record_fee_payment(
                invoice=invoice,
                amount_paid=amount,
                payment_method=method,
                transaction_reference=ref,
                collected_by=request.user,
                notes=notes
            )
            serializer = FeePaymentSerializer(payment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='waive')
    def waive_fee(self, request, pk=None):
        """
        Applies an audited administrative fee waiver.
        """
        invoice = self.get_object()
        amount_str = request.data.get('amount')
        reason = request.data.get('reason', '')

        if not amount_str or not reason:
            return Response({"error": "Waiver amount and reason are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount_str))
            waiver = InvoicingService.apply_fee_waiver(
                invoice=invoice,
                waived_amount=amount,
                reason=reason,
                waived_by=request.user
            )
            serializer = FeeWaiverSerializer(waiver)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='challan-pdf')
    def challan_pdf(self, request, pk=None):
        """
        Streams a 3-copy fee challan PDF document (Student Copy, School Copy, Bank Copy).
        """
        invoice = self.get_object()
        pdf_bytes = generate_fee_challan_pdf(invoice)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"fee_challan_{invoice.challan_number or invoice.invoice_number}.pdf"
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response


class FeePaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FeePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        school = get_current_school()
        if not school:
            return FeePayment.objects.none()
        return FeePayment.objects.filter(school=school).select_related('invoice', 'student__user', 'collected_by')


class PaymentGatewayViewSet(viewsets.ViewSet):
    """
    Pluggable Pakistani Gateway controller: JazzCash, Easypaisa, Safepay, PayFast.
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='status-list')
    def status_list(self, request):
        """
        Lists available Pakistani gateways and their tenant configuration status.
        """
        school = get_current_school()
        gateways = ['jazzcash', 'easypaisa', 'safepay', 'payfast']
        configs = {cfg.gateway: cfg for cfg in PaymentGatewayConfig.objects.filter(school=school)}

        data = []
        for gw in gateways:
            cfg = configs.get(gw)
            data.append({
                "gateway": gw,
                "name": gw.capitalize() if gw != 'payfast' else 'PayFast (APPS)',
                "is_active": cfg.is_active if cfg else False,
                "is_sandbox": cfg.is_sandbox if cfg else True,
                "status": "ready" if (cfg and cfg.is_active) else "coming_soon",
                "description": f"Supports Pakistani local payment rails via {gw.capitalize()}."
            })
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='initiate')
    def initiate(self, request):
        """
        Initiates an online checkout session or USSD mobile prompt via the selected gateway.
        """
        school = get_current_school()
        invoice_id = request.data.get('invoice_id')
        gateway_type = request.data.get('gateway', 'jazzcash').lower()
        customer_phone = request.data.get('phone', '')
        callback_url = request.data.get('callback_url', 'http://localhost:3000/payments/callback')

        invoice = FeeInvoice.objects.filter(school=school, id=invoice_id).first()
        if not invoice:
            return Response({"error": "Invalid invoice ID."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve or construct gateway configuration
        cfg_obj = PaymentGatewayConfig.objects.filter(school=school, gateway=gateway_type).first()
        config_dict = {
            "merchant_id": cfg_obj.merchant_id if cfg_obj else "DEMO_MERCHANT",
            "secret_key_or_salt": cfg_obj.secret_key_or_salt if cfg_obj else "DEMO_SECRET_KEY_12345",
            "webhook_secret": cfg_obj.webhook_secret if cfg_obj else "DEMO_WEBHOOK_SECRET",
        }
        is_sandbox = cfg_obj.is_sandbox if cfg_obj else True

        try:
            gateway = get_payment_gateway(gateway_type, config=config_dict, is_sandbox=is_sandbox)
            result = gateway.initiate_payment(
                invoice_number=invoice.invoice_number,
                amount=invoice.balance_due,
                customer_phone=customer_phone,
                customer_email=invoice.student.user.email or "billing@example.com",
                callback_url=callback_url,
                metadata={"invoice_id": str(invoice.id), "school_slug": school.slug}
            )
            return Response({
                "checkout_url": result.checkout_url,
                "gateway_reference": result.gateway_reference,
                "requires_redirect": result.requires_redirect,
                "ussd_prompt_sent": result.ussd_prompt_sent,
                "message": result.message
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
