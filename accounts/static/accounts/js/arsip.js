// ========================================
// ARSIP PAGE JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    initializeFilters();
    initializeSearch();
    initializeActionButtons();
    updateCount();
});

// ========================================
// FILTER FUNCTIONALITY
// ========================================

function initializeFilters() {
    const filterJenis = document.getElementById('filterJenis');
    const filterSuratMasuk = document.getElementById('filterSuratMasuk');
    const filterSuratKeluar = document.getElementById('filterSuratKeluar');
    const filterStatus = document.getElementById('filterStatus');
    const filterTanggalDari = document.getElementById('filterTanggalDari');
    const filterTanggalSampai = document.getElementById('filterTanggalSampai');
    const filterTahun = document.getElementById('filterTahun');
    const btnTerapkan = document.getElementById('btnTerapkan');

    // Add event listeners with safety checks
    if (filterJenis) filterJenis.addEventListener('change', applyFilters);
    if (filterSuratMasuk) filterSuratMasuk.addEventListener('change', applyFilters);
    if (filterSuratKeluar) filterSuratKeluar.addEventListener('change', applyFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);
    if (filterTanggalDari) filterTanggalDari.addEventListener('change', applyFilters);
    if (filterTanggalSampai) filterTanggalSampai.addEventListener('change', applyFilters);
    if (filterTahun) filterTahun.addEventListener('change', applyFilters);

    if (btnTerapkan) {
        btnTerapkan.addEventListener('click', function(e) {
            e.preventDefault();
            applyFilters();
        });
    }
}

function applyFilters() {
    const filterJenisEl = document.getElementById('filterJenis');
    const filterJenis = filterJenisEl ? filterJenisEl.value : 'all';

    const filterSuratMasukEl = document.getElementById('filterSuratMasuk');
    const filterSuratMasuk = filterSuratMasukEl ? filterSuratMasukEl.value : 'all';

    const filterSuratKeluarEl = document.getElementById('filterSuratKeluar');
    const filterSuratKeluar = filterSuratKeluarEl ? filterSuratKeluarEl.value : 'all';

    const filterStatusEl = document.getElementById('filterStatus');
    const filterStatus = filterStatusEl ? filterStatusEl.value : 'all';

    const filterTanggalDariEl = document.getElementById('filterTanggalDari');
    const filterTanggalDari = filterTanggalDariEl ? filterTanggalDariEl.value : '';

    const filterTanggalSampaiEl = document.getElementById('filterTanggalSampai');
    const filterTanggalSampai = filterTanggalSampaiEl ? filterTanggalSampaiEl.value : '';

    const filterTahunEl = document.getElementById('filterTahun');
    const filterTahun = filterTahunEl ? filterTahunEl.value : 'all';

    const searchInputEl = document.getElementById('searchInput');
    const searchQuery = searchInputEl ? searchInputEl.value.toLowerCase() : '';

    const rows = document.querySelectorAll('.surat-table tbody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const jenis = row.getAttribute('data-jenis');
        const status = row.getAttribute('data-status');
        const tahun = row.getAttribute('data-tahun');
        const tanggalISO = row.getAttribute('data-tanggal');
        const rowText = row.textContent.toLowerCase();
        
        // Get tanggal from data attribute (format: YYYY-MM-DD)
        const rowDate = tanggalISO ? new Date(tanggalISO) : null;

        let show = true;

        // Filter by Jenis
        if (filterJenis !== 'all' && jenis !== filterJenis) {
            show = false;
        }

        // Filter by Tahun
        if (filterTahun !== 'all' && tahun && tahun !== filterTahun) {
            show = false;
        }

        // Filter by Surat Masuk status (only if jenis is masuk)
        if (filterSuratMasuk !== 'all' && jenis === 'masuk' && status !== filterSuratMasuk) {
            show = false;
        }

        // Filter by Surat Keluar status (only if jenis is keluar)
        if (filterSuratKeluar !== 'all' && jenis === 'keluar' && status !== filterSuratKeluar) {
            show = false;
        }

        // Filter by Status (applies to all)
        if (filterStatus !== 'all' && status !== filterStatus) {
            show = false;
        }

        // Filter by Tanggal Dari
        if (filterTanggalDari && rowDate) {
            const fromDate = new Date(filterTanggalDari);
            if (rowDate < fromDate) {
                show = false;
            }
        }

        // Filter by Tanggal Sampai
        if (filterTanggalSampai && rowDate) {
            const toDate = new Date(filterTanggalSampai);
            if (rowDate > toDate) {
                show = false;
            }
        }

        // Filter by Search
        if (searchQuery && !rowText.includes(searchQuery)) {
            show = false;
        }

        // Show/hide row with animation
        if (show) {
            row.style.display = '';
            row.style.animation = 'fadeIn 0.3s ease';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    updateCount(visibleCount);
}

// Parse date from string format "2 Apr 2026"
function parseDateFromString(dateStr) {
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5,
        'Jul': 6, 'Agu': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11
    };
    
    const parts = dateStr.split(' ');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);
    
    if (isNaN(day) || month === undefined || isNaN(year)) return null;
    
    return new Date(year, month, day);
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        applyFilters();
    });
}

