# -*- coding: utf-8 -*-
{
    'name' : 'Owl Tutorial',
    'version' : '1.0',
    'summary': 'OWL Tutorial',
    'sequence': -1,
    'description': """OWL Tutorial Custom Dashboard""",
    'category': 'OWL',
    'depends' : ['base', 'web', 'sale', 'board'],
    'data': [
        'views/sales_dashboard.xml',
    ],
    'demo': [
    ],
    'installable': True,
    'application': True,
    'assets': {
    'web.assets_backend': [
        'odoo_custom_dashboard/static/src/**/*.js',
        'odoo_custom_dashboard/static/src/**/*.xml',
        'odoo_custom_dashboard/static/src/**/*.css',
        # 'odoo_custom_dashboard/static/src/sales_dashboard.js',
        # 'odoo_custom_dashboard/static/src/sales_dashboard.xml',
    ],
},
}