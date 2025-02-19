from odoo import fields, models, api, _



class Applicant(models.Model):
    _inherit = 'hr.applicant'

    g_expierence = fields.Char(string='Kinh nghiệm')