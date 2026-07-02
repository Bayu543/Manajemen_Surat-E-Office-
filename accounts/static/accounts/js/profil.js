/**
 * Script untuk Halaman Profil Admin & Staff
 * Mengelola modal Edit Profil, Ganti Password, dan Upload Foto
 */

document.addEventListener('DOMContentLoaded', function() {
    // Modal Edit Profil
    const modalEdit = document.getElementById('modalEditProfil');
    const btnCloseEdit = document.getElementById('closeModalEditProfil');
    const btnCancelEdit = document.getElementById('btnCancelEditProfil');
    const formEdit = document.getElementById('formEditProfil');
    const backdropEdit = document.getElementById('backdropEditProfil');

    // Modal Ganti Password
    const modalPass = document.getElementById('modalGantiPassword');
    const btnClosePass = document.getElementById('closeModalGantiPassword');
    const btnCancelPass = document.getElementById('btnCancelGantiPassword');
    const formPass = document.getElementById('formGantiPassword');
    const backdropPass = document.getElementById('backdropGantiPassword');

    // Helper untuk menutup modal
    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }
    }

    if (btnCloseEdit) btnCloseEdit.addEventListener('click', () => closeModal(modalEdit));
    if (btnCancelEdit) btnCancelEdit.addEventListener('click', () => closeModal(modalEdit));
    if (backdropEdit) backdropEdit.addEventListener('click', () => closeModal(modalEdit));

    if (btnClosePass) btnClosePass.addEventListener('click', () => closeModal(modalPass));
    if (btnCancelPass) btnCancelPass.addEventListener('click', () => closeModal(modalPass));
    if (backdropPass) backdropPass.addEventListener('click', () => closeModal(modalPass));

    // Tutup saat menekan ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal(modalEdit);
            closeModal(modalPass);
        }
    });

    // High-Fidelity Toast Notification
    function showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        
        // Sleek and harmonious styling based on types
        const bgColor = type === 'success' ? '#10B981' : '#EF4444';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

        toast.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 1.25rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 700;
            font-size: 0.825rem;
        `;

        toast.innerHTML = `
            <i class="fas ${icon} text-lg"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Ensure keyframe animations are injected globally
    if (!document.getElementById('profile-animations')) {
        const style = document.createElement('style');
        style.id = 'profile-animations';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Handle Submit Form Edit Profil via AJAX
    if (formEdit) {
        formEdit.addEventListener('submit', function(e) {
            e.preventDefault();

            const namaInput = document.getElementById('editProfilNama');
            const emailInput = document.getElementById('editProfilEmail');
            const jabatanInput = document.getElementById('editProfilJabatan');
            const nipInput = document.getElementById('editProfilNIP');
            const phoneInput = document.getElementById('editProfilPhone');
            const alamatInput = document.getElementById('editProfilAlamat');

            const formData = new FormData();
            if (namaInput) formData.append('nama_lengkap', namaInput.value.trim());
            if (emailInput) formData.append('email', emailInput.value.trim());
            if (jabatanInput) formData.append('jabatan', jabatanInput.value.trim());
            if (nipInput) formData.append('nip', nipInput.value.trim());
            if (phoneInput) formData.append('telepon', phoneInput.value.trim());
            if (alamatInput) formData.append('alamat', alamatInput.value.trim());

            const csrfToken = formEdit.querySelector('[name=csrfmiddlewaretoken]').value;

            fetch(window.location.pathname, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast('Profil berhasil diperbarui!', 'success');
                    closeModal(modalEdit);

                    // Update DOM elements in real-time
                    const updated = data.data;
                    if (updated) {
                        const cardNama = document.getElementById('profileCardNama');
                        if (cardNama) cardNama.textContent = updated.nama_lengkap;

                        const displayNama = document.getElementById('profileDisplayNama');
                        if (displayNama) displayNama.textContent = updated.nama_lengkap;

                        const displayEmail = document.getElementById('profileDisplayEmail');
                        if (displayEmail) displayEmail.textContent = updated.email || '-';

                        const displayTelepon = document.getElementById('profileDisplayTelepon');
                        if (displayTelepon) displayTelepon.textContent = updated.telepon || '-';

                        const displayJabatan = document.getElementById('profileDisplayJabatan');
                        if (displayJabatan) displayJabatan.textContent = updated.jabatan || '-';

                        const displayAlamat = document.getElementById('profileDisplayAlamat');
                        if (displayAlamat) displayAlamat.textContent = updated.alamat || '-';

                        // Update navbar/sidebar usernames
                        const userProfileNames = document.querySelectorAll('.user-profile-name');
                        userProfileNames.forEach(el => {
                            el.textContent = updated.nama_lengkap;
                        });
                    }
                } else {
                    showToast(data.message || 'Gagal memperbarui profil.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Terjadi kesalahan pada server.', 'error');
            });
        });
    }

    // Handle Submit Form Ganti Password via AJAX
    if (formPass) {
        formPass.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(formPass);
            const csrfToken = formPass.querySelector('[name=csrfmiddlewaretoken]').value;

            fetch('/accounts/profil/ganti-password/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast('Password berhasil diubah!', 'success');
                    closeModal(modalPass);
                    formPass.reset();
                } else {
                    showToast(data.message || 'Gagal mengubah password.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Terjadi kesalahan pada server.', 'error');
            });
        });
    }
});
