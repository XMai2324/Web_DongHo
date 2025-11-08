/* ==========================================================
   auth.js (đã chỉnh sửa & hợp nhất)
   - Quản lý đăng nhập/đăng ký/đăng xuất cho client & admin.
   - Nếu vào trang admin mà chưa đăng nhập admin → bật form login.
   - Nếu login user thường ngay tại trang admin → chặn & yêu cầu admin.
   - Dùng localStorage (demo offline) với 2 key: 'accounts' & 'current_user'.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // =============================== CẤU HÌNH & DOM ===============================
  const LS_ACCOUNTS = 'accounts';
  const LS_CURRENT  = 'current_user';
  const ADMIN_TARGET = '/admin/admin.html'; // sửa nếu admin của bạn là /admin.html

  const DOM = {
    accountBtn:      document.querySelector('.account'),
    modal:           document.getElementById('login_modal'),
    loginForm:       document.getElementById('loginForm'),
    registerForm:    document.getElementById('registerForm'),
    loginIdentifier: document.getElementById('loginIdentifier'),
    loginPassword:   document.getElementById('loginPassword'),
    logoutBtn:       document.getElementById('logout-btn'),
    messageLogin:    document.getElementById('messageLogin') || document.querySelector('#loginForm .message'),
    registerMsg:     document.querySelector('#registerForm .message'),
    accountLinkText: document.getElementById('accountLinkText'),
    profileSection:  document.getElementById('profileSection'),
  };

  const DEFAULT_ACCOUNTS = [
    { username: 'admin', email: 'admin@gmail.com', password: 'admin123', name: 'Quản Trị Viên', role: 'admin' },
    { username: 'mai',   email: 'mai@gmail.com',   password: '123123',   name: 'Mai cute',       role: 'user'  },
  ];

  // =============================== KHỞI TẠO ACCOUNTS ===============================
  let ACCOUNTS;
  try {
    const saved = JSON.parse(localStorage.getItem(LS_ACCOUNTS));
    ACCOUNTS = Array.isArray(saved) && saved.length ? saved : DEFAULT_ACCOUNTS;
  } catch { ACCOUNTS = DEFAULT_ACCOUNTS; }
  if (!localStorage.getItem(LS_ACCOUNTS)) {
    localStorage.setItem(LS_ACCOUNTS, JSON.stringify(ACCOUNTS));
  }

  // =============================== TIỆN ÍCH LƯU TRỮ ===============================
  const setAccounts = (arr) => localStorage.setItem(LS_ACCOUNTS, JSON.stringify(arr || []));
  const setSession  = (u)   => localStorage.setItem(LS_CURRENT, JSON.stringify(u || null));
  const getSession  = () => {
    try { return JSON.parse(localStorage.getItem(LS_CURRENT) || 'null'); }
    catch { return null; }
  };

  // =============================== UI HELPERS ===============================
  const showMessage = (target, msg, type) => {
    if (!target) return;
    target.textContent = msg || '';
    target.className = 'message';
    if (msg && type) target.classList.add(type); // 'error' | 'success'
  };

  const showModal = (formType = 'login') => {
    // đóng profile nếu đang mở
    DOM.profileSection?.classList.remove('open');
    document.documentElement.style.overflow = '';

    const modal = DOM.modal;
    if (!modal) return;

    modal.classList.add('show');
    document.body.classList.add('modal-open');

    const toLogin = formType === 'login';
    if (DOM.loginForm)    DOM.loginForm.style.display    = toLogin ? 'block' : 'none';
    if (DOM.registerForm) DOM.registerForm.style.display = toLogin ? 'none'  : 'block';

    if (toLogin) DOM.loginIdentifier?.focus();
    else document.getElementById('regUsername')?.focus();
  };

  const closeModal = () => {
    const modal = DOM.modal;
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    DOM.loginForm?.reset();
  };

  // expose cho file khác (checkout.js, cart.js, …) nếu có dùng
  window.getCurrentUser   = getSession;
  window.openLoginModal   = () => showModal('login');
  window.ttShowLoginModal = showModal;

  // =============================== RENDER TÊN & NÚT ĐĂNG XUẤT ===============================
  function renderUserState() {
    const link = DOM.accountLinkText;
    const btn  = DOM.logoutBtn;
    if (!link || !btn) return;

    const u = getSession();
    if (u && u.username) {
      link.textContent = u.name || u.username;
      link.href = '#profile';
      btn.style.display = 'flex';
    } else {
      link.textContent = 'Tài khoản';
      link.href = '#login';
      btn.style.display = 'none';
    }
  }
  renderUserState();

  // =============================== AUTH CORE (FIND / VERIFY / CREATE) ===============================
  const findByIdentifier = (id) => {
    const ident = (id || '').trim().toLowerCase();
    return ACCOUNTS.find(acc =>
      acc.email?.toLowerCase() === ident || acc.username?.toLowerCase() === ident
    ) || null;
  };

  const verifyLogin = (identifier, password) => {
    const u = findByIdentifier(identifier);
    if (!u || u.password !== password) return null;
    if (u.status === 'disabled') return { ...u, _disabled: true };
    return u;
  };

  const createUser = ({ username, email, password }) => {
    if (!username || !email || !password) throw new Error('Thiếu thông tin');
    if (findByIdentifier(email) || findByIdentifier(username)) throw new Error('Tài khoản đã tồn tại');
    const u = { username, email, password, name: username, role: 'user' };
    ACCOUNTS.push(u);
    setAccounts(ACCOUNTS);
    return u;
    // thực tế: gọi API /register
  };

  // =============================== LOGIN HANDLER ===============================
  const handleLogin = (e) => {
    e.preventDefault();
    showMessage(DOM.messageLogin, '');

    const identifier = DOM.loginIdentifier?.value.trim();
    const password   = DOM.loginPassword?.value.trim();
    if (!identifier || !password) {
      showMessage(DOM.messageLogin, 'Vui lòng điền đầy đủ thông tin.', 'error');
      return;
    }

    const user = verifyLogin(identifier, password);
    if (!user) {
      showMessage(DOM.messageLogin, 'Email/Tên đăng nhập hoặc Mật khẩu không chính xác.', 'error');
      return;
    }
    if (user._disabled) {
      showMessage(DOM.messageLogin, 'Tài khoản của bạn đã bị vô hiệu hóa.', 'error');
      return;
    }

    setSession({
      id: user.username,
      username: user.username,
      name: user.name || user.username,
      role: user.role,
      email: user.email || '',
    });

    // Điều hướng theo quyền:
   // Điều hướng theo quyền:
// Điều hướng theo quyền:
    const onAdminPage = isAdminPage();

    if (user.role === 'admin') {
      if (onAdminPage) {
        // Đăng nhập admin ngay tại trang admin → cho vào
        closeModal();
        renderUserState();
        location.reload();
      } else {
        // ⛔️ Đăng nhập admin tại trang client → KHÔNG cho phép
        showMessage(DOM.messageLogin, 'Vui lòng đăng nhập bằng tài khoản KHÁCH HÀNG trên trang này.', 'error');
        // Không set session admin ở client page
        setSession(null);
      }
    } else {
      // user thường (khách hàng)
      if (onAdminPage) {
        // ⛔️ User thường không có quyền vào admin
        showMessage(DOM.messageLogin, 'Tài khoản này không có quyền Admin.', 'error');
        return;
      }
      // Client page: cho đăng nhập khách hàng bình thường
      closeModal();
      renderUserState();
      location.reload();
    }


  };

  function displayUserName() {
    const accountLink = DOM.accountLinkText; // Đã sửa ở Bước 2
    const logoutBtn = DOM.logoutBtn;
    if (!accountLink || !logoutBtn) return;
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem(LS_CURRENT));
    } catch {
        user = null;
    }

    if (user && user.username) {
        accountLink.textContent = user.name || user.username;
        accountLink.href = '#profile';
        logoutBtn.style.display = 'flex'; 
    } else {
        accountLink.textContent = 'Tài khoản';
        accountLink.href = '#login'; // Hoặc href="#" tùy ý
        logoutBtn.style.display = 'none';
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

  // =============================== LOGOUT HANDLER ===============================
  function handleLogout() {
    // Xóa session
    localStorage.removeItem(LS_CURRENT);
    // Xóa giỏ hàng (nếu có logic dùng các key này)
    localStorage.removeItem('tt_cart');
    localStorage.removeItem('cart:guest');
    if (window.ttUpdateCartBadge) window.ttUpdateCartBadge();

    renderUserState();
    DOM.profileSection?.classList.remove('open');
    document.documentElement.style.overflow = '';

    alert('Bạn đã đăng xuất!');
    // Nếu đang ở admin thì về client để tránh auto hiện modal liên tục
    if (isAdminPage()) window.location.href = '/view/client.html';
    else window.location.reload();
  }
  window.ttLogout = handleLogout;

  // =============================== REGISTER HANDLER ===============================
  const handleRegister = (e) => {
    e.preventDefault();
    showMessage(DOM.registerMsg, '');

    const username   = document.getElementById('regUsername')?.value.trim();
    const email      = document.getElementById('regEmail')?.value.trim();
    const password   = document.getElementById('regPassword')?.value;
    const rePassword = document.getElementById('regRePassword')?.value;

    if (!username || !email || !password || !rePassword) {
      showMessage(DOM.registerMsg, 'Vui lòng điền đầy đủ thông tin.', 'error');
      return;
    }
    if (password !== rePassword) {
      showMessage(DOM.registerMsg, 'Mật khẩu nhập lại không khớp.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage(DOM.registerMsg, 'Email không hợp lệ.', 'error');
      return;
    }
    try {
      const u = createUser({ username, email, password });
      showMessage(DOM.registerMsg, 'Đăng ký thành công! Đang chuyển đến Đăng nhập…', 'success');
      DOM.registerForm?.reset();
      setTimeout(() => {
        showModal('login');
        showMessage(DOM.messageLogin, '');
        if (DOM.loginIdentifier) DOM.loginIdentifier.value = u.username;
      }, 900);
    } catch (err) {
      showMessage(DOM.registerMsg, err?.message || 'Không tạo được tài khoản.', 'error');
    }
  };

  // =============================== GẮN SỰ KIỆN UI ===============================
  // Nút tài khoản: đã đăng nhập → mở profile; chưa → mở modal login
  DOM.accountBtn?.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    const session = getSession();
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
    e.preventDefault(); e.stopPropagation();
    handleLogout();
  });

  // Submit login/register
  DOM.loginForm?.addEventListener('submit', handleLogin);
  DOM.registerForm?.addEventListener('submit', handleRegister);

  // Toggle Login <-> Register
  DOM.loginForm?.querySelector('.link a')?.addEventListener('click', (e) => {
    e.preventDefault(); showModal('register');
  });
  DOM.registerForm?.querySelector('.link a')?.addEventListener('click', (e) => {
    e.preventDefault(); showModal('login');
  });

  // Click overlay -> chỉ đóng ở trang client; TRANG ADMIN THÌ KHÔNG
  DOM.modal?.addEventListener('click', (e) => {
    if (e.target !== DOM.modal) return;        // chỉ xử lý khi click đúng overlay
    if (isAdminPage()) {                       // ở admin -> KHÔNG đóng
      e.stopImmediatePropagation();            // chặn các listener khác trên cùng element
      return;
    }
    closeModal();                              // ở client -> cho phép đóng
  });

  // ESC để đóng modal
  // ESC -> chỉ cho phép đóng ở client; TRANG ADMIN THÌ KHÔNG
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!DOM.modal?.classList.contains('show')) return;

    if (isAdminPage()) {
      e.preventDefault(); // chặn ESC ở admin
      return;
    }
    closeModal();         // client -> cho phép đóng
  });


  // Ẩn form đăng ký lúc khởi tạo (nếu có modal)
  if (DOM.modal && !DOM.modal.classList.contains('show')) {
    if (DOM.registerForm) DOM.registerForm.style.display = 'none';
  }

  // =============================== GUARD TRANG ADMIN ===============================
  ensureAdminGuard();

  function ensureAdminGuard() {
    if (!isAdminPage()) return;
    const currentUser = getSession();
    if (!currentUser) {
      // Chưa đăng nhập → bật modal login
      showModal('login');
      showMessage(DOM.messageLogin, 'Vui lòng đăng nhập để vào trang quản trị.');
      return;
    }
    if (currentUser.role !== 'admin') {
      // Đang đăng nhập user thường → chặn
      showModal('login');
      showMessage(DOM.messageLogin, 'Tài khoản hiện tại không có quyền Admin.', 'error');
      return;
    }
    // Admin hợp lệ → cho vào bình thường
  }

  function isAdminPage() {
    const p = location.pathname;
    return p.includes('/admin/') || p.endsWith('/admin.html') || p.endsWith('admin.html');
  }
});

// Nút HỦY trong form login admin -> quay về trang client
document.addEventListener('DOMContentLoaded', () => {
  const cancelBtn = document.getElementById('huyBtn');
  const isAdminPage = location.pathname.includes('/admin/') || location.pathname.endsWith('admin.html');

  if (isAdminPage && cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/view/client.html'; // đường dẫn tới trang client của bạn
    });
  }
});






