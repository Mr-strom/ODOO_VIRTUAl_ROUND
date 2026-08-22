# routes/payroll.py — Employee read own payroll, HR read all and update
from flask import Blueprint, request, jsonify, g
from datetime import datetime
from .. import db
from ..models import Payroll, User
from ..auth_utils import jwt_required, hr_required

payroll_bp = Blueprint('payroll', __name__)


@payroll_bp.route('/my', methods=['GET'])
@jwt_required
def my_payroll():
    """GET /api/payroll/my — Employee reads their own payroll. net_salary is computed."""
    user = g.current_user
    if user.role != 'employee':
        return jsonify({'error': 'Forbidden'}), 403

    payroll = user.payroll
    if not payroll:
        return jsonify({'error': 'Payroll record not found'}), 404

    return jsonify(payroll.to_dict()), 200


@payroll_bp.route('/all', methods=['GET'])
@hr_required
def all_payroll():
    """GET /api/payroll/all — HR only: all payroll records with employee info + net_salary."""
    payrolls = Payroll.query.all()
    result = []
    for p in payrolls:
        data = p.to_dict()
        user = User.query.get(p.user_id)
        if user:
            data['employee'] = {
                'id': user.id,
                'employee_id': user.employee_id,
                'email': user.email,
                'role': user.role
            }
            if user.profile:
                data['employee']['full_name'] = user.profile.full_name
                data['employee']['department'] = user.profile.department
        result.append(data)
    return jsonify(result), 200


@payroll_bp.route('/<int:payroll_id>', methods=['PUT'])
@hr_required
def update_payroll(payroll_id):
    """PUT /api/payroll/<id> — HR only: update basic_salary, hra, deductions."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    payroll = Payroll.query.get(payroll_id)
    if not payroll:
        return jsonify({'error': 'Payroll record not found'}), 404

    # Update only provided fields
    if 'basic_salary' in data:
        try:
            payroll.basic_salary = float(data['basic_salary'])
        except (ValueError, TypeError):
            return jsonify({'error': 'basic_salary must be a number'}), 400

    if 'hra' in data:
        try:
            payroll.hra = float(data['hra'])
        except (ValueError, TypeError):
            return jsonify({'error': 'hra must be a number'}), 400

    if 'deductions' in data:
        try:
            payroll.deductions = float(data['deductions'])
        except (ValueError, TypeError):
            return jsonify({'error': 'deductions must be a number'}), 400

    payroll.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(payroll.to_dict()), 200


@payroll_bp.route('/export', methods=['GET'])
@hr_required
def export_payroll():
    """GET /api/payroll/export — HR only: download all payroll records as CSV."""
    import csv
    import io
    from flask import Response

    payrolls = Payroll.query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Employee ID', 'Name', 'Basic Salary', 'HRA', 'Deductions', 'Net Salary'])

    for p in payrolls:
        user = User.query.get(p.user_id)
        emp_id = user.employee_id if user else ''
        name = (user.profile.full_name if user and user.profile and user.profile.full_name else '')
        net = float(p.basic_salary or 0) + float(p.hra or 0) - float(p.deductions or 0)
        writer.writerow([
            emp_id, name,
            float(p.basic_salary), float(p.hra), float(p.deductions),
            round(net, 2)
        ])

    output.seek(0)
    return Response(
        output,
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=payroll_export.csv'}
    )


@payroll_bp.route('/my/slip', methods=['GET'])
@jwt_required
def salary_slip():
    """GET /api/payroll/my/slip — Employee only: download own salary slip as PDF."""
    import io
    from datetime import date as dt_date
    from flask import Response
    from fpdf import FPDF

    user = g.current_user
    if user.role != 'employee':
        return jsonify({'error': 'Forbidden'}), 403

    payroll = user.payroll
    if not payroll:
        return jsonify({'error': 'Payroll record not found'}), 404

    profile = user.profile
    full_name = (profile.full_name or user.employee_id) if profile else user.employee_id
    department = (profile.department or 'N/A') if profile else 'N/A'
    designation = (profile.designation or 'N/A') if profile else 'N/A'

    today = dt_date.today()
    pay_period = today.strftime('%B %Y')
    net_salary = float(payroll.basic_salary or 0) + float(payroll.hra or 0) - float(payroll.deductions or 0)

    # ── Build PDF ──────────────────────────────────────────────────────────
    pdf = FPDF()
    pdf.add_page()

    # Header
    pdf.set_font('Helvetica', 'B', 18)
    pdf.cell(0, 12, 'Dayflow HRMS', ln=True, align='C')
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(0, 7, 'Salary Slip', ln=True, align='C')
    pdf.cell(0, 7, f'Pay Period: {pay_period}', ln=True, align='C')
    pdf.ln(6)

    # Divider
    pdf.set_draw_color(180, 180, 180)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(4)

    # Employee details
    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(50, 8, 'Employee ID:', border=0)
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(0, 8, user.employee_id, ln=True)

    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(50, 8, 'Name:', border=0)
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(0, 8, full_name, ln=True)

    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(50, 8, 'Department:', border=0)
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(0, 8, department, ln=True)

    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(50, 8, 'Designation:', border=0)
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(0, 8, designation, ln=True)
    pdf.ln(4)

    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(6)

    # Salary table header
    pdf.set_fill_color(230, 230, 230)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(120, 9, 'Component', border=1, fill=True)
    pdf.cell(60, 9, 'Amount (INR)', border=1, fill=True, ln=True)

    # Salary rows
    rows = [
        ('Basic Salary', float(payroll.basic_salary)),
        ('HRA',          float(payroll.hra)),
        ('Deductions',   float(payroll.deductions)),
    ]
    pdf.set_font('Helvetica', '', 11)
    for label, amount in rows:
        pdf.cell(120, 9, label, border=1)
        pdf.cell(60, 9, f'{amount:,.2f}', border=1, ln=True)

    # Net salary row
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_fill_color(210, 240, 210)
    pdf.cell(120, 10, 'Net Salary', border=1, fill=True)
    pdf.cell(60, 10, f'{net_salary:,.2f}', border=1, fill=True, ln=True)
    pdf.ln(6)

    # Footer
    pdf.set_font('Helvetica', 'I', 9)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 7, f'Generated on {today.strftime("%d %B %Y")} by Dayflow HRMS', ln=True, align='C')

    # Stream as bytes
    pdf_bytes = pdf.output()
    month_str = today.strftime('%Y%m')
    filename = f'salary_slip_{user.employee_id}_{month_str}.pdf'
    return Response(
        bytes(pdf_bytes),
        mimetype='application/pdf',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )
