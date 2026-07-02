# Migration bersih yang menggantikan:
# - 0002_alter_suratmasuk_options_and_more (perubahan bolak-balik)
# - 0003_userprofile_alter_suratmasuk_options_and_more (mengembalikan field)
#
# Hasil akhir: state database yang sama dengan setelah 0003 dijalankan,
# tanpa langkah hapus-tambah yang tidak perlu.

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    replaces = [
        ('accounts', '0002_alter_suratmasuk_options_and_more'),
        ('accounts', '0003_userprofile_alter_suratmasuk_options_and_more'),
    ]

    dependencies = [
        ('accounts', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Buat model UserProfile
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nip', models.CharField(blank=True, max_length=20, verbose_name='NIP')),
                ('jabatan', models.CharField(blank=True, max_length=100, verbose_name='Jabatan')),
                ('phone', models.CharField(blank=True, max_length=20, verbose_name='No. Telepon')),
                ('alamat', models.TextField(blank=True, verbose_name='Alamat')),
                ('foto_profil', models.ImageField(blank=True, null=True, upload_to='profile_photos/', verbose_name='Foto Profil')),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='profile',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Profil User',
                'verbose_name_plural': 'Profil User',
            },
        ),

        # Perbaiki SuratMasuk ke state final (setelah 0003)
        migrations.AlterModelOptions(
            name='suratmasuk',
            options={
                'ordering': ['-tanggal_diterima'],
                'verbose_name': 'Surat Masuk',
                'verbose_name_plural': 'Surat Masuk',
            },
        ),
        migrations.AlterField(
            model_name='suratmasuk',
            name='nomor_surat',
            field=models.CharField(
                help_text='Nomor surat resmi (contoh: 001/SM/IV/2026)',
                max_length=100,
                unique=True,
                verbose_name='Nomor Surat',
            ),
        ),
        migrations.AlterField(
            model_name='suratmasuk',
            name='pengirim',
            field=models.CharField(
                help_text='Nama instansi atau organisasi pengirim',
                max_length=200,
                verbose_name='Pengirim',
            ),
        ),
        migrations.AlterField(
            model_name='suratmasuk',
            name='perihal',
            field=models.TextField(
                help_text='Perihal atau subjek surat',
                verbose_name='Perihal',
            ),
        ),
        migrations.AlterField(
            model_name='suratmasuk',
            name='tanggal_surat',
            field=models.DateField(
                help_text='Tanggal yang tertera pada surat',
                verbose_name='Tanggal Surat',
            ),
        ),
        migrations.AlterField(
            model_name='suratmasuk',
            name='status',
            field=models.CharField(
                choices=[('baru', 'Baru'), ('diproses', 'Diproses'), ('selesai', 'Selesai')],
                default='baru',
                help_text='Status pemrosesan surat',
                max_length=20,
                verbose_name='Status',
            ),
        ),
        migrations.AlterField(
            model_name='suratmasuk',
            name='dibuat_oleh',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='surat_masuk_dibuat',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Dibuat Oleh',
            ),
        ),
        migrations.AlterField(
            model_name='suratmasuk',
            name='dibuat_pada',
            field=models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada'),
        ),
        migrations.AlterField(
            model_name='suratmasuk',
            name='ditugaskan_ke',
            field=models.ForeignKey(
                blank=True,
                help_text='Staff yang ditugaskan untuk menangani surat ini',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='surat_masuk_ditugaskan',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Ditugaskan Ke',
            ),
        ),
        migrations.AlterField(
            model_name='suratmasuk',
            name='diupdate_pada',
            field=models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada'),
        ),
    ]
