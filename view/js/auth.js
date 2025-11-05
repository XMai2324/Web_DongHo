document.addEventListener('DOMContentLoaded', () => {
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
  };

  const LS_ACCOUNTS = 'accounts';
  const LS_CURRENT = 'current_user';

  const DEFAULT_ACCOUNTS = [
    { username: 'admin', email: 'admin@gmail.com', password: 'admin123', name: 'Quản Trị Viên', role: 'admin' },
    { username: 'mai', email: 'mai@gmail.com', password: '123123', name: 'Mai cute', role: 'user' },
  ];

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
  const setSession = (u) => localStorage.setItem(LS_CURRENT, JSON.stringify(u));

  const showModal = (formType) => {
    document.getElementById('profileSection')?.classList.remove('open');
    document.documentElement.style.overflow = '';

    const modal = DOM.modal;
    if (!modal) return;

    modal.classList.add('show');
    document.body.classList.add('modal-open');
    if (formType === 'login') {
      DOM.loginForm.style.display = 'block';
      DOM.registerForm.style.display = 'none';
      DOM.loginIdentifier?.focus();
    } else {
      DOM.loginForm.style.display = 'none';
      DOM.registerForm.style.display = 'block';
      document.getElementById('regUsername')?.focus();
    }
  };

  const closeModal = () => {
    const modal = DOM.modal;
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    DOM.loginForm?.reset();
  };

  const showMessage = (msg, type, target = DOM.messageDiv) => {
    if (!target) return;
    target.textContent = msg;
    target.className = 'message';
    if (msg) target.classList.add(type);
  };

  function displayUserName() {
    const el = DOM.accountLinkText;
    const container = el?.closest('.account');
    if (!el) return;

    const userJSON = localStorage.getItem(LS_CURRENT);
    if (userJSON) {
      try {
        const user = JSON.parse(userJSON);
        el.textContent = user.name || user.username;
        container?.classList.add('logged-in');
      } catch (e) {
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

  const handleLogin = (event) => {
    event.preventDefault();
    showMessage('', '');

    const identifier = DOM.loginIdentifier?.value.trim();
    const password = DOM.loginPassword?.value.trim();
    if (!identifier || !password) {
      showMessage('Vui lòng điền đầy đủ thông tin.', 'error');
      return;
    }

    const user = ACCOUNTS.find(
      (acc) => (acc.email === identifier || acc.username === identifier) && acc.password === password
    );

    if (user) {
      alert(`Chào mừng ${user.name || user.username}!`);
      setSession({
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
      });
      setTimeout(() => {
        closeModal();
        displayUserName();
        if (user.role === 'admin') {
          window.location.href = '/admin/admin.html';
        } else {
          window.location.reload();
        }
      }, 400);
    } else {
      showMessage('Email/Tên đăng nhập hoặc Mật khẩu không chính xác.', 'error');
    }
  };

  function handleLogout() {
    localStorage.removeItem(LS_CURRENT);
    displayUserName();
    document.getElementById('profileSection')?.classList.remove('open');
    document.documentElement.style.overflow = '';
    alert('Bạn đã đăng xuất!');
    window.location.href = '/view/client.html';
  }

  const handleRegister = (event) => {
    event.preventDefault();

    const msgDiv = DOM.registerForm?.querySelector('.message');
    showMessage('', '', msgDiv);
    const username = document.getElementById('regUsername')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
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
    DOM.registerForm.reset();

    setTimeout(() => {
      showModal('login');
      showMessage('', '');
      if (DOM.loginIdentifier) DOM.loginIdentifier.value = username;
    }, 1200);
  };

  /* ===============================
   * EVENT HANDLERS
   * =============================== */
  DOM.accountBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const session = (() => {
      try {
        return JSON.parse(localStorage.getItem(LS_CURRENT));
      } catch {
        return null;
      }
    })();
    const profile = document.getElementById('profileSection');

    if (session) {
      DOM.modal?.classList.remove('show');
      profile?.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
    } else {
      profile?.classList.remove('open');
      document.documentElement.style.overflow = '';
      showModal('login');
    }
  });




  DOM.logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogout();
  });

  DOM.loginForm?.addEventListener('submit', handleLogin);
  DOM.registerForm?.addEventListener('submit', handleRegister);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.modal?.classList.contains('show')) closeModal();
  });

  // === Toggle giữa Login <-> Register ===
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

    // === Click ra ngoài để đóng modal ===
    // Giả định #login_modal là lớp phủ (overlay) bọc hai form
    DOM.modal?.addEventListener('click', (e) => {
    // chỉ đóng khi click đúng nền ngoài form
    if (e.target === DOM.modal) {
        closeModal();
    }
    });

    // (tuỳ chọn) đảm bảo mặc định mở ra là màn hình đăng nhập
    if (DOM.modal && !DOM.modal.classList.contains('show')) {
    // Ẩn form đăng ký ngay từ đầu
    if (DOM.registerForm) DOM.registerForm.style.display = 'none';
    }

});
