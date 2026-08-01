import os
import django

# Setup environment variables
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eoffice.settings')
os.environ['DATABASE_URL'] = 'mysql://47QNHumxXTdzkYj.root:jW3yimgDD9TtbzeZ@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/eoffice'

django.setup()

from django.contrib.auth.models import User

# Cari user admin, atau buat baru jika belum ada
u = User.objects.filter(username='admin').first()
if not u:
    u = User(username='admin', email='admin@instalasi.go.id', is_staff=True, is_superuser=True)
    print("User admin tidak ditemukan, membuat user admin baru...")

# Set password menjadi admin123
u.set_password('admin123')
u.save()

print("BERHASIL! Password untuk username 'admin' di database produksi (TiDB) telah di-reset menjadi 'admin123'.")
