// Disposisi Staff Page JavaScript
console.log('Disposisi Staff JS loaded');

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded - Disposisi Staff');

    const tableRows = document.querySelectorAll('#disposisiTableBody tr:not(.empty-row)');

    // Row Click - View Detail (Same as Admin)
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

    // Detail Modal AJAX Fetch
    function showDetailDisposisi(row) {
        const modal = document.getElementById('modalDetailDisposisi');
        if (!modal) return;

        const disposisiId = row.getAttribute('data-id');
        if (!disposisiId) return;

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

                // Bagian 3: Log Progress
                document.getElementById('detailStaffAvatar').src = data.staff_avatar;
                document.getElementById('detailStaffNama').textContent = data.staff_nama;

                const statusBar = document.getElementById('detailStatusBar');
                statusBar.textContent = data.status === 'baru' ? 'Belum Dibaca' : data.status;
                const statusLower = data.status.toLowerCase();

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

                modal.classList.remove('hidden');
                modal.classList.add('flex', 'show');
            })
            .catch(err => console.error('Error fetching detail disposisi:', err));
    }

    // Modal detail close
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

    // Update Progress Form / Modal Toggling
    const radioButtons = document.querySelectorAll('input[name="status"]');
    const selesaiFields = document.getElementById('selesaiFields');

    function toggleSelesaiFields() {
        const checkedRadio = document.querySelector('input[name="status"]:checked');
        if (checkedRadio && checkedRadio.value === 'selesai') {
            selesaiFields.style.display = 'block';
            document.getElementById('updateCatatan').setAttribute('required', 'required');
        } else {
            selesaiFields.style.display = 'none';
            document.getElementById('updateCatatan').removeAttribute('required');
        }
    }

    radioButtons.forEach(radio => {
        radio.addEventListener('change', toggleSelesaiFields);
    });

    // Form Submission
    const formUpdate = document.getElementById('formUpdateDisposisi');
    if (formUpdate) {
        formUpdate.addEventListener('submit', function (e) {
            e.preventDefault();
            
            const actionUrl = this.getAttribute('action');
            if (!actionUrl) return;

            const formData = new FormData(this);

            fetch(actionUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(res => {
                if (res.success) {
                    window.location.reload();
                } else {
                    alert('Gagal menyimpan update progress: ' + (res.message || 'Error tidak diketahui'));
                }
            })
            .catch(err => {
                console.error('Error submitting progress update:', err);
                alert('Terjadi kesalahan koneksi.');
            });
        });
    }
});

// Global Window Functions for Modal Triggers
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

window.openUpdateModal = function(id, nomor, currentStatus) {
    const modal = document.getElementById('modalUpdateDisposisi');
    if (!modal) return;

    // Reset Form
    const form = document.getElementById('formUpdateDisposisi');
    form.reset();
    form.setAttribute('action', `/accounts/disposisi/${id}/update-status/`);
    
    document.getElementById('updateNomorSurat').textContent = nomor;
    document.getElementById('fileNamePlaceholder').textContent = 'Pilih file bukti dokumen';

    // Set Current Status radio
    const statusVal = currentStatus.toLowerCase();
    const radioToSelect = document.getElementById(`status${statusVal.charAt(0).toUpperCase() + statusVal.slice(1)}`);
    if (radioToSelect) {
        radioToSelect.checked = true;
    } else {
        // Fallback to "dibaca" or "diproses"
        const defaultRadio = document.getElementById('statusDibaca');
        if (defaultRadio) defaultRadio.checked = true;
    }

    // Toggle Selesai Area
    const selesaiFields = document.getElementById('selesaiFields');
    if (statusVal === 'selesai') {
        selesaiFields.style.display = 'block';
        document.getElementById('updateCatatan').setAttribute('required', 'required');
    } else {
        selesaiFields.style.display = 'none';
        document.getElementById('updateCatatan').removeAttribute('required');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex', 'show');
};

window.closeUpdateModal = function() {
    const modal = document.getElementById('modalUpdateDisposisi');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex', 'show');
    }
};

window.displayFileName = function(input) {
    const placeholder = document.getElementById('fileNamePlaceholder');
    if (input.files && input.files.length > 0) {
        const file = input.files[0];
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (file.size > maxSize) {
            alert('Ukuran file terlalu besar! Maksimal 5 MB.');
            input.value = '';
            placeholder.textContent = 'Pilih file bukti dokumen';
            return;
        }

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
            alert('Tipe file tidak didukung! Hanya diperbolehkan PDF atau Word (DOC/DOCX).');
            input.value = '';
            placeholder.textContent = 'Pilih file bukti dokumen';
            return;
        }

        placeholder.textContent = file.name;
    } else {
        placeholder.textContent = 'Pilih file bukti dokumen';
    }
};
