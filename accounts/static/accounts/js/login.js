// Tab Switching & Initialization
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
    
    // Generate initial captcha for login form (dihapus)
    generateRegisterCaptcha();
    
    // Form validation for login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            // Proceed without captcha validation
        });
    }
    
    // Form validation for register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const userAnswer = document.getElementById('reg_captcha').value;
            
            if (!userAnswer) {
                e.preventDefault();
                showAlert('Silakan masukkan jawaban verifikasi.', 'error');
                return false;
            }
            
            const password = document.getElementById('reg_password').value;
            if (password.length < 8) {
                e.preventDefault();
                showAlert('Password harus minimal 8 karakter!', 'error');
                return false;
            }
        });
        
        // Password strength indicator
        const regPassword = document.getElementById('reg_password');
        if (regPassword) {
            regPassword.addEventListener('input', function() {
                checkPasswordStrength(this.value);
            });
        }
    }
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    });

    // Wire up Lupa Password event listeners
    const closeLupaBtn = document.getElementById('closeLupaPassword');
    if (closeLupaBtn) {
        closeLupaBtn.addEventListener('click', closeLupaPasswordModal);
    }

    const btnBatalLupa = document.getElementById('btnBatalLupa');
    if (btnBatalLupa) {
        btnBatalLupa.addEventListener('click', closeLupaPasswordModal);
    }

    const btnSelesaiLupa = document.getElementById('btnSelesaiLupa');
    if (btnSelesaiLupa) {
        btnSelesaiLupa.addEventListener('click', closeLupaPasswordModal);
    }

    // Modal backdrop click to close
    const modalLupa = document.getElementById('modalLupaPassword');
    if (modalLupa) {
        modalLupa.addEventListener('click', function(e) {
            if (e.target.classList.contains('bg-gray-900/60')) {
                closeLupaPasswordModal();
            }
        });
    }

    // Escape key press to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalLupaPassword');
            if (modal && !modal.classList.contains('hidden')) {
                closeLupaPasswordModal();
            }
        }
    });

    // Forgot Password form submission handler
    const formLupaPassword = document.getElementById('formLupaPassword');
    if (formLupaPassword) {
        formLupaPassword.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const btnKirimLupa = document.getElementById('btnKirimLupa');
            const username = document.getElementById('lupa_username').value.trim();
            const captcha_answer = document.getElementById('lupa_captcha').value.trim();
            const captcha_token = document.getElementById('lupaCaptchaToken').value;
            const csrfTokenInput = formLupaPassword.querySelector('[name=csrfmiddlewaretoken]');
            const csrfToken = csrfTokenInput ? csrfTokenInput.value : '';

            if (!username || !captcha_answer) {
                showLupaAlert('Silakan isi email/username dan jawaban verifikasi.', 'error');
                return;
            }

            // Show loading spinner
            let originalText = '';
            if (btnKirimLupa) {
                originalText = btnKirimLupa.innerHTML;
                btnKirimLupa.disabled = true;
                btnKirimLupa.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memproses...';
            }

            try {
                const url = '/accounts/api/lupa-password/';
                const formData = new FormData();
                formData.append('username', username);
                formData.append('captcha_answer', captcha_answer);
                formData.append('captcha_token', captcha_token);
                if (csrfToken) {
                    formData.append('csrfmiddlewaretoken', csrfToken);
                }

                const response = await fetch(url, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': csrfToken
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Transition to Step 2 (Success)
                    const step1 = document.getElementById('lupaPasswordStep1');
                    const step2 = document.getElementById('lupaPasswordStep2');
                    if (step1) step1.classList.add('hidden');
                    if (step2) step2.classList.remove('hidden');
                } else {
                    showLupaAlert(data.message || 'Terjadi kesalahan. Silakan coba lagi.', 'error');
                    generateLupaCaptcha();
                }
            } catch (error) {
                console.error('Error submitting forgot password:', error);
                showLupaAlert('Gagal mengirim permintaan. Periksa koneksi internet Anda.', 'error');
                generateLupaCaptcha();
            } finally {
                if (btnKirimLupa) {
                    btnKirimLupa.disabled = false;
                    btnKirimLupa.innerHTML = originalText;
                }
            }
        });
    }
});

// Switch Tab Function
function switchTab(targetTab) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remove active class from all tabs and contents
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    const activeBtn = document.querySelector(`[data-tab="${targetTab}"]`);
    const activeContent = document.getElementById(targetTab);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
    
    // Generate captcha for the active tab
    if (targetTab === 'masuk') {
        // Captcha removed for login
    } else {
        generateRegisterCaptcha();
    }
}

// Generate Captcha for Login
async function generateCaptcha() {
    const questionElement = document.getElementById('captchaQuestion');
    const wrapper = questionElement?.closest('.captcha-wrapper');
    const url = wrapper?.getAttribute('data-captcha-url') || '/accounts/api/captcha/';

    try {
        if (questionElement) questionElement.textContent = '...';
        const response = await fetch(url);
        const data = await response.json();
        
        if (questionElement) {
            questionElement.textContent = data.question;
        }
        
        const tokenInput = document.getElementById('captchaToken');
        if (tokenInput) {
            tokenInput.value = data.token;
        }
        
        // Clear input
        const captchaInput = document.getElementById('captcha');
        if (captchaInput) {
            captchaInput.value = '';
        }
    } catch (error) {
        console.error('Error fetching captcha:', error);
        if (questionElement) questionElement.textContent = 'Gagal';
    }
}

