# 📧 E-Office - Sistem Manajemen Surat

Aplikasi web untuk mengelola surat masuk, surat keluar, disposisi, dan arsip surat secara digital.

## 🚀 Cara Menjalankan Proyek

### Pertama Kali (Setup)

1. **Double-click** file `SETUP_PERTAMA_KALI.bat`
   - Akan menginstall semua dependencies
   - Membuat database
   - Siap digunakan!

2. **Buat akun admin** (opsional)
   - Double-click `BUAT_ADMIN.bat`
   - Ikuti instruksi untuk membuat username dan password

### Menjalankan Server

**Double-click** file `JALANKAN_SERVER.bat`

Server akan berjalan di: **http://127.0.0.1:8000**

### URL Penting

- 🔐 **Login**: http://127.0.0.1:8000/login/
- 📊 **Dashboard**: http://127.0.0.1:8000/dashboard/
- ⚙️ **Admin Panel**: http://127.0.0.1:8000/admin/
- 📥 **Surat Masuk**: http://127.0.0.1:8000/surat-masuk/
- 📤 **Surat Keluar**: http://127.0.0.1:8000/surat-keluar/
- 🔀 **Disposisi**: http://127.0.0.1:8000/disposisi/
- 📁 **Arsip**: http://127.0.0.1:8000/arsip/
- 👥 **Manajemen User**: http://127.0.0.1:8000/manajemen-user/
- 👤 **Profil**: http://127.0.0.1:8000/profil/

## 🛠️ Teknologi yang Digunakan

- **Backend**: Django 5.1.4
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript
- **Icons**: Font Awesome 6.4.0
- **Charts**: Chart.js
- **Image Processing**: Pillow

## 📁 Struktur Proyek

```
eoffice/
├── accounts/              # Aplikasi utama
│   ├── templates/        # Template HTML
│   ├── static/          # CSS, JS, Images
│   ├── models.py        # Model database
│   ├── views.py         # Logic aplikasi
│   └── urls.py          # URL routing
├── eoffice/             # Konfigurasi project
│   ├── settings.py      # Settings Django
│   └── urls.py          # URL utama
├── manage.py            # Django management
├── requirements.txt     # Dependencies
└── *.bat               # File untuk menjalankan
```

## 📋 Fitur

- ✅ Login & Logout
- ✅ Dashboard dengan statistik
- ✅ Manajemen Surat Masuk
- ✅ Manajemen Surat Keluar
- ✅ Disposisi Surat
- ✅ Arsip Surat
- ✅ Manajemen User
- ✅ Profil User (Edit profil, upload foto)
- ✅ Notifikasi
- ✅ Responsive Design

## 🔧 Troubleshooting

### Server tidak bisa jalan?
1. Pastikan Python terinstall: `python --version`
2. Jalankan `SETUP_PERTAMA_KALI.bat` lagi
3. Cek apakah port 8000 sudah digunakan

### Error saat install dependencies?
1. Update pip: `python -m pip install --upgrade pip`
2. Install ulang: `pip install -r requirements.txt`

### Database error?
1. Hapus file `db.sqlite3`
2. Jalankan: `python manage.py migrate`

## 📞 Support

Jika ada masalah, silakan hubungi developer atau buat issue di repository.

---

**Dibuat dengan ❤️ untuk E-Office**
