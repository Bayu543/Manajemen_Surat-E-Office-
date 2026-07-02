from django.db import models, transaction
from django.utils import timezone
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from .utils import get_roman_month

# Model untuk aplikasi accounts
# Saat ini menggunakan User model bawaan Django
# Bisa ditambahkan custom model di sini jika diperlukan

# Contoh custom model untuk profile user:
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nip = models.CharField(max_length=20, blank=True, verbose_name='NIP')
    jabatan = models.CharField(max_length=100, blank=True, verbose_name='Instansi')
    phone = models.CharField(max_length=20, blank=True, verbose_name='No. Telepon')
    alamat = models.TextField(blank=True, verbose_name='Alamat')
    foto_profil = models.ImageField(upload_to='profile_photos/', blank=True, null=True, verbose_name='Foto Profil')
    
    def __str__(self):
        return f"{self.user.username} Profile"
    
    class Meta:
        verbose_name = 'Profil User'
        verbose_name_plural = 'Profil User'


# Signal untuk membuat UserProfile otomatis saat User dibuat
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, raw=False, **kwargs):
    if raw:
        return
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, raw=False, **kwargs):
    if raw:
        return
    if hasattr(instance, 'profile'):
        instance.profile.save()


class SuratMasuk(models.Model):
    """
    Model untuk menyimpan data Surat Masuk
    """
    STATUS_CHOICES = [
        ('baru', 'Baru'),
        ('diproses', 'Diproses'),
        ('selesai', 'Selesai'),
    ]

    PRIORITAS_CHOICES = [
        ('biasa', 'Biasa'),
        ('segera', 'Segera'),
    ]
    
    prioritas = models.CharField(
        max_length=20,
        choices=PRIORITAS_CHOICES,
        default='biasa',
        verbose_name='Prioritas'
    )
    
    tenggat_waktu = models.DateField(
        null=True,
        blank=True,
        verbose_name='Tenggat Waktu'
    )
    
    nomor_surat = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nomor Surat',
        help_text='Nomor surat resmi (contoh: 001/SM/IV/2026)'
    )
    
    pengirim = models.CharField(
        max_length=200,
        verbose_name='Pengirim',
        help_text='Nama instansi atau organisasi pengirim'
    )
    
    perihal = models.TextField(
        verbose_name='Perihal',
        help_text='Perihal atau subjek surat'
    )
    
    tanggal_surat = models.DateField(
        verbose_name='Tanggal Surat',
        help_text='Tanggal yang tertera pada surat'
    )
    
    tanggal_diterima = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Tanggal Diterima',
        help_text='Tanggal surat diterima di sistem'
    )
    
    file_surat = models.FileField(
        upload_to='surat_masuk/',
        blank=True,
        null=True,
        verbose_name='File Surat',
        help_text='Upload file surat (PDF, DOCX, atau gambar)'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='baru',
        verbose_name='Status',
        help_text='Status pemrosesan surat'
    )
    
    ditugaskan_ke = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='surat_masuk_ditugaskan',
        verbose_name='Ditugaskan Ke',
        help_text='Staff yang ditugaskan untuk menangani surat ini'
    )
    
    catatan = models.TextField(
        blank=True,
        null=True,
        verbose_name='Catatan',
        help_text='Catatan tambahan terkait surat'
    )
    
    dibuat_oleh = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='surat_masuk_dibuat',
        verbose_name='Dibuat Oleh'
    )
    
    dibuat_pada = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Dibuat Pada'
    )
    
    diupdate_pada = models.DateTimeField(
        auto_now=True,
        verbose_name='Diupdate Pada'
    )
    
    class Meta:
        verbose_name = 'Surat Masuk'
        verbose_name_plural = 'Surat Masuk'
        ordering = ['-tanggal_diterima']
        indexes = [
            models.Index(fields=['nomor_surat']),
            models.Index(fields=['status']),
            models.Index(fields=['-tanggal_diterima']),
        ]
    
    def __str__(self):
        return f"{self.nomor_surat} - {self.pengirim}"
    
    def get_status_display_badge(self):
        """
        Return status dengan class CSS untuk badge
        """
        status_classes = {
            'baru': 'badge-status-surat baru',
            'diproses': 'badge-status-surat diproses',
            'selesai': 'badge-status-surat selesai',
        }
        return status_classes.get(self.status, 'badge-status-surat')
    
    def get_file_extension(self):
        """
        Return ekstensi file untuk menampilkan icon yang sesuai
        """
        if self.file_surat:
            return self.file_surat.name.split('.')[-1].lower()
        return None


