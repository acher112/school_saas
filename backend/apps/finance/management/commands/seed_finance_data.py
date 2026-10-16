"""
Management command to seed comprehensive Finance, Fee Structures, Invoices,
Sibling Discounts, Payments, Waivers, Arrears, and Pakistani Payment Gateway Configs.
"""
from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.core.context import set_current_school, clear_current_school
from apps.core.models import School, Campus, AcademicSession
from apps.academics.models import Grade, Section, StudentEnrollment
from apps.authentication.models import User, UserRole, StudentProfile, GuardianLink
from apps.finance.models import (
    Account, JournalEntry, JournalItem,
    FeeHead, FeeStructure, DiscountRule, LateFeeConfig,
    FeeInvoice, FeeInvoiceItem, FeePayment, FeeWaiver, PaymentGatewayConfig
)
from apps.finance.services.invoicing import InvoicingService, ensure_default_chart_of_accounts


class Command(BaseCommand):
    help = "Seeds comprehensive finance module data for demo school."

    def handle(self, *args, **options):
        self.stdout.write("Starting Finance module data seeding...")

        # 1. School & Campus Context
        school = School.objects.filter(slug="optimus-orien-demo").first()
        if not school:
            self.stdout.write(self.style.ERROR("School 'optimus-orien-demo' not found. Run seed_academic_data first."))
            return

        set_current_school(school)
        main_campus = school.campuses.first()
        session = AcademicSession.objects.filter(school=school, is_current=True).first()
        if not session:
            session = AcademicSession.objects.filter(school=school).first()

        # Admin user
        admin_user = User.objects.filter(school=school, role=UserRole.SCHOOL_ADMIN).first()
        if not admin_user:
            admin_user = User.objects.filter(school=school).first()

        # 2. Ensure Chart of Accounts
        coa = ensure_default_chart_of_accounts(school)
        self.stdout.write(f"Chart of Accounts initialized: {len(coa)} accounts verified.")

        # 3. Fee Heads
        tuition_head, _ = FeeHead.objects.get_or_create(
            school=school, code="TUITION",
            defaults={"name": "Monthly Tuition Fee", "description": "Core curriculum and academic tuition"}
        )
        transport_head, _ = FeeHead.objects.get_or_create(
            school=school, code="TRANSPORT",
            defaults={"name": "Transport Service Fee", "description": "Doorstep school bus transit"}
        )
        lab_head, _ = FeeHead.objects.get_or_create(
            school=school, code="LAB",
            defaults={"name": "Science & Computer Lab Fee", "description": "Laboratory consumables and software"}
        )
        admission_head, _ = FeeHead.objects.get_or_create(
            school=school, code="ADMISSION",
            defaults={"name": "Admission & Registration Fee", "description": "One-time registration fee"}
        )

        # 4. Fee Structures
        grades = Grade.objects.filter(school=school)
        for g in grades:
            # Tuition
            amount = Decimal("8500.00") if "10" in g.name else (Decimal("7500.00") if "9" in g.name else Decimal("6500.00"))
            FeeStructure.objects.update_or_create(
                school=school, session=session, grade=g, fee_head=tuition_head,
                defaults={"campus": main_campus, "amount": amount, "is_active": True}
            )
            # Transport
            FeeStructure.objects.update_or_create(
                school=school, session=session, grade=g, fee_head=transport_head,
                defaults={"campus": main_campus, "amount": Decimal("3500.00"), "is_active": True}
            )
            # Lab
            FeeStructure.objects.update_or_create(
                school=school, session=session, grade=g, fee_head=lab_head,
                defaults={"campus": main_campus, "amount": Decimal("1000.00"), "is_active": True}
            )

        self.stdout.write("Fee structures configured across all active grades.")

        # 5. Discount Rules (Sibling Discounts)
        DiscountRule.objects.update_or_create(
            school=school, applies_to_sibling_order=2, applies_to_fee_head=tuition_head,
            defaults={
                "name": "2nd Child Sibling Discount (20%)",
                "discount_type": "percentage",
                "value": Decimal("20.00"),
                "is_active": True
            }
        )
        DiscountRule.objects.update_or_create(
            school=school, applies_to_sibling_order=3, applies_to_fee_head=tuition_head,
            defaults={
                "name": "3rd Child Sibling Discount (50%)",
                "discount_type": "percentage",
                "value": Decimal("50.00"),
                "is_active": True
            }
        )
        self.stdout.write("Sibling discount rules active (2nd child: 20%, 3rd child: 50%).")

        # 6. Late Fee Configuration (5-day grace period, 200 PKR fixed surcharge, 1000 PKR cap)
        LateFeeConfig.objects.update_or_create(
            school=school,
            defaults={
                "is_enabled": True,
                "calculation_type": "fixed",
                "amount_or_percent": Decimal("200.00"),
                "grace_period_days": 5,
                "max_cap_amount": Decimal("1000.00")
            }
        )
        self.stdout.write("Late fee rules configured: 5 days grace, 200 PKR fine, cap 1,000 PKR.")

        # 7. Pakistani Payment Gateway Configurations
        PaymentGatewayConfig.objects.update_or_create(
            school=school, gateway="jazzcash",
            defaults={
                "merchant_id": "JC_MCH_894102",
                "secret_key_or_salt": "jc_secure_hash_secret_key_prod",
                "webhook_secret": "jc_webhook_sig_xyz",
                "is_active": True,
                "is_sandbox": True
            }
        )
        PaymentGatewayConfig.objects.update_or_create(
            school=school, gateway="easypaisa",
            defaults={
                "merchant_id": "EP_STORE_7721",
                "secret_key_or_salt": "ep_hash_token_abc99",
                "webhook_secret": "ep_webhook_secret_key",
                "is_active": True,
                "is_sandbox": True
            }
        )
        PaymentGatewayConfig.objects.update_or_create(
            school=school, gateway="safepay",
            defaults={
                "merchant_id": "sec_sandbox_01928374",
                "secret_key_or_salt": "v1_secret_key_safepay_pk",
                "webhook_secret": "sfpy_wh_shared_token",
                "is_active": True,
                "is_sandbox": True
            }
        )
        PaymentGatewayConfig.objects.update_or_create(
            school=school, gateway="payfast",
            defaults={
                "merchant_id": "PF_1LINK_MCH_4401",
                "secret_key_or_salt": "pf_secured_key_88910",
                "webhook_secret": "pf_signature_hash_token",
                "is_active": True,
                "is_sandbox": True
            }
        )
        self.stdout.write("All 4 Pakistani payment gateway configurations seeded (JazzCash, Easypaisa, Safepay, PayFast).")

        # 8. Guardian Relationships for Sibling Discounting
        parent_user = User.objects.filter(school=school, username="rehman.parent").first()
        student_ayan_user = User.objects.filter(school=school, username="ayan.rehman").first()
        student_zainab_user = User.objects.filter(school=school, username="zainab.fatima").first()

        if parent_user and student_ayan_user:
            GuardianLink.objects.update_or_create(
                school=school, student=student_ayan_user, parent=parent_user,
                defaults={"relationship": "father", "is_primary": True}
            )
        if parent_user and student_zainab_user:
            GuardianLink.objects.update_or_create(
                school=school, student=student_zainab_user, parent=parent_user,
                defaults={"relationship": "father", "is_primary": True}
            )

        # 9. Clean any existing invoices to avoid duplicate key conflicts during demo reset
        FeeInvoice.objects.filter(school=school).delete()

        # 10. Generate Invoices for October 2026
        oct_due_date = date(2026, 10, 15)
        invoices = InvoicingService.generate_monthly_invoices(
            school=school, session=session, month="2026-10", due_date=oct_due_date, created_by=admin_user
        )
        self.stdout.write(f"Generated {len(invoices)} monthly fee invoices for October 2026.")

        # 11. Create Overdue Invoice with Arrears & Compounded Late Fee for Muhammad Hamza
        hamza_user = User.objects.filter(school=school, username="muhammad.hamza").first()
        if hamza_user and hasattr(hamza_user, 'student_profile'):
            hamza_profile = hamza_user.student_profile
            # Past invoice for September 2026
            inv_sep = FeeInvoice.objects.create(
                school=school,
                campus=main_campus,
                student=hamza_profile,
                session=session,
                invoice_number=f"INV-202609-{hamza_profile.admission_number or '001'}",
                month="2026-09",
                title="Monthly Fee - September 2026",
                issue_date=date(2026, 9, 1),
                due_date=date(2026, 9, 10),
                grace_period_days=5,
                status="overdue",
                subtotal=Decimal("8500.00"),
                late_fee_amount=Decimal("200.00"),
                total_amount=Decimal("8700.00"),
                paid_amount=Decimal("0.00"),
                balance_due=Decimal("8700.00"),
                bank_name="Habib Bank Limited (HBL)",
                bank_branch="Gulberg Main Branch",
                bank_account_number="PK89HABB0001234567890101",
                challan_number="CHL-202609-HAMZA"
            )
            FeeInvoiceItem.objects.create(
                school=school, invoice=inv_sep, fee_head=tuition_head, description="Monthly Tuition Fee",
                amount=Decimal("8500.00"), discount_amount=Decimal("0.00"), net_amount=Decimal("8500.00")
            )
            self.stdout.write("Created overdue September 2026 invoice for Muhammad Hamza with 200 PKR late fee.")

        # 12. Record Partial Payment for Ayan Rehman
        if student_ayan_user and hasattr(student_ayan_user, 'student_profile'):
            ayan_profile = student_ayan_user.student_profile
            ayan_inv = FeeInvoice.objects.filter(school=school, student=ayan_profile, month="2026-10").first()
            if ayan_inv:
                InvoicingService.record_fee_payment(
                    invoice=ayan_inv,
                    amount_paid=Decimal("5000.00"),
                    payment_method="bank_transfer",
                    transaction_reference="1LINK-TXN-889911",
                    collected_by=admin_user,
                    notes="Direct bank deposit via 1Link 1Bill"
                )
                self.stdout.write("Recorded 5,000 PKR partial payment for Ayan Rehman via 1Link.")

        # 13. Record Full Payment for Maryam Bibi
        maryam_user = User.objects.filter(school=school, username="maryam.bibi").first()
        if maryam_user and hasattr(maryam_user, 'student_profile'):
            maryam_profile = maryam_user.student_profile
            maryam_inv = FeeInvoice.objects.filter(school=school, student=maryam_profile, month="2026-10").first()
            if maryam_inv:
                InvoicingService.record_fee_payment(
                    invoice=maryam_inv,
                    amount_paid=maryam_inv.balance_due,
                    payment_method="cash",
                    transaction_reference="COUNTER-CASH-7712",
                    collected_by=admin_user,
                    notes="Full counter payment received with school receipt stamp"
                )
                self.stdout.write("Recorded full cash counter payment for Maryam Bibi.")

        # 14. Apply Audited Fee Waiver for Bilal Ahmed
        bilal_user = User.objects.filter(school=school, username="bilal.ahmed").first()
        if bilal_user and hasattr(bilal_user, 'student_profile'):
            bilal_profile = bilal_user.student_profile
            bilal_inv = FeeInvoice.objects.filter(school=school, student=bilal_profile, month="2026-10").first()
            if bilal_inv:
                InvoicingService.apply_fee_waiver(
                    invoice=bilal_inv,
                    waived_amount=Decimal("2000.00"),
                    reason="Merit and need-based financial relief approved by Board of Governors",
                    waived_by=admin_user
                )
                self.stdout.write("Applied 2,000 PKR audited administrative waiver for Bilal Ahmed.")

        clear_current_school()
        self.stdout.write(self.style.SUCCESS("Successfully seeded comprehensive Checkpoint 2a Finance data!"))
