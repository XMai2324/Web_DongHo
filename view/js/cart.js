/* ========= Utils ========= */
function currency(v){try{return Number(v).toLocaleString('vi-VN')}catch{return v}}
function getUser(){return JSON.parse(localStorage.getItem('auth:user')||'null')}
function cartKey(){const u=getUser();return(u&&u.id)?`cart:${u.id}`:'cart:guest'}

function updateBadge(cart=readCart()){
  const n=cart.reduce((s,i)=>s+(i.qty||0),0);
  const badge=document.getElementById('cart-count')||document.querySelector('.cart-badge');
  if(badge) badge.textContent=n;
}

/* ========= Storage (đồng bộ với product.js) =========
   - product.js dùng key 'tt_cart'
   - cart.js dùng key cartKey()
   → đọc ưu tiên 'tt_cart', khi ghi thì ghi CẢ HAI để 2 nơi thấy cùng dữ liệu
*/
function readCart(){
  try{
    const t = localStorage.getItem('tt_cart');
    if (t) return JSON.parse(t);
  }catch{}
  try{
    return JSON.parse(localStorage.getItem(cartKey())||'[]');
  }catch{ return []; }
}
function writeCart(cart){
  localStorage.setItem('tt_cart', JSON.stringify(cart));
  localStorage.setItem(cartKey(), JSON.stringify(cart));
  updateBadge(cart);
}

/* ========= Render ========= */
function renderCart() {
  const cart = readCart();

  const tbody      = document.getElementById('cart-body');
  const sumQty     = document.getElementById('sum-qty');
  const subtotalEl = document.getElementById('subtotal');
  const grandEl    = document.getElementById('grand-total');
  const msg        = document.getElementById('shipping-msg');
  if (!tbody) return;

  tbody.innerHTML = '';
  let sum = 0, subtotal = 0;

  cart.forEach((it, idx) => {
    const tr = document.createElement('tr');
    const line = (it.price || 0) * (it.qty || 1);

    tr.innerHTML = `
      <td><img src="${it.image || ''}" alt="${it.name || ''}"
               onerror="this.src='https://via.placeholder.com/80?text=?'"></td>
      <td><p>${it.name || ('Sản phẩm #'+it.id)}</p></td>
      <td><input type="number" min="1" step="1" value="${it.qty || 1}"></td>
      <td><p>${currency(line)} <sub>đ</sub></p></td>
      <td class="delete-cell" title="Xóa">X</td>
    `;

    // tăng/giảm số lượng
    const qtyInput = tr.querySelector('input[type="number"]');
    ['input','change','blur'].forEach(evt => {
      qtyInput.addEventListener(evt, () => {
        let v = parseInt(qtyInput.value, 10);
        if (!Number.isFinite(v) || v < 1) v = 1;
        if (cart[idx].qty !== v) {
          cart[idx].qty = v;
          writeCart(cart);
          renderCart();
        }
      });
    });
    qtyInput.addEventListener('wheel', e => e.preventDefault(), { passive: false });

    // xoá sản phẩm
    tr.querySelector('.delete-cell').addEventListener('click', () => {
      cart.splice(idx, 1);
      writeCart(cart);
      renderCart();
    });

    tbody.appendChild(tr);

    sum      += (it.qty || 1);
    subtotal += (it.price || 0) * (it.qty || 1);
  });

  if (sumQty)     sumQty.textContent = sum;
  if (subtotalEl) subtotalEl.innerHTML = `${currency(subtotal)} <sub>đ</sub>`;
  if (grandEl)    grandEl.innerHTML   = `${currency(subtotal)} <sub>đ</sub>`;

  if (msg) {
    const need = Math.max(0, 2000000 - subtotal);
    msg.textContent = need > 0
      ? `Mua thêm ${currency(need)} đ để được miễn phí ship.`
      : 'Bạn đã được miễn phí ship!';
  }

  updateBadge(cart);
}

