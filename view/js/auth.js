document.addEventListener('DOMContentLoaded', () => {
  // ===============================
  // HẰNG SỐ & PHẦN TỬ DOM
  // ===============================
  const LS_ACCOUNTS = 'accounts';
  const LS_CURRENT = 'current_user';

  const DOM = {
    accountBtn: document.querySelector('.account'),
    modal: document.getElementById('login_modal'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginIdentifier: document.getElementById('loginIdentifier'),
    loginPassword: document.getElementById('loginPassword'),
    logoutBtn: document.getElementById('logoutBtn'),
    messageDiv: document.querySelector('#messageLogin') || document.querySelector('.message'),
    accountLinkText: document.getElementById('accountLinkText'),
    profileSection: document.getElementById('profileSection'),
  };

  const DEFAULT_ACCOUNTS = [
    { username: 'admin', email: 'admin@gmail.com', password: 'admin123', name: 'Quản Trị Viên', role: 'admin' },
    { username: 'mai',   email: 'mai@gmail.com',   password: '123123',   name: 'Mai cute',       role: 'user'  },
  ];

  // ===============================
  // KHỞI TẠO TÀI KHOẢN TỪ localStorage (nếu chưa có)
  // ===============================
  let ACCOUNTS = [];
  try {
    const saved = JSON.parse(localStorage.getItem(LS_ACCOUNTS));
    ACCOUNTS = Array.isArray(saved) && saved.length ? saved : DEFAULT_ACCOUNTS;
  } catch {
    ACCOUNTS = DEFAULT_ACCOUNTS;
  }
  if (!localStorage.getItem(LS_ACCOUNTS)) {
    localStorage.setItem(LS_ACCOUNTS, JSON.stringify(ACCOUNTS));
  }

  const setAccounts = (arr) => localStorage.setItem(LS_ACCOUNTS, JSON.stringify(arr));
  const setSession  = (u)   => localStorage.setItem(LS_CURRENT, JSON.stringify(u));

  // ===============================
  // HÀM TIỆN ÍCH
  // ===============================
  const showMessage = (msg, type, target = DOM.messageDiv) => {
    if (!target) return;
    target.textContent = msg || '';
    target.className = 'message';
    if (msg) target.classList.add(type); // 'error' | 'success' | ...
  };

  const showModal = (formType = 'login') => {
    // đóng profile nếu đang mở
    DOM.profileSection?.classList.remove('open');
    document.documentElement.style.overflow = '';

    const modal = DOM.modal;
    if (!modal) return;

    modal.classList.add('show');
    document.body.classList.add('modal-open');

    if (formType === 'login') {
      if (DOM.loginForm) DOM.loginForm.style.display = 'block';
      if (DOM.registerForm) DOM.registerForm.style.display = 'none';
      DOM.loginIdentifier?.focus();
    } else {
      if (DOM.loginForm) DOM.loginForm.style.display = 'none';
      if (DOM.registerForm) DOM.registerForm.style.display = 'block';
      document.getElementById('regUsername')?.focus();
    }
  };

  const closeModal = () => {
    const modal = DOM.modal;
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    DOM.loginForm?.reset();
    // Không xoá thông báo đăng ký vì có thể đang ở form khác
  };

  function displayUserName() {
    const el = DOM.accountLinkText;
    const container = el?.closest('.account');
    if (!el) return;

    const userJSON = localStorage.getItem(LS_CURRENT);
    if (userJSON) {
      try {
        const user = JSON.parse(userJSON);
        el.textContent = user.name || user.username || 'Tài khoản';
        container?.classList.add('logged-in');
      } catch {
        localStorage.removeItem(LS_CURRENT);
        el.textContent = 'Tài khoản';
        container?.classList.remove('logged-in');
      }
    } else {
      el.textContent = 'Tài khoản';
      container?.classList.remove('logged-in');
    }
  }

  displayUserName();
  // Helper toàn cục cho file khác dùng (checkout.js, cart.js, ...)
  window.getCurrentUser = function () {
    try {
      return JSON.parse(localStorage.getItem(LS_CURRENT) || 'null');
    } catch {
      return null;
    }
  };
  window.openLoginModal = function () {
    try { showModal('login'); } catch { /* no-op */ }
  };

  displayUserName();

  // ===============================
  // ĐĂNG NHẬP
  // ===============================
  const handleLogin = (event) => {
    event.preventDefault();
    showMessage('', '');

    const identifier = DOM.loginIdentifier?.value.trim();
    const password   = DOM.loginPassword?.value.trim();

    if (!identifier || !password) {
      showMessage('Vui lòng điền đầy đủ thông tin.', 'error');
      return;
    }

    const user = ACCOUNTS.find(
      (acc) => (acc.email === identifier || acc.username === identifier) && acc.password === password
    );

    if (user) {

      if (user.status === 'disabled') {
            // Hiển thị lỗi và DỪNG quá trình đăng nhập
            showMessage('Tài khoản của bạn đã bị vô hiệu hóa.', 'error');
            return; // Quan trọng: Dừng hàm tại đây, không set session
        }

      alert(`Chào mừng ${user.name || user.username}!`);
      setSession({
        username: user.username,
        name: user.name || user.username,
        role: user.role,
        email: user.email || '',
      });

      setTimeout(() => {
        closeModal();
        displayUserName();
        if (user.status === 'disabled') {
          showMessage(messageDiv, 'vô hiệu hóa', 'error');
          return;
        }
        // if (user.role === 'admin') {
        //   window.location.href = '/admin/admin.html';
        // } else {
        //   // Tải lại trang để đồng bộ UI (nếu cần)
        //   window.location.reload();
        // }

        const isAdminPage = location.pathname.includes("/admin/");

        if (user.role === "admin") {
          if (isAdminPage) {
            // Nếu đang ở trang admin (dán link) → reload để ẩn form login
            location.reload();
          } else {
            // Nếu login từ trang user → chuyển vào admin
            location.href = "/admin/admin.html";
          }
        } else {
          // Nếu user login mà đang ở trang admin → chặn
          if (isAdminPage) {
            alert("Bạn không có quyền vào trang quản trị!");
            return;
          } else {
            // login bình thường
            location.reload();
          }
        }


      }, 400);
    } else {
      showMessage('Email/Tên đăng nhập hoặc Mật khẩu không chính xác.', 'error');
    }
  };

  // ===============================
  // ĐĂNG XUẤT
  // ===============================
  function handleLogout() {
    localStorage.removeItem(LS_CURRENT);
    displayUserName();
    DOM.profileSection?.classList.remove('open');
    document.documentElement.style.overflow = '';
    alert('Bạn đã đăng xuất!');
    window.location.href = '/view/client.html';

  }

  // ===============================
  // ĐĂNG KÝ
  // ===============================
  const handleRegister = (event) => {
    event.preventDefault();

    const msgDiv = DOM.registerForm?.querySelector('.message');
    showMessage('', '', msgDiv);

    const username   = document.getElementById('regUsername')?.value.trim();
    const email      = document.getElementById('regEmail')?.value.trim();
    const password   = document.getElementById('regPassword')?.value;
    const rePassword = document.getElementById('regRePassword')?.value;

    if (!username || !email || !password || !rePassword) {
      showMessage('Vui lòng điền đầy đủ thông tin.', 'error', msgDiv);
      return;
    }
    if (password !== rePassword) {
      showMessage('Mật khẩu nhập lại không khớp.', 'error', msgDiv);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage('Email không hợp lệ.', 'error', msgDiv);
      return;
    }
    if (ACCOUNTS.some((u) => u.username === username)) {
      showMessage('Tên đăng nhập đã tồn tại.', 'error', msgDiv);
      return;
    }
    if (ACCOUNTS.some((u) => u.email === email)) {
      showMessage('Email đã được sử dụng.', 'error', msgDiv);
      return;
    }

    const newUser = { username, email, password, name: username, role: 'user' };
    ACCOUNTS.push(newUser);
    setAccounts(ACCOUNTS);

    showMessage('Đăng ký thành công! Đang chuyển đến Đăng nhập...', 'success', msgDiv);
    DOM.registerForm?.reset();

    setTimeout(() => {
      showModal('login');
      showMessage('', '');
      if (DOM.loginIdentifier) DOM.loginIdentifier.value = username;
    }, 1200);
  };

  // ===============================
  // GẮN SỰ KIỆN
  // ===============================
  // Click vào .account: nếu đã đăng nhập -> mở profile; chưa -> mở modal login
  DOM.accountBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let session = null;
    try { session = JSON.parse(localStorage.getItem(LS_CURRENT)); } catch { session = null; }

    if (session) {
      DOM.modal?.classList.remove('show');
      DOM.profileSection?.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
    } else {
      DOM.profileSection?.classList.remove('open');
      document.documentElement.style.overflow = '';
      showModal('login');
    }
  });

  // Đăng xuất
  DOM.logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogout();
  });

  // Submit login/register
  DOM.loginForm?.addEventListener('submit', handleLogin);
  DOM.registerForm?.addEventListener('submit', handleRegister);

  // Toggle giữa Login <-> Register qua link ở form
  const linkToRegister = DOM.loginForm?.querySelector('.link a');
  linkToRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    showModal('register');
  });

  const linkToLogin = DOM.registerForm?.querySelector('.link a');
  linkToLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    showModal('login');
  });

  // Click overlay để đóng modal
  DOM.modal?.addEventListener('click', (e) => {
    if (e.target === DOM.modal) closeModal();
  });

  // ESC để đóng modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.modal?.classList.contains('show')) closeModal();
  });

  // Ẩn form đăng ký lúc khởi tạo (nếu có modal)
  if (DOM.modal && !DOM.modal.classList.contains('show')) {
    if (DOM.registerForm) DOM.registerForm.style.display = 'none';
  }
});


// ========== KIỂM TRA QUYỀN TRUY CẬP TRANG ADMIN ==========
document.addEventListener("DOMContentLoaded", () => {
  // ĐỌC ĐÚNG KEY PHIÊN
  const currentUser = JSON.parse(localStorage.getItem("current_user") || "null");
  const isAdminPage = location.pathname.includes("/admin/");

  if (!isAdminPage) return;

  if (!currentUser) {
    // Chưa đăng nhập → mở form login theo đúng cơ chế showModal
    if (typeof showModal === "function") {
      showModal("login");
    } else {
      // fallback nếu chưa có showModal
      const m = document.getElementById("login_modal");
      if (m) m.classList.add("show");
    }
    console.warn("⚠️ Chưa đăng nhập → bật form login");
    return;
  }

  if (currentUser.role !== "admin") {
    alert("Tài khoản của bạn không có quyền truy cập trang quản trị! Vui lòng đăng nhập bằng tài khoản Admin.");
    window.location.href = "/view/client.html";
    return;
  }

  console.log("✅ Admin đăng nhập, vào trang quản trị");
});

