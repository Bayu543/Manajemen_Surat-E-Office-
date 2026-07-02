// ========================================
// MANAJEMEN USER PAGE JAVASCRIPT (AJAX-ENABLED)
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize functions
    initializeFilterRole();
    initializeModals();
    initializeActionButtons();
    updateCount();
});

// CSRF Utility
function getCsrfToken() {
    const csrfElement = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfElement ? csrfElement.value : '';
}

// Robust response handler
async function handleFetchResponse(res) {
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : null;

    if (!res.ok) {
        const errorMsg = (data && data.message) ? data.message : `Error ${res.status}: ${res.statusText || 'Gagal terhubung ke server'}`;
        throw new Error(errorMsg);
    }
    return data;
}

// ========================================
// ROLE FILTERING FUNCTIONALITY
// ========================================

function initializeFilterRole() {
    const filterButtons = document.querySelectorAll('.filter-role-btn');
    const tableBody = document.getElementById('userTableBody');
    if (!filterButtons.length || !tableBody) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active classes from all buttons
            filterButtons.forEach(btn => {
                btn.className = "filter-role-btn px-4 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-gray-600 transition-all";
            });

            // Add active classes to the clicked button
            this.className = "filter-role-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-sm border border-gray-100 transition-all";

            applyActiveFilter();
        });
    });

    // Run active filter on initial load to ensure everything is synchronized
    applyActiveFilter();
}

