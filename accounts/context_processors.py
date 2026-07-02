from django.urls import reverse
from accounts.models import Disposisi, SuratKeluar, SuratMasuk

def get_user_notifications(user):
    if not user.is_authenticated:
        return {
            'unread_notifications_count': 0,
            'recent_notifications': []
        }

    recent = []
    unread_count = 0

    if user.is_superuser:
        # Admin: Surat Keluar yang baru diajukan oleh staff
        notif_items = SuratKeluar.objects.filter(status='diajukan').select_related('pembuat').order_by('-tanggal_dibuat')[:10]
        unread_count = SuratKeluar.objects.filter(status='diajukan').count()
        
        for notif in notif_items:
            recent.append({
                'id': notif.id,
                'type': 'surat_keluar',
                'label': 'Surat Keluar',
                'sub_label': 'Pengajuan Konsep',
                'title': f'{notif.pembuat.get_full_name() or notif.pembuat.username} mengajukan "{notif.perihal}"',
                'time_ago': notif.tanggal_dibuat,
                'url': reverse('surat_keluar')
            })
    else:
        # Staff:
        # 1. Disposisi baru (Surat Masuk)
        disposisi_items = Disposisi.objects.filter(penerima_disposisi=user, status='baru').select_related('surat', 'pemberi_disposisi').order_by('-tanggal_dibuat')[:10]
        disposisi_count = Disposisi.objects.filter(penerima_disposisi=user, status='baru').count()
        
        for notif in disposisi_items:
            recent.append({
                'id': notif.id,
                'type': 'surat_masuk',
                'label': 'Surat Masuk',
                'sub_label': 'Disposisi Baru',
                'title': f'{notif.pemberi_disposisi.get_full_name() or notif.pemberi_disposisi.username} mendisposisikan surat "{notif.surat.perihal}"',
                'time_ago': notif.tanggal_dibuat,
                'url': reverse('disposisi')
            })

        # 2. Surat Masuk baru ditugaskan langsung
        surat_masuk_items = SuratMasuk.objects.filter(ditugaskan_ke=user, status='baru').select_related('dibuat_oleh').order_by('-tanggal_diterima')[:10]
        surat_masuk_count = SuratMasuk.objects.filter(ditugaskan_ke=user, status='baru').count()
        
        for notif in surat_masuk_items:
            recent.append({
                'id': notif.id,
                'type': 'surat_masuk',
                'label': 'Surat Masuk',
                'sub_label': 'Tugas Baru',
                'title': f'Surat Masuk baru ditugaskan ke Anda: "{notif.perihal}"',
                'time_ago': notif.tanggal_diterima,
                'url': reverse('surat_masuk')
            })

        # 3. Surat Keluar disetujui (Konsep disetujui)
        surat_keluar_items = SuratKeluar.objects.filter(pembuat=user, status='disetujui').order_by('-tanggal_diupdate')[:10]
        for notif in surat_keluar_items:
            recent.append({
                'id': notif.id,
                'type': 'surat_keluar',
                'label': 'Surat Keluar',
                'sub_label': 'Konsep Disetujui',
                'title': f'Konsep surat Anda "{notif.perihal}" telah disetujui Admin',
                'time_ago': notif.tanggal_diupdate,
                'url': reverse('surat_keluar')
            })

        unread_count = disposisi_count + surat_masuk_count

    # Sort combined recent items by time_ago descending
    recent = sorted(recent, key=lambda x: x['time_ago'], reverse=True)[:5]

    return {
        'unread_notifications_count': unread_count,
        'recent_notifications': recent
    }

def notifications(request):
    if not request.user.is_authenticated:
        return {}
    return get_user_notifications(request.user)

