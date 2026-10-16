"""
3-Copy Fee Challan PDF Generator using ReportLab.
Constructs a standard 3-panel landscape document:
Panel 1: Student Copy | Panel 2: School Copy | Panel 3: Bank Copy.
"""
import io
from decimal import Decimal
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from apps.finance.models import FeeInvoice


def generate_fee_challan_pdf(invoice: FeeInvoice) -> bytes:
    """
    Generates a 3-copy fee challan PDF byte-stream for the specified FeeInvoice.
    """
    buffer = io.BytesIO()
    page_width, page_height = landscape(A4)  # 841.89 x 595.27 points
    c = canvas.Canvas(buffer, pagesize=landscape(A4))

    margin_x = 20
    margin_y = 25
    available_width = page_width - (2 * margin_x)
    panel_width = available_width / 3.0
    panel_height = page_height - (2 * margin_y)

    copies = [
        ("STUDENT COPY", colors.HexColor("#1E3A8A")),
        ("SCHOOL COPY", colors.HexColor("#065F46")),
        ("BANK COPY", colors.HexColor("#78350F")),
    ]

    student = invoice.student
    student_name = student.user.get_full_name() or student.user.username
    adm_num = student.admission_number or "N/A"
    father_name = student.emergency_contact or "Guardian"
    school_name = invoice.school.name
    campus_name = invoice.campus.name if invoice.campus else "Main Branch"
    session_name = invoice.session.name
    currency = invoice.school.currency or "PKR"

    from apps.academics.models import StudentEnrollment
    enrollment = StudentEnrollment.objects.filter(student=student.user, session=invoice.session, status='enrolled').first()
    roll_num = enrollment.roll_number if (enrollment and enrollment.roll_number) else "N/A"
    grade_sec = f"{enrollment.section.grade.name} - {enrollment.section.name}" if enrollment and enrollment.section else "Grade Level"

    # Dates
    issue_str = invoice.issue_date.strftime("%d-%b-%Y")
    due_str = invoice.due_date.strftime("%d-%b-%Y")
    grace_expiry = invoice.due_date + invoice.due_date.resolution * invoice.grace_period_days
    # Use timedelta for validity
    from datetime import timedelta
    validity_date = invoice.due_date + timedelta(days=invoice.grace_period_days)
    validity_str = validity_date.strftime("%d-%b-%Y")

    late_fee = invoice.late_fee_amount if invoice.late_fee_amount > Decimal('0.00') else Decimal('100.00')
    payable_after_due = invoice.total_amount + (late_fee if invoice.late_fee_amount == Decimal('0.00') else Decimal('0.00'))

    for i, (copy_title, badge_color) in enumerate(copies):
        panel_x = margin_x + (i * panel_width)
        panel_y = margin_y

        # Draw panel boundary
        c.setStrokeColor(colors.HexColor("#CBD5E1"))
        c.setLineWidth(0.75)
        c.rect(panel_x + 5, panel_y, panel_width - 10, panel_height)

        # Draw cut marks (dashed vertical lines between panels)
        if i > 0:
            c.setStrokeColor(colors.HexColor("#94A3B8"))
            c.setDash(3, 3)
            c.line(panel_x, margin_y, panel_x, margin_y + panel_height)
            c.setDash()  # reset dash

        curr_x = panel_x + 12
        curr_y = panel_y + panel_height - 18

        # Copy Title Badge
        c.setFillColor(badge_color)
        c.rect(curr_x, curr_y - 2, panel_width - 24, 16, fill=True, stroke=False)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(panel_x + (panel_width / 2), curr_y + 2, copy_title)

        curr_y -= 22

        # Header: School Name & Campus
        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(panel_x + (panel_width / 2), curr_y, school_name[:32])
        curr_y -= 11

        c.setFont("Helvetica", 7.5)
        c.setFillColor(colors.HexColor("#475569"))
        c.drawCentredString(panel_x + (panel_width / 2), curr_y, f"{campus_name} • {session_name}")
        curr_y -= 14

        # Bank Details Box
        c.setStrokeColor(colors.HexColor("#E2E8F0"))
        c.setFillColor(colors.HexColor("#F8FAFC"))
        c.rect(curr_x, curr_y - 20, panel_width - 24, 22, fill=True, stroke=True)

        c.setFillColor(colors.HexColor("#1E293B"))
        c.setFont("Helvetica-Bold", 7)
        c.drawString(curr_x + 5, curr_y - 8, f"Bank: {invoice.bank_name}")
        c.drawString(curr_x + 5, curr_y - 17, f"A/C: {invoice.bank_account_number} ({invoice.bank_branch})")
        curr_y -= 30

        # Challan Metadata Grid
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(colors.HexColor("#334155"))
        c.drawString(curr_x, curr_y, "Challan #:")
        c.drawString(curr_x + 50, curr_y, invoice.challan_number or invoice.invoice_number)
        c.drawString(curr_x + 130, curr_y, "Month:")
        c.drawString(curr_x + 165, curr_y, invoice.month)
        curr_y -= 11

        c.setFont("Helvetica", 7)
        c.drawString(curr_x, curr_y, "Issue Date:")
        c.drawString(curr_x + 50, curr_y, issue_str)
        c.drawString(curr_x + 130, curr_y, "Due Date:")
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(colors.HexColor("#B91C1C"))
        c.drawString(curr_x + 165, curr_y, due_str)
        curr_y -= 11

        c.setFont("Helvetica", 7)
        c.setFillColor(colors.HexColor("#334155"))
        c.drawString(curr_x, curr_y, "Validity Date:")
        c.drawString(curr_x + 50, curr_y, validity_str)
        curr_y -= 15

        # Student Details Box
        c.setStrokeColor(colors.HexColor("#E2E8F0"))
        c.setFillColor(colors.HexColor("#F1F5F9"))
        c.rect(curr_x, curr_y - 28, panel_width - 24, 30, fill=True, stroke=True)

        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(curr_x + 5, curr_y - 9, f"Student: {student_name[:24]}")
        c.setFont("Helvetica", 7)
        c.drawString(curr_x + 5, curr_y - 18, f"Roll #: {roll_num}   |   Adm #: {adm_num}")
        c.drawString(curr_x + 5, curr_y - 26, f"Class: {grade_sec}   |   F/Name: {father_name[:14]}")
        curr_y -= 38

        # Line Items Table Header
        table_width = panel_width - 24
        c.setFillColor(colors.HexColor("#E2E8F0"))
        c.rect(curr_x, curr_y - 11, table_width, 13, fill=True, stroke=False)
        c.setFillColor(colors.HexColor("#1E293B"))
        c.setFont("Helvetica-Bold", 7)
        c.drawString(curr_x + 5, curr_y - 8, "Fee Description")
        c.drawRightString(curr_x + table_width - 5, curr_y - 8, f"Amount ({currency})")
        curr_y -= 14

        # Table rows
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.HexColor("#334155"))
        for item in invoice.items.all()[:6]:
            c.drawString(curr_x + 5, curr_y, item.description[:24])
            c.drawRightString(curr_x + table_width - 5, curr_y, f"{item.amount:,.2f}")
            curr_y -= 10

        # Sibling / Waiver Discounts line
        if invoice.discount_amount > Decimal('0.00'):
            c.setFillColor(colors.HexColor("#047857"))
            c.drawString(curr_x + 5, curr_y, "Sibling / Institutional Discount (-)")
            c.drawRightString(curr_x + table_width - 5, curr_y, f"-{invoice.discount_amount:,.2f}")
            curr_y -= 10
            c.setFillColor(colors.HexColor("#334155"))

        # Arrears line if not in items
        if invoice.arrears_amount > Decimal('0.00') and not invoice.items.filter(fee_head__code='ARREARS').exists():
            c.setFillColor(colors.HexColor("#B91C1C"))
            c.drawString(curr_x + 5, curr_y, "Unpaid Arrears / Prior Balance (+)")
            c.drawRightString(curr_x + table_width - 5, curr_y, f"+{invoice.arrears_amount:,.2f}")
            curr_y -= 10
            c.setFillColor(colors.HexColor("#334155"))

        # Totals Summary Box
        c.setStrokeColor(colors.HexColor("#CBD5E1"))
        c.line(curr_x, curr_y + 2, curr_x + table_width, curr_y + 2)
        curr_y -= 12

        # Payable within Due Date
        c.setFillColor(colors.HexColor("#1E3A8A"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(curr_x + 5, curr_y, "Payable within Due Date:")
        c.drawRightString(curr_x + table_width - 5, curr_y, f"{invoice.total_amount:,.2f}")
        curr_y -= 12

        # Late Fee Surcharge
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawString(curr_x + 5, curr_y, "Late Fee Surcharge:")
        c.drawRightString(curr_x + table_width - 5, curr_y, f"{late_fee:,.2f}")
        curr_y -= 12

        # Payable after Due Date
        c.setFillColor(colors.HexColor("#991B1B"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(curr_x + 5, curr_y, "Payable after Due Date:")
        c.drawRightString(curr_x + table_width - 5, curr_y, f"{payable_after_due:,.2f}")
        curr_y -= 22

        # Instructions Note
        c.setFont("Helvetica-Oblique", 6)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawCentredString(
            panel_x + (panel_width / 2),
            curr_y,
            "Deposit at designated branch or via mobile apps (JazzCash / Easypaisa / 1Link)."
        )
        curr_y -= 24

        # Signatures
        c.setStrokeColor(colors.HexColor("#94A3B8"))
        c.setLineWidth(0.5)
        # Depositor Line
        c.line(curr_x + 10, curr_y, curr_x + 80, curr_y)
        # Bank Stamp Line
        c.line(curr_x + table_width - 80, curr_y, curr_x + table_width - 10, curr_y)

        c.setFont("Helvetica", 6.5)
        c.setFillColor(colors.HexColor("#475569"))
        c.drawCentredString(curr_x + 45, curr_y - 8, "Depositor Signature")
        c.drawCentredString(curr_x + table_width - 45, curr_y - 8, "Authorized Bank Stamp")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()
