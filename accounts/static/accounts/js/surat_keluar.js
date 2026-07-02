// Surat Keluar Page JavaScript
console.log('Surat Keluar JS loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Surat Keluar');
    
    // Selectors matching the templates
    const filterTabs = document.querySelectorAll('.tab-item');
    const tableBody = document.getElementById('suratTableBody');
    const tableRows = document.querySelectorAll('#suratTableBody tr.activity-row');
    
    // Utility: Get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Utility: Toast notification function
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: ${type === 'success' ? '#10B981' : '#EF4444'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
            z-index: 10000;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 600;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
        toast.innerHTML = `${icon} <span>${message}</span>`;
        
        document.body.appendChild(toast);
        
        // Trigger reflow & show
        toast.offsetHeight;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    function getStatusColor(status) {
        switch(status) {
            case 'draft': return 'blue';
            case 'diajukan': return 'amber';
            case 'revisi': return 'violet';
            case 'disetujui': return 'emerald';
            default: return 'blue';
        }
    }

    // Filter Tabs (Modern Pills) & Mobile Dropdown
    const mobileDropdown = document.getElementById('mobileStatusFilterKeluar');
    
    function applyFilter(status) {
        console.log('Applying filter:', status);
        
        // Sync tabs and dropdown visually
        if (mobileDropdown && mobileDropdown.value !== status) {
            mobileDropdown.value = status;
        }
        
        // Reset active styles on all tabs
        filterTabs.forEach(t => {
            t.classList.remove('active', 'bg-blue-600', 'bg-amber-500', 'bg-violet-600', 'bg-emerald-600', 'shadow-lg', 'shadow-blue-500/20', 'shadow-blue-500/25', 'shadow-amber-500/20', 'shadow-violet-500/20', 'shadow-violet-500/25', 'shadow-emerald-500/20', 'shadow-emerald-500/25');
            
            if (t.getAttribute('data-status') === status) {
                // Set active styles (Status-Specific Styling)
                t.classList.add('active', 'shadow-lg');
                
                if (status === 'all' || status === 'draft') {
                    t.classList.add('bg-blue-600', 'shadow-blue-500/25');
                } else if (status === 'diajukan') {
                    t.classList.add('bg-amber-500', 'shadow-amber-500/20');
                } else if (status === 'revisi') {
                    t.classList.add('bg-violet-600', 'shadow-violet-500/25');
                } else if (status === 'disetujui' || status === 'selesai') {
                    t.classList.add('bg-emerald-600', 'shadow-emerald-500/25');
                }
            }
        });
        
        // Filter table rows
        let visibleCount = 0;
        tableRows.forEach(row => {
            const rowStatus = row.getAttribute('data-status');
            
            if (status === 'all' || rowStatus === status || (status === 'disetujui' && rowStatus === 'selesai') || (status === 'selesai' && rowStatus === 'disetujui')) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        updatePaginationInfo(visibleCount);
    }

    if (mobileDropdown) {
        mobileDropdown.addEventListener('change', function() {
            applyFilter(this.value);
        });
    }

    // Filter Tabs Click Event
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            applyFilter(status);
        });
    });
    
    // Search Functionality (Supporting both local input and dashboard globalSearch)
    const searchInputs = [
        document.getElementById('globalSearch'),
        document.getElementById('searchInput')
    ];
    
    searchInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase().trim();
                let visibleCount = 0;
                
                const currentFilter = document.querySelector('.tab-item.active');
                const currentStatus = currentFilter ? currentFilter.getAttribute('data-status') : 'all';
                
                tableRows.forEach(row => {
                    const numberLink = row.querySelector('td:first-child span');
                    const nomorSurat = numberLink ? numberLink.textContent.toLowerCase() : '';
                    const pengirim = row.cells[1] ? row.cells[1].textContent.toLowerCase() : '';
                    const perihal = row.cells[2] ? row.cells[2].textContent.toLowerCase() : '';
                    
                    const searchableText = `${nomorSurat} ${pengirim} ${perihal}`;
                    const rowStatus = row.getAttribute('data-status');
                    
                    const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm);
                    const matchesFilter = currentStatus === 'all' || rowStatus === currentStatus;
                    
                    if (matchesSearch && matchesFilter) {
                        row.style.display = '';
                        visibleCount++;
                    } else {
                        row.style.display = 'none';
                    }
                });
                
                updatePaginationInfo(visibleCount);
            });
        }
    });
    
    // Variables for Approval state
    let targetRow = null;
    let targetId = null;
    
    // Event Delegation for action buttons (.view and .approve)
    if (tableBody) {
        tableBody.addEventListener('click', function(e) {
            // Find closest button inside row
            const btnView = e.target.closest('.view');
            const btnApprove = e.target.closest('.approve');
            const btnReject = e.target.closest('.reject');
            
            if (btnView) {
                e.preventDefault();
                e.stopPropagation();
                showDetailModal(btnView);
            } else if (btnApprove) {
                e.preventDefault();
                e.stopPropagation();
                
                targetRow = btnApprove.closest('tr');
                targetId = btnApprove.getAttribute('data-id');
                
                const modalKonfirmasi = document.getElementById('modalKonfirmasiApprove');
                if (modalKonfirmasi) {
                    modalKonfirmasi.classList.add('show');
                }
            } else if (btnReject) {
                e.preventDefault();
                e.stopPropagation();
                
                targetRow = btnReject.closest('tr');
                targetId = btnReject.getAttribute('data-id');
                
                const modalKonfirmasiRevisi = document.getElementById('modalKonfirmasiRevisi');
                if (modalKonfirmasiRevisi) {
                    document.getElementById('catatan_revisi').value = '';
                    modalKonfirmasiRevisi.classList.add('show');
                }
            }
        });
    }
    
    let currentDetailRow = null;
    let currentDetailId = null;

    // Show Detail Modal
    function showDetailModal(btn) {
        try {
            const modal = document.getElementById('modalDetailSuratKeluar');
            if (!modal) {
                alert('Modal element not found!');
                return;
            }
            
            currentDetailRow = btn.closest('tr');
            currentDetailId = btn.getAttribute('data-id');
            
            // Retrieve data attributes directly from the button
            const nomor = btn.getAttribute('data-nomor') || '-';
            const penerima = btn.getAttribute('data-penerima') || '-';
            const perihal = btn.getAttribute('data-perihal') || '-';
            const tanggal = btn.getAttribute('data-tanggal') || '-';
            const status = btn.getAttribute('data-status') || 'draft';
            
            const pembuat = btn.getAttribute('data-pembuat') || '-';
            const file = btn.getAttribute('data-file') || '#';
            const tglBuat = btn.getAttribute('data-tanggal-buat') || '-';
            const tglUpdate = btn.getAttribute('data-tanggal-update') || '-';
            
            // Populate modal fields
            const elNomor = document.getElementById('detailNomorSuratKeluar');
            const elPenerima = document.getElementById('detailPenerimaKeluar');
            const elTanggal = document.getElementById('detailTanggalKeluar');
            const elPerihal = document.getElementById('detailPerihalKeluar');
            const elStatus = document.getElementById('detailStatusKeluar');
            
            const elPembuat = document.getElementById('detailPembuatKeluar');
            const elFile = document.getElementById('detailFileKeluar');
            const elTimelineDraft = document.getElementById('detailTimelineDraft');
            const elTimelineDiajukan = document.getElementById('detailTimelineDiajukan');
            const elTimelineDiajukanContainer = document.getElementById('timelineDiajukanContainer');
            const elActionButtons = document.getElementById('actionButtonsKeluar');
            
            if (elNomor) elNomor.textContent = nomor;
            if (elPenerima) elPenerima.textContent = penerima;
            if (elTanggal) elTanggal.textContent = tanggal;
            if (elPerihal) elPerihal.textContent = perihal;
            if (elPembuat) elPembuat.textContent = pembuat;
            
            if (elFile) {
                if (file === '#' || file === '') {
                    elFile.style.display = 'none';
                } else {
                    elFile.style.display = 'flex';
                    elFile.href = file;
                }
            }
            
            if (elTimelineDraft) elTimelineDraft.textContent = tglBuat;
            if (status === 'draft') {
                if (elTimelineDiajukanContainer) elTimelineDiajukanContainer.style.display = 'none';
            } else {
                if (elTimelineDiajukanContainer) elTimelineDiajukanContainer.style.display = 'block';
                if (elTimelineDiajukan) elTimelineDiajukan.textContent = tglUpdate;
            }

            // Toggle action buttons based on status
            if (elActionButtons) {
                if (status === 'diajukan') {
                    elActionButtons.classList.remove('hidden');
                    elActionButtons.classList.add('flex');
                } else {
                    elActionButtons.classList.add('hidden');
                    elActionButtons.classList.remove('flex');
                }
            }
            
            // Populate status badge dynamically with premium classes
            if (elStatus) {
                let statusText = 'Draft';
                let statusClass = 'px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ';
                
                if (status === 'draft') {
                    statusText = 'Draft';
                    statusClass += 'bg-blue-50 text-blue-500 border-blue-100';
                } else if (status === 'diajukan') {
                    statusText = 'Diajukan';
                    statusClass += 'bg-amber-50 text-amber-600 border-amber-100';
                } else if (status === 'revisi') {
                    statusText = 'Revisi';
                    statusClass += 'bg-violet-50 text-violet-600 border-violet-100';
                } else if (status === 'disetujui' || status === 'selesai') {
                    statusText = 'Disetujui';
                    statusClass += 'bg-emerald-50 text-emerald-600 border-emerald-100';
                }
                
                elStatus.innerHTML = `<span class="${statusClass}">${statusText}</span>`;
            }
            
            // Show modal safely for Tailwind
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            modal.style.display = 'flex';
            modal.classList.add('show');
        } catch (error) {
            alert('Error in showDetailModal: ' + error.message);
            console.error(error);
        }
    }
    window.showDetailModal = showDetailModal;
    
    // Bind CTA inside Modal Detail
    const btnDetailSetujui = document.getElementById('btnDetailSetujui');
    if (btnDetailSetujui) {
        btnDetailSetujui.addEventListener('click', function(e) {
            e.preventDefault();
            // Close detail modal
            const modalDetail = document.getElementById('modalDetailSuratKeluar');
            if (modalDetail) modalDetail.classList.remove('show');
            
            // Open confirm modal and set target
            targetRow = currentDetailRow;
            targetId = currentDetailId;
            const modalKonfirmasi = document.getElementById('modalKonfirmasiApprove');
            if (modalKonfirmasi) modalKonfirmasi.classList.add('show');
        });
    }
    
    const btnDetailRevisi = document.getElementById('btnDetailRevisi');
    if (btnDetailRevisi) {
        btnDetailRevisi.addEventListener('click', function(e) {
            e.preventDefault();
            // Close detail modal
            const modalDetail = document.getElementById('modalDetailSuratKeluar');
            if (modalDetail) modalDetail.classList.remove('show');
            
            // Open reject modal and set target
            targetRow = currentDetailRow;
            targetId = currentDetailId;
            const modalKonfirmasiRevisi = document.getElementById('modalKonfirmasiRevisi');
            if (modalKonfirmasiRevisi) {
                document.getElementById('catatan_revisi').value = '';
                modalKonfirmasiRevisi.classList.add('show');
            }
        });
    }
    
    // Close Detail Modal
    const closeDetailButtons = [
        document.getElementById('closeDetailKeluar'),
        document.getElementById('btnCloseDetailKeluar')
    ];
    
    closeDetailButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                const modal = document.getElementById('modalDetailSuratKeluar');
                if (modal) {
                    modal.classList.remove('show');
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }
            });
        }
    });
    
    // Backdrop click closures
    const modalDetail = document.getElementById('modalDetailSuratKeluar');
    if (modalDetail) {
        modalDetail.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                this.classList.add('hidden');
                this.style.display = 'none';
            }
        });
    }
    
    const modalConfirm = document.getElementById('modalKonfirmasiApprove');
    if (modalConfirm) {
        modalConfirm.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    }
    
    // Escape key closures for all modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (modalDetail && modalDetail.classList.contains('show')) {
                modalDetail.classList.remove('show');
            }
            if (modalConfirm && modalConfirm.classList.contains('show')) {
                modalConfirm.classList.remove('show');
                targetRow = null;
                targetId = null;
            }
            const modalKonfirmasiRevisi = document.getElementById('modalKonfirmasiRevisi');
            if (modalKonfirmasiRevisi && modalKonfirmasiRevisi.classList.contains('show')) {
                modalKonfirmasiRevisi.classList.remove('show');
                targetRow = null;
                targetId = null;
            }
        }
    });
    
    // Handle Batal Approve
    const btnBatalApprove = document.getElementById('btnBatalApprove');
    if (btnBatalApprove) {
        btnBatalApprove.addEventListener('click', function() {
            if (modalConfirm) {
                modalConfirm.classList.remove('show');
            }
            targetRow = null;
            targetId = null;
        });
    }
    
    // Handle Konfirmasi Approve (AJAX to Backend)
    const btnKonfirmasiApprove = document.getElementById('btnKonfirmasiApprove');
    if (btnKonfirmasiApprove) {
        btnKonfirmasiApprove.addEventListener('click', function() {
            if (!targetId || !targetRow) return;
            
            // Set loading state on button
            const originalBtnText = btnKonfirmasiApprove.textContent;
            btnKonfirmasiApprove.disabled = true;
            btnKonfirmasiApprove.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memproses...';
            
            const csrfToken = getCookie('csrftoken');
            
            fetch(`/accounts/surat-keluar/${targetId}/setujui/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => { throw new Error(data.message || 'Terjadi kesalahan sistem.'); });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Update data-status on the row
                    targetRow.setAttribute('data-status', 'disetujui');
                    
                    // Update status badge inside table cell
                    const statusCell = targetRow.querySelector('td:nth-child(6)');
                    if (statusCell) {
                        statusCell.innerHTML = `<span class="px-4 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">Disetujui</span>`;
                    }
                    
                    // Update nomor surat cell text (strip '(Konsep)' or set from response)
                    const nomorCellLink = targetRow.querySelector('td:first-child span');
                    if (nomorCellLink) {
                        nomorCellLink.textContent = data.nomor_surat;
                    }
                    
                    // Update the view button's data attributes for future modal lookups
                    const viewBtn = targetRow.querySelector('.view');
                    if (viewBtn) {
                        viewBtn.setAttribute('data-status', 'disetujui');
                        viewBtn.setAttribute('data-nomor', data.nomor_surat);
                    }
                    
                    // Remove approve button gracefully with animation
                    const approveBtn = targetRow.querySelector('.approve');
                    if (approveBtn) {
                        approveBtn.style.transition = 'opacity 0.25s ease';
                        approveBtn.style.opacity = '0';
                        setTimeout(() => approveBtn.remove(), 250);
                    }
                    
                    // Refresh count badges on tabs
                    updateFilterCounts();
                    
                    // Hide confirm modal
                    if (modalConfirm) {
                        modalConfirm.classList.remove('show');
                    }
                    
                    showToast('Surat berhasil disetujui!', 'success');
                } else {
                    showToast(data.message || 'Gagal menyetujui surat.', 'error');
                }
            })
            .catch(error => {
                console.error('Error approving mail:', error);
                showToast(error.message || 'Terjadi kesalahan saat menyetujui surat.', 'error');
            })
            .finally(() => {
                // Restore button state
                btnKonfirmasiApprove.disabled = false;
                btnKonfirmasiApprove.textContent = originalBtnText;
                
                targetRow = null;
                targetId = null;
            });
        });
    }
    
    // Handle Batal Revisi
    const btnBatalRevisi = document.getElementById('btnBatalRevisi');
    if (btnBatalRevisi) {
        btnBatalRevisi.addEventListener('click', function() {
            const modalRevisi = document.getElementById('modalKonfirmasiRevisi');
            if (modalRevisi) {
                modalRevisi.classList.remove('show');
            }
            targetRow = null;
            targetId = null;
        });
    }
    
    // Handle Submit Revisi (AJAX to Backend)
    const formRevisi = document.getElementById('formRevisiSurat');
    if (formRevisi) {
        formRevisi.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!targetId || !targetRow) return;
            
            const catatan = document.getElementById('catatan_revisi').value;
            if (!catatan.trim()) {
                showToast('Catatan revisi wajib diisi.', 'error');
                return;
            }
            
            const btnSubmit = document.getElementById('btnKonfirmasiRevisi');
            const originalBtnText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengirim...';
            
            const csrfToken = getCookie('csrftoken');
            const formData = new FormData();
            formData.append('catatan_revisi', catatan);
            
            fetch(`/accounts/surat-keluar/${targetId}/tolak/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => { throw new Error(data.message || 'Terjadi kesalahan sistem.'); });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    targetRow.setAttribute('data-status', 'revisi');
                    
                    const statusCell = targetRow.querySelector('td:nth-child(6)');
                    if (statusCell) {
                        statusCell.innerHTML = `<span class="px-4 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 uppercase tracking-wider">Revisi</span>`;
                    }
                    
                    const viewBtn = targetRow.querySelector('.view');
                    if (viewBtn) {
                        viewBtn.setAttribute('data-status', 'revisi');
                    }
                    
                    // Remove approve and reject buttons gracefully
                    const approveBtn = targetRow.querySelector('.approve');
                    const rejectBtn = targetRow.querySelector('.reject');
                    if (approveBtn) {
                        approveBtn.style.transition = 'opacity 0.25s ease';
                        approveBtn.style.opacity = '0';
                        setTimeout(() => approveBtn.remove(), 250);
                    }
                    if (rejectBtn) {
                        rejectBtn.style.transition = 'opacity 0.25s ease';
                        rejectBtn.style.opacity = '0';
                        setTimeout(() => rejectBtn.remove(), 250);
                    }
                    
                    updateFilterCounts();
                    
                    const modalRevisi = document.getElementById('modalKonfirmasiRevisi');
                    if (modalRevisi) modalRevisi.classList.remove('show');
                    
                    showToast('Surat berhasil dikembalikan untuk revisi.', 'success');
                } else {
                    showToast(data.message || 'Gagal merevisi surat.', 'error');
                }
            })
            .catch(error => {
                console.error('Error rejecting mail:', error);
                showToast(error.message || 'Terjadi kesalahan saat menolak surat.', 'error');
            })
            .finally(() => {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;
                targetRow = null;
                targetId = null;
            });
        });
    }
    
    // Pagination placeholder updater
    function updatePaginationInfo(count) {
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            const total = tableRows.length;
            paginationInfo.textContent = `Menampilkan ${count} dari ${total} surat`;
        }
    }
    
    // Dynamically Recalculate Filter Badge Counts
    function updateFilterCounts() {
        let draftCount = 0;
        let diajukanCount = 0;
        let revisiCount = 0;
        let selesaiCount = 0;
        let allCount = tableRows.length;
        
        tableRows.forEach(row => {
            const status = row.getAttribute('data-status');
            if (status === 'draft') draftCount++;
            else if (status === 'diajukan') diajukanCount++;
            else if (status === 'revisi') revisiCount++;
            else if (status === 'disetujui' || status === 'selesai') selesaiCount++;
        });
        
        // Update pills badges
        const elDraft = document.getElementById('countDraft');
        const elDiajukan = document.getElementById('countDiajukan');
        const elRevisi = document.getElementById('countRevisi');
        const elSelesai = document.getElementById('countSelesai');
        
        if (elDraft) elDraft.textContent = draftCount;
        if (elDiajukan) elDiajukan.textContent = diajukanCount;
        if (elRevisi) elRevisi.textContent = revisiCount;
        if (elSelesai) elSelesai.textContent = selesaiCount;

        // Sync dropdown labels
        if (mobileDropdown) {
            Array.from(mobileDropdown.options).forEach(option => {
                if (option.value === 'all') option.text = `Semua (${allCount})`;
                if (option.value === 'draft') option.text = `Draft (${draftCount})`;
                if (option.value === 'diajukan') option.text = `Diajukan (${diajukanCount})`;
                if (option.value === 'revisi') option.text = `Revisi (${revisiCount})`;
                if (option.value === 'disetujui' || option.value === 'selesai') option.text = `Selesai (${selesaiCount})`;
            });
        }
    }
    
    // Initialize counts and apply initial active filter state styles
    updateFilterCounts();
    const initialActiveTab = document.querySelector('.tab-item.active');
    if (initialActiveTab) {
        initialActiveTab.click();
    }
    
    // Animate table rows on page load
    tableRows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 40);
    });
    
    console.log('Surat Keluar initialized successfully');
});
