document.addEventListener('DOMContentLoaded', () => {
  const LS_ACCOUNTS = 'accounts';
  const LS_CURRENT = 'current_user';

  const getSession = () => JSON.parse(localStorage.getItem(LS_CURRENT) || 'null');
  const setSession = (u) => localStorage.setItem(LS_CURRENT, JSON.stringify(u));
  const getAccounts = () => JSON.parse(localStorage.getItem(LS_ACCOUNTS) || '[]');
  const setAccounts = (arr) => localStorage.setItem(LS_ACCOUNTS, JSON.stringify(arr));

  const section = document.getElementById('profileSection');
  const unameText = document.getElementById('usernameText');
  const nameEl = document.getElementById('profileName');
  const emailEl = document.getElementById('profileEmail');
  const userEl = document.getElementById('profileUsername');
  const roleEl = document.getElementById('profileRole');
  const roleBadge = document.getElementById('profileRoleBadge');
  const saveBtn = document.getElementById('saveProfile');
  const logoutBtn = document.getElementById('logoutProfile');
  const msg = document.getElementById('profileMsg');
  const oldPass = document.getElementById('oldPass');
  const newPass = document.getElementById('newPass');
  const reNewPass = document.getElementById('reNewPass');
  const passBtn = document.getElementById('changePass');
  const passMsg = document.getElementById('passMsg');

  const setToast = (el, text, type) => {
    el.textContent = text || '';
    el.className = 'toast' + (type ? ' ' + type : '');
    if (text) setTimeout(() => (el.textContent = ''), 3000);
  };

  const openProfile = () => {
    const session = getSession();
    if (!session) return alert('Bạn cần đăng nhập trước!');
    const acc = getAccounts().find(a => a.username === session.username);

    nameEl.value = acc?.name || session.name || '';
    emailEl.value = acc?.email || session.email || '';
    userEl.value = session.username;
    roleEl.value = session.role;
    roleBadge.textContent = session.role;

    unameText.textContent = nameEl.value || session.username;
    section.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
  };

  const closeProfile = () => {
    section.classList.remove('open');
    document.documentElement.style.overflow = '';
  };

  document.getElementById('profileClose')?.addEventListener('click', closeProfile);
  document.getElementById('profileBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'profileBackdrop') closeProfile();
  });

  saveBtn.addEventListener('click', () => {
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    if (!name) return setToast(msg, 'Tên không được để trống.', 'error');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setToast(msg, 'Email không hợp lệ.', 'error');

    const session = getSession();
    const accounts = getAccounts();
    const idx = accounts.findIndex(a => a.username === session.username);
    if (idx >= 0) {
      accounts[idx].name = name;
      accounts[idx].email = email;
    }
    setAccounts(accounts);
    session.name = name;
    session.email = email;
    setSession(session);
    setToast(msg, 'Đã lưu thay đổi.', 'success');
    document.getElementById('accountLinkText').textContent = name || session.username;
  });

  passBtn.addEventListener('click', () => {
    const oldP = oldPass.value, newP = newPass.value, reP = reNewPass.value;
    if (!oldP || !newP || !reP) return setToast(passMsg, 'Điền đủ 3 trường.', 'error');
    if (newP.length < 6) return setToast(passMsg, 'Mật khẩu ≥ 6 ký tự.', 'error');
    if (newP !== reP) return setToast(passMsg, 'Mật khẩu không khớp.', 'error');

    const session = getSession();
    const accounts = getAccounts();
    const idx = accounts.findIndex(a => a.username === session.username);
    if (idx < 0) return setToast(passMsg, 'Không tìm thấy tài khoản.', 'error');
    if (accounts[idx].password !== oldP)
      return setToast(passMsg, 'Mật khẩu hiện tại sai.', 'error');

    accounts[idx].password = newP;
    setAccounts(accounts);
    setToast(passMsg, 'Đổi mật khẩu thành công.', 'success');
    oldPass.value = newPass.value = reNewPass.value = '';
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(LS_CURRENT);
    closeProfile();
    alert('Bạn đã đăng xuất!');
    window.location.href = 'client.html';
  });

  document.getElementById('accountLinkText')?.addEventListener('click', (e) => {
    const session = getSession();
    if (!session) return;
    e.preventDefault();
    openProfile();
  });
});
