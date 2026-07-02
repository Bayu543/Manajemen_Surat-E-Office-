from django.urls import path
from . import views

urlpatterns = [
    path('login/',      views.login_view,      name='login'),
    path('api/captcha/', views.get_captcha_api, name='get_captcha_api'),
    path('api/lupa-password/', views.lupa_password_view, name='lupa_password_api'),
    path('api/dashboard-stats/', views.dashboard_stats_api, name='dashboard_stats_api'),
    path('api/notifications/', views.notifications_api, name='notifications_api'),
    path('register/',   views.register_view,   name='register'),
    path('logout/',     views.logout_view,      name='logout'),
    path('dashboard/',  views.dashboard_view,  name='dashboard'),
    # Profil
    path('profil/',                 views.profil_view,          name='profil'),
    path('profil/upload-foto/',     views.upload_foto_profil,   name='upload_foto_profil'),
    path('profil/ganti-password/',  views.ganti_password_view,  name='ganti_password'),
    path('arsip/',      views.arsip_view,       name='arsip'),

    # Surat Masuk (GET list + POST tambah)
    path('surat-masuk/',                    views.surat_masuk_view,     name='surat_masuk'),
    path('surat-masuk/<int:id>/hapus/',     views.hapus_surat,          name='hapus_surat'),
    path('surat-masuk/<int:id>/edit/',      views.edit_surat,           name='edit_surat'),
    path('surat-masuk/<int:id>/status/',    views.update_status_surat,  name='update_status_surat'),
    path('surat-masuk/<int:id>/tracking/',  views.tracking_surat_api,   name='tracking_surat_api'),

    # Surat Keluar
    path('surat-keluar/',               views.surat_keluar_view,    name='surat_keluar'),
    path('surat-keluar/buat/',          views.buat_draft_action,    name='buat_draft'),
    path('surat-keluar/<int:id>/ajukan/', views.ajukan_draft_action, name='ajukan_draft'),
    path('surat-keluar/<int:id>/setujui/', views.setujui_surat_keluar, name='setujui_surat_keluar'),
    path('surat-keluar/<int:id>/tolak/', views.tolak_surat_keluar, name='tolak_surat_keluar'),

    # Disposisi (GET list + POST buat)
    path('disposisi/',                      views.disposisi_view,           name='disposisi'),
    path('disposisi/<int:id>/detail/',      views.get_detail_disposisi_api, name='detail_disposisi_api'),
    path('disposisi/<int:id>/selesai/',     views.selesaikan_disposisi,     name='selesaikan_disposisi'),
    path('disposisi/<int:id>/update-status/', views.update_status_disposisi, name='update_status_disposisi'),
    path('disposisi/<int:id>/batal/',       views.batal_disposisi,          name='batal_disposisi'),

    # Manajemen User
    path('manajemen-user/',                         views.manajemen_user_view,      name='manajemen_user'),
    path('manajemen-user/tambah/',                  views.tambah_user_view,         name='tambah_user'),
    path('manajemen-user/<int:id>/edit/',            views.edit_user_view,           name='edit_user'),
    path('manajemen-user/<int:id>/hapus/',           views.hapus_user_view,          name='hapus_user'),
    path('manajemen-user/<int:id>/reset-password/',  views.reset_password_user_view, name='reset_password_user'),
]
