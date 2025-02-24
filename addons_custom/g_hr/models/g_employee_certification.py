from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import timedelta
from datetime import datetime


class EmployeeCertification(models.Model):
    _name = 'g.employee.certification'
    _description = 'Employee Certification'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'name'

    name = fields.Char(string='Tên chứng chỉ', required=True)
    description = fields.Text(string='Mô tả')
    score = fields.Float(string='Điểm số chứng chỉ')
    cer_type = fields.Selection([
        ('internal', 'Nội bộ'),
        ('external', 'Bên ngoài'),
    ], string='Loại chứng chỉ', default='')
    date_end = fields.Date(string='Ngày hết hạn chứng chỉ')
    date_start = fields.Date(string='Ngày cấp chứng chỉ')
    employee_id = fields.Many2one('hr.employee', string='Nhân viên')
    attachment_ids = fields.Many2many('ir.attachment', string='Chứng chỉ đính kèm')

    @api.constrains('date_start', 'date_end')
    def _check_end_date(self):
        for cer in self:
            if cer.date_start and cer.date_end and cer.date_start > cer.date_end:
                raise ValidationError('Ngày cấp chứng chỉ phải nhỏ hơn ngày hết hạn chứng chỉ')
    def get_certification_details(self):
        """Trả về thông tin chứng chỉ và nhân viên."""
        return {
            'certification_name': self.name or "Không có tên chứng chỉ",
            'end_date': self.date_end or "Không có ngày hết hạn",
            'employee_name': self.employee_id.name or "Không có tên nhân viên",
        }

    def send_certificate_expiry_notification(self):
        today = fields.Date.today()
        deadline = today + timedelta(days=30)

        # Lọc chứng chỉ hết hạn
        expired_certs = self.search([('date_end', '<=', deadline)])

        for cer in expired_certs:
            details = cer.get_certification_details()

            if cer.employee_id.work_email:
                email_subject = f"Chứng chỉ {details['certification_name']} của bạn sắp hết hạn"
                template_id = self.env.ref('g_hr.email_template_certificate_expiry')

                # Tạo và gửi email sử dụng mẫu
                email_values = {
                    'subject': email_subject,
                    'email_to': cer.employee_id.work_email,
                }
                template_id.send_mail(cer.id, email_values=email_values, force_send=True)
            else:
                print(f"Nhân viên {details['employee_name']} không có email làm việc.")

    def get_name_certification(self):
        today = fields.Date.today()
        deadline = today + timedelta(days=30)

        # Lọc chứng chỉ hết hạn
        expired_certs = self.search([('date_end', '<=', deadline)])
        cer_name = self.name or "Không có tên chứng chỉ"
        print(f"get_name_certification: {cer_name}")
        return cer_name

    def get_date_end_certification(self):
        cer_date_end = self.date_end or "Không có ngày hết hạn"
        print(f"get_date_end_certification: {cer_date_end}")
        return cer_date_end

    def get_employee_name(self):
        emp_name = self.employee_id.name or "Không có tên nhân viên"
        print(f"get_employee_name: {emp_name}")
        return emp_name
