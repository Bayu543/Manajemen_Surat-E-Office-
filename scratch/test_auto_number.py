import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eoffice.settings')
django.setup()

from accounts.models import SuratKeluar
from django.contrib.auth.models import User

# Buat dummy user jika belum ada
user, created = User.objects.get_or_create(username='testadmin', defaults={'is_superuser': True, 'is_staff': True})

s1 = SuratKeluar.objects.create(pembuat=user, tujuan="A", perihal="Test A")
print(f"Surat 1: {s1.nomor_surat}")

s2 = SuratKeluar.objects.create(pembuat=user, tujuan="B", perihal="Test B")
print(f"Surat 2: {s2.nomor_surat}")

# Coba dengan departemen dan jenis_surat beda
s3 = SuratKeluar.objects.create(pembuat=user, tujuan="C", perihal="Test C", jenis_surat="SK", departemen="IT")
print(f"Surat 3: {s3.nomor_surat}")

print("Menghapus data tes...")
s1.delete()
s2.delete()
s3.delete()
