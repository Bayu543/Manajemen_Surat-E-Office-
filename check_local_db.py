import os
import django
import dj_database_url

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eoffice.settings')
# Force local DB
os.environ['DATABASE_URL'] = 'mysql://root:@127.0.0.1:3306/eoffice'

django.setup()

from accounts.models import SuratMasuk
print(f"Total Surat Masuk di DB Lokal: {SuratMasuk.objects.count()}")