// Generate Captcha for Register
async function generateRegisterCaptcha() {
    const questionElement = document.getElementById('regCaptchaQuestion');
    const wrapper = questionElement?.closest('.captcha-wrapper');
    const url = wrapper?.getAttribute('data-captcha-url') || '/accounts/api/captcha/';

    try {
        if (questionElement) questionElement.textContent = '...';
        const response = await fetch(url);
        const data = await response.json();
        
        const questionElementReg = document.getElementById('regCaptchaQuestion');
        if (questionElementReg) {
            questionElementReg.textContent = data.question;
        }
        
        const tokenInput = document.getElementById('regCaptchaToken');
        if (tokenInput) {
            tokenInput.value = data.token;
        }
        
        // Clear input
        const captchaInput = document.getElementById('reg_captcha');
        if (captchaInput) {
            captchaInput.value = '';
        }
    } catch (error) {
        console.error('Error fetching captcha:', error);
        if (questionElement) questionElement.textContent = 'Gagal';
    }
}

// Toggle Password Visibility
function togglePassword(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);
    
    if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }
}

// Check Password Strength
function checkPasswordStrength(password) {
    const strengthElement = document.getElementById('passwordStrength');
    
    if (!strengthElement) return;
    
    if (password.length === 0) {
        strengthElement.classList.remove('show', 'weak', 'medium', 'strong');
        return;
    }
    
    strengthElement.classList.add('show');
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Contains number
    if (/\d/.test(password)) strength++;
    
    // Contains lowercase and uppercase
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // Remove all strength classes
    strengthElement.classList.remove('weak', 'medium', 'strong');
    
    // Add appropriate class
    if (strength <= 2) {
        strengthElement.classList.add('weak');
    } else if (strength <= 4) {
        strengthElement.classList.add('medium');
    } else {
        strengthElement.classList.add('strong');
    }
}

// Show Alert
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    // Insert alert
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const form = activeTab.querySelector('form');
        if (form) {
            form.insertBefore(alert, form.firstChild);
        }
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alert.style.transition = 'opacity 0.5s ease';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
    }, 5000);
}

// --- FORGOT PASSWORD MODAL ---
function openLupaPasswordModal() {
    const modal = document.getElementById('modalLupaPassword');
    if (!modal) return;

    // Reset Form & Steps
    const form = document.getElementById('formLupaPassword');
    if (form) form.reset();

    const step1 = document.getElementById('lupaPasswordStep1');
    const step2 = document.getElementById('lupaPasswordStep2');
    if (step1) step1.classList.remove('hidden');
    if (step2) step2.classList.add('hidden');

    // Remove any leftover modal alerts
    const existingAlerts = form ? form.querySelectorAll('.lupa-alert') : [];
    existingAlerts.forEach(alert => alert.remove());

    // Generate Captcha
    generateLupaCaptcha();

    // Show Modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.classList.add('show');
}

function closeLupaPasswordModal() {
    const modal = document.getElementById('modalLupaPassword');
    if (!modal) return;

    modal.classList.remove('show');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

async function generateLupaCaptcha() {
    const questionElement = document.getElementById('lupaCaptchaQuestion');
    const tokenInput = document.getElementById('lupaCaptchaToken');
    const captchaInput = document.getElementById('lupa_captcha');
    
    const wrapper = document.querySelector('.captcha-wrapper');
    const url = wrapper?.getAttribute('data-captcha-url') || '/accounts/api/captcha/';
    
    try {
        if (questionElement) questionElement.textContent = '...';
        const response = await fetch(url);
        const data = await response.json();
        
        if (questionElement) {
            questionElement.textContent = data.question;
        }
        if (tokenInput) {
            tokenInput.value = data.token;
        }
        if (captchaInput) {
            captchaInput.value = '';
        }
    } catch (error) {
        console.error('Error fetching captcha for forgot password:', error);
        if (questionElement) questionElement.textContent = 'Gagal';
    }
}

function showLupaAlert(message, type) {
    const modalBody = document.getElementById('formLupaPassword');
    if (!modalBody) return;
    
    const existingAlerts = modalBody.querySelectorAll('.lupa-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `lupa-alert alert alert-${type} mb-4`;
    alert.style.padding = '12px 16px';
    alert.style.borderRadius = '16px';
    alert.style.fontSize = '13px';
    alert.style.display = 'flex';
    alert.style.alignItems = 'center';
    alert.style.gap = '8px';
    alert.style.marginBottom = '20px';
    
    if (type === 'error') {
        alert.style.background = '#FEF2F2';
        alert.style.border = '1px solid #FEE2F2';
        alert.style.color = '#EF4444';
    } else {
        alert.style.background = '#ECFDF5';
        alert.style.border = '1px solid #D1FAE5';
        alert.style.color = '#10B981';
    }
    
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    const step1 = document.getElementById('lupaPasswordStep1');
    if (step1) {
        step1.insertBefore(alert, step1.firstChild);
    }
    
    setTimeout(() => {
        alert.style.transition = 'opacity 0.5s ease';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
    }, 5000);
}