/* ========= Cart API ========= */
function addToCart(product, qty = 1) {
  if (!product || !product.id) return;
  const cart = readCart();
  const i = cart.findIndex(p => p.id === product.id);
  if (i >= 0) cart[i].qty += qty;
  else cart.push({
    id: product.id,
    name: product.name,
    price: Number(product.price) || 0,
    image: product.image || '',
    qty
  });
  writeCart(cart);
  if (typeof renderCart === 'function') renderCart();
}

/* ========= Quick View (tránh double-bind với product.js) =========
   Ở trang sản phẩm, product.js đã gắn click cho #qv-add.
   Tại đây ta tạo hàm no-op để gọi cho an toàn nhưng KHÔNG bind thêm.
*/
function bindQuickView(){
  /* no-op: tránh gắn listener trùng */
}

/* ========= Checkout ========= */
function bindCheckoutButton() {
  const btn = document.getElementById('checkout-btn');
  if (!btn) return;
  if (btn.__bound) return;
  btn.__bound = true;

  btn.addEventListener('click', () => {
    const cart = readCart();
    if (!cart || cart.length === 0) {
      alert('Giỏ hàng của bạn đang trống.');
      return;}
  });
}

/* ========= Toggle Cart Panel ========= */
function showCart(){
  const cartEl=document.getElementById('cart');
  if(!cartEl) return;

  if (location.hash === '#delivery') {
    location.hash = '#cart';
    return;
  }

  cartEl.classList.remove('hidden');
  cartEl.removeAttribute('hidden');
  cartEl.style.display = 'block';
  document.body.classList.add('show-cart');
  renderCart();
  window.scrollTo({top:0,behavior:'smooth'});
}
function hideCart(){
  document.body.classList.remove('show-cart');
  document.getElementById('cart')?.classList.add('hidden');
  if (location.hash === '#cart') history.replaceState({}, '', location.pathname + location.search);
}

/* ========= Hash Router (đồng bộ với checkout) ========= */
(function attachCartRouter(){
  const cart = document.getElementById('cart');
  if (!cart) return;

  function hardHide(el){
    el.classList.add('hidden');
    el.setAttribute('hidden','');
    el.style.display = 'none';
  }
  function hardShow(el){
    el.classList.remove('hidden');
    el.removeAttribute('hidden');
    el.style.display = 'block';
  }

  function syncCartWithHash() {
    if (location.hash === '#delivery') {
      hardHide(cart);
    } else if (location.hash === '#cart') {
      hardShow(cart);
    }
  }

  document.addEventListener('DOMContentLoaded', syncCartWithHash);
  window.addEventListener('hashchange', syncCartWithHash);
  setTimeout(syncCartWithHash, 0);
})();

/* ========= Init ========= */
document.addEventListener('DOMContentLoaded',()=>{
  // icon giỏ trên header
  const btn=document.getElementById('cart-btn')
          || document.querySelector('header .cart-link a')
          || document.querySelector('header .cart i.fa-cart-shopping');
  if(btn){
    btn.addEventListener('click',(e)=>{
      e.preventDefault();
      if (location.hash === '#delivery') location.hash = '#cart';
      else showCart();
    });
  }

  // cập nhật badge
  updateBadge();

  // quick view: no-op để tránh double-bind
  bindQuickView();

  // mở thẳng giỏ nếu URL có #cart
  if(location.hash==='#cart') showCart();

  // đóng giỏ bằng ESC
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') hideCart(); });

  // đồng bộ badge nếu thay đổi từ tab khác
  window.addEventListener('storage',(e)=>{ 
    if (e.key && (e.key==='tt_cart' || e.key.startsWith('cart:'))) updateBadge();
  });

  // nút "tiếp tục mua sắm"
  const closeBtn=document.getElementById('cart-close');
  if(closeBtn){
    closeBtn.addEventListener('click',(e)=>{
      e.preventDefault(); hideCart();
      document.querySelector('main')?.scrollIntoView({behavior:'smooth'});
    });
  }

  // checkout
  bindCheckoutButton();
});

/* ========= Expose ========= */
window.Cart={addToCart,showCart,hideCart,renderCart,updateBadge};
