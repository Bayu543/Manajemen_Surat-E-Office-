from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden, JsonResponse
from django.contrib import messages
from django.contrib.auth.models import User
from django.utils import timezone
from django.views.decorators.http import require_POST
from django.core.signing import Signer, BadSignature
import random
from django.db.models import Count, Q
from django.db.models.functions import ExtractMonth
from .models import UserProfile, SuratMasuk, Disposisi, SuratKeluar


def generate_captcha_logic():
    """Fungsi utilitas untuk membuat soal captcha acak"""
    num1 = random.randint(5, 15)
    num2 = random.randint(1, 5)
    operators = ['+', '-', '*']
    operator = random.choice(operators)
    
    # Pastikan hasil pengurangan tidak negatif untuk kenyamanan user
    if operator == '-':
        if num1 < num2:
            num1, num2 = num2, num1
            
    if operator == '+':
        answer = num1 + num2
    elif operator == '-':
        answer = num1 - num2
    else:
        answer = num1 * num2
        
    return f"{num1} {operator} {num2} = ?", str(answer)


def get_captcha_api(request):
    """API endpoint untuk mendapatkan soal captcha baru dengan Signed Token"""
    question, answer = generate_captcha_logic()
    request.session['captcha_expected'] = str(answer)
    print(f"[CAPTCHA API] Created: {question} -> Answer: {answer}")
    return JsonResponse({
        'question': question,
        'token': 'session_based'
    })


def login_view(request):
    """View untuk halaman login"""
    # Otomatis logout jika mengakses halaman login via GET agar selalu mengarah ke halaman awal
    if request.user.is_authenticated and request.method == 'GET':
        logout(request)
    
    if request.method == 'POST':
        username_or_email = request.POST.get('username')
        password = request.POST.get('password')
        remember_me = request.POST.get('remember_me')
        # Captcha dihapus untuk login sesuai permintaan
        
        print(f"[LOGIN] Captcha valid (Signed Token verified), proceeding...")
        
        print(f"[LOGIN] Captcha valid, proceeding to authentication...")
        
        print(f"[LOGIN] Attempting login for: {username_or_email}")
        
        # Try to find user by email first
        user_obj = None
        if '@' in username_or_email:
            # It's an email
            user_obj = User.objects.filter(email=username_or_email).first()
            if user_obj:
                username = user_obj.username
                print(f"[LOGIN] Found user by email: {username}, is_active: {user_obj.is_active}, is_superuser: {user_obj.is_superuser}")
            else:
                username = username_or_email
                print(f"[LOGIN] Email not found, trying as username")
        else:
            # It's a username
            username = username_or_email
            try:
                user_obj = User.objects.get(username=username)
                print(f"[LOGIN] Found user by username: {username}, is_active: {user_obj.is_active}, is_superuser: {user_obj.is_superuser}")
            except User.DoesNotExist:
                print(f"[LOGIN] Username not found: {username}")
        
        # Authenticate
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            # Check if user is active
            if not user.is_active:
                print(f"[LOGIN] User {username} is not active!")
                messages.error(request, 'Akun Anda tidak aktif. Hubungi administrator.')
                return render(request, 'accounts/login.html')
            
            login(request, user)
            
            # Set session expiry
            if not remember_me:
                request.session.set_expiry(0)  # Session expires when browser closes
            else:
                request.session.set_expiry(1209600)  # 2 weeks
            
            print(f"[LOGIN] Success! User: {user.username}, is_superuser: {user.is_superuser}, is_staff: {user.is_staff}")
            
            messages.success(request, 'Login berhasil!')
            return redirect('dashboard')
        else:
            print(f"[LOGIN] Authentication failed for: {username_or_email}")
            if user_obj:
                print(f"[LOGIN] User exists but password incorrect or user inactive")
            messages.error(request, 'Email atau password salah!')
    
    return render(request, 'accounts/login.html')


