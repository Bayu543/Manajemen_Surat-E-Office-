// Disposisi Page JavaScript
console.log('Disposisi JS loaded');

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded - Disposisi');

    const tableRows = document.querySelectorAll('#disposisiTableBody tr:not(.empty-row)');

    // Search Functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            let visibleCount = 0;

            tableRows.forEach(row => {
                const nomorSurat = row.cells[0] ? row.cells[0].textContent.toLowerCase().trim() : '';
                const staff = row.cells[1] ? row.cells[1].textContent.toLowerCase().trim() : '';
                const instruksi = row.cells[2] ? row.cells[2].textContent.toLowerCase().trim() : '';

                const searchableText = `${nomorSurat} ${staff} ${instruksi}`;

                if (searchTerm === '' || searchableText.includes(searchTerm)) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            updatePaginationInfo(visibleCount);
        });
    }

    // Action Buttons - View Detail
    const actionButtons = document.querySelectorAll('.btn-lihat-disposisi');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const row = this.closest('tr');
            showDetailDisposisi(row);
        });
    });

    tableRows.forEach(row => {
        row.addEventListener('click', function (e) {
            if (e.target.closest('button') || e.target.closest('form') || e.target.closest('a')) return;
            showDetailDisposisi(this);
        });
    });

    // Show Detail & Tracking Disposisi Modal (AJAX)
    function showDetailDisposisi(row) {
        const modal = document.getElementById('modalDetailDisposisi');
        if (!modal) return;

        const disposisiId = row.getAttribute('data-id');
        if (!disposisiId) return;

        // Fetch data from server
        fetch(`/accounts/disposisi/${disposisiId}/detail/`)
            .then(response => response.json())
            .then(res => {
                if (!res.success) {
                    alert('Gagal mengambil data detail disposisi.');
                    return;
                }
                const data = res.data;

                // Bagian 1: Informasi Surat Induk
                document.getElementById('detailNomorSurat').textContent = data.nomor_surat;
                document.getElementById('detailPengirim').textContent = data.pengirim;
                document.getElementById('detailPerihal').textContent = data.perihal;
                document.getElementById('detailTanggalSurat').textContent = data.tanggal_surat;
                document.getElementById('detailTanggalDiterima').textContent = data.tanggal_diterima;
                
                const btnLihatPdf = document.getElementById('btnLihatDokumenAsli');
                if (data.file_surat_url) {
                    btnLihatPdf.style.display = 'flex';
                    btnLihatPdf.href = data.file_surat_url;
                } else {
                    btnLihatPdf.style.display = 'none';
                }

                // Bagian 2: Detail Instruksi Pimpinan
                const prioritasBadge = document.getElementById('detailPrioritasBadge');
                prioritasBadge.textContent = data.prioritas;
                if (data.prioritas.toLowerCase() === 'segera') {
                    prioritasBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-600 border border-red-200 shadow-sm';
                } else {
                    prioritasBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm';
                }
                document.getElementById('detailTanggalDisposisi').textContent = data.tanggal_disposisi;
                if (document.getElementById('timelineTanggalDikirim')) {
                    document.getElementById('timelineTanggalDikirim').textContent = data.tanggal_disposisi;
                }
                document.getElementById('detailInstruksiPimpinan').textContent = data.instruksi;

                // Bagian 3: Log Progress & Tracking Pelaksanaan
                document.getElementById('detailStaffAvatar').src = data.staff_avatar;
                document.getElementById('detailStaffNama').textContent = data.staff_nama;

                const statusBar = document.getElementById('detailStatusBar');
                statusBar.textContent = data.status === 'baru' ? 'Belum Dibaca' : data.status;
                const statusLower = data.status.toLowerCase();

                // (Belum Dibaca: Abu-abu, Dibaca: Ungu, Diproses: Kuning, Selesai: Hijau)
                if (statusLower === 'baru' || statusLower === 'belum_dibaca') {
                    statusBar.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 shadow-sm';
                } else if (statusLower === 'dibaca') {
                    statusBar.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-600 border border-purple-200 shadow-sm';
                } else if (statusLower === 'diproses') {
                    statusBar.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-600 border border-amber-200 shadow-sm';
                } else if (statusLower === 'selesai') {
                    statusBar.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm';
                }

                document.getElementById('detailTanggalDibaca').textContent = data.tanggal_dibaca;
                document.getElementById('detailTanggalSelesai').textContent = data.tanggal_selesai;

                const dotSelesai = document.getElementById('dotSelesai');
                const catatanWrapper = document.getElementById('detailCatatanStaffWrapper');
                const btnUnduhBukti = document.getElementById('btnUnduhBuktiStaff');
                const btnUnduhBuktiWrapper = document.getElementById('btnUnduhBuktiStaffWrapper');
                const noBuktiWrapper = document.getElementById('noBuktiStaffWrapper');

                if (statusLower === 'selesai') {
                    dotSelesai.className = 'absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm';
                    catatanWrapper.style.display = 'block';
                    document.getElementById('detailCatatanStaff').textContent = data.catatan_penyelesaian;

                    if (data.file_bukti_url) {
                        btnUnduhBuktiWrapper.style.display = 'block';
                        noBuktiWrapper.style.display = 'none';
                        btnUnduhBukti.href = data.file_bukti_url;
                    } else {
                        btnUnduhBuktiWrapper.style.display = 'none';
                        noBuktiWrapper.style.display = 'flex';
                    }
                } else {
                    dotSelesai.className = 'absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-gray-300 border-4 border-white shadow-sm';
                    catatanWrapper.style.display = 'none';
                }

                // Tampilkan modal
                modal.classList.remove('hidden');
                modal.classList.add('flex', 'show');
            })
            .catch(err => console.error('Error fetching detail disposisi:', err));
    }

    // Handler Penutupan Modal Detail
    function hideDetailDisposisiModal() {
        const modal = document.getElementById('modalDetailDisposisi');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex', 'show');
        }
    }

    const closeDetailDisposisi = document.getElementById('closeDetailDisposisi');
    const btnCloseDetailDisposisi = document.getElementById('btnCloseDetailDisposisi');
    const closeBackdropDetail = document.getElementById('closeBackdropDetail');

    if (closeDetailDisposisi) closeDetailDisposisi.addEventListener('click', hideDetailDisposisiModal);
    if (btnCloseDetailDisposisi) btnCloseDetailDisposisi.addEventListener('click', hideDetailDisposisiModal);
    if (closeBackdropDetail) closeBackdropDetail.addEventListener('click', hideDetailDisposisiModal);

    const modalDetailDisposisi = document.getElementById('modalDetailDisposisi');
    if (modalDetailDisposisi) {
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modalDetailDisposisi.classList.contains('show')) {
                hideDetailDisposisiModal();
            }
        });
    }

    // Buat Disposisi Button
    const btnBuatDisposisi = document.getElementById('btnBuatDisposisi');
    const modalBuatDisposisi = document.getElementById('modalBuatDisposisi');
    const closeModalDisposisi = document.getElementById('closeModalDisposisi');
    const btnBatalDisposisi = document.getElementById('btnBatalDisposisi');
    const btnKirimDisposisi = document.getElementById('btnKirimDisposisi');

    if (btnBuatDisposisi) {
        btnBuatDisposisi.addEventListener('click', function () {
            modalBuatDisposisi.classList.add('show');
        });
    }

    // Close modal
    if (closeModalDisposisi) {
        closeModalDisposisi.addEventListener('click', function () {
            modalBuatDisposisi.classList.remove('show');
        });
    }

    if (btnBatalDisposisi) {
        btnBatalDisposisi.addEventListener('click', function () {
            modalBuatDisposisi.classList.remove('show');
        });
    }

    // Close on ESC or overlay click
    if (modalBuatDisposisi) {
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modalBuatDisposisi.classList.contains('show')) {
                modalBuatDisposisi.classList.remove('show');
            }
        });

        modalBuatDisposisi.addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    }

    // Pilih Semua / Hapus Pilihan
    const btnPilihSemua = document.getElementById('btnPilihSemua');
    const btnHapusPilihan = document.getElementById('btnHapusPilihan');
    const staffCheckboxes = document.querySelectorAll('input[name="staff_ids"]');

    if (btnPilihSemua) {
        btnPilihSemua.addEventListener('click', function () {
            staffCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }

    if (btnHapusPilihan) {
        btnHapusPilihan.addEventListener('click', function () {
            staffCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }

    // Kirim Disposisi via AJAX
    const formBuatDisposisi = document.getElementById('formBuatDisposisi');
    if (formBuatDisposisi) {
        formBuatDisposisi.addEventListener('submit', function (e) {
            e.preventDefault();
            
            const suratMasuk = document.querySelector('[name="surat_id"]').value;
            const instruksi = document.querySelector('[name="instruksi"]').value;
            const selectedStaff = Array.from(staffCheckboxes).filter(cb => cb.checked);

            // Validation
            if (!suratMasuk) {
                alert('Silakan pilih surat masuk terlebih dahulu!');
                return;
            }

            if (selectedStaff.length === 0) {
                alert('Silakan pilih minimal 1 staff penerima!');
                return;
            }

            if (!instruksi.trim()) {
                alert('Silakan isi instruksi/catatan!');
                return;
            }

            const formData = new FormData(formBuatDisposisi);
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

            fetch('/accounts/disposisi/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    modalBuatDisposisi.classList.remove('show');
                    showToast(data.message || `Disposisi berhasil dikirim ke ${selectedStaff.length} staff!`, 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    alert(data.message || 'Gagal mengirim disposisi.');
                }
            })
            .catch(err => {
                console.error('Error sending disposisi:', err);
                alert('Terjadi kesalahan pada server saat mengirim disposisi.');
            });
        });
    }

    // Toast notification function
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-weight: 500;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Update Filter Counts (Fixed for Premium Cards)
    function updateFilterCounts() {
        const rows = document.querySelectorAll('#disposisiTableBody tr:not(.empty-row)');

        const counts = {
            'belum_dibaca': 0,
            'dibaca': 0,
            'diproses': 0,
            'selesai': 0
        };

        rows.forEach(row => {
            const status = row.getAttribute('data-status');
            if (status && counts.hasOwnProperty(status)) {
                counts[status]++;
            }
        });

        // Update UI
        if (document.getElementById('countBelumDibaca')) document.getElementById('countBelumDibaca').textContent = counts['belum_dibaca'];
        if (document.getElementById('countDibaca')) document.getElementById('countDibaca').textContent = counts['dibaca'];
        if (document.getElementById('countDiproses')) document.getElementById('countDiproses').textContent = counts['diproses'];
        if (document.getElementById('countSelesai')) document.getElementById('countSelesai').textContent = counts['selesai'];
    }

    // Update Pagination Info
    function updatePaginationInfo(count) {
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            const total = document.querySelectorAll('#disposisiTableBody tr:not(.empty-row)').length;
            paginationInfo.textContent = `Menampilkan ${count} dari ${total} disposisi`;
        }
    }

    // Initial call
    updateFilterCounts();

    // Animate table rows on load
    const allRows = document.querySelectorAll('#disposisiTableBody tr');
    allRows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';

        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 50);
    });

    console.log('Disposisi initialized successfully');
});

