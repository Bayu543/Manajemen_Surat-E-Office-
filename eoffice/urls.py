"""
URL configuration for eoffice project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Semua URL app langsung di root: /login/, /dashboard/, /surat-masuk/, dll
    path('', include('accounts.urls')),
]

# Serve media files (Bypassing DEBUG check so it works on Railway)
from django.urls import re_path
from django.views.static import serve
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