function applyActiveFilter() {
    const activeBtn = document.querySelector('.filter-role-btn.bg-white');
    if (!activeBtn) return;

    const filterType = activeBtn.getAttribute('data-role-filter');
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const editBtn = row.querySelector('.btn-edit-user');
        if (!editBtn) return;

        const rowRole = editBtn.getAttribute('data-role').toLowerCase();

        if (filterType === 'semua' || rowRole === filterType) {
            const wasHidden = row.style.display === 'none';
            row.style.display = '';
            if (wasHidden) {
                row.style.animation = 'fadeIn 0.3s ease forwards';
            }
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    updateCount(visibleCount);
}

// ========================================
// MODAL FUNCTIONALITY & FORM SUBMISSION
// ========================================

let currentRow = null;
let currentUserId = null;

function initializeModals() {
    // Modal Tambah User
    const btnTambahUser = document.getElementById('btnTambahUser');
    const modalTambahUser = document.getElementById('modalTambahUser');
    const closeModalTambah = document.getElementById('closeModalTambah');
    const btnCancelTambah = document.getElementById('btnCancelTambah');
    const formTambahUser = document.getElementById('formTambahUser');

    if (btnTambahUser && modalTambahUser) {
        btnTambahUser.addEventListener('click', () => {
            const modalBody = modalTambahUser.querySelector('.overflow-y-auto');
            if (modalBody) {
                modalBody.scrollTop = 0;
            }
            modalTambahUser.classList.add('show');
            setTimeout(() => {
                if (modalBody) {
                    modalBody.scrollTop = 0;
                }
            }, 50);
        });
    }

    const closeTambahFlow = () => {
        if (modalTambahUser) modalTambahUser.classList.remove('show');
        if (formTambahUser) formTambahUser.reset();
    };

    if (closeModalTambah) closeModalTambah.addEventListener('click', closeTambahFlow);
    if (btnCancelTambah) btnCancelTambah.addEventListener('click', closeTambahFlow);

    if (formTambahUser) {
        formTambahUser.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData();
            
            formData.append('nama_lengkap', document.getElementById('x_tambah_nama').value.trim());
            formData.append('email', document.getElementById('x_tambah_email').value.trim());
            formData.append('jabatan', document.getElementById('x_tambah_jabatan').value.trim());
            formData.append('role', formTambahUser.querySelector('[name="role"]').value);
            
            // Password default is generated automatically to satisfy backend view requirements
            formData.append('password', 'eoffice123');
            formData.append('konfirmasi_password', 'eoffice123');

            fetch('/accounts/manajemen-user/tambah/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            })
            .then(handleFetchResponse)
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    closeTambahFlow();
                    
                    // Dynamically insert new user row at the top
                    const tableBody = document.getElementById('userTableBody');
                    const user = data.user;
                    const newRow = document.createElement('tr');
                    newRow.className = 'hover:bg-gray-50/30 transition-colors group block lg:table-row bg-white border border-gray-100 lg:border-none rounded-2xl lg:rounded-none p-5 mb-4 lg:mb-0 shadow-sm lg:shadow-none flex flex-col lg:flex-row gap-3 lg:gap-0 relative';
                    newRow.setAttribute('data-id', user.id);
                    newRow.style.animation = 'fadeIn 0.4s ease forwards';

                    const avatarHTML = user.role.toLowerCase() === 'admin'
                        ? `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&background=3B82F6&color=fff" class="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm shrink-0">`
                        : `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&background=10B981&color=fff" class="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm shrink-0">`;

                    const roleBadge = user.role.toLowerCase() === 'admin'
                        ? `<span class="badge-status-surat" style="background: #DBEAFE; color: #3B82F6;">Admin</span>`
                        : `<span class="badge-status-surat diproses">Staff</span>`;

                    newRow.innerHTML = `
                        <td class="px-0 lg:px-6 py-0 lg:py-5 block lg:table-cell border-none lg:border-b lg:border-gray-100">
                            <div class="flex items-center gap-4">
                                <div class="relative shrink-0">
                                    ${avatarHTML}
                                    <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-emerald-500"></div>
                                </div>
                                <div>
                                    <h4 class="text-sm font-bold text-gray-800">${user.nama}</h4>
                                    <p class="text-[10px] text-gray-400 font-medium">Terdaftar: Baru</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-0 lg:px-6 py-0 lg:py-5 block lg:table-cell border-none lg:border-b lg:border-gray-100">
                            <div class="flex items-center lg:block">
                                <span class="lg:hidden text-[10px] font-black text-gray-400 uppercase w-24 shrink-0 tracking-wider">Kontak</span>
                                <div class="space-y-1">
                                    <div class="flex items-center gap-2 text-xs text-gray-600">
                                        <i class="fas fa-envelope text-[10px] text-gray-300"></i>
                                        <span>${user.email}</span>
                                    </div>
                                    <div class="flex items-center gap-2 text-xs text-gray-400">
                                        <i class="fas fa-user-circle text-[10px] text-gray-200"></i>
                                        <span class="font-mono">@${user.email.split('@')[0]}</span>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="px-0 lg:px-6 py-0 lg:py-5 block lg:table-cell border-none lg:border-b lg:border-gray-100">
                            <div class="flex items-center lg:block">
                                <span class="lg:hidden text-[10px] font-black text-gray-400 uppercase w-24 shrink-0 tracking-wider">Role</span>
                                <div class="space-y-2 flex flex-row lg:flex-col items-center lg:items-start gap-3 lg:gap-1">
                                    <div class="flex">
                                        ${roleBadge}
                                    </div>
                                    <p class="text-xs font-bold text-gray-700 ml-1 lg:mt-0 mt-[-4px]">${user.jabatan || '-'}</p>
                                </div>
                            </div>
                        </td>
                        <td class="absolute top-5 right-5 block lg:relative lg:top-0 lg:right-0 lg:table-cell text-center border-none lg:border-b lg:border-gray-100">
                            <span class="text-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Aktif
                            </span>
                        </td>
                        <td class="px-0 lg:px-6 py-0 lg:py-5 block lg:table-cell border-none lg:border-b lg:border-gray-100 mt-2 lg:mt-0 border-t border-gray-50 lg:border-none pt-3 lg:pt-0">
                            <div class="flex lg:justify-center justify-end gap-3">
                                <button class="btn-edit-user w-9 lg:w-8 h-9 lg:h-8 rounded-xl lg:rounded-lg bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center border border-gray-100 lg:border-none shadow-sm lg:shadow-none" 
                                    title="Edit User" data-id="${user.id}" data-nama="${user.nama}" data-email="${user.email}" 
                                    data-jabatan="${user.jabatan}" data-role="${user.role.toLowerCase()}" data-status="aktif">
                                    <i class="fas fa-edit text-xs"></i>
                                </button>
                                <button class="btn-hapus-user w-9 lg:w-8 h-9 lg:h-8 rounded-xl lg:rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center border border-gray-100 lg:border-none shadow-sm lg:shadow-none" title="Hapus" data-id="${user.id}">
                                    <i class="fas fa-trash-alt text-xs"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    
                    if (tableBody.firstChild) {
                        tableBody.insertBefore(newRow, tableBody.firstChild);
                    } else {
                        tableBody.appendChild(newRow);
                    }
                    
                    applyActiveFilter();
                } else {
                    showToast(data.message || 'Gagal menambahkan pengguna.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast(err.message || 'Gagal menambahkan pengguna.', 'error');
            });
        });
    }

    // Edit User Modal Flow
    const modalEditUser = document.getElementById('modalEditUser');
    const closeModalEdit = document.getElementById('closeModalEdit');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const formEditUser = document.getElementById('formEditUser');

    const closeEditFlow = () => {
        if (modalEditUser) modalEditUser.classList.remove('show');
        if (formEditUser) formEditUser.reset();
        
        // Remove editing row highlight
        const tableBody = document.getElementById('userTableBody');
        if (tableBody) {
            tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('editing-row'));
        }
    };

    if (closeModalEdit) closeModalEdit.addEventListener('click', closeEditFlow);
    if (btnCancelEdit) btnCancelEdit.addEventListener('click', closeEditFlow);

    if (formEditUser) {
        formEditUser.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData();

            formData.append('nama_lengkap', document.getElementById('x_edit_nama').value.trim());
            formData.append('email', document.getElementById('x_edit_email').value.trim());
            formData.append('jabatan', document.getElementById('x_edit_jabatan').value.trim());
            formData.append('role', document.getElementById('edit_role').value);
            formData.append('status', document.getElementById('edit_status').value);

            fetch(`/accounts/manajemen-user/${currentUserId}/edit/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            })
            .then(handleFetchResponse)
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    
                    // Flash the updated row beautifully
                    if (currentRow) {
                        const rowToFlash = currentRow;
                        rowToFlash.classList.add('success-flash-row');
                        setTimeout(() => {
                            rowToFlash.classList.remove('success-flash-row');
                        }, 1500);
                    }
                    
                    closeEditFlow();

                    // Dynamically update the row on page
                    if (currentRow) {
                        const user = data.user;
                        
                        // Update status indicator in avatar container
                        const statusDotDiv = currentRow.querySelector('.absolute.-bottom-1.-right-1');
                        if (statusDotDiv) {
                            statusDotDiv.className = `absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.status.toLowerCase() === 'aktif' ? 'bg-emerald-500' : 'bg-gray-300'}`;
                        }

                        // Update fallback avatar or image if there is no profile image
                        const avatarContainer = currentRow.querySelector('td:first-child .relative');
                        if (avatarContainer) {
                            const currentAvatar = avatarContainer.querySelector('img');
                            if (currentAvatar) {
                                if (currentAvatar.src.includes('ui-avatars.com')) {
                                    const bgHex = user.role.toLowerCase() === 'admin' ? '3B82F6' : '10B981';
                                    currentAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&background=${bgHex}&color=fff`;
                                }
                            }
                        }

                        // Update texts
                        const nameHeading = currentRow.querySelector('h4.text-sm.font-bold');
                        if (nameHeading) nameHeading.textContent = user.nama;

                        const emailSpan = currentRow.querySelector('td:nth-child(2) span');
                        if (emailSpan) emailSpan.textContent = user.email;

                        const usernameSpan = currentRow.querySelector('td:nth-child(2) .font-mono');
                        if (usernameSpan) usernameSpan.textContent = `@${user.email.split('@')[0]}`;

                        // Update role badge and jabatan
                        const roleCol = currentRow.querySelector('td:nth-child(3)');
                        if (roleCol) {
                            const newRoleBadge = user.role.toLowerCase() === 'admin'
                                ? `<span class="badge-status-surat" style="background: #DBEAFE; color: #3B82F6;">Admin</span>`
                                : `<span class="badge-status-surat diproses">Staff</span>`;
                            
                            roleCol.innerHTML = `
                                <div class="flex items-center lg:block">
                                    <span class="lg:hidden text-[10px] font-black text-gray-400 uppercase w-24 shrink-0 tracking-wider">Role</span>
                                    <div class="space-y-2 flex flex-row lg:flex-col items-center lg:items-start gap-3 lg:gap-1">
                                        <div class="flex">
                                            ${newRoleBadge}
                                        </div>
                                        <p class="text-xs font-bold text-gray-700 ml-1 lg:mt-0 mt-[-4px]">${user.jabatan || '-'}</p>
                                    </div>
                                </div>
                            `;
                        }

                        // Update Status Column
                        const statusCol = currentRow.querySelector('td:nth-child(4)');
                        if (statusCol) {
                            if (user.status.toLowerCase() === 'aktif') {
                                statusCol.innerHTML = `
                                    <span class="text-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5">
                                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Aktif
                                    </span>
                                `;
                            } else {
                                statusCol.innerHTML = `<span class="text-gray-400 text-xs font-bold">Nonaktif</span>`;
                            }
                        }

                        // Update action buttons data attributes so subsequent edits work correctly
                        const editBtn = currentRow.querySelector('.btn-edit-user');
                        if (editBtn) {
                            editBtn.setAttribute('data-nama', user.nama);
                            editBtn.setAttribute('data-email', user.email);
                            editBtn.setAttribute('data-jabatan', user.jabatan);
                            editBtn.setAttribute('data-role', user.role.toLowerCase());
                            editBtn.setAttribute('data-status', user.status.toLowerCase());
                        }
                        
                        applyActiveFilter();
                    }
                } else {
                    showToast(data.message || 'Gagal memperbarui pengguna.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast(err.message || 'Gagal memperbarui pengguna.', 'error');
            });
        });
    }

    // Modal Konfirmasi Hapus
    const modalKonfirmasiHapus = document.getElementById('modalKonfirmasiHapus');
    const btnCancelHapus = document.getElementById('btnCancelHapus');
    const btnConfirmHapus = document.getElementById('btnConfirmHapus');

    const closeHapusFlow = () => {
        if (modalKonfirmasiHapus) modalKonfirmasiHapus.classList.remove('show');
    };

    if (btnCancelHapus) btnCancelHapus.addEventListener('click', closeHapusFlow);

    if (btnConfirmHapus) {
        btnConfirmHapus.addEventListener('click', function() {
            if (!currentUserId) return;

            fetch(`/accounts/manajemen-user/${currentUserId}/hapus/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            })
            .then(handleFetchResponse)
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    closeHapusFlow();
                    
                    if (currentRow) {
                        currentRow.style.animation = 'fadeOut 0.3s ease forwards';
                        setTimeout(() => {
                            currentRow.remove();
                            applyActiveFilter();
                        }, 300);
                    }
                } else {
                    showToast(data.message || 'Gagal menghapus pengguna.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast(err.message || 'Gagal menghapus pengguna.', 'error');
            });
        });
    }

    // Close modals on overlay backdrop click
    const backdrops = [
        { modal: modalTambahUser, backdropId: 'backdropTambahUser' },
        { modal: modalEditUser, backdropId: 'backdropEditUser' },
        { modal: modalKonfirmasiHapus, backdrop: true }
    ];

    backdrops.forEach(item => {
        if (item.modal) {
            item.modal.addEventListener('click', function(e) {
                if (e.target === item.modal || e.target.id === item.backdropId || e.target.classList.contains('bg-gray-900/60')) {
                    item.modal.classList.remove('show');
                }
            });
        }
    });

    // Reset Password Action (Linked to Reset button inside Edit Modal)
    const btnResetPassword = document.getElementById('btnResetPassword');
    if (btnResetPassword) {
        btnResetPassword.addEventListener('click', function() {
            if (!currentUserId) return;
            
            const isConfirmed = confirm("Apakah Anda yakin ingin mengatur ulang sandi pengguna ini ke kata sandi bawaan ('eoffice123')?");
            if (!isConfirmed) return;

            fetch(`/accounts/manajemen-user/${currentUserId}/reset-password/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            })
            .then(handleFetchResponse)
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    closeEditFlow();
                } else {
                    showToast(data.message || 'Gagal mengatur ulang kata sandi.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast(err.message || 'Gagal mengatur ulang kata sandi.', 'error');
            });
        });
    }
}

// ========================================
// ACTION BUTTONS EVENTS DELEGATION
// ========================================

function initializeActionButtons() {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;

    tableBody.addEventListener('click', function(e) {
        const btnEdit = e.target.closest('.btn-edit-user');
        const btnHapus = e.target.closest('.btn-hapus-user');

        if (btnEdit) {
            currentRow = btnEdit.closest('tr');
            currentUserId = btnEdit.getAttribute('data-id');

            // Highlight selected row beautifully
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(r => r.classList.remove('editing-row'));
            currentRow.classList.add('editing-row');

            // Populate form values
            const modalEditUser = document.getElementById('modalEditUser');
            if (modalEditUser) {
                document.getElementById('edit_user_id').value = currentUserId;
                document.getElementById('x_edit_nama').value = btnEdit.getAttribute('data-nama') || '';
                document.getElementById('x_edit_email').value = btnEdit.getAttribute('data-email') || '';
                document.getElementById('x_edit_jabatan').value = btnEdit.getAttribute('data-jabatan') || '';
                document.getElementById('edit_role').value = btnEdit.getAttribute('data-role') || 'staff';
                document.getElementById('edit_status').value = btnEdit.getAttribute('data-status') || 'aktif';

                // Reset scroll position of panel body to prevent browser scroll-to-autofill jumps
                const panelBody = modalEditUser.querySelector('.overflow-y-auto');
                if (panelBody) {
                    panelBody.scrollTop = 0;
                }

                // Show/slide in the panel
                modalEditUser.classList.add('show');
                
                // Adjust responsive grid / focus
                setTimeout(() => {
                    if (panelBody) {
                        panelBody.scrollTop = 0;
                    }
                }, 50);
            }
        }

        if (btnHapus) {
            currentRow = btnHapus.closest('tr');
            currentUserId = btnHapus.getAttribute('data-id');

            const modalKonfirmasiHapus = document.getElementById('modalKonfirmasiHapus');
            if (modalKonfirmasiHapus) {
                modalKonfirmasiHapus.classList.add('show');
            }
        }
    });
}

// ========================================
// UPDATE PAGE USERS COUNT DISPLAY
// ========================================

function updateCount(count) {
    const totalRows = document.querySelectorAll('#userTableBody tr').length;
    const visibleCount = count !== undefined ? count : totalRows;

    // Update toolbar indicator if any header stats exist
    const toolbarInfo = document.querySelector('.card-header span');
    if (toolbarInfo) {
        toolbarInfo.textContent = `${visibleCount} pengguna`;
    }
}

// ========================================
// HIGH-FIDELITY TOAST NOTIFICATION
// ========================================

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
if (!document.getElementById('manajemen-user-animations')) {
    const style = document.createElement('style');
    style.id = 'manajemen-user-animations';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
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