// Modal Bukti Penyelesaian Handlers
window.showBuktiModal = function(button) {
    const modal = document.getElementById('modalBuktiPenyelesaian');
    if (!modal) return;
    
    const nomor = button.getAttribute('data-nomor') || '-';
    const staff = button.getAttribute('data-staff') || '-';
    const tanggal = button.getAttribute('data-tanggal') || '-';
    const catatan = button.getAttribute('data-catatan') || 'Tidak ada catatan dari staff.';
    const fileUrl = button.getAttribute('data-file');
    
    if (document.getElementById('buktiNomorSurat')) document.getElementById('buktiNomorSurat').textContent = nomor;
    if (document.getElementById('buktiStaffNama')) document.getElementById('buktiStaffNama').textContent = staff;
    if (document.getElementById('buktiWaktuSelesai')) document.getElementById('buktiWaktuSelesai').textContent = tanggal;
    if (document.getElementById('buktiCatatan')) document.getElementById('buktiCatatan').textContent = catatan;
    
    const fileWrapper = document.getElementById('buktiFileWrapper');
    const noFile = document.getElementById('buktiNoFile');
    const fileLink = document.getElementById('buktiFileLink');
    
    if (fileUrl && fileUrl !== 'none') {
        fileWrapper.style.display = 'block';
        noFile.style.display = 'none';
        fileLink.href = fileUrl;
    } else {
        fileWrapper.style.display = 'none';
        noFile.style.display = 'flex';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex', 'show');
};

window.closeBuktiModal = function() {
    const modal = document.getElementById('modalBuktiPenyelesaian');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex', 'show');
    }
};

// Modal Konfirmasi Batal Disposisi Handlers
window.openBatalModal = function(id, nomor) {
    const modal = document.getElementById('modalKonfirmasiBatal');
    if (!modal) return;
    
    const nomorEl = document.getElementById('batalNomorSurat');
    if (nomorEl) nomorEl.textContent = nomor;
    
    const formEl = document.getElementById('formBatalDisposisi');
    if (formEl) formEl.action = `/accounts/disposisi/${id}/batal/`;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex', 'show');
    document.body.style.overflow = 'hidden';
};

window.closeBatalModal = function() {
    const modal = document.getElementById('modalKonfirmasiBatal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex', 'show');
        document.body.style.overflow = 'auto';
    }
};
