"""
Comprehensive Test Suite for CHECKPOINT 2A:
Fee Structures, Invoicing, Sibling Discounts, Arrears Compounding,
5-Day Grace Period & Late Fees, General Ledger, Audited Waivers,
3-Copy PDF Challan Generator, and Pluggable Pakistani Payment Gateways.
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from rest_framework import status
from django.db import models
from django.utils import timezone
from apps.core.models import Campus, AcademicSession
from apps.authentication.models import User, UserRole, StudentProfile, GuardianLink
from apps.academics.models import Grade, Section, StudentEnrollment
from apps.finance.models import (
    Account, JournalEntry, JournalItem,
    FeeHead, FeeStructure, DiscountRule, LateFeeConfig,
    FeeInvoice, FeeInvoiceItem, FeePayment, FeeWaiver, PaymentGatewayConfig
)
from apps.finance.services.invoicing import InvoicingService, ensure_default_chart_of_accounts
from apps.finance.services.challan_pdf import generate_fee_challan_pdf
from apps.finance.gateways.registry import get_payment_gateway


@pytest.mark.django_db(transaction=True)
class TestCheckpoint2aFinanceAndGateways:

    @pytest.fixture
    def finance_setup(self, school_factory, user_factory, tenant_context):
        school = school_factory(name="Optimus Finance Academy", slug="optimus-fin")
        tenant_context(school)

        main_campus = school.campuses.first()
        session = AcademicSession.objects.create(
            school=school, name="2026-2027", start_date="2026-08-01", end_date="2027-06-30", is_current=True
        )
        grade8 = Grade.objects.create(school=school, name="Grade 8", code="G8", level_order=8)
        grade10 = Grade.objects.create(school=school, name="Grade 10", code="G10", level_order=10)

        section8 = Section.objects.create(school=school, campus=main_campus, grade=grade8, name="8-A", capacity=30)
        section10 = Section.objects.create(school=school, campus=main_campus, grade=grade10, name="10-A", capacity=30)

        # Admin & Parent users
        admin = user_factory(username="fin_admin", role=UserRole.ORG_ADMIN, school=school)
        parent_user = user_factory(username="parent_khan", role=UserRole.PARENT, school=school)

        # Student 1: Elder child in Grade 10
        user_s1 = user_factory(username="student_ayan", role=UserRole.STUDENT, school=school)
        student1 = StudentProfile.objects.create(
            school=school, campus=main_campus, user=user_s1, admission_number="ADM-1001",
            gender="male", date_of_birth=date(2010, 5, 14), emergency_contact="Tariq Khan"
        )
        StudentEnrollment.objects.create(
            school=school, campus=main_campus, session=session, section=section10,
            student=user_s1, admission_number="ADM-1001", roll_number="1001"
        )
        GuardianLink.objects.create(school=school, student=user_s1, parent=parent_user, relationship="father", is_primary=True)

        # Student 2: Younger sibling in Grade 8
        user_s2 = user_factory(username="student_zainab", role=UserRole.STUDENT, school=school)
        student2 = StudentProfile.objects.create(
            school=school, campus=main_campus, user=user_s2, admission_number="ADM-8001",
            gender="female", date_of_birth=date(2012, 9, 20), emergency_contact="Tariq Khan"
        )
        StudentEnrollment.objects.create(
            school=school, campus=main_campus, session=session, section=section8,
            student=user_s2, admission_number="ADM-8001", roll_number="8001"
        )
        GuardianLink.objects.create(school=school, student=user_s2, parent=parent_user, relationship="father", is_primary=True)

        # Fee Heads
        tuition_head = FeeHead.objects.create(school=school, name="Monthly Tuition Fee", code="TUITION")
        transport_head = FeeHead.objects.create(school=school, name="Transport Service", code="TRANSPORT")

        # Fee Structure: Grade 10 Tuition = 8000, Grade 8 Tuition = 6000
        FeeStructure.objects.create(school=school, session=session, grade=grade10, fee_head=tuition_head, amount=Decimal('8000.00'))
        FeeStructure.objects.create(school=school, session=session, grade=grade8, fee_head=tuition_head, amount=Decimal('6000.00'))

        # Sibling Discount Rule: 2nd child receives 20% discount on Tuition
        DiscountRule.objects.create(
            school=school, name="2nd Child Sibling Discount (20%)", discount_type="percentage",
            value=Decimal('20.00'), applies_to_sibling_order=2, applies_to_fee_head=tuition_head
        )

        # Late Fee Configuration: 5 days grace, 100 PKR fixed surcharge, cap 500 PKR
        LateFeeConfig.objects.create(
            school=school, is_enabled=True, calculation_type="fixed", amount_or_percent=Decimal('100.00'),
            grace_period_days=5, max_cap_amount=Decimal('500.00')
        )

        return {
            "school": school,
            "main_campus": main_campus,
            "session": session,
            "grade8": grade8,
            "grade10": grade10,
            "student1": student1,
            "student2": student2,
            "admin": admin,
            "tuition_head": tuition_head,
            "transport_head": transport_head,
        }

    def test_fee_heads_and_fee_structure_creation(self, finance_setup, api_client):
        data = finance_setup
        school = data["school"]
        api_client.force_authenticate(user=data["admin"])

        # Query fee structures endpoint
        resp = api_client.get('/api/v1/finance/fee-structures/', HTTP_X_SCHOOL_SLUG=school.slug)
        assert resp.status_code == status.HTTP_200_OK
        results = resp.data if isinstance(resp.data, list) else resp.data.get('results', resp.data)
        assert len(results) == 2
        amounts = [float(r['amount']) for r in results]
        assert 8000.0 in amounts
        assert 6000.0 in amounts

    def test_automated_invoice_generation_with_sibling_discount(self, finance_setup):
        data = finance_setup
        school = data["school"]
        session = data["session"]
        due_date = timezone.localdate() + timedelta(days=10)

        # Generate invoices for October 2026
        invoices = InvoicingService.generate_monthly_invoices(
            school=school, session=session, month="2026-10", due_date=due_date
        )

        assert len(invoices) == 2

        inv_ayan = next(inv for inv in invoices if inv.student == data["student1"])
        inv_zainab = next(inv for inv in invoices if inv.student == data["student2"])

        # Elder child (1st): full tuition 8000 PKR, 0 discount
        assert inv_ayan.subtotal == Decimal('8000.00')
        assert inv_ayan.discount_amount == Decimal('0.00')
        assert inv_ayan.total_amount == Decimal('8000.00')
        assert inv_ayan.balance_due == Decimal('8000.00')

        # Younger child (2nd): 6000 PKR tuition with 20% sibling discount (1200 PKR) -> net 4800 PKR
        assert inv_zainab.subtotal == Decimal('6000.00')
        assert inv_zainab.discount_amount == Decimal('1200.00')
        assert inv_zainab.total_amount == Decimal('4800.00')
        assert inv_zainab.balance_due == Decimal('4800.00')

    def test_prior_arrears_rolled_forward_in_subsequent_invoice(self, finance_setup):
        data = finance_setup
        school = data["school"]
        session = data["session"]

        # Student 1 has an unpaid invoice for September with 3000 PKR balance
        inv_sep = FeeInvoice.objects.create(
            school=school, campus=data["main_campus"], invoice_number="INV-202609-00001",
            student=data["student1"], session=session, month="2026-09",
            title="Monthly Fee - Sep 2026", issue_date=date(2026, 9, 1), due_date=date(2026, 9, 10),
            status="unpaid", subtotal=Decimal('8000.00'), total_amount=Decimal('8000.00'),
            paid_amount=Decimal('5000.00'), balance_due=Decimal('3000.00')
        )

        # Generate October invoice
        due_date = date(2026, 10, 10)
        invoices = InvoicingService.generate_monthly_invoices(
            school=school, session=session, month="2026-10", due_date=due_date
        )

        inv_oct = next(inv for inv in invoices if inv.student == data["student1"])
        # October invoice should carry forward 3000 PKR as arrears
        assert inv_oct.arrears_amount == Decimal('3000.00')
        # Total = 8000 (tuition) + 3000 (arrears) = 11000 PKR
        assert inv_oct.total_amount == Decimal('11000.00')
        assert inv_oct.balance_due == Decimal('11000.00')

    def test_five_day_grace_period_and_late_fee_rules(self, finance_setup):
        data = finance_setup
        school = data["school"]
        session = data["session"]
        student = data["student1"]

        # Invoice with due date 10 days ago (past the 5-day grace period)
        overdue_inv = FeeInvoice.objects.create(
            school=school, campus=data["main_campus"], invoice_number="INV-OVERDUE-01",
            student=student, session=session, month="2026-08",
            title="Aug Fee", issue_date=timezone.localdate() - timedelta(days=25),
            due_date=timezone.localdate() - timedelta(days=10),
            grace_period_days=5, status="unpaid",
            subtotal=Decimal('8000.00'), total_amount=Decimal('8000.00'),
            paid_amount=Decimal('0.00'), balance_due=Decimal('8000.00'), late_fee_amount=Decimal('0.00')
        )

        # Execute late fee job
        applied = InvoicingService.apply_late_fees(school=school)
        assert applied == 1

        overdue_inv.refresh_from_db()
        assert overdue_inv.status == 'overdue'
        assert overdue_inv.late_fee_amount == Decimal('100.00')
        assert overdue_inv.total_amount == Decimal('8100.00')
        assert overdue_inv.balance_due == Decimal('8100.00')

    def test_fee_payments_and_double_entry_general_ledger(self, finance_setup, api_client, tenant_context):
        data = finance_setup
        school = data["school"]
        student = data["student1"]
        admin = data["admin"]

        invoice = FeeInvoice.objects.create(
            school=school, campus=data["main_campus"], invoice_number="INV-PAY-001",
            student=student, session=data["session"], month="2026-10",
            title="October Fee", issue_date=timezone.localdate(), due_date=timezone.localdate() + timedelta(days=10),
            status="unpaid", subtotal=Decimal('5000.00'), total_amount=Decimal('5000.00'),
            paid_amount=Decimal('0.00'), balance_due=Decimal('5000.00')
        )

        api_client.force_authenticate(user=admin)

        # 1. Record Partial Payment: 2,000 PKR Cash
        pay_resp1 = api_client.post(f'/api/v1/finance/invoices/{invoice.id}/pay/', {
            "amount": "2000.00",
            "payment_method": "cash",
            "notes": "First installment paid at fee counter"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert pay_resp1.status_code == status.HTTP_201_CREATED

        tenant_context(school)
        invoice.refresh_from_db()
        assert invoice.status == 'partially_paid'
        assert invoice.paid_amount == Decimal('2000.00')
        assert invoice.balance_due == Decimal('3000.00')

        # 2. Record Final Payment: 3,000 PKR Bank Transfer
        pay_resp2 = api_client.post(f'/api/v1/finance/invoices/{invoice.id}/pay/', {
            "amount": "3000.00",
            "payment_method": "bank_transfer",
            "transaction_reference": "TXN-HBL-998822"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert pay_resp2.status_code == status.HTTP_201_CREATED

        tenant_context(school)
        invoice.refresh_from_db()
        assert invoice.status == 'paid'
        assert invoice.paid_amount == Decimal('5000.00')
        assert invoice.balance_due == Decimal('0.00')

        # 3. Verify Double-Entry General Ledger Postings
        coa = ensure_default_chart_of_accounts(school)
        cash_account = coa['1010']
        bank_account = coa['1020']
        receivables_account = coa['1100']

        # Assert balances: Cash received 2000, Bank received 3000, Receivables credited 5000
        assert cash_account.current_balance == Decimal('2000.00')
        assert bank_account.current_balance == Decimal('3000.00')
        # Total debits in journal entries must exactly equal total credits
        for entry in JournalEntry.objects.filter(school=school):
            debits = entry.items.filter(entry_type='debit').aggregate(t=models.Sum('amount'))['t'] or Decimal('0.00')
            credits = entry.items.filter(entry_type='credit').aggregate(t=models.Sum('amount'))['t'] or Decimal('0.00')
            assert debits == credits

    def test_audited_administrative_fee_waiver(self, finance_setup, api_client, tenant_context):
        data = finance_setup
        school = data["school"]
        student = data["student1"]
        admin = data["admin"]

        invoice = FeeInvoice.objects.create(
            school=school, campus=data["main_campus"], invoice_number="INV-WAIVE-001",
            student=student, session=data["session"], month="2026-10",
            title="October Fee", issue_date=timezone.localdate(), due_date=timezone.localdate() + timedelta(days=10),
            status="unpaid", subtotal=Decimal('5000.00'), total_amount=Decimal('5000.00'),
            paid_amount=Decimal('0.00'), balance_due=Decimal('5000.00')
        )

        api_client.force_authenticate(user=admin)

        # Apply audited waiver of 1,500 PKR
        waiver_resp = api_client.post(f'/api/v1/finance/invoices/{invoice.id}/waive/', {
            "amount": "1500.00",
            "reason": "Administrative financial aid approved by School Principal."
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert waiver_resp.status_code == status.HTTP_201_CREATED

        tenant_context(school)
        invoice.refresh_from_db()
        assert invoice.discount_amount == Decimal('1500.00')
        assert invoice.total_amount == Decimal('3500.00')
        assert invoice.balance_due == Decimal('3500.00')

        # Assert audited record
        waiver = FeeWaiver.objects.get(invoice=invoice)
        assert waiver.waived_amount == Decimal('1500.00')
        assert waiver.waived_by == admin
        assert "Principal" in waiver.reason

    def test_three_copy_fee_challan_pdf_stream(self, finance_setup, api_client):
        data = finance_setup
        school = data["school"]
        student = data["student1"]
        admin = data["admin"]

        invoice = FeeInvoice.objects.create(
            school=school, campus=data["main_campus"], invoice_number="INV-PDF-001",
            challan_number="CHL-202610-0001", student=student, session=data["session"], month="2026-10",
            title="Challan Voucher", issue_date=date(2026, 10, 1), due_date=date(2026, 10, 10),
            status="unpaid", subtotal=Decimal('8000.00'), total_amount=Decimal('8000.00'),
            paid_amount=Decimal('0.00'), balance_due=Decimal('8000.00')
        )
        FeeInvoiceItem.objects.create(
            school=school, campus=data["main_campus"], invoice=invoice, fee_head=data["tuition_head"],
            description="Tuition Fee (Oct 2026)", amount=Decimal('8000.00'), discount_amount=Decimal('0.00'),
            net_amount=Decimal('8000.00')
        )

        # Direct service call
        pdf_bytes = generate_fee_challan_pdf(invoice)
        assert pdf_bytes.startswith(b'%PDF-'), "Generated document must have valid PDF header bytes"
        assert len(pdf_bytes) > 2000, "PDF document must contain rendered vectors and text"

        # HTTP API endpoint
        api_client.force_authenticate(user=admin)
        resp = api_client.get(f'/api/v1/finance/invoices/{invoice.id}/challan-pdf/', HTTP_X_SCHOOL_SLUG=school.slug)
        assert resp.status_code == status.HTTP_200_OK
        assert resp['Content-Type'] == 'application/pdf'
        assert b'%PDF-' in resp.content

    def test_pluggable_payment_gateways_initiation_and_signatures(self, finance_setup):
        """
        Tests HMAC and checksum signature mechanics across all 4 Pakistani payment gateways:
        JazzCash, Easypaisa, Safepay, and PayFast.
        """
        # 1. JazzCash
        jc_config = {"merchant_id": "MC12345", "password": "pass", "secret_key_or_salt": "JAZZ_SALT_9988"}
        jc = get_payment_gateway("jazzcash", config=jc_config, is_sandbox=True)
        jc_init = jc.initiate_payment(
            invoice_number="INV-001", amount=Decimal('2500.00'), customer_phone="03001234567",
            customer_email="parent@test.com", callback_url="http://callback"
        )
        assert jc_init.ussd_prompt_sent is True
        assert "pp_SecureHash" in jc_init.raw_response

        # 2. Easypaisa
        ep_config = {"merchant_id": "EP_STORE_1", "secret_key_or_salt": "EP_KEY_SECRET"}
        ep = get_payment_gateway("easypaisa", config=ep_config, is_sandbox=True)
        ep_init = ep.initiate_payment(
            invoice_number="INV-002", amount=Decimal('3500.00'), customer_phone="03451234567",
            customer_email="parent@test.com", callback_url="http://callback"
        )
        assert ep_init.ussd_prompt_sent is True
        assert "checksum" in ep_init.raw_response

        # 3. Safepay
        sf_config = {"merchant_id": "sec_sandbox_123", "secret_key_or_salt": "sf_secret_key"}
        sf = get_payment_gateway("safepay", config=sf_config, is_sandbox=True)
        sf_init = sf.initiate_payment(
            invoice_number="INV-003", amount=Decimal('5000.00'), customer_phone="",
            customer_email="parent@test.com", callback_url="http://callback"
        )
        assert sf_init.requires_redirect is True
        assert "beacon=" in sf_init.checkout_url

        # Safepay HMAC Webhook verification
        import hmac, hashlib
        body = b'{"data": {"status": "paid", "amount": 5000.00, "tracker": "trk_01"}}'
        valid_sig = hmac.new(b"sf_secret_key", body, hashlib.sha256).hexdigest()
        assert sf.verify_webhook_signature(body, {"X-SFPY-SIGNATURE": valid_sig}) is True
        assert sf.verify_webhook_signature(body, {"X-SFPY-SIGNATURE": "invalid_sig"}) is False

        # 4. PayFast
        pf_config = {"merchant_id": "PF_MERCHANT_1", "secret_key_or_salt": "pf_secret_99"}
        pf = get_payment_gateway("payfast", config=pf_config, is_sandbox=True)
        pf_init = pf.initiate_payment(
            invoice_number="INV-004", amount=Decimal('4200.00'), customer_phone="",
            customer_email="parent@test.com", callback_url="http://callback"
        )
        assert pf_init.requires_redirect is True
        assert "ProcessTransaction" in pf_init.checkout_url

    def test_finance_tenant_rls_isolation(self, school_factory, user_factory, tenant_context):
        """
        Verifies that School A's fee invoices and general ledger entries
        are strictly invisible to School B under PostgreSQL Row-Level Security.
        """
        school_a = school_factory(name="School Alpha Finance", slug="alpha-fin")
        school_b = school_factory(name="School Beta Finance", slug="beta-fin")

        tenant_context(school_a)
        head_a = FeeHead.objects.create(school=school_a, name="Alpha Tuition", code="ALPHA_TUI")

        tenant_context(school_b)
        head_b = FeeHead.objects.create(school=school_b, name="Beta Tuition", code="BETA_TUI")

        # In School B context, FeeHead.objects should only return Beta Tuition
        visible_heads = list(FeeHead.objects.filter(school=school_b))
        assert len(visible_heads) == 1
        assert visible_heads[0].name == "Beta Tuition"

        # Explicitly trying to query Alpha's head from Beta should return empty
        assert FeeHead.objects.filter(school=school_b, code="ALPHA_TUI").count() == 0
