document.addEventListener('DOMContentLoaded', () => {
    const DOMElements = {
        accountBtn: document.querySelector('.account'),
        modal: document.getElementById('login_modal'),
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        loginIdentifier: document.getElementById('loginIdentifier'),
        loginPassword: document.getElementById('loginPassword'),
        logoutBtn: document.getElementById('logoutBtn'),
        messageDiv: document.querySelector('#messageLogin') || document.querySelector('.message')
    };
    
    const ACCOUNTS = [
        { 
          username: 'admin', 
          email: 'admin@gmail.com', 
          password: 'admin123', 
          name: 'Quản Trị Viên', 
          role: 'admin' 
        },
        { 
          username: 'mai', 
          email: 'mai@gmail.com', 
          password: '123123', 
          name: 'Mai cute', 
          role: 'user' 
        }
    ];

    // ===================================
    // 2. HÀM HỖ TRỢ ĐIỀU KHIỂN MODAL
    // ===================================
    const { modal, loginForm, registerForm } = DOMElements;

    const showModal = (formType) => {
        if (!modal) return;
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        if (formType === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            DOMElements.loginIdentifier?.focus();
        } else if (formType === 'register') {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            document.getElementById('regUsername')?.focus();
        }
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        DOMElements.loginForm?.reset();
    };

    const showMessage = (msg, type, target = DOMElements.messageDiv) => {
        if (!target) return;
        target.textContent = msg;
        target.className = 'message';
        if (msg) target.classList.add(type);
    };

    // ===== Helper toàn cục cho file khác dùng (checkout.js, cart.js, ...) =====
    window.getCurrentUser = function () {
      try {
        return JSON.parse(localStorage.getItem('current_user') || 'null');
      } catch (e) {
        return null;
      }
    };

    window.openLoginModal = function () {
      try { 
        showModal('login'); 
      } catch (e) { /* no-op */ }
    };

    //-----------Hiện username---------------
    function displayUserName() {
        const nameDisplayElement = document.getElementById('accountLinkText');
        const accountContainer = nameDisplayElement?.closest('.account');
        
        if (!nameDisplayElement) return;

        const userJSON = localStorage.getItem('current_user');

        if (userJSON) {
            try {
                const user = JSON.parse(userJSON);
                nameDisplayElement.textContent = user.name || user.username; 
                accountContainer?.classList.add('logged-in'); 
            } catch (e) {
                console.error("Lỗi dữ liệu LocalStorage:", e);
                localStorage.removeItem('current_user');
                nameDisplayElement.textContent = 'Tài khoản';
                accountContainer?.classList.remove('logged-in');
            }
        } else {
            nameDisplayElement.textContent = 'Tài khoản';
            accountContainer?.classList.remove('logged-in');
        }
    } 
    displayUserName(); 

    // ===================================
    // 3. LOGIC ĐĂNG NHẬP
    // ===================================
    const handleLogin = (event) => {
        event.preventDefault();

        const identifier = DOMElements.loginIdentifier?.value.trim();
        const password   = DOMElements.loginPassword?.value.trim();
        showMessage('', ''); 

        if (!identifier || !password) {
            showMessage('Vui lòng điền đầy đủ thông tin.', 'error');
            return;
        }

        const user = ACCOUNTS.find(acc =>
            (acc.email === identifier || acc.username === identifier) && acc.password === password
        );

        if (user) {
            alert(`Chào mừng ${user.name || user.username}! Bạn đã đăng nhập thành công.`);

            // ⭐ Lưu thêm email để form checkout tự điền
            localStorage.setItem('current_user', JSON.stringify({ 
                username: user.username, 
                name: user.name,
                role: user.role,
                email: user.email || ''
            }));

            setTimeout(() => {
                closeModal();
                displayUserName(); 
                if (user.role === 'admin') {
                    window.location.href = '/admin/admin.html'; 
                } else {
                    window.location.reload(); 
                }
            }, 800);
        } else {
            showMessage('Email/Tên đăng nhập hoặc Mật khẩu không chính xác.', 'error');
        }
    };

    // ===================================
    // 4. ĐĂNG XUẤT
    // ===================================
    function handleLogout() {
        localStorage.removeItem('current_user'); 
        displayUserName(); 
        alert('Bạn sẽ đăng xuất!');
        window.location.href = '../../view/client.html';    
    }

    // ===================================
    // 5. GẮN CÁC SỰ KIỆN
    // ===================================
    DOMElements.accountBtn?.addEventListener('click', (e) => {
        e.preventDefault?.();
        showModal('login');
    });

    DOMElements.loginForm?.querySelector('.link a')?.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showModal('register'); 
    });

    DOMElements.registerForm?.querySelector('.link a')?.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showModal('login'); 
    });

    modal?.addEventListener('click', (e) => { 
        if (e.target === modal) closeModal(); 
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) closeModal();
    });

    DOMElements.loginForm?.addEventListener('submit', handleLogin);
    DOMElements.logoutBtn?.addEventListener('click', handleLogout);

    // ===================================
    // 6. LOGIC ĐĂNG KÝ
    // ===================================
    const handleRegister = (event) => {
        event.preventDefault();
        const registerMsgDiv = DOMElements.registerForm?.querySelector('.message');
        showMessage('', '', registerMsgDiv); 

        const username = document.getElementById('regUsername')?.value.trim();
        const email = document.getElementById('regEmail')?.value.trim();
        const password = document.getElementById('regPassword')?.value;
        const rePassword = document.getElementById('regRePassword')?.value;

        const newUser = {
            username: username,
            email: email,
            password: password,
            name: username, 
            role: 'user'
        };

        ACCOUNTS.push(newUser);
        console.log("Registered Accounts:", ACCOUNTS);

        showMessage('Đăng ký thành công! Đang chuyển đến Đăng nhập...', 'success', registerMsgDiv);
        DOMElements.registerForm.reset();

        setTimeout(() => {
            showModal('login');
            showMessage('', '');
            DOMElements.loginIdentifier.value = username;
        }, 1500);
    };

    DOMElements.registerForm?.addEventListener('submit', handleRegister);
});
