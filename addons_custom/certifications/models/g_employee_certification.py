from odoo import models, fields, api, _
from odoo.cli.scaffold import template


class EmployeeCertification(models.Model):
    _name = 'g.employee.certification'
    _description = 'Employee Certification'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'name'

    name = fields.Char(string='Tên chứng chỉ', required=True)
    description = fields.Text(string='Mô tả')
    score = fields.Float(string='Điểm số chứng chỉ')
    cer_type = fields.Selection([
        ('intrernal', 'Nội bộ'),
        ('external', 'Bên ngoài'),
    ], string='Loại chứng chỉ', default='')
    date_end = fields.Date(string='Ngày hết hạn chứng chỉ')
    date_start = fields.Date(string='Ngày cấp chứng chỉ')
    employee_id = fields.Many2one('hr.employee', string='Nhân viên')
    attachment_ids = fields.Many2many('ir.attachment', string='Chứng chỉ đính kèm')



@api.constrains('date_start','date_end')
def _check_end_date(self):
    for cer in self:
        if cer.date_start and cer.date_end and cer.date_start > cer.date_end:
            raise ValidationError('Ngày cấp chứng chỉ phải nhỏ hơn ngày hết hạn chứng chỉ')

#send certificate expired notification

def send_certificate_expiry_notification(self):
    today = fields.Date.today()

    deadline = today + timedelta(days=30)

    expired_certs = self.search([('date_end', '<=', deadline)])

    for cer in expired_certs:
        if cer.employee_id.user_id:
            print('Sending email to: ', cer.employee_id.user_id.partner_id.email)
            cer.message_post(
                body=_("Chứng chỉ '%s' của bạn sẽ hết hạn vào ngày %s." % (cer.name, cer.date_end)),
                partner_ids=[cer.employee_id.user_id.partner_id.id]
            )

            template_id = self.env.ref('certifications.email_template_certificate_expiry')
            if template_id:
                template_id.send_mail(cer.id, force_send=True)
