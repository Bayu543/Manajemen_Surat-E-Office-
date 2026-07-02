def get_roman_month(month: int) -> str:
    """
    Konversi angka bulan (1-12) menjadi format Romawi (I-XII).
    """
    roman_months = {
        1: 'I', 2: 'II', 3: 'III', 4: 'IV',
        5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII',
        9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
    }
    return roman_months.get(month, '')

import io
from django.template.loader import get_template
from xhtml2pdf import pisa

def render_to_pdf(template_src, context_dict={}):
    """
    Fungsi untuk merender HTML template menjadi file PDF menggunakan xhtml2pdf.
    """
    template = get_template(template_src)
    html  = template.render(context_dict)
    result = io.BytesIO()
    
    # Generate PDF
    # pisa.pisaDocument returns an object, where err is 0 if successful
    pdf = pisa.pisaDocument(io.BytesIO(html.encode("UTF-8")), result)
    
    if not pdf.err:
        return result.getvalue()
    return None