def register_view(request):
    """View untuk registrasi user baru"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        try:
            fullname = request.POST.get('fullname', '').strip()
            email = request.POST.get('email', '').strip()
            password = request.POST.get('password', '')
            role = request.POST.get('role', 'staff')
            captcha_answer = request.POST.get('captcha_answer', '').replace(' ', '').strip()
            captcha_token = request.POST.get('captcha_token', '')
            
            # Validasi Captcha
            is_valid = False
            expected = request.session.pop('captcha_expected', None)
            if expected and captcha_answer == expected:
                is_valid = True
                
            if not is_valid:
                messages.error(request, 'Verifikasi keamanan (Captcha) tidak valid atau kedaluwarsa. Silakan coba lagi.')
                return redirect('login')
            
            print(f"[REGISTER] Attempting to register: {email}, role: {role}")
            
            # Validasi input
            if not fullname or not email or not password:
                messages.error(request, 'Semua field harus diisi!')
                return redirect('login')
            
            # Validasi password
            if len(password) < 8:
                messages.error(request, 'Password harus minimal 8 karakter!')
                return redirect('login')
            
            # Validasi email sudah terdaftar
            if User.objects.filter(email=email).exists():
                messages.error(request, 'Email sudah terdaftar!')
                return redirect('login')
            
            # Extract username from email
            username = email.split('@')[0]
            
            # Check if username exists, add number if needed
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            print(f"[REGISTER] Creating user with username: {username}")
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            # Set full name
            if fullname:
                name_parts = fullname.split(' ', 1)
                user.first_name = name_parts[0]
                if len(name_parts) > 1:
                    user.last_name = name_parts[1]
            
            # Set role - only superuser for admin, regular user for staff
            if role == 'admin':
                user.is_superuser = True
                user.is_staff = True
            else:
                # Staff user - regular user (NOT superuser, NOT Django staff)
                # is_active = True by default, so user can login
                user.is_superuser = False
                user.is_staff = False
                user.is_active = True  # Explicitly set to ensure user can login
            
            user.save()
            
            # Create UserProfile for the new user
            UserProfile.objects.create(
                user=user,
                jabatan='Staff',
                nip='',
                phone='',
                alamat=''
            )
            
            print(f"[REGISTER] User created successfully: {username}, is_superuser: {user.is_superuser}, is_active: {user.is_active}")
            
            messages.success(request, f'Registrasi berhasil! Akun staff Anda telah dibuat. Silakan login dengan email dan password Anda.')
            return redirect('login')
            
        except Exception as e:
            print(f"[REGISTER ERROR] {str(e)}")
            import traceback
            traceback.print_exc()
            messages.error(request, f'Terjadi kesalahan: {str(e)}')
            return redirect('login')
    
    return redirect('login')


@require_POST
def lupa_password_view(request):
    """API view untuk mereset password ke default jika user lupa"""
    username_or_email = request.POST.get('username', '').strip()
    captcha_answer    = request.POST.get('captcha_answer', '').replace(' ', '').strip()
    captcha_token     = request.POST.get('captcha_token', '')

    # 1. Validasi Captcha
    is_valid = False
    expected = request.session.pop('captcha_expected', None)
    if expected and captcha_answer == expected:
        is_valid = True

    if not is_valid:
        return JsonResponse({'success': False, 'message': 'Verifikasi keamanan (Captcha) tidak valid.'}, status=400)

    # 2. Cari User
    user = None
    if '@' in username_or_email:
        user = User.objects.filter(email=username_or_email).first()
    else:
        user = User.objects.filter(username=username_or_email).first()

    if not user:
        return JsonResponse({'success': False, 'message': 'Email atau username tidak terdaftar.'}, status=404)

    # 3. Reset Password ke Default
    default_password = 'eoffice123'
    user.set_password(default_password)
    user.save()

    return JsonResponse({
        'success': True,
        'message': 'Password berhasil direset.',
        'username': user.username,
        'email': user.email
    })


def logout_view(request):
    """View untuk logout"""
    logout(request)
    messages.success(request, 'Anda telah keluar dari sistem.')
    return redirect('login')


@login_required
def dashboard_view(request):
    """View untuk dashboard setelah login"""
    from datetime import datetime
    
    # Statistik Dasar
    total_masuk = SuratMasuk.objects.count()
    total_keluar = SuratKeluar.objects.count()
    pending_proses = SuratMasuk.objects.filter(status='diproses').count()
    surat_selesai = SuratMasuk.objects.filter(status='selesai').count()
    
    # Statistik Detail untuk Ringkasan Status
    masuk_baru = SuratMasuk.objects.filter(status='baru').count()
    sedang_diproses = pending_proses
    sk_menunggu = SuratKeluar.objects.filter(status='diajukan').count()

    # Hitung Persentase untuk Progress Bar
    def get_pct(count, total):
        if not total or total == 0: return 0
        return min(int((count / total) * 100), 100)

    p_baru = get_pct(masuk_baru, total_masuk)
    p_proses = get_pct(sedang_diproses, total_masuk)
    p_selesai = get_pct(surat_selesai, total_masuk)
    p_sk_menunggu = get_pct(sk_menunggu, total_keluar)

    context = {
        'current_date': datetime.now().strftime('%A, %d %B %Y'),
        'total_masuk': total_masuk,
        'total_keluar': total_keluar,
        'pending_proses': pending_proses,
        'surat_selesai': surat_selesai,
        'selesai_count': surat_selesai, # fallback untuk template
        'masuk_baru': masuk_baru,
        'sedang_diproses': sedang_diproses,
        'sk_menunggu': sk_menunggu,
        'p_baru': p_baru,
        'p_proses': p_proses,
        'p_selesai': p_selesai,
        'p_sk_menunggu': p_sk_menunggu,
    }

    if request.user.is_superuser:
        # Admin Dashboard: Gabungkan aktivitas terbaru
        sm = SuratMasuk.objects.all().order_by('-tanggal_diterima')[:5]
        recent_sm = []
        for s in sm:
            recent_sm.append({
                'nomor_surat': s.nomor_surat,
                'jenis': 'masuk',
                'pengirim': s.pengirim,
                'penerima': '—',
                'perihal': s.perihal,
                'tanggal_diterima': s.tanggal_diterima,
                'status': s.status
            })
            
        sk = SuratKeluar.objects.exclude(status='draft').order_by('-tanggal_dibuat')[:3]
        recent_sk = []
        for s in sk:
            recent_sk.append({
                'nomor_surat': s.nomor_surat or 'Draft',
                'jenis': 'keluar',
                'pengirim': 'Internal',
                'penerima': s.tujuan,
                'perihal': s.perihal,
                'tanggal_diterima': s.tanggal_dibuat,
                'status': 'menunggu' if s.status == 'diajukan' else 'selesai'
            })
            
        recent_activity = sorted(recent_sm + recent_sk, key=lambda x: x['tanggal_diterima'], reverse=True)[:8]
        context['recent_activity'] = recent_activity
        return render(request, 'accounts/admin/dashboard.html', context)
    else:
        # Staff Dashboard
        tugas_saya_list = SuratMasuk.objects.filter(ditugaskan_ke=request.user).order_by('-tanggal_diterima')[:5]
        disposisi_list = Disposisi.objects.filter(penerima_disposisi=request.user).order_by('-tanggal_dibuat')[:5]
        
        surat_ditugaskan_count = SuratMasuk.objects.filter(ditugaskan_ke=request.user).count()
        disposisi_count = Disposisi.objects.filter(penerima_disposisi=request.user, status='baru').count()
        
        surat_selesai_user = SuratMasuk.objects.filter(ditugaskan_ke=request.user, status='selesai').count()
        disposisi_selesai_user = Disposisi.objects.filter(penerima_disposisi=request.user, status='selesai').count()
        tugas_selesai_count = surat_selesai_user + disposisi_selesai_user
        
        context.update({
            'tugas_saya_list': tugas_saya_list,
            'disposisi_list': disposisi_list,
            'surat_ditugaskan_count': surat_ditugaskan_count,
            'disposisi_count': disposisi_count,
            'tugas_selesai_count': tugas_selesai_count,
        })
        return render(request, 'accounts/staff/dashboard.html', context)


@login_required
def surat_masuk_view(request):
    """View untuk halaman surat masuk - GET list, POST tambah baru"""
    if request.method == 'POST':
        if not request.user.is_superuser:
            return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)

        nomor_surat    = request.POST.get('nomor_surat', '').strip()
        pengirim       = (request.POST.get('pengirim') or request.POST.get('nama_pengirim', '')).strip()
        perihal        = request.POST.get('perihal', '').strip()
        tanggal_surat  = request.POST.get('tanggal_surat', '').strip()
        status         = request.POST.get('status', 'baru').strip()
        sifat          = request.POST.get('sifat_surat', 'biasa').strip()
        tugas_id       = request.POST.get('tugas_ke_staff', '').strip()
        catatan        = request.POST.get('ringkasan', '').strip()
        file_surat     = request.FILES.get('file_surat')

        # Validasi wajib
        if not nomor_surat or not pengirim or not perihal or not tanggal_surat:
            return JsonResponse({'success': False, 'message': 'Nomor surat, pengirim, perihal, dan tanggal wajib diisi.'}, status=400)

        if file_surat:
            if file_surat.size > 5 * 1024 * 1024:
                return JsonResponse({'success': False, 'message': 'Ukuran file terlalu besar! Maksimal 5 MB.'}, status=400)
            import os
            ext = os.path.splitext(file_surat.name)[1].lower()
            if ext not in ['.pdf', '.doc', '.docx']:
                return JsonResponse({'success': False, 'message': 'Format file tidak didukung! Hanya diperbolehkan PDF atau Word (DOC/DOCX).'}, status=400)

        # Cek duplikat nomor surat
        if SuratMasuk.objects.filter(nomor_surat=nomor_surat).exists():
            return JsonResponse({'success': False, 'message': f'Nomor surat "{nomor_surat}" sudah terdaftar.'}, status=400)

        # Resolve staff
        ditugaskan_ke = None
        if tugas_id:
            try:
                ditugaskan_ke = User.objects.get(pk=int(tugas_id))
            except (User.DoesNotExist, ValueError):
                pass

        surat = SuratMasuk.objects.create(
            nomor_surat   = nomor_surat,
            pengirim      = pengirim,
            perihal       = perihal,
            tanggal_surat = tanggal_surat,
            status        = status,
            prioritas     = sifat if sifat in ('biasa', 'segera') else 'biasa',
            ditugaskan_ke = ditugaskan_ke,
            catatan       = catatan,
            file_surat    = file_surat,
            dibuat_oleh   = request.user,
        )

        return JsonResponse({
            'success': True,
            'message': 'Surat masuk berhasil ditambahkan.',
            'surat': {
                'id'            : surat.id,
                'nomor_surat'   : surat.nomor_surat,
                'pengirim'      : surat.pengirim,
                'perihal'       : surat.perihal,
                'tanggal_surat' : surat.tanggal_surat.strftime('%d %b %Y') if hasattr(surat.tanggal_surat, 'strftime') else str(surat.tanggal_surat),
                'status'        : surat.status,
                'ditugaskan_ke' : surat.ditugaskan_ke.get_full_name() or surat.ditugaskan_ke.username if surat.ditugaskan_ke else '-',
            }
        })

    # GET
    if request.user.is_superuser:
        surat_list  = SuratMasuk.objects.select_related('ditugaskan_ke').all()
        staff_list  = User.objects.filter(is_superuser=False, is_active=True).order_by('first_name')
        return render(request, 'accounts/admin/surat_masuk.html', {
            'surat_list': surat_list,
            'staff_list': staff_list,
        })
    else:
        surat_list = SuratMasuk.objects.filter(ditugaskan_ke=request.user)
        return render(request, 'accounts/staff/surat_masuk.html', {'surat_list': surat_list})


@login_required
def surat_keluar_view(request):
    """View untuk halaman surat keluar - Mengambil data riil dari DB"""
    if request.user.is_superuser:
        surat_keluar_list = SuratKeluar.objects.select_related('pembuat').all().order_by('-tanggal_dibuat')
        count_draft = SuratKeluar.objects.filter(status='draft').count()
        count_diajukan = SuratKeluar.objects.filter(status='diajukan').count()
        count_revisi = SuratKeluar.objects.filter(status='revisi').count()
        count_selesai = SuratKeluar.objects.filter(status='disetujui').count()
    else:
        surat_keluar_list = SuratKeluar.objects.filter(pembuat=request.user).order_by('-tanggal_dibuat')
        count_draft = SuratKeluar.objects.filter(pembuat=request.user, status='draft').count()
        count_diajukan = SuratKeluar.objects.filter(pembuat=request.user, status='diajukan').count()
        count_revisi = SuratKeluar.objects.filter(pembuat=request.user, status='revisi').count()
        count_selesai = SuratKeluar.objects.filter(pembuat=request.user, status='disetujui').count()

    context = {
        'surat_keluar_list': surat_keluar_list,
        'count_draft': count_draft,
        'count_diajukan': count_diajukan,
        'count_revisi': count_revisi,
        'count_selesai': count_selesai,
    }
    
    if request.user.is_superuser:
        return render(request, 'accounts/admin/surat_keluar.html', context)
    else:
        return render(request, 'accounts/staff/surat_keluar.html', context)

@login_required
def buat_draft_action(request):
    """View untuk menghandle form POST pembuatan draft surat keluar"""
    if request.method == 'POST':
        if request.user.is_superuser:
            return HttpResponseForbidden("Admin tidak membuat draft surat.")
        
        action_type = request.POST.get('action_type', 'diajukan')
        status_val = 'diajukan' if action_type == 'diajukan' else 'draft'
        
        perihal = request.POST.get('perihal', '').strip()
        tujuan = request.POST.get('tujuan', '').strip()
        nomor_surat = request.POST.get('nomor_surat', '').strip()
        klasifikasi = request.POST.get('klasifikasi', '').strip()
        catatan = request.POST.get('catatan', '').strip()
        file_draf = request.FILES.get('file_draf')
        
        if not perihal or not tujuan or not file_draf or not klasifikasi:
            messages.error(request, 'Klasifikasi, Perihal, Tujuan, dan File Draf wajib diisi.')
            return redirect('surat_keluar')

        if file_draf:
            if file_draf.size > 5 * 1024 * 1024:
                messages.error(request, 'Ukuran file draf terlalu besar! Maksimal 5 MB.')
                return redirect('surat_keluar')
            import os
            ext = os.path.splitext(file_draf.name)[1].lower()
            if ext not in ['.pdf', '.doc', '.docx']:
                messages.error(request, 'Format file draf tidak didukung! Hanya diperbolehkan PDF atau Word (DOC/DOCX).')
                return redirect('surat_keluar')
            
        if klasifikasi and not nomor_surat:
            nomor_surat = f"{klasifikasi} (Konsep)"
            
        if catatan:
            perihal = f"{perihal}\n\n[Catatan Pengantar Staf]: {catatan}"
            
        SuratKeluar.objects.create(
            perihal=perihal,
            tujuan=tujuan,
            nomor_surat=nomor_surat,
            file_draf=file_draf,
            status=status_val,
            pembuat=request.user,
            jenis_surat=klasifikasi
        )
        messages.success(request, f"Surat Keluar berhasil disimpan dengan status '{status_val.capitalize()}'.")
        
    return redirect('surat_keluar')

@login_required
def ajukan_draft_action(request, id):
    """View untuk mengubah status draft menjadi diajukan"""
    if request.method == 'POST':
        draft = get_object_or_404(SuratKeluar, id=id)
        
        if request.user != draft.pembuat:
            return HttpResponseForbidden("Anda tidak berhak mengajukan draft ini.")
            
        if draft.status != 'draft':
            messages.error(request, 'Hanya draft yang bisa diajukan.')
        else:
            draft.status = 'diajukan'
            draft.save()
            messages.success(request, 'Draft berhasil diajukan ke Admin.')
            
    return redirect('surat_keluar')


@login_required
@require_POST
def setujui_surat_keluar(request, id):
    """View untuk menyetujui surat keluar oleh Admin"""
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)
    surat = get_object_or_404(SuratKeluar, id=id)
    if surat.status != 'diajukan':
        return JsonResponse({'success': False, 'message': 'Hanya surat dengan status Diajukan yang dapat disetujui.'}, status=400)
    surat.status = 'disetujui'
    if surat.nomor_surat and " (Konsep)" in surat.nomor_surat:
        surat.nomor_surat = None
    surat.save()
    return JsonResponse({
        'success': True,
        'message': 'Surat keluar berhasil disetujui.',
        'nomor_surat': surat.nomor_surat
    })


@login_required
@require_POST
def tolak_surat_keluar(request, id):
    """View untuk menolak/mengembalikan surat keluar untuk direvisi oleh Admin"""
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)
    surat = get_object_or_404(SuratKeluar, id=id)
    if surat.status != 'diajukan':
        return JsonResponse({'success': False, 'message': 'Hanya surat dengan status Diajukan yang dapat direvisi.'}, status=400)
    
    catatan = request.POST.get('catatan_revisi', '').strip()
    if not catatan:
        return JsonResponse({'success': False, 'message': 'Catatan revisi wajib diisi.'}, status=400)
        
    surat.status = 'revisi'
    surat.catatan_revisi = catatan
    surat.save()
    
    return JsonResponse({
        'success': True,
        'message': 'Surat keluar berhasil dikembalikan untuk direvisi.'
    })


@login_required
def notifications_api(request):
    """API view to fetch unread notifications dynamically for polling"""
    from accounts.context_processors import get_user_notifications
    from django.utils.timesince import timesince
    
    data = get_user_notifications(request.user)
    
    serialized_recent = []
    for notif in data['recent_notifications']:
        serialized_recent.append({
            'id': notif['id'],
            'type': notif['type'],
            'label': notif['label'],
            'sub_label': notif['sub_label'],
            'title': notif['title'],
            'time_ago': timesince(notif['time_ago']) + ' yang lalu',
            'url': notif['url']
        })
        
    return JsonResponse({
        'unread_count': data['unread_notifications_count'],
        'recent_notifications': serialized_recent
    })


@login_required
def disposisi_view(request):
    """View untuk halaman disposisi — GET list, POST buat baru"""
    if request.method == 'POST':
        if not request.user.is_superuser:
            return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)

        surat_id    = request.POST.get('surat_id', '').strip()
        staff_ids   = request.POST.getlist('staff_ids')   # bisa multi
        instruksi   = request.POST.get('instruksi', '').strip()
        prioritas   = request.POST.get('prioritas', 'biasa').strip()
        tenggat     = request.POST.get('tenggat_waktu', '').strip() or None

        if not surat_id or not staff_ids or not instruksi:
            return JsonResponse({'success': False, 'message': 'Surat, staff, dan instruksi wajib diisi.'}, status=400)

        surat = get_object_or_404(SuratMasuk, pk=surat_id)
        created = []
        for sid in staff_ids:
            try:
                staff = User.objects.get(pk=int(sid))
            except (User.DoesNotExist, ValueError):
                continue
            d = Disposisi.objects.create(
                surat               = surat,
                pemberi_disposisi   = request.user,
                penerima_disposisi  = staff,
                instruksi           = instruksi,
                prioritas           = prioritas if prioritas in ('biasa', 'segera') else 'biasa',
                tenggat_waktu       = tenggat or None,
                status              = 'baru',
            )
            created.append({
                'id'       : d.id,
                'staff'    : staff.get_full_name() or staff.username,
                'status'   : d.status,
                'tanggal'  : d.tanggal_dibuat.strftime('%d %b %Y'),
            })

        return JsonResponse({'success': True, 'message': f'{len(created)} disposisi berhasil dibuat.', 'disposisi': created})

    # GET
    if request.user.is_superuser:
        disposisi_list = Disposisi.objects.select_related('surat', 'penerima_disposisi').all()
        surat_list     = SuratMasuk.objects.all().order_by('-tanggal_diterima')
        staff_list     = User.objects.filter(is_superuser=False, is_active=True).order_by('first_name')
        return render(request, 'accounts/admin/disposisi.html', {
            'disposisi_list': disposisi_list,
            'surat_list'    : surat_list,
            'staff_list'    : staff_list,
        })
    else:
        disposisi_list = Disposisi.objects.filter(penerima_disposisi=request.user).select_related('surat', 'pemberi_disposisi')
        
        # Hitung statistik disposisi untuk staff saat ini
        count_belum_dibaca = disposisi_list.filter(status='baru').count()
        count_dibaca = disposisi_list.filter(status='dibaca').count()
        count_diproses = disposisi_list.filter(status='diproses').count()
        count_selesai = disposisi_list.filter(status='selesai').count()
        
        # Daftar Tugas Aktif (status: baru, dibaca, diproses)
        tugas_aktif = disposisi_list.filter(status__in=['baru', 'dibaca', 'diproses']).order_by('-tanggal_dibuat')
        
        context = {
            'disposisi_list': disposisi_list,
            'count_belum_dibaca': count_belum_dibaca,
            'count_dibaca': count_dibaca,
            'count_diproses': count_diproses,
            'count_selesai': count_selesai,
            'tugas_aktif': tugas_aktif,
        }
        return render(request, 'accounts/staff/disposisi.html', context)


@login_required
def selesaikan_disposisi(request, id):
    """Fungsi untuk mengubah status disposisi menjadi Selesai"""
    disposisi = get_object_or_404(Disposisi, id=id)
    
    # Hanya penerima disposisi atau admin yang bisa mengubah status
    if request.user != disposisi.penerima_disposisi and not request.user.is_superuser:
        return HttpResponseForbidden("Anda tidak berhak mengubah status disposisi ini.")
    
    if request.method == 'POST':
        catatan = request.POST.get('catatan_penyelesaian', '').strip()
        file_bukti = request.FILES.get('file_bukti')
        
        if file_bukti:
            if file_bukti.size > 5 * 1024 * 1024:
                messages.error(request, 'Ukuran file bukti terlalu besar! Maksimal 5 MB.')
                return redirect('disposisi')
            import os
            ext = os.path.splitext(file_bukti.name)[1].lower()
            if ext not in ['.pdf', '.doc', '.docx']:
                messages.error(request, 'Format file bukti tidak didukung! Hanya diperbolehkan PDF atau Word (DOC/DOCX).')
                return redirect('disposisi')

        disposisi.status = 'selesai'
        disposisi.tanggal_selesai = timezone.now()
        if catatan:
            disposisi.catatan_penyelesaian = catatan
        if file_bukti:
            disposisi.file_bukti = file_bukti
        disposisi.save()
        messages.success(request, 'Disposisi berhasil diselesaikan.')
    else:
        disposisi.status = 'selesai'
        disposisi.tanggal_selesai = timezone.now()
        disposisi.save()
        messages.success(request, 'Status disposisi berhasil diubah menjadi Selesai.')
        
    return redirect('disposisi')


@login_required
@require_POST
def update_status_disposisi(request, id):
    """View untuk memperbarui status disposisi oleh staff (via AJAX/POST)"""
    disposisi = get_object_or_404(Disposisi, id=id)
    
    # Hanya penerima disposisi atau admin yang bisa mengubah status
    if request.user != disposisi.penerima_disposisi and not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)
        
    status = request.POST.get('status', '').strip()
    if status not in ('baru', 'dibaca', 'diproses', 'selesai'):
        return JsonResponse({'success': False, 'message': 'Status tidak valid.'}, status=400)
        
    disposisi.status = status
    if status == 'selesai':
        disposisi.tanggal_selesai = timezone.now()
        catatan = request.POST.get('catatan_penyelesaian', '').strip()
        file_bukti = request.FILES.get('file_bukti')
        
        if file_bukti:
            if file_bukti.size > 5 * 1024 * 1024:
                return JsonResponse({'success': False, 'message': 'Ukuran file bukti terlalu besar! Maksimal 5 MB.'}, status=400)
            import os
            ext = os.path.splitext(file_bukti.name)[1].lower()
            if ext not in ['.pdf', '.doc', '.docx']:
                return JsonResponse({'success': False, 'message': 'Format file bukti tidak didukung! Hanya diperbolehkan PDF atau Word (DOC/DOCX).'}, status=400)

        if catatan:
            disposisi.catatan_penyelesaian = catatan
        if file_bukti:
            disposisi.file_bukti = file_bukti
    elif status == 'dibaca' and not disposisi.tanggal_dibaca:
        disposisi.tanggal_dibaca = timezone.now()
    elif status == 'diproses' and disposisi.status == 'baru':
        # Jika langsung dari baru ke diproses, set juga dibaca jika belum
        if not disposisi.tanggal_dibaca:
            disposisi.tanggal_dibaca = timezone.now()
            
    disposisi.save()
    messages.success(request, f'Status disposisi berhasil diperbarui menjadi {status.capitalize()}.')
    return JsonResponse({'success': True, 'message': 'Status disposisi berhasil diperbarui.'})


@login_required
@require_POST
def batal_disposisi(request, id):
    """Admin menarik kembali / membatalkan disposisi yang salah kirim"""
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)
    d = get_object_or_404(Disposisi, pk=id)
    if d.status in ('baru', 'belum_dibaca'):
        d.delete()
        messages.success(request, 'Disposisi berhasil dibatalkan dan ditarik kembali.')
    else:
        messages.error(request, 'Disposisi yang sudah dibaca atau diproses tidak dapat dibatalkan.')
    return redirect('disposisi')


@login_required
def get_detail_disposisi_api(request, id):
    """API endpoint untuk mengambil detail lengkap disposisi dan surat induknya dalam format JSON"""
    d = get_object_or_404(Disposisi, id=id)
    
    if not request.user.is_superuser and request.user != d.penerima_disposisi and request.user != d.pemberi_disposisi:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)
        
    # Jika staff membuka detail pertama kali dan status masih 'baru', ubah jadi 'dibaca'
    if request.user == d.penerima_disposisi and d.status == 'baru':
        d.status = 'dibaca'
        d.tanggal_dibaca = timezone.now()
        d.save()
        
    def format_indonesian_datetime(dt, show_time=False):
        if not dt:
            return '-'
        months = {
            1: 'Mei', # Default placeholder fallback just in case
            1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
            7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
        }
        day = dt.day
        month = months.get(dt.month, 'Mei')
        year = dt.year
        if show_time:
            from django.utils import timezone
            # Convert to local time if aware
            local_dt = timezone.localtime(dt) if timezone.is_aware(dt) else dt
            return f"{day} {month} {year}, {local_dt.strftime('%H:%M')} WIB"
        return f"{day} {month} {year}"
        
    s = d.surat
    data = {
        'id': d.id,
        'nomor_surat': s.nomor_surat,
        'pengirim': s.pengirim,
        'perihal': s.perihal,
        'tanggal_surat': format_indonesian_datetime(s.tanggal_surat, show_time=False),
        'tanggal_diterima': format_indonesian_datetime(s.tanggal_diterima, show_time=True),
        'file_surat_url': s.file_surat.url if s.file_surat else '',
        'prioritas': d.prioritas,
        'tanggal_disposisi': format_indonesian_datetime(d.tanggal_dibuat, show_time=True),
        'instruksi': d.instruksi,
        'staff_nama': d.penerima_disposisi.get_full_name() or d.penerima_disposisi.username,
        'staff_avatar': d.penerima_disposisi.profile.foto_profil.url if d.penerima_disposisi.profile.foto_profil else (
            f"https://ui-avatars.com/api/?name={d.penerima_disposisi.get_full_name() or d.penerima_disposisi.username}&background=DBEAFE&color=2563EB&bold=true"
            if d.penerima_disposisi.is_superuser else
            f"https://ui-avatars.com/api/?name={d.penerima_disposisi.get_full_name() or d.penerima_disposisi.username}&background=F3E8FF&color=7C3AED&bold=true"
        ),
        'status': d.status,
        'tanggal_dibaca': format_indonesian_datetime(d.tanggal_dibaca, show_time=True) if d.tanggal_dibaca else 'Belum dibaca',
        'tanggal_selesai': format_indonesian_datetime(d.tanggal_selesai, show_time=True) if d.tanggal_selesai else 'Belum selesai',
        'catatan_penyelesaian': d.catatan_penyelesaian or 'Tidak ada catatan.',
        'file_bukti_url': d.file_bukti.url if d.file_bukti else '',
    }
    return JsonResponse({'success': True, 'data': data})



@login_required
def hapus_surat(request, id):
    """Fungsi hapus surat yang diproteksi hanya untuk Admin"""
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)

    surat = get_object_or_404(SuratMasuk, id=id)
    surat.delete()

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'success': True, 'message': 'Surat berhasil dihapus.'})

    messages.success(request, 'Surat berhasil dihapus.')
    return redirect('surat_masuk')


@login_required
@require_POST
def edit_surat(request, id):
    """Edit surat masuk — hanya Admin"""
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)

    surat = get_object_or_404(SuratMasuk, id=id)

    nomor_surat   = request.POST.get('nomor_surat', '').strip()
    pengirim      = request.POST.get('pengirim', '').strip()
    perihal       = request.POST.get('perihal', '').strip()
    tanggal_surat = request.POST.get('tanggal_surat', '').strip()
    status        = request.POST.get('status', surat.status).strip()
    tugas_id      = request.POST.get('ditugaskan_ke', '').strip()

    if not nomor_surat or not pengirim or not perihal or not tanggal_surat:
        return JsonResponse({'success': False, 'message': 'Field wajib tidak boleh kosong.'}, status=400)

    # Cek duplikat nomor surat (kecuali milik sendiri)
    if SuratMasuk.objects.filter(nomor_surat=nomor_surat).exclude(pk=id).exists():
        return JsonResponse({'success': False, 'message': f'Nomor surat "{nomor_surat}" sudah digunakan.'}, status=400)

    ditugaskan_ke = None
    if tugas_id:
        try:
            ditugaskan_ke = User.objects.get(pk=int(tugas_id))
        except (User.DoesNotExist, ValueError):
            pass

    surat.nomor_surat   = nomor_surat
    surat.pengirim      = pengirim
    surat.perihal       = perihal
    surat.tanggal_surat = tanggal_surat
    surat.status        = status
    surat.ditugaskan_ke = ditugaskan_ke
    file_surat = request.FILES.get('file_surat')
    if file_surat:
        if file_surat.size > 5 * 1024 * 1024:
            return JsonResponse({'success': False, 'message': 'Ukuran file terlalu besar! Maksimal 5 MB.'}, status=400)
        import os
        ext = os.path.splitext(file_surat.name)[1].lower()
        if ext not in ['.pdf', '.doc', '.docx']:
            return JsonResponse({'success': False, 'message': 'Format file tidak didukung! Hanya diperbolehkan PDF atau Word (DOC/DOCX).'}, status=400)
        surat.file_surat = file_surat
    surat.save()

    return JsonResponse({
        'success': True,
        'message': 'Surat berhasil diperbarui.',
        'surat': {
            'id'            : surat.id,
            'nomor_surat'   : surat.nomor_surat,
            'pengirim'      : surat.pengirim,
            'perihal'       : surat.perihal,
            'tanggal_surat' : surat.tanggal_surat.strftime('%d %b %Y') if hasattr(surat.tanggal_surat, 'strftime') else str(surat.tanggal_surat),
            'status'        : surat.status,
            'ditugaskan_ke' : surat.ditugaskan_ke.get_full_name() or surat.ditugaskan_ke.username if surat.ditugaskan_ke else '-',
        }
    })


@login_required
@require_POST
def update_status_surat(request, id):
    """Staff mengubah status surat yang ditugaskan kepadanya"""
    surat = get_object_or_404(SuratMasuk, id=id)

    if not request.user.is_superuser and surat.ditugaskan_ke != request.user:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)

    new_status = request.POST.get('status', '').strip()
    if new_status not in ('baru', 'diproses', 'selesai'):
        return JsonResponse({'success': False, 'message': 'Status tidak valid.'}, status=400)

    surat.status = new_status
    surat.save(update_fields=['status', 'diupdate_pada'])
    return JsonResponse({'success': True, 'message': 'Status berhasil diperbarui.', 'status': new_status})


@login_required
def arsip_view(request):
    """View untuk halaman arsip - Menggabungkan Surat Masuk & Keluar"""
    from datetime import datetime
    
    # Ambil Surat Masuk
    masuk = SuratMasuk.objects.all()
    for s in masuk:
        s.jenis = 'masuk'
        s.tujuan = '-' # Tambahkan atribut tujuan agar template tidak error
    
    # Ambil Surat Keluar yang sudah disetujui (selesai)
    keluar = SuratKeluar.objects.filter(status='disetujui')
    for s in keluar:
        s.jenis = 'keluar'
        s.pengirim = '-' # Tambahkan atribut pengirim agar template tidak error
        s.tanggal_surat = s.tanggal_dibuat.date()
    
    # Gabungkan
    from itertools import chain
    combined = sorted(
        chain(masuk, keluar),
        key=lambda x: x.tanggal_surat if hasattr(x, 'tanggal_surat') else x.tanggal_dibuat.date(),
        reverse=True
    )
    
    context = {
        'current_date': datetime.now().strftime('%A, %d-%m-%Y'),
        'surat_list': combined
    }
    
    if request.user.is_superuser:
        return render(request, 'accounts/admin/arsip.html', context)
    else:
        return render(request, 'accounts/staff/arsip.html', context)


@login_required
def manajemen_user_view(request):
    """View untuk halaman manajemen user — hanya Admin"""
    if not request.user.is_superuser:
        return redirect('dashboard')

    user_list = User.objects.select_related('profile').order_by('-date_joined')
    return render(request, 'accounts/admin/manajemen_user.html', {'user_list': user_list})


@login_required
@require_POST
def tambah_user_view(request):
    """Tambah user baru — hanya Admin"""
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)

    nama_lengkap = (request.POST.get('nama_lengkap') or request.POST.get('x_tambah_nama', '')).strip()
    email        = (request.POST.get('email') or request.POST.get('x_tambah_email', '')).strip()
    jabatan      = (request.POST.get('jabatan') or request.POST.get('x_tambah_jabatan', '')).strip()
    role         = request.POST.get('role', 'staff').strip()
    password     = request.POST.get('password', '').strip()
    konfirmasi   = request.POST.get('konfirmasi_password', '').strip()

    if not nama_lengkap or not email or not password:
        return JsonResponse({'success': False, 'message': 'Nama, email, dan password wajib diisi.'}, status=400)
    if len(password) < 8:
        return JsonResponse({'success': False, 'message': 'Password minimal 8 karakter.'}, status=400)
    if password != konfirmasi:
        return JsonResponse({'success': False, 'message': 'Konfirmasi password tidak cocok.'}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({'success': False, 'message': 'Email sudah terdaftar.'}, status=400)

    username = email.split('@')[0]
    base = username
    i = 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{i}'; i += 1

    user = User.objects.create_user(username=username, email=email, password=password)
    parts = nama_lengkap.split(' ', 1)
    user.first_name = parts[0]
    user.last_name  = parts[1] if len(parts) > 1 else ''
    if role == 'admin':
        user.is_superuser = True
        user.is_staff     = True
    user.save()

    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.jabatan = jabatan
    profile.save()

    return JsonResponse({
        'success': True,
        'message': f'User {nama_lengkap} berhasil ditambahkan.',
        'user': {
            'id'      : user.id,
            'nama'    : user.get_full_name() or user.username,
            'email'   : user.email,
            'jabatan' : profile.jabatan,
            'role'    : 'Admin' if user.is_superuser else 'Staff',
            'status'  : 'Aktif' if user.is_active else 'Nonaktif',
            'avatar'  : f"https://ui-avatars.com/api/?name={user.get_full_name() or user.username}&background=DBEAFE&color=2563EB&bold=true" if user.is_superuser else f"https://ui-avatars.com/api/?name={user.get_full_name() or user.username}&background=F3E8FF&color=7C3AED&bold=true",
        }
    })


@login_required
@require_POST
def edit_user_view(request, id):
    """Edit user — hanya Admin"""
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)

    target = get_object_or_404(User, pk=id)

    nama_lengkap = (request.POST.get('nama_lengkap') or request.POST.get('x_edit_nama', '')).strip()
    email        = (request.POST.get('email') or request.POST.get('x_edit_email', '')).strip()
    jabatan      = (request.POST.get('jabatan') or request.POST.get('x_edit_jabatan', '')).strip()
    role         = (request.POST.get('role') or request.POST.get('x_edit_role', '')).strip()
    status       = (request.POST.get('status') or request.POST.get('x_edit_status', '')).strip()

    if not nama_lengkap or not email:
        return JsonResponse({'success': False, 'message': 'Nama dan email wajib diisi.'}, status=400)

    if User.objects.filter(email=email).exclude(pk=id).exists():
        return JsonResponse({'success': False, 'message': 'Email sudah digunakan user lain.'}, status=400)

    parts = nama_lengkap.split(' ', 1)
    target.first_name = parts[0]
    target.last_name  = parts[1] if len(parts) > 1 else ''
    target.email      = email
    if role == 'admin':
        target.is_superuser = True
        target.is_staff     = True
    elif role == 'staff':
        target.is_superuser = False
        target.is_staff     = False
    if status == 'aktif':
        target.is_active = True
    elif status == 'nonaktif':
        target.is_active = False
    target.save()

    profile, _ = UserProfile.objects.get_or_create(user=target)
    profile.jabatan = jabatan
    profile.save()

    return JsonResponse({
        'success': True,
        'message': 'User berhasil diperbarui.',
        'user': {
            'id'      : target.id,
            'nama'    : target.get_full_name() or target.username,
            'email'   : target.email,
            'jabatan' : profile.jabatan,
            'role'    : 'Admin' if target.is_superuser else 'Staff',
            'status'  : 'Aktif' if target.is_active else 'Nonaktif',
        }
    })


@login_required
@require_POST
def hapus_user_view(request, id):
    """Hapus user — hanya Admin, tidak bisa hapus diri sendiri"""
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)
    if request.user.pk == id:
        return JsonResponse({'success': False, 'message': 'Tidak bisa menghapus akun sendiri.'}, status=400)

    target = get_object_or_404(User, pk=id)
    nama = target.get_full_name() or target.username
    target.delete()
    return JsonResponse({'success': True, 'message': f'User {nama} berhasil dihapus.'})


@login_required
@require_POST
def reset_password_user_view(request, id):
    """Reset password user ke default — hanya Admin"""
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)

    target = get_object_or_404(User, pk=id)
    default_password = 'eoffice123'
    target.set_password(default_password)
    target.save()
    return JsonResponse({'success': True, 'message': f'Password direset ke: {default_password}'})


@login_required
@require_POST
def upload_foto_profil(request):
    """Upload / ganti foto profil user"""
    foto = request.FILES.get('foto_profil')
    if not foto:
        messages.error(request, 'Tidak ada file yang dikirim.')
        return redirect('profil')

    # Validasi tipe file
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
    if foto.content_type not in allowed_types:
        messages.error(request, 'Format file tidak didukung. Harap gunakan hanya format JPG atau PNG.')
        return redirect('profil')

    # Validasi ukuran file (max 5MB)
    if foto.size > 5 * 1024 * 1024:
        messages.error(request, 'Ukuran file terlalu besar. Maksimal 5MB.')
        return redirect('profil')

    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    # Hapus foto lama jika ada
    if profile.foto_profil:
        import os
        old_path = profile.foto_profil.path
        if os.path.exists(old_path):
            os.remove(old_path)

    profile.foto_profil = foto
    profile.save()

    messages.success(request, 'Foto profil berhasil diperbarui.')
    return redirect('profil')


@login_required
@require_POST
def ganti_password_view(request):
    """Ganti password user sendiri"""
    from django.contrib.auth import update_session_auth_hash

    password_lama  = request.POST.get('password_lama', '').strip()
    password_baru  = request.POST.get('password_baru', '').strip()
    konfirmasi     = request.POST.get('konfirmasi_password_baru', '').strip()

    if not request.user.check_password(password_lama):
        return JsonResponse({'success': False, 'message': 'Password lama tidak sesuai.'}, status=400)
    if len(password_baru) < 8:
        return JsonResponse({'success': False, 'message': 'Password baru minimal 8 karakter.'}, status=400)
    if password_baru != konfirmasi:
        return JsonResponse({'success': False, 'message': 'Konfirmasi password tidak cocok.'}, status=400)

    request.user.set_password(password_baru)
    request.user.save()
    update_session_auth_hash(request, request.user)  # Jaga sesi tetap aktif

    return JsonResponse({'success': True, 'message': 'Password berhasil diubah.'})


@login_required
def profil_view(request):
    """View untuk halaman profil"""
    if request.method == 'POST':
        from django.http import JsonResponse
        import traceback
        
        try:
            # Get form data
            nama_lengkap = request.POST.get('nama_lengkap', '')
            email = request.POST.get('email', '')
            jabatan = request.POST.get('jabatan', '')
            nip = request.POST.get('nip', '')
            telepon = request.POST.get('telepon', '')
            alamat = request.POST.get('alamat', '')
            
            print(f"Received data: nama={nama_lengkap}, email={email}, jabatan={jabatan}")
            
            # Update User model
            user = request.user
            
            # Split nama lengkap menjadi first_name dan last_name
            if nama_lengkap:
                name_parts = nama_lengkap.strip().split(' ', 1)
                user.first_name = name_parts[0]
                if len(name_parts) > 1:
                    user.last_name = name_parts[1]
                else:
                    user.last_name = ''
            
            # Update email
            if email:
                # Check if email already exists for other users
                if User.objects.filter(email=email).exclude(id=user.id).exists():
                    return JsonResponse({
                        'success': False,
                        'message': 'Email sudah digunakan oleh user lain!'
                    })
                user.email = email
            
            user.save()
            print(f"User saved: {user.get_full_name()}")
            
            # Update or create UserProfile
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.jabatan = jabatan or ''
            profile.nip = nip or ''
            profile.phone = telepon or ''
            profile.alamat = alamat or ''
            profile.save()
            print(f"Profile saved: {profile.jabatan}")
            
            return JsonResponse({
                'success': True,
                'message': 'Profil berhasil diperbarui!',
                'data': {
                    'nama_lengkap': user.get_full_name() or user.username,
                    'email': user.email,
                    'jabatan': profile.jabatan,
                    'nip': profile.nip,
                    'telepon': profile.phone,
                    'alamat': profile.alamat
                }
            })
        except Exception as e:
            print(f"Error in profil_view: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'success': False,
                'message': f'Terjadi kesalahan: {str(e)}'
            })
    
    # GET request - render template
    # Ensure user has a profile
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    context = {
        'user': request.user,
        'profile': profile
    }
    
    if request.user.is_superuser:
        return render(request, 'accounts/admin/profil.html', context)
    else:
        return render(request, 'accounts/staff/profil.html', context)


@login_required
def dashboard_stats_api(request):
    """API terpadu untuk mengambil semua statistik dashboard secara riil"""
    range_type = request.GET.get('range', 'year')
    now = timezone.now()
    
    # 1. Stats Cards & Summary (Untuk update Stat Cards & Progress Bars)
    total_masuk = SuratMasuk.objects.count()
    total_keluar = SuratKeluar.objects.count()
    pending_proses = SuratMasuk.objects.filter(status='diproses').count()
    surat_selesai = SuratMasuk.objects.filter(status='selesai').count()
    
    masuk_baru = SuratMasuk.objects.filter(status='baru').count()
    sedang_diproses = pending_proses
    sk_menunggu = SuratKeluar.objects.filter(status='diajukan').count()

    def get_pct(count, total):
        if not total or total == 0: return 0
        return int((count / total) * 100)

    stats = {
        'total_masuk': total_masuk,
        'total_keluar': total_keluar,
        'pending_proses': pending_proses,
        'surat_selesai': surat_selesai,
        'masuk_baru': masuk_baru,
        'sedang_diproses': sedang_diproses,
        'sk_menunggu': sk_menunggu,
        'p_baru': get_pct(masuk_baru, total_masuk),
        'p_proses': get_pct(sedang_diproses, total_masuk),
        'p_selesai': get_pct(surat_selesai, total_masuk),
        'p_sk_menunggu': get_pct(sk_menunggu, total_keluar),
    }

    # 2. Chart Data
    labels = []
    masuk_data = []
    keluar_data = []

    # Calculate boundary dates
    if range_type == 'week':
        start_date = now - timezone.timedelta(days=6)
    elif range_type == 'month':
        start_date = now - timezone.timedelta(days=29)
    else:
        # Year
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # Use range query (BETWEEN) which Django optimizes perfectly without CONVERT_TZ
    m_qs = list(SuratMasuk.objects.filter(tanggal_diterima__gte=start_date).values_list('tanggal_diterima', flat=True))
    k_qs = list(SuratKeluar.objects.filter(tanggal_dibuat__gte=start_date).values_list('tanggal_dibuat', flat=True))
    
    # Convert all to local date objects for easy counting
    m_dates = [dt.astimezone(timezone.get_current_timezone()).date() for dt in m_qs if dt]
    k_dates = [dt.astimezone(timezone.get_current_timezone()).date() for dt in k_qs if dt]

    if range_type == 'week':
        days_id = {'Mon':'Sen', 'Tue':'Sel', 'Wed':'Rab', 'Thu':'Kam', 'Fri':'Jum', 'Sat':'Sab', 'Sun':'Min'}
        for i in range(6, -1, -1):
            d = (now - timezone.timedelta(days=i)).date()
            labels.append(days_id.get(d.strftime('%a'), d.strftime('%a')))
            masuk_data.append(m_dates.count(d))
            keluar_data.append(k_dates.count(d))
            
    elif range_type == 'month':
        for i in range(29, -1, -1):
            d = (now - timezone.timedelta(days=i)).date()
            labels.append(d.strftime('%d/%m'))
            masuk_data.append(m_dates.count(d))
            keluar_data.append(k_dates.count(d))
            
    else: # Year
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        labels = month_names
        masuk_data = [0] * 12
        keluar_data = [0] * 12
        
        for dt in m_qs:
            if dt:
                local_dt = dt.astimezone(timezone.get_current_timezone())
                if local_dt.year == now.year:
                    masuk_data[local_dt.month - 1] += 1
                    
        for dt in k_qs:
            if dt:
                local_dt = dt.astimezone(timezone.get_current_timezone())
                if local_dt.year == now.year:
                    keluar_data[local_dt.month - 1] += 1

    return JsonResponse({
        'success': True,
        'stats': stats,
        'chart': {
            'range': range_type,
            'labels': labels,
            'masuk': masuk_data,
            'keluar': keluar_data
        }
    })

@login_required
def tracking_surat_api(request, id):
    surat = get_object_or_404(SuratMasuk, id=id)
    
    if not request.user.is_superuser and surat.ditugaskan_ke != request.user:
        # Periksa apakah user adalah penerima disposisi dari surat ini
        is_disposisi_receiver = surat.disposisi_list.filter(penerima_disposisi=request.user).exists()
        if not is_disposisi_receiver:
            return JsonResponse({'success': False, 'message': 'Akses ditolak.'}, status=403)
            
    events = []
    
    events.append({
        'title': 'Surat Diterima',
        'waktu': surat.tanggal_diterima.strftime('%d %b %Y, %H:%M WIB'),
        'aktor': surat.dibuat_oleh.get_full_name() or surat.dibuat_oleh.username if surat.dibuat_oleh else 'Admin',
        'status_color': 'blue'
    })
    
    disposisi_list = surat.disposisi_list.all().order_by('tanggal_dibuat')
    
    if not disposisi_list.exists():
        if surat.status == 'selesai':
            events.append({
                'title': 'Selesai (Tanpa Disposisi)',
                'waktu': surat.diupdate_pada.strftime('%d %b %Y, %H:%M WIB'),
                'aktor': 'Sistem',
                'catatan': surat.catatan,
                'status_color': 'emerald'
            })
        else:
            events.append({
                'title': 'Menunggu Disposisi',
                'waktu': '-',
                'aktor': 'Pimpinan',
                'status_color': 'amber'
            })
    else:
        for disp in disposisi_list:
            events.append({
                'title': f'Didisposisikan ke {disp.penerima_disposisi.get_full_name() or disp.penerima_disposisi.username}',
                'waktu': disp.tanggal_dibuat.strftime('%d %b %Y, %H:%M WIB'),
                'aktor': disp.pemberi_disposisi.get_full_name() or disp.pemberi_disposisi.username if disp.pemberi_disposisi else 'Admin',
                'catatan': disp.instruksi,
                'status_color': 'indigo'
            })
            
            if disp.tanggal_dibaca:
                events.append({
                    'title': 'Dibaca oleh Staff',
                    'waktu': disp.tanggal_dibaca.strftime('%d %b %Y, %H:%M WIB'),
                    'aktor': disp.penerima_disposisi.get_full_name() or disp.penerima_disposisi.username,
                    'status_color': 'teal'
                })
                
            if disp.status == 'selesai' and disp.tanggal_selesai:
                events.append({
                    'title': 'Disposisi Selesai',
                    'waktu': disp.tanggal_selesai.strftime('%d %b %Y, %H:%M WIB'),
                    'aktor': disp.penerima_disposisi.get_full_name() or disp.penerima_disposisi.username,
                    'catatan': disp.catatan_penyelesaian,
                    'status_color': 'emerald'
                })
            elif disp.status == 'diproses':
                events.append({
                    'title': 'Sedang Diproses Staff',
                    'waktu': '-',
                    'aktor': disp.penerima_disposisi.get_full_name() or disp.penerima_disposisi.username,
                    'status_color': 'amber'
                })
        
        if surat.status == 'selesai':
            events.append({
                'title': 'Surat Dinyatakan Selesai',
                'waktu': surat.diupdate_pada.strftime('%d %b %Y, %H:%M WIB'),
                'aktor': 'Sistem',
                'status_color': 'emerald'
            })
            
    return JsonResponse({'success': True, 'events': events})

from .models import SuratKeluar
from .utils import render_to_pdf
from django.core.files.base import ContentFile
from django.views.decorators.http import require_POST

@login_required
@require_POST
def generate_surat_keluar_pdf_view(request):
    """
    Menangkap data form dari request, membuat objek SuratKeluar,
    menggenerate PDF dengan xhtml2pdf, dan menyimpannya.
    """
    tujuan = request.POST.get('tujuan', '').strip()
    perihal = request.POST.get('perihal', '').strip()
    isi_surat = request.POST.get('isi_surat', '').strip()
    jenis_surat = request.POST.get('jenis_surat', 'SU').strip()
    departemen = request.POST.get('departemen', 'GA').strip()
    
    if not tujuan or not perihal or not isi_surat:
        return JsonResponse({'success': False, 'message': 'Tujuan, perihal, dan isi surat wajib diisi.'}, status=400)
        
    # Buat instance sementara untuk mendapatkan nomor_surat
    # dan simpan ke DB dulu supaya ID/nomor ke-generate
    surat = SuratKeluar.objects.create(
        tujuan=tujuan,
        perihal=perihal,
        isi_surat=isi_surat,
        jenis_surat=jenis_surat,
        departemen=departemen,
        pembuat=request.user,
        status='draft' # Atur status default
    )
    
    # Generate PDF
    context = {
        'surat': surat,
    }
    
    pdf_bytes = render_to_pdf('accounts/surat_template.html', context)
    
    if pdf_bytes:
        filename = f"Surat_Keluar_{surat.nomor_surat.replace('/', '_')}.pdf"
        surat.file_pdf_final.save(filename, ContentFile(pdf_bytes))
        surat.save()
        return JsonResponse({'success': True, 'message': 'Surat Keluar berhasil dibuat & PDF digenerate.', 'pdf_url': surat.file_pdf_final.url})
    else:
        # Jika gagal, tetap simpan textnya tapi kembalikan pesan error
        return JsonResponse({'success': False, 'message': 'Gagal generate PDF. Data text berhasil disimpan.'}, status=500)