class Disposisi(models.Model):
    """
    Model untuk menyimpan data alur Disposisi Surat ke Staff
    """
    STATUS_CHOICES = [
        ('baru', 'Baru'),
        ('dibaca', 'Dibaca'),
        ('diproses', 'Diproses'),
        ('selesai', 'Selesai'),
    ]

    PRIORITAS_CHOICES = [
        ('biasa', 'Biasa'),
        ('segera', 'Segera'),
    ]
    
    prioritas = models.CharField(
        max_length=20,
        choices=PRIORITAS_CHOICES,
        default='biasa',
        verbose_name='Prioritas'
    )
    
    tenggat_waktu = models.DateField(
        null=True,
        blank=True,
        verbose_name='Tenggat Waktu'
    )

    surat = models.ForeignKey(
        SuratMasuk,
        on_delete=models.CASCADE,
        related_name='disposisi_list',
        verbose_name='Surat Terkait'
    )
    pemberi_disposisi = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='disposisi_diberikan',
        verbose_name='Pemberi Disposisi'
    )
    penerima_disposisi = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='disposisi_diterima',
        verbose_name='Penerima Disposisi'
    )
    instruksi = models.TextField(
        verbose_name='Instruksi Disposisi'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='baru',
        verbose_name='Status'
    )
    tanggal_dibuat = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Tanggal Dibuat'
    )
    tanggal_dibaca = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Tanggal Dibaca',
        help_text='Timestamp saat staff pertama kali membuka surat'
    )
    tanggal_selesai = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Tanggal Selesai',
        help_text='Timestamp spesifik saat disposisi diselesaikan'
    )
    catatan_penyelesaian = models.TextField(
        blank=True,
        null=True,
        verbose_name='Catatan Penyelesaian',
        help_text='Catatan dari staff saat menyelesaikan disposisi'
    )
    file_bukti = models.FileField(
        upload_to='bukti_disposisi/',
        blank=True,
        null=True,
        verbose_name='File Bukti Penyelesaian',
        help_text='Bukti file kerja dari staff'
    )

    class Meta:
        verbose_name = 'Disposisi'
        verbose_name_plural = 'Disposisi'
        ordering = ['-tanggal_dibuat']

    def __str__(self):
        return f"Disposisi {self.surat.nomor_surat} ke {self.penerima_disposisi.username}"


class SuratKeluar(models.Model):
    """
    Model untuk menyimpan data Draft Surat Keluar dari Staff
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('diajukan', 'Diajukan'),
        ('revisi', 'Revisi'),
        ('disetujui', 'Disetujui'),
    ]

    JENIS_SURAT_CHOICES = [
        ('SK', 'Surat Keputusan'),
        ('SE', 'Surat Edaran'),
        ('SP', 'Surat Pemberitahuan'),
        ('SU', 'Surat Undangan'),
    ]

    DEPARTEMEN_CHOICES = [
        ('IT', 'Information Technology'),
        ('HR', 'Human Resources'),
        ('GA', 'General Affairs'),
        ('FIN', 'Finance'),
    ]

    jenis_surat = models.CharField(
        max_length=100,
        verbose_name='Klasifikasi',
        blank=True,
        null=True
    )
    
    departemen = models.CharField(
        max_length=10,
        choices=DEPARTEMEN_CHOICES,
        default='GA',
        verbose_name='Departemen'
    )

    nomor_surat = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Nomor Surat',
        help_text='Bisa dikosongkan jika belum mendapat nomor dari Admin'
    )
    tujuan = models.CharField(
        max_length=200,
        verbose_name='Tujuan Surat',
        help_text='Instansi atau orang yang dituju'
    )
    perihal = models.TextField(
        verbose_name='Perihal',
        help_text='Perihal atau subjek surat keluar'
    )
    isi_surat = models.TextField(
        verbose_name='Isi Surat',
        help_text='Isi / body teks surat',
        blank=True,
        null=True
    )
    file_draf = models.FileField(
        upload_to='surat_keluar_draf/',
        blank=True,
        null=True,
        verbose_name='File Draf',
        help_text='Upload file draf lampiran (opsional jika generate PDF)'
    )
    file_pdf_final = models.FileField(
        upload_to='surat_keluar_pdf/',
        blank=True,
        null=True,
        verbose_name='File PDF Final',
        help_text='File PDF hasil generate otomatis'
    )
    catatan_revisi = models.TextField(
        blank=True,
        null=True,
        verbose_name='Catatan Revisi',
        help_text='Catatan dari Admin jika surat dikembalikan untuk direvisi'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name='Status'
    )
    pembuat = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='draft_surat_keluar',
        verbose_name='Pembuat'
    )
    tanggal_dibuat = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Tanggal Dibuat'
    )
    tanggal_diupdate = models.DateTimeField(
        auto_now=True,
        verbose_name='Diupdate Pada'
    )

    class Meta:
        verbose_name = 'Surat Keluar'
        verbose_name_plural = 'Surat Keluar'
        ordering = ['-tanggal_dibuat']

    def __str__(self):
        return f"{self.perihal} - {self.tujuan}"

    def save(self, *args, **kwargs):
        if not self.nomor_surat:
            now = timezone.now()
            current_year = now.year
            current_month_roman = get_roman_month(now.month)
            
            with transaction.atomic():
                # Cari surat keluar terakhir di tahun yang sama
                last_surat = SuratKeluar.objects.select_for_update().filter(
                    tanggal_dibuat__year=current_year
                ).exclude(nomor_surat__isnull=True).exclude(nomor_surat='').exclude(nomor_surat__icontains='Konsep').order_by('id').last()
                
                if last_surat and last_surat.nomor_surat:
                    try:
                        last_number = int(last_surat.nomor_surat.split('/')[0])
                        new_number = last_number + 1
                    except (ValueError, IndexError):
                        new_number = 1
                else:
                    new_number = 1
                    
                self.nomor_surat = f"{new_number:03d}/{self.jenis_surat}/{self.departemen}/{current_month_roman}/{current_year}"
                
        super().save(*args, **kwargs)

