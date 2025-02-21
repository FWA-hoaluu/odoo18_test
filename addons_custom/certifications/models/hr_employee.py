from  odoo import models, fields, api, _




class  Employee(models.Model):
    _inherit = 'hr.employee'

    certification_ids = fields.One2many('g.employee.certification', 'employee_id', string='Chứng chỉ')