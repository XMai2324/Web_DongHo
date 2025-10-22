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
          role: 'user' }
    ];

    // ===================================
    // 2. HÀM HỖ TRỢ ĐIỀU KHIỂN MODAL
    // ===================================
    const { modal, loginForm, registerForm } = DOMElements;

    const showModal = (formType) => {
        if (!modal) return;
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Điều chỉnh hiển thị Form (Login/Register)
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
        DOMElements.loginForm?.reset(); // Reset form khi đóng
    };

    const showMessage = (msg, type, target = DOMElements.messageDiv) => {
        if (!target) return;
        target.textContent = msg;
        target.className = 'message'; // Reset classes
        if (msg) target.classList.add(type);
    };



  
//-----------Hiện username---------------
    function displayUserName() {
        // ID khớp với <span id="accountLinkText">Tài khoản</span>
        const nameDisplayElement = document.getElementById('accountLinkText');
        const accountContainer = nameDisplayElement?.closest('.account');
        
        if (!nameDisplayElement) return;

        // 2. Lấy thông tin người dùng từ LocalStorage
        const userJSON = localStorage.getItem('current_user');

        if (userJSON) {
            try {
                const user = JSON.parse(userJSON);
                
                // ⭐ SỬA LỖI: Dùng user.name HOẶC user.username để đảm bảo không bị rỗng
                nameDisplayElement.textContent = user.name || user.username; 
                
                // Thêm class logged-in
                accountContainer?.classList.add('logged-in'); 

            } catch (e) {
                console.error("Lỗi dữ liệu LocalStorage:", e);
                localStorage.removeItem('current_user');
                
                // Nếu lỗi, reset về trạng thái chưa đăng nhập
                nameDisplayElement.textContent = 'Tài khoản';
                accountContainer?.classList.remove('logged-in');
            }
        } else {
            // Trạng thái chưa đăng nhập
            nameDisplayElement.textContent = 'Tài khoản';
            accountContainer?.classList.remove('logged-in');
        }
    } 

    // Gọi hàm ngay lập tức khi JavaScript được tải
    displayUserName(); 


    // ===================================
    // 3. LOGIC ĐĂNG NHẬP (HANDLE LOGIN) - Đã sửa lỗi chuyển hướng
    // ===================================

    const handleLogin = (event) => {
        event.preventDefault();
        console.log("--- Bắt đầu xử lý đăng ký ---"); // DÒNG NÀY CẦN XUẤT HIỆN TRONG CONSOLE

        const identifier = DOMElements.loginIdentifier?.value.trim();
        const password   = DOMElements.loginPassword?.value.trim();

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

            // ⭐ ĐẢM BẢO LƯU name và role (nếu có)
            localStorage.setItem('current_user', JSON.stringify({ 
                username: user.username, 
                name: user.name,
                role: user.role 
            }));

            // Xử lý chuyển hướng sau 0.8 giây
            setTimeout(() => {
                closeModal();
                
                // Cập nhật tên hiển thị trên UI TRƯỚC KHI chuyển hướng
                displayUserName(); 
                
                if (user.role === 'admin') {
                    // Admin: CHUYỂN HƯỚNG SANG TRANG MỚI
                    window.location.href = '/admin/admin.html'; 
                } else {
                    // User: Tải lại trang hiện tại để cập nhật toàn bộ giao diện
                    // LƯU Ý: Nếu trang đích là trang khác, dùng window.location.href
                    window.location.reload(); 
                }
            }, 800);
        } else {
            showMessage('Email/Tên đăng nhập hoặc Mật khẩu không chính xác.', 'error');
        }
    };



    /**
 * Xử lý đăng xuất: Xóa phiên, cập nhật UI và tải lại trang.
 */
    function handleLogout() {
        localStorage.removeItem('current_user'); 
   
        displayUserName(); 

        alert('Bạn sẽ đăng xuất ??.');
        window.location.href = '../../view/client.html';    }

    // ===================================
    // 4. GẮN CÁC SỰ KIỆN (TRIGGERS)
    // ===================================
    
    // Mở Modal (Login)
    DOMElements.accountBtn?.addEventListener('click', (e) => {
        e.preventDefault?.();
        showModal('login');
    });

    // Chuyển tab Login <-> Register
    DOMElements.loginForm?.querySelector('.link a')?.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showModal('register'); 
    });

    DOMElements.registerForm?.querySelector('.link a')?.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showModal('login'); 
    });

    // Đóng Modal (Click nền tối hoặc ESC)
    modal?.addEventListener('click', (e) => { 
        if (e.target === modal) closeModal(); 
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) closeModal();
    });

    // Gắn xử lý Đăng nhập
    DOMElements.loginForm?.addEventListener('submit', handleLogin);

    // Gắn xử lý Đăng xuất
    DOMElements.logoutBtn?.addEventListener('click', handleLogout);




    // ===================================
    // 5. LOGIC ĐĂNG KÝ (HANDLE REGISTER)
    // ===================================
    const handleRegister = (event) => {
        event.preventDefault();
        
        // Lấy Message Div của Form Đăng ký (nó có class .message trong HTML bạn cung cấp)
        const registerMsgDiv = DOMElements.registerForm?.querySelector('.message');
        showMessage('', '', registerMsgDiv); 

        const username = document.getElementById('regUsername')?.value.trim();
        const email = document.getElementById('regEmail')?.value.trim();
        const password = document.getElementById('regPassword')?.value;
        const rePassword = document.getElementById('regRePassword')?.value;
        
        // // 1. Validate Form
        // if (!validateRegisterForm(username, email, password, rePassword)) {
        //     showMessage('Vui lòng kiểm tra lại thông tin đăng ký.', 'error', registerMsgDiv);
        //     return;
        // }

        // 2. Đăng ký thành công (Trong môi trường demo, thêm vào mảng)
        const newUser = {
            username: username,
            email: email,
            password: password,
            name: username, // Lấy username làm tên hiển thị
            role: 'user'
        };

        ACCOUNTS.push(newUser); // ⭐ THÊM USER MỚI VÀO MẢNG ACCOUNTS
        console.log("Registered Accounts:", ACCOUNTS);

        // 3. Thông báo và chuyển hướng
        showMessage('Đăng ký thành công! Đang chuyển đến Đăng nhập...', 'success', registerMsgDiv);
        
        DOMElements.registerForm.reset();

        setTimeout(() => {
            // Chuyển sang Form Đăng nhập
            showModal('login');
            showMessage('', ''); // Xóa thông báo trên form Đăng nhập
            DOMElements.loginIdentifier.value = username; // Điền sẵn username
        }, 1500);

    };



    // ...
    // Gắn xử lý Đăng nhập
    DOMElements.loginForm?.addEventListener('submit', handleLogin);

    // ⭐ GẮN XỬ LÝ ĐĂNG KÝ
    DOMElements.registerForm?.addEventListener('submit', handleRegister);

    // Gắn xử lý Đăng xuất
    DOMElements.logoutBtn?.addEventListener('click', handleLogout);
});

