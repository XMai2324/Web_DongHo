document.addEventListener('DOMContentLoaded', () => {
  const accountLink  = document.querySelector('.account a');
  const modal        = document.getElementById('login_modal');
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Mở modal ở tab ĐĂNG NHẬP
  function openLogin() {
  modal.classList.add('show');           // KHÔNG set style.display
  document.body.classList.add('modal-open');
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
}

function openRegister() {
  modal.classList.add('show');
  document.body.classList.add('modal-open');
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
}

function closeModal() {
  modal.classList.remove('show');
  document.body.classList.remove('modal-open');
}

  // Click "Tài khoản" -> mở form đăng nhập
  accountLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openLogin();
  });

  // Link "Đăng ký ngay" trong loginForm -> chuyển sang form đăng ký
  const toRegisterLink = loginForm?.querySelector('.link a');
  toRegisterLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openRegister();
  });

  // Link "Đăng nhập ngay" trong registerForm -> chuyển sang form đăng nhập
  const toLoginLink = registerForm?.querySelector('.link a');
  toLoginLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openLogin();
  });

  // Click ra ngoài form để đóng (nếu muốn)
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Nhấn ESC để đóng
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.style.display === 'block') closeModal();
  });
});
