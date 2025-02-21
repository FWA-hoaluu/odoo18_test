from odoo import models, fields, api, _



class EmployeeCertification(models.Model):
    _name = 'g.employee.certification'
    _description = 'Employee Certification'
    _rec_name = 'name'

    name = fields.Char(string='Tên chứng chỉ', required=True)
    description = fields.Text(string='Mô tả')
    cer_type = fields.Selection([
        ('intrernal', 'Nội bộ'),
        ('external', 'Bên ngoài'),
    ], string='Loại chứng chỉ', default='')
    date_end = fields.Date(string='Ngày hết hạn chứng chỉ')
    date_start = fields.Date(string='Ngày cấp chứng chỉ')
    employee_id = fields.Many2one('hr.employee', string='Nhân viên')
    attachment_ids = fields.Many2many('ir.attachment', string='Chứng chỉ đính kèm')




