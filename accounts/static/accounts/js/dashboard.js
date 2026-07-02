// Chart Configuration & Dashboard Logic
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const ctx = document.getElementById('activityChart');
    
    // Global Chart Instances
    let activityChart = null;
    let currentRange = 'year';
    
    // Initialize chart
    async function createChart(range) {
        if (!ctx) {
            console.warn("[DASHBOARD] activityChart canvas not found");
            return;
        }

        try {
            const res = await fetch(`/accounts/api/dashboard-stats/?range=${range}`);
            const data = await res.json();
            
            if (!data.success) {
                console.error("[DASHBOARD] API Error:", data.message);
                return;
            }

            const s = data.stats;
            
            // 1. UPDATE STAT CARDS
            document.querySelectorAll('.stat-card').forEach(card => {
                const labelEl = card.querySelector('.stat-label');
                const valEl = card.querySelector('.stat-value');
                if (!labelEl || !valEl) return;
                
                const label = labelEl.textContent.trim().toUpperCase();
                if (label === 'TOTAL SURAT MASUK' || label === 'TOTAL SURAT MASUK') valEl.textContent = s.total_masuk;
                if (label === 'TOTAL SURAT KELUAR' || label === 'TOTAL SURAT KELUAR') valEl.textContent = s.total_keluar;
                if (label === 'PENDING PROSES' || label === 'PENDING/PROSES') valEl.textContent = s.pending_proses;
                if (label === 'SURAT SELESAI' || label === 'SURAT SELESAI') valEl.textContent = s.surat_selesai;
            });

            // 2. UPDATE PROGRESS BARS
            document.querySelectorAll('.status-item').forEach(item => {
                const labelEl = item.querySelector('.status-label');
                const countEl = item.querySelector('.status-count');
                const barEl = item.querySelector('.status-progress');
                if (!labelEl) return;

                const label = labelEl.textContent.trim();
                if (label === 'Surat Masuk Baru') {
                    if (countEl) countEl.textContent = s.masuk_baru;
                    if (barEl) barEl.style.width = s.p_baru + '%';
                }
                if (label === 'Sedang Diproses') {
                    if (countEl) countEl.textContent = s.sedang_diproses;
                    if (barEl) barEl.style.width = s.p_proses + '%';
                }
                if (label === 'Selesai') {
                    if (countEl) countEl.textContent = s.surat_selesai;
                    if (barEl) barEl.style.width = s.p_selesai + '%';
                }
                if (label === 'SK Menunggu Approve') {
                    if (countEl) countEl.textContent = s.sk_menunggu;
                    if (barEl) barEl.style.width = s.p_sk_menunggu + '%';
                }
            });

            // 3. UPDATE LINE CHART
            const c = data.chart;
            if (activityChart) {
                activityChart.destroy();
            }

            const canvasCtx = ctx.getContext('2d');
            const gradientMasuk = canvasCtx.createLinearGradient(0, 0, 0, 300);
            gradientMasuk.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
            gradientMasuk.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

            const gradientKeluar = canvasCtx.createLinearGradient(0, 0, 0, 300);
            gradientKeluar.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            gradientKeluar.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
            
            activityChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: c.labels,
                    datasets: [
                        {
                            label: 'Masuk',
                            data: c.masuk,
                            borderColor: '#10B981',
                            backgroundColor: gradientMasuk,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            borderWidth: 3
                        },
                        {
                            label: 'Keluar',
                            data: c.keluar,
                            borderColor: '#EF4444',
                            backgroundColor: gradientKeluar,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            borderWidth: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            titleFont: { size: 12, weight: 'bold' },
                            bodyFont: { size: 12 },
                            padding: 12,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        y: { 
                            min: 0,
                            max: 100,
                            grid: { color: '#F3F4F6', drawBorder: false },
                            ticks: { 
                                stepSize: 10,
                                color: '#9CA3AF', 
                                font: { size: 10 } 
                            }
                        },
                        x: { 
                            grid: { display: false },
                            ticks: { color: '#9CA3AF', font: { size: 10 } }
                        }
                    }
                }
            });
        } catch (err) {
            console.error('[DASHBOARD] Fetch Error:', err);
        }
    }

    // Auto Refresh setiap 30 detik agar Real-time
    setInterval(() => {
        createChart(currentRange);
    }, 30000);

    // Filter Logic
    const filterRange = document.getElementById('filterRange');
    if (filterRange) {
        filterRange.addEventListener('change', function() {
            currentRange = this.value;
            
            // Update UI Teks
            const subtitle = document.querySelector('.subtitle');
            if (subtitle) {
                const rangeText = {
                    'week': '7 Hari Terakhir',
                    'month': '30 Hari Terakhir',
                    'year': 'Tahun 2026'
                };
                subtitle.textContent = rangeText[currentRange];
            }
            
            createChart(currentRange);
        });
    }

    // Initial Load
    createChart(currentRange);

    // Realtime Polling (Every 30s)
    setInterval(() => createChart(currentRange), 30000);

    // ========================================
    // INTERACTIVE UI LOGIC
    // ========================================

    // Mobile Sidebar Toggle
    const mobileMenuBtn = document.querySelector('header button.lg\\:hidden');
    const sidebar = document.querySelector('aside');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('fixed');
            sidebar.classList.toggle('inset-0');
            sidebar.classList.toggle('z-50');
            sidebar.classList.toggle('w-full');
        });
    }

    // User Profile Dropdown
    const profileBtn = document.getElementById('userProfileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.location.href = '/accounts/profil/';
        });
    }

    // ========================================
    // RECENT ACTIVITY TABLE FILTER LOGIC
    // ========================================
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const activityRows = document.querySelectorAll('.activity-row');
    const activityCount = document.getElementById('activityCount');
    
    let currentFilters = {
        jenis: 'all',
        status: 'all'
    };

    if (filterToggleBtn && filterDropdown) {
        // Toggle Dropdown
        filterToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('hidden');
        });

        // Close on outside click
        document.addEventListener('click', () => {
            filterDropdown.classList.add('hidden');
        });

        filterDropdown.addEventListener('click', (e) => e.stopPropagation());

        // Filter Selection Logic
        const filterOpts = document.querySelectorAll('.filter-opt, .filter-opt-status');
        
        filterOpts.forEach(opt => {
            opt.addEventListener('click', function() {
                const type = this.getAttribute('data-filter');
                const val = this.getAttribute('data-val');
                
                currentFilters[type] = val;
                
                // Update UI Checkmarks (Hanya hapus check dari grup yang sama)
                const groupOpts = filterDropdown.querySelectorAll(`[data-filter="${type}"]`);
                groupOpts.forEach(o => {
                    const check = o.querySelector('.fa-check');
                    if (check) check.remove();
                    // Hapus padding/justify jika ada
                    o.classList.remove('justify-between');
                });
                
                // Tambah check ke yang diklik
                this.classList.add('flex', 'items-center', 'justify-between');
                this.innerHTML += ' <i class="fas fa-check text-[10px] text-blue-500"></i>';
                
                applyFilters();
            });
        });
    }

    function applyFilters() {
        let visibleCount = 0;
        
        activityRows.forEach(row => {
            const rowJenis = row.getAttribute('data-jenis');
            const rowStatus = row.getAttribute('data-status');
            
            const matchJenis = currentFilters.jenis === 'all' || rowJenis === currentFilters.jenis;
            const matchStatus = currentFilters.status === 'all' || rowStatus === currentFilters.status;
            
            if (matchJenis && matchStatus) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        if (activityCount) {
            activityCount.textContent = `${visibleCount} entri`;
        }
    }
});
