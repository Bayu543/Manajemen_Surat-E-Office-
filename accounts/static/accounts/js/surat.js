// Surat Masuk Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Filter Tabs (Modern Pills) & Mobile Dropdown
    const filterTabs = document.querySelectorAll('.tab-item');
    const mobileDropdown = document.getElementById('mobileStatusFilter');
    
    function applyFilter(status) {
        const tableRows = document.querySelectorAll('#suratTableBody tr');
        
        // Reset active styles on all tabs
        filterTabs.forEach(t => {
            t.classList.remove('active', 'bg-blue-600', 'bg-amber-500', 'bg-emerald-600', 'shadow-lg', 'shadow-blue-500/20', 'shadow-blue-500/25', 'shadow-amber-500/20', 'shadow-emerald-500/20', 'shadow-emerald-500/25');
        });
        
        // Set active styles (Status-Specific Styling) on corresponding tab
        const activeTab = document.querySelector(`.tab-item[data-status="${status}"]`);
        if (activeTab) {
            activeTab.classList.add('active', 'shadow-lg');
            
            if (status === 'all' || status === 'baru') {
                activeTab.classList.add('bg-blue-600', 'shadow-blue-500/25');
            } else if (status === 'diproses') {
                activeTab.classList.add('bg-amber-500', 'shadow-amber-500/20');
            } else if (status === 'selesai') {
                activeTab.classList.add('bg-emerald-600', 'shadow-emerald-500/25');
            }
        }
        
        // Sync mobile dropdown
        if (mobileDropdown && mobileDropdown.value !== status) {
            mobileDropdown.value = status;
        }
        
        // Filter table rows
        let visibleCount = 0;
        tableRows.forEach(row => {
            const rowStatus = row.getAttribute('data-status');
            if (status === 'all' || rowStatus === status) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        if (typeof updatePaginationInfo === 'function') {
            updatePaginationInfo(visibleCount);
        }

        // Update counts after filtering
        updateFilterCounts();
    }
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            applyFilter(status);
        });
    });
    
    if (mobileDropdown) {
        mobileDropdown.addEventListener('change', function() {
            applyFilter(this.value);
        });
    }

    function getStatusColor(status) {
        switch(status) {
            case 'baru': return 'blue';
            case 'diproses': return 'amber';
            case 'selesai': return 'emerald';
            default: return 'blue';
        }
    }
    
    // Search Functionality - Enhanced
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Add search icon animation
        const searchIcon = searchInput.previousElementSibling;
        
        searchInput.addEventListener('focus', function() {
            if (searchIcon) {
                searchIcon.style.color = '#3B82F6';
            }
        });
        
        searchInput.addEventListener('blur', function() {
            if (searchIcon && !this.value) {
                searchIcon.style.color = '#6B7280';
            }
        });
        
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            let visibleCount = 0;
            
            // Get current active filter
            const currentFilter = document.querySelector('.tab-item.active');
            const currentStatus = currentFilter ? currentFilter.getAttribute('data-status') : 'all';
            
            tableRows.forEach(row => {
                // Get all searchable content
                const nomorSurat = row.cells[0] ? row.cells[0].textContent.toLowerCase().trim() : '';
                const pengirim = row.cells[1] ? row.cells[1].textContent.toLowerCase().trim() : '';
                const perihal = row.cells[2] ? row.cells[2].textContent.toLowerCase().trim() : '';
                const tanggal = row.cells[3] ? row.cells[3].textContent.toLowerCase().trim() : '';
                const ditugaskan = row.querySelector('.user-avatar-cell span') || row.cells[4] ? (row.querySelector('.user-avatar-cell span') ? row.querySelector('.user-avatar-cell span').textContent.toLowerCase().trim() : row.cells[4].textContent.toLowerCase().trim()) : '';
                
                // Combine all searchable fields
                const searchableText = `${nomorSurat} ${pengirim} ${perihal} ${tanggal} ${ditugaskan}`;
                
                // Get row status
                const rowStatus = row.getAttribute('data-status');
                
                // Check if matches search term
                const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm);
                
                // Check if matches current filter
                const matchesFilter = currentStatus === 'all' || rowStatus === currentStatus;
                
                // Show/hide row based on both conditions
                if (matchesSearch && matchesFilter) {
                    row.style.display = '';
                    visibleCount++;
                    
                    // Highlight matching text (optional)
                    if (searchTerm !== '') {
                        highlightText(row, searchTerm);
                    } else {
                        removeHighlight(row);
                    }
                } else {
                    row.style.display = 'none';
                    removeHighlight(row);
                }
            });
            
            // Update pagination info
            updatePaginationInfo(visibleCount);
            
            // Show "no results" message if needed
            showNoResultsMessage(visibleCount);
        });
        
        // Highlight matching text
        function highlightText(row, searchTerm) {
            // Remove existing highlights first
            removeHighlight(row);
            
            // Get cells to highlight
            const cells = [
                row.querySelector('.link-primary'),
                row.cells[1], // Pengirim
                row.cells[2], // Perihal
            ];
            
            cells.forEach(cell => {
                if (cell && cell.textContent) {
                    const text = cell.textContent;
                    const lowerText = text.toLowerCase();
                    const index = lowerText.indexOf(searchTerm);
                    
                    if (index !== -1) {
                        const before = text.substring(0, index);
                        const match = text.substring(index, index + searchTerm.length);
                        const after = text.substring(index + searchTerm.length);
                        
                        const highlighted = `${before}<mark style="background: #FEF3C7; color: #92400E; padding: 0 2px; border-radius: 2px;">${match}</mark>${after}`;
                        cell.innerHTML = highlighted;
                    }
                }
            });
        }
        
        // Remove highlight
        function removeHighlight(row) {
            const marks = row.querySelectorAll('mark');
            marks.forEach(mark => {
                const parent = mark.parentNode;
                parent.textContent = parent.textContent; // Reset to plain text
            });
        }
        
        // Show no results message
        function showNoResultsMessage(count) {
            let noResultsMsg = document.getElementById('noResultsMessage');
            
            if (count === 0 && searchInput.value.trim() !== '') {
                if (!noResultsMsg) {
                    noResultsMsg = document.createElement('div');
                    noResultsMsg.id = 'noResultsMessage';
                    noResultsMsg.className = 'no-results-message';
                    noResultsMsg.innerHTML = `
                        <i class="fas fa-search"></i>
                        <h3>Tidak ada hasil ditemukan</h3>
                        <p>Coba gunakan kata kunci lain atau ubah filter</p>
                    `;
                    noResultsMsg.style.cssText = `
                        text-align: center;
                        padding: 3rem 2rem;
                        color: #6B7280;
                    `;
                    
                    const tbody = document.querySelector('.surat-table tbody');
                    if (tbody) {
                        tbody.parentNode.insertBefore(noResultsMsg, tbody.nextSibling);
                    }
                }
                noResultsMsg.style.display = 'block';
            } else {
                if (noResultsMsg) {
                    noResultsMsg.style.display = 'none';
                }
            }
        }
    }
    
    // Action Buttons
    const actionButtons = document.querySelectorAll('.btn-icon-surat');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (this.classList.contains('view')) {
                openDetailModal(this);
            } else if (this.classList.contains('edit')) {
                openEditModal(this);
            } else if (this.classList.contains('delete')) {
                openDeleteModal(this);
            } else if (this.classList.contains('tracking')) {
                openTrackingModal(this);
            }
        });
    });

    // Handle Delete Confirmation Modal
    window.openDeleteModal = function(btn) {
        const id = btn.getAttribute('data-id');
        const nomor = btn.getAttribute('data-nomor') || '-';
        const nomorEl = document.getElementById('hapusNomorSurat');
        if (nomorEl) nomorEl.textContent = nomor;
        const formEl = document.getElementById('formHapusSurat');
        if (formEl) formEl.action = `/accounts/surat-masuk/${id}/hapus/`;
        const modal = document.getElementById('modalKonfirmasiHapus');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex', 'show');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeDeleteModalFunc = function() {
        const modal = document.getElementById('modalKonfirmasiHapus');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex', 'show');
            document.body.style.overflow = 'auto';
        }
    };
    
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
    
    // Tambah Surat Button
    const btnAdd = document.querySelector('.btn-add-surat');
    const modalOverlay = document.getElementById('modalTambahSurat');
    const closeModal = document.getElementById('closeModal');
    const btnCancel = document.getElementById('btnCancel');
    const formTambahSurat = document.getElementById('formTambahSurat');
    
    if (btnAdd && modalOverlay) {
        // Open modal
        btnAdd.addEventListener('click', function() {
            modalOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        });

        // Close modal
        function closeModalFunc() {
            modalOverlay.classList.remove('show');
            document.body.style.overflow = 'auto';
            formTambahSurat.reset();
            
            // Reset file preview
            const filePreview = document.getElementById('filePreview');
            if (filePreview) {
                filePreview.className = 'hidden';
                filePreview.innerHTML = '';
            }
            const uploadContainer = document.getElementById('uploadContainer');
            if (uploadContainer) uploadContainer.classList.remove('hidden');
        }

        if (closeModal) {
            closeModal.addEventListener('click', closeModalFunc);
        }

        if (btnCancel) {
            btnCancel.addEventListener('click', closeModalFunc);
        }

        // Close modal when clicking outside
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModalFunc();
            }
        });

        // Close modal with ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalOverlay.classList.contains('show')) {
                closeModalFunc();
            }
        });
    }

    // File Upload
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileSurat = document.getElementById('fileSurat');
    const filePreview = document.getElementById('filePreview');

    if (fileUploadArea && fileSurat) {
        // Click to upload
        fileUploadArea.addEventListener('click', function() {
            fileSurat.click();
        });

        // Drag and drop
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#3B82F6';
            this.style.background = '#EFF6FF';
        });

        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#D1D5DB';
            this.style.background = '#F9FAFB';
        });

        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#D1D5DB';
            this.style.background = '#F9FAFB';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });

        // File input change
        fileSurat.addEventListener('change', function(e) {
            if (this.files.length > 0) {
                handleFileSelect(this.files[0]);
            }
        });

        // Handle file selection
        function handleFileSelect(file) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            const allowedExtensions = ['.pdf', '.doc', '.docx'];
            const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

            if (file.size > maxSize) {
                showToast('Ukuran file terlalu besar! Maksimal 5 MB.', 'error');
                fileSurat.value = '';
                return;
            }

            if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
                showToast('Tipe file tidak didukung! Hanya diperbolehkan PDF atau Word (DOC/DOCX).', 'error');
                fileSurat.value = '';
                return;
            }

            // Show preview
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            let iconClass = "fas fa-file text-2xl text-gray-500";
            let bgClass = "bg-gray-50";
            if (file.type.includes('pdf')) {
                iconClass = "fas fa-file-pdf text-2xl text-red-500";
                bgClass = "bg-red-50";
            } else if (file.type.includes('word') || file.type.includes('document')) {
                iconClass = "fas fa-file-word text-2xl text-blue-500";
                bgClass = "bg-blue-50";
            } else if (file.type.includes('image')) {
                iconClass = "fas fa-file-image text-2xl text-emerald-500";
                bgClass = "bg-emerald-50";
            }

            filePreview.innerHTML = `
                <div class="flex items-center justify-between w-full p-3.5 gap-4">
                    <div class="w-12 h-12 rounded-2xl ${bgClass} flex items-center justify-center shrink-0">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-gray-800 truncate">${file.name}</p>
                        <p class="text-xs font-medium text-gray-400">${fileSize} MB</p>
                    </div>
                    <button type="button" class="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm" onclick="removeFile()" title="Hapus File">
                        <i class="fas fa-times font-bold text-sm"></i>
                    </button>
                </div>
            `;
            filePreview.className = "border border-gray-200 rounded-2xl bg-white shadow-sm block";
            const uploadContainer = document.getElementById('uploadContainer');
            if (uploadContainer) uploadContainer.classList.add('hidden');
        }
    }

    // Remove file
    window.removeFile = function() {
        const fileSurat = document.getElementById('fileSurat');
        const filePreview = document.getElementById('filePreview');
        const uploadContainer = document.getElementById('uploadContainer');
        if (fileSurat) fileSurat.value = '';
        if (filePreview) {
            filePreview.className = "hidden";
            filePreview.innerHTML = '';
        }
        if (uploadContainer) uploadContainer.classList.remove('hidden');
    };


    
    // Table Row Click
    const mainTableRows = document.querySelectorAll('#suratTableBody tr');
    mainTableRows.forEach(row => {
        row.addEventListener('click', function(e) {
            // Don't trigger if clicking action buttons
            if (!e.target.closest('.btn-icon-surat')) {
                const linkEl = this.querySelector('.link-primary');
                if (linkEl) {
                    const nomorSurat = linkEl.textContent;
                    console.log('Clicked row:', nomorSurat);
                }
            }
        });
    });
    
    // Update Pagination Info
    function updatePaginationInfo(count) {
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            const total = document.querySelectorAll('#suratTableBody tr').length;
            paginationInfo.textContent = `Menampilkan ${count} dari ${total} surat`;
        }
    }
    
    // Update Filter Counts (Fixed for Pills)
    function updateFilterCounts() {
        const tableRows = document.querySelectorAll('#suratTableBody tr');
        const allCount = tableRows.length;
        const baruCount = document.querySelectorAll('#suratTableBody tr[data-status="baru"]').length;
        const diprosesCount = document.querySelectorAll('#suratTableBody tr[data-status="diproses"]').length;
        const selesaiCount = document.querySelectorAll('#suratTableBody tr[data-status="selesai"]').length;
        
        document.querySelectorAll('.tab-item').forEach(tab => {
            const status = tab.getAttribute('data-status');
            const badge = tab.querySelector('span:last-child');
            
            if (badge) {
                switch(status) {
                    case 'all': badge.textContent = allCount; break;
                    case 'baru': badge.textContent = baruCount; break;
                    case 'diproses': badge.textContent = diprosesCount; break;
                    case 'selesai': badge.textContent = selesaiCount; break;
                }
            }
        });

        const mobileDropdown = document.getElementById('mobileStatusFilter');
        if (mobileDropdown) {
            const options = mobileDropdown.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === 'all') options[i].text = `Semua (${allCount})`;
                if (options[i].value === 'baru') options[i].text = `Baru (${baruCount})`;
                if (options[i].value === 'diproses') options[i].text = `Diproses (${diprosesCount})`;
                if (options[i].value === 'selesai') options[i].text = `Selesai (${selesaiCount})`;
            }
        }
    }
    
    // Initialize counts
    updateFilterCounts();
    
    // Animate table rows on load
    if (typeof mainTableRows !== 'undefined') {
        mainTableRows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    // ========================================
    // MODAL DETAIL SURAT FUNCTIONALITY
    // ========================================

    window.openDetailModal = function(btn) {
        const nomor = btn.getAttribute('data-nomor') || '-';
        const pengirim = btn.getAttribute('data-pengirim') || '-';
        const perihal = btn.getAttribute('data-perihal') || '-';
        const tanggal = btn.getAttribute('data-tanggal') || '-';
        const diterima = btn.getAttribute('data-diterima') || '-';
        const staffnama = btn.getAttribute('data-staffnama') || 'Belum ditugaskan';
        const status = btn.getAttribute('data-status') || 'baru';
        const file = btn.getAttribute('data-file') || 'none';

        const catatan = btn.getAttribute('data-catatan') || 'Tidak ada instruksi khusus dari pimpinan.';

        const elNomor = document.getElementById('detailNomorSurat');
        if (elNomor) elNomor.textContent = nomor;
        const elPengirim = document.getElementById('detailPengirim');
        if (elPengirim) elPengirim.textContent = pengirim;
        const elPerihal = document.getElementById('detailPerihal');
        if (elPerihal) elPerihal.textContent = perihal;
        const elTanggalSurat = document.getElementById('detailTanggalSurat');
        if (elTanggalSurat) elTanggalSurat.textContent = tanggal;
        const elTanggalDiterima = document.getElementById('detailTanggalDiterima');
        if (elTanggalDiterima) elTanggalDiterima.textContent = diterima;
        const elPenerima = document.getElementById('detailPenerima');
        if (elPenerima) elPenerima.textContent = staffnama;
        const elCatatan = document.getElementById('detailCatatan');
        if (elCatatan) elCatatan.textContent = catatan;

        const statusEl = document.getElementById('detailStatus');
        if (statusEl) {
            statusEl.textContent = status.toUpperCase();
            if (status === 'baru') {
                statusEl.className = 'px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm bg-blue-100 text-blue-700 border border-blue-200';
            } else if (status === 'diproses') {
                statusEl.className = 'px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm bg-amber-100 text-amber-700 border border-amber-200';
            } else if (status === 'selesai') {
                statusEl.className = 'px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm bg-emerald-100 text-emerald-700 border border-emerald-200';
            }
        }

        const pdfFrame = document.getElementById('pdfFrame');
        const pdfNoFile = document.getElementById('pdfNoFile');
        const btnUnduhWrapper = document.getElementById('btnUnduhSuratWrapper');
        const btnUnduh = document.getElementById('btnUnduhSurat');

        if (file !== 'none' && file !== '') {
            const isPDF = file.toLowerCase().split('?')[0].endsWith('.pdf');
            if (isPDF) {
                if (pdfFrame) {
                    pdfFrame.src = file;
                    pdfFrame.classList.remove('hidden');
                }
                if (pdfNoFile) pdfNoFile.classList.add('hidden');
            } else {
                // Word or other non-previewable formats
                if (pdfFrame) {
                    pdfFrame.src = '';
                    pdfFrame.classList.add('hidden');
                }
                if (pdfNoFile) {
                    pdfNoFile.innerHTML = `
                        <div class="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto text-lg shadow-sm border border-blue-500/30">
                            <i class="fas fa-file-word"></i>
                        </div>
                        <p class="text-xs font-bold text-slate-300">Pratinjau tidak tersedia untuk format Word.</p>
                        <p class="text-[9px] text-slate-500">Silakan unduh dokumen menggunakan tombol di bawah untuk melihat isi surat.</p>
                    `;
                    pdfNoFile.classList.remove('hidden');
                }
            }
            if (btnUnduhWrapper) btnUnduhWrapper.classList.remove('hidden');
            if (btnUnduh) btnUnduh.href = file;
        } else {
            if (pdfFrame) {
                pdfFrame.src = '';
                pdfFrame.classList.add('hidden');
            }
            if (pdfNoFile) {
                pdfNoFile.innerHTML = `
                    <div class="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-lg shadow-sm border border-slate-700">
                        <i class="fas fa-file-excel"></i>
                    </div>
                    <p class="text-xs font-bold text-slate-300">File dokumen tidak tersedia.</p>
                    <p class="text-[9px] text-slate-500">Surat ini mungkin tidak diunggah dengan lampiran file saat pembuatan.</p>
                `;
                pdfNoFile.classList.remove('hidden');
            }
            if (btnUnduhWrapper) btnUnduhWrapper.classList.add('hidden');
            if (btnUnduh) btnUnduh.href = '#';
        }

        const btnLacak = document.getElementById('btnLacakDetail');
        if (btnLacak) {
            const id = btn.getAttribute('data-id');
            btnLacak.setAttribute('data-id', id);
        }

        const modal = document.getElementById('modalDetailSurat');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeDetailModalFunc = function() {
        const modal = document.getElementById('modalDetailSurat');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = 'auto';
            const pdfFrame = document.getElementById('pdfFrame');
            if (pdfFrame) pdfFrame.src = '';
        }
    };

    // ========================================
    // MODAL EDIT SURAT FUNCTIONALITY
    // ========================================

    window.openEditModal = function(btn) {
        const id = btn.getAttribute('data-id');
        const nomor = btn.getAttribute('data-nomor') || '';
        const pengirim = btn.getAttribute('data-pengirim') || '';
        const perihal = btn.getAttribute('data-perihal') || '';
        const tanggal = btn.getAttribute('data-tanggal') || '';
        const status = btn.getAttribute('data-status') || 'baru';
        const ditugaskan = btn.getAttribute('data-ditugaskan') || '';

        const editSuratId = document.getElementById('editSuratId');
        if (editSuratId) editSuratId.value = id;
        
        const editNomor = document.getElementById('editNomorSurat');
        if (editNomor) editNomor.value = nomor;
        
        const editPengirim = document.getElementById('editPengirim');
        if (editPengirim) editPengirim.value = pengirim;

        const editPerihal = document.getElementById('editPerihal');
        if (editPerihal) editPerihal.value = perihal;

        const editTanggalSurat = document.getElementById('editTanggalSurat');
        if (editTanggalSurat) editTanggalSurat.value = tanggal;

        const editStatus = document.getElementById('editStatus');
        if (editStatus) editStatus.value = status;

        const editTugasKeStaff = document.getElementById('editTugasKeStaff');
        if (editTugasKeStaff) editTugasKeStaff.value = ditugaskan;

        const editFileSurat = document.getElementById('editFileSurat');
        if (editFileSurat) editFileSurat.value = '';

        const editFileNameDisplay = document.getElementById('editFileNameDisplay');
        if (editFileNameDisplay) editFileNameDisplay.textContent = 'Klik untuk mengganti file (Biarkan kosong jika tidak berubah)';

        const modal = document.getElementById('modalEditSurat');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeEditModalFunc = function() {
        const modal = document.getElementById('modalEditSurat');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = 'auto';
        }
    };

    // File input change for edit modal
    const editFileSurat = document.getElementById('editFileSurat');
    if (editFileSurat) {
        editFileSurat.addEventListener('change', function() {
            const display = document.getElementById('editFileNameDisplay');
            if (display && this.files && this.files.length > 0) {
                const file = this.files[0];
                const maxSize = 5 * 1024 * 1024; // 5MB
                const allowedTypes = [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ];
                const allowedExtensions = ['.pdf', '.doc', '.docx'];
                const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

                if (file.size > maxSize) {
                    showToast('Ukuran file terlalu besar! Maksimal 5 MB.', 'error');
                    this.value = '';
                    display.textContent = 'Klik untuk mengganti file (Biarkan kosong jika tidak berubah)';
                    display.className = 'text-xs text-gray-400 font-medium';
                    return;
                }

                if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
                    showToast('Tipe file tidak didukung! Hanya diperbolehkan PDF atau Word (DOC/DOCX).', 'error');
                    this.value = '';
                    display.textContent = 'Klik untuk mengganti file (Biarkan kosong jika tidak berubah)';
                    display.className = 'text-xs text-gray-400 font-medium';
                    return;
                }

                display.textContent = 'File dipilih: ' + file.name;
                display.className = 'text-xs text-amber-600 font-bold';
            } else if (display) {
                display.textContent = 'Klik untuk mengganti file (Biarkan kosong jika tidak berubah)';
                display.className = 'text-xs text-gray-400 font-medium';
            }
        });
    }

    // Form Edit Submit Handler
    const formEditSurat = document.getElementById('formEditSurat');
    if (formEditSurat) {
        formEditSurat.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('editSuratId') ? document.getElementById('editSuratId').value : '';
            if (!id) return;

            const formData = new FormData(this);
            fetch(`/accounts/surat-masuk/${id}/edit/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast('Surat masuk berhasil diperbarui!', 'success');
                    closeEditModalFunc();
                    setTimeout(() => window.location.reload(), 600);
                } else {
                    showToast(data.message || 'Terjadi kesalahan.', 'error');
                }
            })
            .catch(error => {
                console.error('Error editing surat:', error);
                showToast('Terjadi kesalahan pada server.', 'error');
            });
        });
    }





// ========================================
// RADIO BUTTON STYLING
// ========================================

// Add hover and active states to radio options
const radioOptions = document.querySelectorAll('.radio-option');
radioOptions.forEach(option => {
    const radio = option.querySelector('input[type="radio"]');
    
    // Initial state
    if (radio && radio.checked) {
        option.style.borderColor = '#3B82F6';
        option.style.background = '#EFF6FF';
    }
    
    // Hover effect
    option.addEventListener('mouseenter', function() {
        if (!radio.checked) {
            this.style.borderColor = '#3B82F6';
            this.style.background = '#F9FAFB';
        }
    });
    
    option.addEventListener('mouseleave', function() {
        if (!radio.checked) {
            this.style.borderColor = '#E5E7EB';
            this.style.background = 'transparent';
        }
    });
    
    // Click effect
    option.addEventListener('click', function() {
        // Reset all options
        radioOptions.forEach(opt => {
            opt.style.borderColor = '#E5E7EB';
            opt.style.background = 'transparent';
        });
        
        // Highlight selected
        this.style.borderColor = '#3B82F6';
        this.style.background = '#EFF6FF';
    });
    
    // Radio change event
    if (radio) {
        radio.addEventListener('change', function() {
            // Reset all options
            radioOptions.forEach(opt => {
                opt.style.borderColor = '#E5E7EB';
                opt.style.background = 'transparent';
            });
            
            // Highlight selected
            if (this.checked) {
                option.style.borderColor = '#3B82F6';
                option.style.background = '#EFF6FF';
            }
        });
    }
});

// ========================================
// TEXTAREA AUTO-RESIZE
// ========================================

const ringkasanTextarea = document.getElementById('ringkasan');
if (ringkasanTextarea) {
    ringkasanTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Focus effect
    ringkasanTextarea.addEventListener('focus', function() {
        this.style.borderColor = '#3B82F6';
        this.style.background = '#FFFFFF';
        this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    });
    
    ringkasanTextarea.addEventListener('blur', function() {
        this.style.borderColor = '#E5E7EB';
        this.style.background = '#F9FAFB';
        this.style.boxShadow = 'none';
    });
}

// ========================================
// FORM VALIDATION ENHANCEMENTS
// ========================================

if (formTambahSurat) {
    // Add real-time validation
    const requiredFields = formTambahSurat.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.style.borderColor = '#EF4444';
                this.style.background = '#FEF2F2';
            } else {
                this.style.borderColor = '#10B981';
                this.style.background = '#F0FDF4';
                
                // Reset after 1 second
                setTimeout(() => {
                    this.style.borderColor = '#E5E7EB';
                    this.style.background = '#F9FAFB';
                }, 1000);
            }
        });
        
        field.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#E5E7EB';
                this.style.background = '#F9FAFB';
            }
        });
    });
    
    // Enhanced form submit with validation
    formTambahSurat.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check all required fields
        let isValid = true;
        requiredFields.forEach(field => {
            if (!field.value.trim() && field.type !== 'radio') {
                isValid = false;
                field.style.borderColor = '#EF4444';
                field.style.background = '#FEF2F2';
                
                // Scroll to first invalid field
                if (isValid === false) {
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    field.focus();
                }
            }
        });
        
        // Check radio buttons
        const sifatSurat = document.querySelector('input[name="sifat_surat"]:checked');
        if (!sifatSurat) {
            isValid = false;
            alert('Silakan pilih sifat surat!');
            return;
        }
        
        if (!isValid) {
            showToast('Mohon lengkapi semua field yang wajib diisi!', 'error');
            return;
        }
        
        const formData = new FormData(this);
        
        fetch(window.location.pathname, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Surat berhasil ditambahkan!', 'success');
                modalOverlay.classList.remove('show');
                document.body.style.overflow = 'auto';
                formTambahSurat.reset();
                const uploadContainer = document.getElementById('uploadContainer');
                const filePreview = document.getElementById('filePreview');
                if (uploadContainer) uploadContainer.classList.remove('hidden');
                if (filePreview) { filePreview.className = 'hidden'; filePreview.innerHTML = ''; }
                if (typeof radioOptions !== 'undefined' && radioOptions) {
                    radioOptions.forEach(opt => {
                        opt.style.borderColor = '#E5E7EB';
                        opt.style.background = 'transparent';
                    });
                }
                setTimeout(() => window.location.reload(), 600);
            } else {
                showToast(data.message || 'Gagal menambahkan surat.', 'error');
            }
        })
        .catch(err => {
            console.error('Error adding surat:', err);
            showToast('Terjadi kesalahan pada server.', 'error');
        });
    });
}

// ========================================
// DATE INPUT ENHANCEMENTS
// ========================================

const tanggalSuratInput = document.getElementById('tanggalSurat');
const tanggalDiterimaInput = document.getElementById('tanggalDiterima');

// Set default date to today for tanggal diterima
if (tanggalDiterimaInput) {
    const today = new Date().toISOString().split('T')[0];
    tanggalDiterimaInput.value = today;
}

// Validate tanggal surat tidak lebih dari tanggal diterima
if (tanggalSuratInput && tanggalDiterimaInput) {
    tanggalSuratInput.addEventListener('change', function() {
        if (tanggalDiterimaInput.value && this.value > tanggalDiterimaInput.value) {
            alert('Tanggal surat tidak boleh lebih dari tanggal diterima!');
            this.value = '';
        }
    });
    
    tanggalDiterimaInput.addEventListener('change', function() {
        if (tanggalSuratInput.value && this.value < tanggalSuratInput.value) {
            alert('Tanggal diterima tidak boleh kurang dari tanggal surat!');
            this.value = '';
        }
    });
}

// ========================================
// SELECT2 INITIALIZATION FOR OPD DROPDOWN
// ========================================

// Initialize Select2 for OPD dropdown
$(document).ready(function() {
    $('.select2-opd').select2({
        placeholder: '-- Pilih OPD Kabupaten Bekasi --',
        allowClear: true,
        width: '100%',
        dropdownParent: $('#modalTambahSurat'),
        language: {
            noResults: function() {
                return "OPD tidak ditemukan";
            },
            searching: function() {
                return "Mencari...";
            }
        },
        theme: 'default'
    });
    
    // Initialize Select2 for Pengirim dropdown
    $('.select2-pengirim').select2({
        placeholder: '-- Pilih Dinas/Instansi Pengirim --',
        allowClear: true,
        width: '100%',
        dropdownParent: $('#modalTambahSurat'),
        language: {
            noResults: function() {
                return "Dinas/Instansi tidak ditemukan";
            },
            searching: function() {
                return "Mencari...";
            }
        },
        theme: 'default'
    });
    
    // Force center align text for all Select2 dropdowns
    setTimeout(function() {
        $('.select2-selection__rendered').css({
            'text-align': 'center',
            'display': 'block',
            'width': '100%',
            'padding-right': '30px'
        });
        $('.select2-selection__placeholder').css({
            'text-align': 'center',
            'display': 'block',
            'width': '100%'
        });
        console.log('✅ Select2 text centered!');
    }, 200);
    
    // Custom styling for Select2
    $('.select2-opd, .select2-pengirim').on('select2:open', function() {
        // Add custom class to dropdown
        $('.select2-dropdown').addClass('select2-dropdown-custom');
        
        // Tentukan teks placeholder sesuai dropdown yang aktif
        const isOpd = $(this).hasClass('select2-opd');
        const placeholderText = isOpd ? 'Ketik untuk mencari OPD...' : 'Ketik untuk mencari dinas/instansi...';
        
        // Focus on search input and set placeholder
        setTimeout(function() {
            const searchField = $('.select2-search__field');
            searchField.attr('placeholder', placeholderText);
            searchField.focus();
        }, 50);
    });
    
    // Handle selection
    $('.select2-opd, .select2-pengirim').on('select2:select', function(e) {
        const selectedText = e.params.data.text;
        console.log('Selected:', selectedText);
        
        // Re-apply center alignment after selection
        $(this).next('.select2-container').find('.select2-selection__rendered').css({
            'text-align': 'center',
            'display': 'block',
            'width': '100%',
            'padding-right': '30px'
        });
        
        // Add visual feedback
        $(this).next('.select2-container').find('.select2-selection').css({
            'border-color': '#10B981',
            'background': '#F0FDF4'
        });
        
        // Reset after 1 second
        setTimeout(() => {
            $(this).next('.select2-container').find('.select2-selection').css({
                'border-color': '#E5E7EB',
                'background': '#F9FAFB'
            });
        }, 1000);
    });
    
    // Handle clear
    $('.select2-opd, .select2-pengirim').on('select2:clear', function() {
        console.log('Selection cleared');
        
        // Re-apply center alignment after clear
        setTimeout(() => {
            $('.select2-selection__rendered').css({
                'text-align': 'center',
                'display': 'block',
                'width': '100%',
                'padding-right': '30px'
            });
        }, 50);
    });
    
    // Reset Select2 when modal closes
    $('#closeModal, #btnCancel').on('click', function() {
        $('.select2-opd').val(null).trigger('change');
        $('.select2-pengirim').val(null).trigger('change');
    });

    // ========================================
    // MODAL TRACKING SURAT FUNCTIONALITY
    // ========================================
    window.openTrackingModal = function(btn) {
        const id = btn.getAttribute('data-id');
        const modal = document.getElementById('modalTrackingSurat');
        const timeline = document.getElementById('trackingTimeline');
        const loading = document.getElementById('trackingLoading');

        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';
            
            if (timeline) timeline.innerHTML = '';
            if (loading) loading.classList.remove('hidden');

            fetch(`/accounts/surat-masuk/${id}/tracking/`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(res => res.json())
            .then(data => {
                if (loading) loading.classList.add('hidden');
                
                if (data.success && timeline) {
                    let html = '';
                    data.events.forEach((event, index) => {
                        const isLast = index === data.events.length - 1;
                        let colorClass = 'bg-blue-500';
                        if (event.status_color === 'amber') colorClass = 'bg-amber-500';
                        if (event.status_color === 'indigo') colorClass = 'bg-indigo-500';
                        if (event.status_color === 'emerald') colorClass = 'bg-emerald-500';
                        if (event.status_color === 'teal') colorClass = 'bg-teal-500';

                        html += `
                        <div class="relative pl-6">
                            <!-- Bullet -->
                            <div class="absolute w-4 h-4 rounded-full ${colorClass} border-4 border-white shadow-sm -left-[9px] top-1"></div>
                            
                            <!-- Content -->
                            <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <h3 class="font-bold text-gray-800 text-sm mb-1">${event.title}</h3>
                                <div class="flex items-center gap-2 text-[11px] text-gray-500 mb-2 font-medium">
                                    <i class="fas fa-clock opacity-70"></i>
                                    <span>${event.waktu}</span>
                                    <span class="mx-1">•</span>
                                    <i class="fas fa-user-circle opacity-70"></i>
                                    <span>Oleh: ${event.aktor}</span>
                                </div>
                                ${event.catatan ? `<div class="mt-2 p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100 italic">"${event.catatan}"</div>` : ''}
                            </div>
                        </div>
                        `;
                    });
                    timeline.innerHTML = html;
                } else {
                    if (timeline) timeline.innerHTML = '<div class="text-center text-red-500 font-bold p-4">Gagal memuat riwayat.</div>';
                }
            })
            .catch(err => {
                console.error(err);
                if (loading) loading.classList.add('hidden');
                if (timeline) timeline.innerHTML = '<div class="text-center text-red-500 font-bold p-4">Terjadi kesalahan.</div>';
            });
        }
    };

    window.closeTrackingModal = function() {
        const modal = document.getElementById('modalTrackingSurat');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = 'auto';
        }
    };

    window.openTrackingModalFromDetail = function() {
        const btnLacak = document.getElementById('btnLacakDetail');
        if (btnLacak) {
            openTrackingModal(btnLacak);
        }
    };
});
});

console.log('✅ Enhanced Surat Masuk Form with PDF Preview loaded successfully!');
