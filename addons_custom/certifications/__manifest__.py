{
    'name': 'Certifications',
    'version': '1.0.1',
    'summary': 'Employee Certification',
    'description': 'Chung chi nhân viên',
    'category': 'HR Employee',
    'author': 'GMO',
    'license': 'AGPL-3',
    'depends': ['base', 'hr'],
    'data': [
        'security/ir.model.access.csv',
        'views/hr_employee_views.xml',
        'views/g_employee_certification_views.xml',
        'data/certification_cron.xml',
        'data/email_template.xml',

    ],
    # 'demo': ['Demo'],
    'installable': True,
    'auto_install': False
}