// ========================================
// ACTION BUTTONS
// ========================================

function initializeActionButtons() {
    const table = document.querySelector('.surat-table tbody');
    if (!table) return;
    
    table.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const row = target.closest('tr');
        if (!row) return;

        const nomorSurat = row.cells[0] ? row.cells[0].textContent.trim() : '';
        const badgeJenis = row.querySelector('.badge-jenis');
        const jenis = badgeJenis ? badgeJenis.textContent.trim() : (row.getAttribute('data-jenis') || '');
        
        // View button
        if (target.querySelector('.fa-eye')) {
            showDetailModal(row);
        }
        
        // Download button
        if (target.querySelector('.fa-download')) {
            const fileUrl = row.getAttribute('data-file-url') || '';
            downloadSurat(nomorSurat, jenis, fileUrl);
        }
    });
}

// Show detail modal
function showDetailModal(row) {
    const nomorSurat = row.cells[0] ? row.cells[0].textContent.trim() : '';
    const badgeJenis = row.querySelector('.badge-jenis');
    const jenis = badgeJenis ? badgeJenis.textContent.trim() : (row.getAttribute('data-jenis') || '');
    const pengirimTujuan = row.cells[2] ? row.cells[2].textContent.trim() : '';
    const perihal = row.cells[3] ? row.cells[3].textContent.trim() : '';
    const tanggal = row.cells[4] ? row.cells[4].textContent.trim() : '';
    const badgeStatus = row.querySelector('.badge-status-surat');
    const status = badgeStatus ? badgeStatus.textContent.trim() : (row.getAttribute('data-status') || '-');
    const fileUrl = row.getAttribute('data-file-url') || '';
    
    let iconClass = 'fa-file-pdf';
    let extText = '.pdf';
    if (fileUrl && fileUrl !== '' && fileUrl !== 'None' && fileUrl !== '#') {
        const ext = fileUrl.split('.').pop().toLowerCase();
        if (ext === 'docx' || ext === 'doc') iconClass = 'fa-file-word';
        else if (ext === 'xlsx' || ext === 'xls') iconClass = 'fa-file-excel';
        else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) iconClass = 'fa-file-image';
        extText = '.' + ext;
    }
    const safeNomor = nomorSurat.replace(/[\/\\?%*:|"<>\s]/g, '_');
    const displayFileName = (fileUrl && fileUrl !== '' && fileUrl !== 'None' && fileUrl !== '#') ? `${safeNomor}${extText}` : 'Dokumen Belum Diunggah';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
        <div class="modal-container modal-detail">
            <div class="modal-header">
                <h2>Detail Arsip</h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body-detail">
                <div class="detail-section highlight">
                    <span class="detail-label">Nomor Surat</span>
                    <div class="detail-value">${nomorSurat}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-section">
                        <span class="detail-label">Jenis Surat</span>
                        <div class="detail-value">
                            <span class="badge-jenis ${jenis.toLowerCase()}">${jenis}</span>
                        </div>
                    </div>
                    <div class="detail-section">
                        <span class="detail-label">Status</span>
                        <div class="detail-value">
                            <span class="badge-status-surat ${status.toLowerCase().replace(' ', '-')}">${status}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <span class="detail-label">${jenis.toLowerCase() === 'masuk' ? 'Pengirim' : 'Tujuan'}</span>
                    <div class="detail-value">${pengirimTujuan}</div>
                </div>

                <div class="detail-section">
                    <span class="detail-label">Perihal</span>
                    <div class="detail-value">${perihal}</div>
                </div>

                <div class="detail-section">
                    <span class="detail-label">Tanggal</span>
                    <div class="detail-value">${tanggal}</div>
                </div>

                <div class="detail-section">
                    <span class="detail-label">File Lampiran</span>
                    <div style="margin-top: 0.5rem;">
                        <a href="#" class="file-attachment" onclick="event.preventDefault(); this.closest('.modal-overlay').remove(); downloadSurat('${nomorSurat}', '${jenis}', '${fileUrl}');">
                            <i class="fas ${iconClass}"></i>
                            <span>${displayFileName}</span>
                        </a>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-close-detail" onclick="this.closest('.modal-overlay').remove()">Tutup</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Download surat
function downloadSurat(nomorSurat, jenis, fileUrl) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    // Determine file extension and dynamic file icon
    let fileExt = 'PDF';
    let iconClass = 'fa-file-pdf';
    let iconBgColor = '#FEE2E2';
    let iconColor = '#EF4444';
    
    if (fileUrl && fileUrl !== '' && fileUrl !== 'None') {
        const ext = fileUrl.split('.').pop().toLowerCase();
        if (ext === 'docx' || ext === 'doc') {
            fileExt = 'DOCX';
            iconClass = 'fa-file-word';
            iconBgColor = '#DBEAFE';
            iconColor = '#2563EB';
        } else if (ext === 'xlsx' || ext === 'xls') {
            fileExt = 'EXCEL';
            iconClass = 'fa-file-excel';
            iconBgColor = '#D1FAE5';
            iconColor = '#10B981';
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
            fileExt = ext.toUpperCase();
            iconClass = 'fa-file-image';
            iconBgColor = '#F3E8FF';
            iconColor = '#9333EA';
        }
    }
    
    // Render an incredibly premium, interactive confirmation modal
    modal.innerHTML = `
        <div class="modal-container modal-detail animate-fadeIn" style="max-width: 400px; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);">
            <div class="modal-body-detail" style="padding: 2.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem;">
                <div class="download-icon-wrapper animate-pulse-subtle" style="width: 72px; height: 72px; border-radius: 20px; background-color: ${iconBgColor}; border: 1px solid rgba(0,0,0,0.03); display: flex; align-items: center; justify-content: center; color: ${iconColor}; transition: all 0.3s ease;">
                    <i class="fas ${iconClass}" style="font-size: 2.25rem;"></i>
                </div>
                
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #1E293B; margin-bottom: 0.5rem; letter-spacing: -0.01em;">Konfirmasi Unduh</h3>
                    <p style="font-size: 0.875rem; color: #64748B; font-weight: 500; line-height: 1.6;">Apakah Anda yakin ingin mengunduh dokumen arsip ini?</p>
                </div>
                
                <div style="width: 100%; background-color: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 16px; padding: 1.25rem; text-align: left; display: flex; flex-direction: column; gap: 0.625rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; align-items: center;">
                        <span style="color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Nomor Surat</span>
                        <span style="color: #334155; font-weight: 800; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${nomorSurat}">${nomorSurat}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; align-items: center;">
                        <span style="color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Jenis Surat</span>
                        <span class="badge-jenis ${jenis.toLowerCase()}" style="font-size: 9px; padding: 0.15rem 0.5rem; display: inline-flex; align-items: center; border-radius: 9999px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">${jenis}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; align-items: center;">
                        <span style="color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Format File</span>
                        <span style="color: ${iconColor}; font-weight: 800; display: flex; align-items: center; gap: 0.25rem; text-transform: uppercase;"><i class="fas ${iconClass}" style="font-size: 10px;"></i> ${fileExt}</span>
                    </div>
                </div>
                
                <div style="display: flex; width: 100%; gap: 1rem; margin-top: 0.5rem;">
                    <button class="btn-cancel-download" style="flex: 1; padding: 0.85rem; background-color: #F1F5F9; border: 1px solid #E2E8F0; color: #475569; font-weight: 700; font-size: 0.875rem; border-radius: 14px; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); outline: none;">Batal</button>
                    <button class="btn-confirm-download" style="flex: 1; padding: 0.85rem; background-color: #10B981; border: none; color: white; font-weight: 700; font-size: 0.875rem; border-radius: 14px; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25); outline: none;">Unduh</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Trigger reflow to enable seamless animation transitions
    modal.offsetWidth;
    modal.classList.add('show');

    // Smooth transition close helper
    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    // Cancel / Close buttons logic
    const closeBtn = modal.querySelector('.btn-cancel-download');
    closeBtn.addEventListener('click', closeModal);
    
    // Hover effects for Batal
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = '#E2E8F0';
        closeBtn.style.color = '#1E293B';
        closeBtn.style.transform = 'translateY(-1px)';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = '#F1F5F9';
        closeBtn.style.color = '#475569';
        closeBtn.style.transform = 'translateY(0)';
    });
    
    // Confirm download logic
    const confirmBtn = modal.querySelector('.btn-confirm-download');
    confirmBtn.addEventListener('click', () => {
        closeModal();
        
        // Show initial loading toast
        showToast(`Menyiapkan unduhan ${jenis} ${nomorSurat}...`, 'success');
        
        // Trigger download of real file if URL is provided
        setTimeout(() => {
            if (fileUrl && fileUrl !== '' && fileUrl !== 'None' && fileUrl !== '#') {
                const link = document.createElement('a');
                link.href = fileUrl;
                
                // Keep the original file extension
                const extension = fileUrl.split('.').pop();
                const sanitizedNomor = nomorSurat.replace(/[\/\\?%*:|"<>\s]/g, '_');
                link.setAttribute('download', `${sanitizedNomor}.${extension}`);
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showToast(`Dokumen ${nomorSurat} berhasil diunduh!`, 'success');
            } else {
                showToast(`File fisik untuk dokumen ${nomorSurat} belum diunggah!`, 'error');
            }
        }, 1200);
    });
    
    // Hover effects for Unduh
    confirmBtn.addEventListener('mouseenter', () => {
        confirmBtn.style.backgroundColor = '#059669';
        confirmBtn.style.transform = 'translateY(-1.5px)';
        confirmBtn.style.boxShadow = '0 6px 18px rgba(16, 185, 129, 0.35)';
    });
    confirmBtn.addEventListener('mouseleave', () => {
        confirmBtn.style.backgroundColor = '#10B981';
        confirmBtn.style.transform = 'translateY(0)';
        confirmBtn.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.25)';
    });

    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// ========================================
// UPDATE COUNT
// ========================================

function updateCount(count) {
    const totalRows = document.querySelectorAll('.surat-table tbody tr').length;
    const visibleCount = count !== undefined ? count : totalRows;
    
    // Update header badge
    const headerBadge = document.querySelector('.card-header span');
    if (headerBadge) {
        headerBadge.textContent = `Menampilkan ${visibleCount}`;
    }

    // Update documentCount element if present
    const documentCountEl = document.getElementById('documentCount');
    if (documentCountEl) {
        documentCountEl.textContent = `${visibleCount} Dokumen`;
    }
    
    // Update pagination info
    const paginationInfo = document.querySelector('.pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `Menampilkan ${visibleCount} dari ${totalRows} arsip`;
    }
}

// ========================================
// TOAST NOTIFICATION
// ========================================

function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10B981' : '#EF4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;
    `;
    
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// ANIMATIONS
// ========================================

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-fadeIn {
        animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes pulseSubtle {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
    }

    .animate-pulse-subtle {
        animation: pulseSubtle 3s ease-in-out infinite;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
