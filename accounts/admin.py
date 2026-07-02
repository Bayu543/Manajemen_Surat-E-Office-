from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import SuratMasuk, UserProfile, SuratKeluar

# Customize admin site headers
admin.site.site_header = "E-Office Administration"
admin.site.site_title = "E-Office Admin"
admin.site.index_title = "Selamat Datang di E-Office Admin Panel"


@admin.register(SuratMasuk)
class SuratMasukAdmin(admin.ModelAdmin):
    """
    Admin interface untuk model SuratMasuk
    """
    list_display = [
        'nomor_surat',
        'pengirim',
        'perihal_short',
        'tanggal_surat',
        'tanggal_diterima',
        'status',
        'ditugaskan_ke',
    ]
    
    list_filter = [
        'status',
        'tanggal_diterima',
        'tanggal_surat',
        'ditugaskan_ke',
    ]
    
    search_fields = [
        'nomor_surat',
        'pengirim',
        'perihal',
    ]
    
    readonly_fields = [
        'tanggal_diterima',
        'dibuat_pada',
        'diupdate_pada',
        'dibuat_oleh',
    ]
    
    fieldsets = (
        ('Informasi Surat', {
            'fields': (
                'nomor_surat',
                'pengirim',
                'perihal',
                'tanggal_surat',
            )
        }),
        ('File & Status', {
            'fields': (
                'file_surat',
                'status',
                'ditugaskan_ke',
                'catatan',
            )
        }),
        ('Metadata', {
            'fields': (
                'tanggal_diterima',
                'dibuat_oleh',
                'dibuat_pada',
                'diupdate_pada',
            ),
            'classes': ('collapse',),
        }),
    )
    
    date_hierarchy = 'tanggal_diterima'
    
    ordering = ['-tanggal_diterima']
    
    list_per_page = 25
    
    def perihal_short(self, obj):
        """
        Menampilkan perihal yang dipotong jika terlalu panjang
        """
        if len(obj.perihal) > 50:
            return obj.perihal[:50] + '...'
        return obj.perihal
    perihal_short.short_description = 'Perihal'
    
    def save_model(self, request, obj, form, change):
        """
        Override save_model untuk menyimpan user yang membuat/mengupdate
        """
        if not change:  # Jika objek baru
            obj.dibuat_oleh = request.user
        super().save_model(request, obj, form, change)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin interface untuk model UserProfile
    """
    list_display = [
        'user',
        'nip',
        'jabatan',
        'phone',
    ]
    
    search_fields = [
        'user__username',
        'user__email',
        'user__first_name',
        'user__last_name',
        'nip',
        'jabatan',
    ]
    
    list_filter = [
        'jabatan',
    ]
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Informasi Profil', {
            'fields': (
                'nip',
                'jabatan',
                'phone',
                'alamat',
                'foto_profil',
            )
        }),
    )
    
    list_per_page = 25

@admin.register(SuratKeluar)
class SuratKeluarAdmin(admin.ModelAdmin):
    """
    Admin interface untuk model SuratKeluar
    """
    list_display = [
        'nomor_surat',
        'jenis_surat',
        'departemen',
        'tujuan',
        'perihal_short',
        'status',
        'pembuat',
        'tanggal_dibuat',
    ]
    
    list_filter = [
        'status',
        'jenis_surat',
        'departemen',
        'tanggal_dibuat',
    ]
    
    search_fields = [
        'nomor_surat',
        'tujuan',
        'perihal',
    ]
    
    readonly_fields = [
        'nomor_surat',
        'tanggal_dibuat',
        'tanggal_diupdate',
    ]
    
    fieldsets = (
        ('Informasi Surat', {
            'fields': (
                'nomor_surat',
                'jenis_surat',
                'departemen',
                'tujuan',
                'perihal',
            )
        }),
        ('File & Status', {
            'fields': (
                'file_draf',
                'status',
                'pembuat',
            )
        }),
        ('Metadata', {
            'fields': (
                'tanggal_dibuat',
                'tanggal_diupdate',
            ),
            'classes': ('collapse',),
        }),
    )
    
    date_hierarchy = 'tanggal_dibuat'
    ordering = ['-tanggal_dibuat']
    list_per_page = 25

    def perihal_short(self, obj):
        if len(obj.perihal) > 50:
            return obj.perihal[:50] + '...'
        return obj.perihal
    perihal_short.short_description = 'Perihal'
