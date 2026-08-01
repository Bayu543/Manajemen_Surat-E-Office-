from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import UserProfile, SuratMasuk, Disposisi, SuratKeluar
from django.core.files.uploadedfile import SimpleUploadedFile

class EOfficeBlackBoxTesting(TestCase):
    def setUp(self):
        self.client = Client()

        # Buat Admin User
        self.admin_user = User.objects.create_superuser('admin', 'admin@eoffice.com', 'adminpass123')
        
        # Buat Staff User
        self.staff_user = User.objects.create_user('staff1', 'staff1@eoffice.com', 'staffpass123')
        
        # Helper: file mockup untuk diupload
        self.mock_file = SimpleUploadedFile("dummy.pdf", b"file_content", content_type="application/pdf")

    def test_01_login_valid(self):
        """Skenario 1.1: Login dengan kredensial valid"""
        response = self.client.post(reverse('login'), {
            'username': 'admin',
            'password': 'adminpass123'
        })
        self.assertRedirects(response, reverse('dashboard'))
        self.assertTrue('_auth_user_id' in self.client.session)

    def test_02_login_invalid(self):
        """Skenario 1.2: Login dengan kredensial salah"""
        response = self.client.post(reverse('login'), {
            'username': 'admin',
            'password': 'wrongpassword'
        })
        # Tetap di halaman login dan tidak masuk session
        self.assertEqual(response.status_code, 200)
        self.assertFalse('_auth_user_id' in self.client.session)

    def test_03_admin_input_surat_masuk(self):
        """Skenario 2.1: Admin Input Surat Masuk Baru"""
        self.client.login(username='admin', password='adminpass123')
        
        response = self.client.post(reverse('surat_masuk'), {
            'nomor_surat': '001/SM/2026',
            'pengirim': 'PT XYZ',
            'perihal': 'Undangan Meeting',
            'tanggal_surat': '2026-07-20',
            'prioritas': 'biasa'
        })
        
        # Pastikan data masuk ke DB
        surat = SuratMasuk.objects.filter(nomor_surat='001/SM/2026').first()
        self.assertIsNotNone(surat)
        self.assertEqual(surat.status, 'baru')
        self.assertEqual(surat.pengirim, 'PT XYZ')

    def test_04_admin_buat_disposisi(self):
        """Skenario 3.1: Admin Buat Disposisi untuk Staff"""
        surat = SuratMasuk.objects.create(
            nomor_surat='002/SM/2026',
            pengirim='Instansi A',
            perihal='Tugas Cepat',
            tanggal_surat='2026-07-20',
            dibuat_oleh=self.admin_user
        )
        
        self.client.login(username='admin', password='adminpass123')
        
        disposisi = Disposisi.objects.create(
            surat=surat,
            pemberi_disposisi=self.admin_user,
            penerima_disposisi=self.staff_user,
            instruksi='Tolong proses dokumen ini'
        )
        self.assertEqual(disposisi.status, 'baru')
        self.assertEqual(disposisi.penerima_disposisi.username, 'staff1')

    def test_05_staff_buat_draf_surat_keluar(self):
        """Skenario 4.1: Staff membuat Draf Surat Keluar"""
        self.client.login(username='staff1', password='staffpass123')
        
        # Buat surat draf. Asumsi POST ke buat_draft
        response = self.client.post(reverse('buat_draft'), {
            'tujuan': 'Direktur PT ABC',
            'perihal': 'Pengajuan Kerjasama',
            'isi_surat': 'Berikut ini penawaran...',
            'departemen': 'IT',
            'klasifikasi': 'SU',
            'action_type': 'draft'
        })
        
        # Cek di DB
        draf = SuratKeluar.objects.filter(tujuan='Direktur PT ABC').first()
        self.assertIsNotNone(draf)
        self.assertEqual(draf.status, 'draft')
        self.assertEqual(draf.pembuat, self.staff_user)

    def test_06_admin_setujui_surat_keluar(self):
        """Skenario 4.4: Admin menyetujui draf surat"""
        draf = SuratKeluar.objects.create(
            tujuan='Kementerian XYZ',
            perihal='Laporan Tahunan',
            status='diajukan',
            pembuat=self.staff_user,
            departemen='HR'
        )
        
        self.client.login(username='admin', password='adminpass123')
        
        # Setujui surat
        response = self.client.post(reverse('setujui_surat_keluar', args=[draf.id]))
        
        draf.refresh_from_db()
        self.assertEqual(draf.status, 'disetujui')
        self.assertIsNotNone(draf.nomor_surat)
