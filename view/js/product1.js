// FILE: product1.js (client side)
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY_PRODUCTS = 'admin_products';
  const STORAGE_KEY_ACCESS   = 'admin_accessories';

  function safeJSON(key, fallback=[]) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return fallback; }
  }

  function useAdminOrDefault(){
    // Watches
    const adminProducts = safeJSON(STORAGE_KEY_PRODUCTS);
    if (Array.isArray(adminProducts) && adminProducts.length) {
      window.products = adminProducts;   // thay bộ dữ liệu gốc
    }
    // Accessories
    const adminAccessories = safeJSON(STORAGE_KEY_ACCESS);
    if (Array.isArray(adminAccessories) && adminAccessories.length) {
      window.accessories = adminAccessories.map(a => ({ category: 'phukien', ...a }));
    }

    update(); // gọi hàm render hiện có của bạn
  }

  // Lần đầu vào trang
  useAdminOrDefault();

  // Khi admin lưu (ở tab khác) -> client auto nhận
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_PRODUCTS || e.key === STORAGE_KEY_ACCESS) useAdminOrDefault();
  });

  // Nếu người dùng quay lại tab, cũng refresh từ localStorage
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) useAdminOrDefault();
  });
});


document.addEventListener('DOMContentLoaded', () => {
  // ===== CART BADGE (chạy ở mọi trang) =====
  function p1_getUser(){ return JSON.parse(localStorage.getItem('current_user')||'null') }
  function p1_cartKey(){ const u=p1_getUser(); return (u&&u.id)?`cart:${u.id}`:'cart:guest' }

  const loadCart = () => {
    try {
      const t = localStorage.getItem('tt_cart');
      if (t) return JSON.parse(t); // 1. Ưu tiên 'tt_cart'
    } catch {}
    try {
      // 2. Nếu không có, đọc key riêng (ví dụ 'cart:mai' hoặc 'cart:guest')
      return JSON.parse(localStorage.getItem(p1_cartKey()) || '[]');
    } catch { return []; }
  };

  // Hàm saveCart cũng cần cập nhật để ghi vào cả 2 key
  const saveCart = (cart) => {
    const cartStr = JSON.stringify(cart);
    localStorage.setItem('tt_cart', cartStr);
    localStorage.setItem(p1_cartKey(), cartStr);
  };
  const cartCount = (cart) => cart.reduce((s, i) => s + Number(i.qty || 1), 0);

  // Tìm phần tử badge theo nhiều cách để hợp nhất header giữa các trang
  const findCartCountEl = () =>
    document.getElementById('cart-count') ||
    document.querySelector('[data-cart-count]') ||
    document.querySelector('.cart-count') ||
    document.querySelector('.header-cart .count, .cart__count, .count-badge');

  const updateCartBadge = () => {
    const el = findCartCountEl();
    const n = cartCount(loadCart());
    if (el) {
      el.textContent = n > 99 ? '99+' : String(n);
      el.style.display = n ? 'inline-block' : 'none';
      el.classList.toggle('is-empty', !n);
      el.setAttribute('aria-label', `Giỏ hàng: ${n} sản phẩm`);
    }
    const checkoutBtn = document.getElementById('checkout-btn');
    const emptyMsg = document.getElementById('cart-empty-msg'); 

    if (checkoutBtn && emptyMsg) {
      if (n === 0) {
        checkoutBtn.disabled = true; 
        checkoutBtn.title = "Giỏ hàng của bạn đang trống";
        emptyMsg.style.display = 'block';
      } else {
        checkoutBtn.disabled = false;
        checkoutBtn.title = "";
        emptyMsg.style.display = 'none';
      }
    }
  };

  // cập nhật khi load / đổi tab / tab khác sửa localStorage
  updateCartBadge();
  window.addEventListener('storage', updateCartBadge);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateCartBadge(); });
  window.ttUpdateCartBadge = updateCartBadge;

  // ===== PHẦN DANH SÁCH SẢN PHẨM (chỉ chạy khi có #product-list) =====
  const box = document.getElementById('product-list');
  if (!box) return;

  const counterEl = document.getElementById('counter');
  const paginationEl = document.getElementById('pagination');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const pageTitle = document.getElementById('page-title');
  const priceSelect = document.getElementById('price-range');
  const sortSelect  = document.getElementById('sort');

  if (typeof window.products === 'undefined') {
    box.innerHTML = '<p>Chưa nạp dữ liệu sản phẩm.</p>';
    return;
  }

  // Fallback: nếu chưa có window.accessories thì đọc từ LS (phòng lúc block đầu chưa chạy kịp)
  if (!Array.isArray(window.accessories)) {
    try {
      const acc = JSON.parse(localStorage.getItem('admin_accessories') || '[]');
      if (acc.length) window.accessories = acc.map(a => ({ category:'phukien', ...a }));
    } catch {}
  }

  // Gộp phụ kiện vào products (nếu có)
  if (Array.isArray(window.accessories) && window.accessories.length) {
    window.products = (window.products || []).concat(window.accessories);
  }

  // ===== CONFIG =====
  const PER_PAGE = 8;

  // Tránh _id = 0 (bắt đầu từ 1)
  window.products.forEach((p,i)=>{ if (p._id == null) p._id = i + 1; });

  // ===== HELPERS =====
  const fmtVND    = n => Number(n).toLocaleString('vi-VN') + ' đ';
  const fmtVNDsup = n => Number(n).toLocaleString('vi-VN') + '<sup>đ</sup>';
  const toNumberPrice = v =>
    (typeof v === 'number') ? v : (parseInt(String(v).replace(/[^\d]/g,''),10) || 0);

  const params   = new URLSearchParams(location.search);
  const getParam = k => params.get(k) || '';
  const setParam = (k, v) => {
    if (!v) params.delete(k); else params.set(k, v);
    history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
  };

  // Viết hoa chữ cái đầu (tiếng Việt)
  function ucFirstVN(str) {
    const s = (str || '').trim();
    if (!s) return s;
    return s.charAt(0).toLocaleUpperCase('vi-VN') + s.slice(1);
  }

  const brandTitle = (b) => {
    if (!b) return '';
    const map = { casio:'Casio', rolex:'Rolex', citizen:'Citizen', rado:'Rado', seiko:'Seiko' };
    return map[(b || '').toLowerCase()] || (b.charAt(0).toUpperCase() + b.slice(1));
  };

  // Category maps
  const categoryTitleUpper = (c) => {
    if (!c) return '';
    const map = { nam:'NAM', nu:'NỮ', capdoi:'CẶP ĐÔI', 'cap-doi':'CẶP ĐÔI', phukien:'PHỤ KIỆN' };
    const k = (c || '').toLowerCase(); return map[k] || k.toUpperCase();
  };
  const categoryBreadcrumb = (c) => {
    if (!c) return '';
    const map = { nam:'nam', nu:'nữ', capdoi:'cặp đôi', 'cap-doi':'cặp đôi', phukien:'phụ kiện' };
    const k = (c || '').toLowerCase(); return map[k] || k;
  };

  // Accessory title maps
  const accessoryTitle = (a) => {
    if (!a) return '';
    const map = { glass:'Kính cường lực', box:'Hộp đựng', strap:'Dây đeo' };
    return map[(a || '').toLowerCase()] || a;
  };
  const accessoryBreadcrumb = (a) => {
    if (!a) return '';
    const map = { glass:'kính cường lực', box:'hộp đựng', strap:'dây đeo' };
    return map[(a || '').toLowerCase()] || a.toLowerCase();
  };

  // Đồng bộ select từ URL
  priceSelect && (priceSelect.value = getParam('price_range'));
  sortSelect  && (sortSelect.value  = getParam('sort'));

  // ===== TITLES / BREADCRUMB / TAB TITLE =====
  (function updateTitles(){
    const brand     = getParam('brand');
    const category  = getParam('category');
    const accessory = getParam('accessory');

    let bigTitle = 'TẤT CẢ SẢN PHẨM';
    let crumb    = 'Danh sách sản phẩm';
    let tabTitle = 'Sản phẩm';

    if ((category || '').toLowerCase() === 'phukien' && accessory) {
      const aTitle = accessoryTitle(accessory);
      bigTitle = `SẢN PHẨM LOẠI: ${aTitle.toUpperCase()}`;
      crumb    = accessoryBreadcrumb(accessory);
      tabTitle = aTitle;
    } else if (brand && category) {
      bigTitle = `${brandTitle(brand).toUpperCase()} - ${categoryTitleUpper(category)}`;
      crumb    = `${brandTitle(brand)} ${categoryBreadcrumb(category)}`;
      tabTitle = `${brandTitle(brand)} ${categoryBreadcrumb(category)}`;
    } else if (brand) {
      bigTitle = `SẢN PHẨM THƯƠNG HIỆU: ${brandTitle(brand).toUpperCase()}`;
      crumb    = brandTitle(brand);
      tabTitle = brandTitle(brand);
    } else if (category) {
      bigTitle = `SẢN PHẨM LOẠI: ${categoryTitleUpper(category)}`;
      crumb    = categoryBreadcrumb(category);
      tabTitle = categoryBreadcrumb(category);
    }

    pageTitle && (pageTitle.textContent = bigTitle);
    breadcrumbCurrent && (breadcrumbCurrent.textContent = ucFirstVN(crumb));
    document.title = `${ucFirstVN(tabTitle)} - TickTock Shop`;
  })();

  // ===== LỌC =====
  function baseFilter(list){
    const category  = getParam('category');
    const brand     = getParam('brand');
    const accessory = getParam('accessory');

    let out = list.slice();
    if (category)  out = out.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    if (brand)     out = out.filter(p => (p.brand || '').toLowerCase()    === brand.toLowerCase());
    if (accessory) out = out.filter(p => ((p.accessory || p.type) || '').toLowerCase() === accessory.toLowerCase());
    return out;
  }
  function priceFilter(list){
    const val = getParam('price_range') || (priceSelect ? priceSelect.value : '');
    if (!val) return list;
    const [minStr, maxStr] = val.split('-');
    const min = Number(minStr || 0);
    const max = Number(maxStr || Number.MAX_SAFE_INTEGER);
    return list.filter(p => {
      const price = toNumberPrice(p.price);
      return price >= min && price <= max;
    });
  }
  function sortList(list){
    const s = getParam('sort') || (sortSelect ? sortSelect.value : '');
    if (!s) return list;
    const asc = s === 'asc';
    return list.slice().sort((a,b) => toNumberPrice(asc ? a.price : b.price) - toNumberPrice(asc ? b.price : a.price));
  }

  // ===== PAGINATION =====
  function getPage(){
    const p = parseInt(getParam('page') || '1', 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }
  function paginate(list, page, perPage){
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * perPage;
    return { total, totalPages, current,
      slice: list.slice(start, start + perPage),
      from: total ? start + 1 : 0,
      to: Math.min(start + perPage, total) };
  }
  function renderPagination(totalPages, current){
    if (!paginationEl) return;
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

    const makeBtn = (label, page, disabled=false, active=false) => {
      const tag = disabled ? 'span' : 'a';
      const cls = [disabled ? 'disabled' : '', active ? 'active' : ''].join(' ').trim();
      const data = disabled ? '' : `data-page="${page}" href="javascript:void(0)"`;
      return `<li class="${cls}"><${tag} ${data}>${label}</${tag}></li>`;
    };

    const items = [];
    items.push(makeBtn('«', 1, current === 1));
    items.push(makeBtn('‹', current - 1, current === 1));

    const windowSize = 2;
    const start = Math.max(1, current - windowSize);
    const end   = Math.min(totalPages, current + windowSize);
    for (let i = start; i <= end; i++) items.push(makeBtn(i, i, false, i === current));

    items.push(makeBtn('›', current + 1, current === totalPages));
    items.push(makeBtn('»', totalPages, current === totalPages));

    paginationEl.innerHTML = items.join('');
    paginationEl.querySelectorAll('a[data-page]').forEach(a => {
      a.addEventListener('click', (e) => {
        const page = parseInt(e.currentTarget.getAttribute('data-page'), 10);
        setParam('page', page);
        update();
      });
    });
  }

  // ===== QUICK VIEW MODAL =====
  const qvEl       = document.getElementById('quickview');
  const qvImg      = document.getElementById('qv-image');
  const qvName     = document.getElementById('qv-name');
  const qvPrice    = document.getElementById('qv-price');
  const qvDesc     = document.getElementById('qv-desc');
  const qvBrand    = document.getElementById('qv-brand');
  const qvCategory = document.getElementById('qv-category');
  const qvQty      = document.getElementById('qv-qty');
  const qvAdd      = document.getElementById('qv-add');
  const qvClose    = document.getElementById('qv-close');

  let currentProductId = null;

  const brandLabel = b => ({casio:'Casio', rolex:'Rolex', citizen:'Citizen', rado:'Rado', seiko:'Seiko'}[b] || (b||''));
  const catLabel   = c => ({nam:'Nam', nu:'Nữ', capdoi:'Cặp đôi', 'cap-doi':'Cặp đôi', phukien:'Phụ kiện'}[c] || (c||''));

  function openQuickView(id){
    const p = window.products.find(x => x._id === Number(id));
    if (!p) return;
    currentProductId = p._id;

    qvImg.src = p.image; qvImg.alt = p.name;
    qvName.textContent  = p.name;
    qvPrice.innerHTML   = fmtVNDsup(toNumberPrice(p.price));
    qvDesc.textContent  = p.description || '';
    qvBrand.textContent = brandLabel((p.brand || '').toLowerCase());
    qvCategory.textContent = catLabel((p.category || '').toLowerCase());
    qvQty.value = 1;

    qvEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function closeQuickView(){
    qvEl.style.display = 'none';
    document.body.style.overflow = '';
  }

  qvClose && qvClose.addEventListener('click', closeQuickView);
  qvEl && qvEl.addEventListener('click', (e) => { if (e.target === qvEl) closeQuickView(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQuickView(); });

  qvAdd && qvAdd.addEventListener('click', () => {
    const p = window.products.find(x => x._id === currentProductId);
    if (!p) return;
    const qty = Math.max(1, parseInt(qvQty.value, 10) || 1);

    // Gọi Cart.addToCart với dữ liệu chuẩn
    if (window.Cart && typeof window.Cart.addToCart === 'function') {
      const productForCart = {
        id: String(p._id),                // tránh id=0 bị coi là falsy
        name: p.name,
        price: toNumberPrice(p.price),    // chuẩn hoá giá
        image: p.image,
        brand: p.brand || '',
        category: p.category || ''
      };
      window.Cart.addToCart(productForCart, qty);
    } else {
      console.error('Lỗi: window.Cart.addToCart không tồn tại.');
    }

    closeQuickView();
  });

  // ===== RENDER =====
  function render(list){
    const page = getPage();
    const { total, totalPages, current, slice, from, to } = paginate(list, page, PER_PAGE);

    if (!slice.length){
      box.innerHTML = '<p class="no-product-message">Không tìm thấy sản phẩm phù hợp.</p>';
      counterEl && (counterEl.textContent = 'Hiển thị 0 sản phẩm');
      renderPagination(1, 1);
      return;
    }

    box.innerHTML = slice.map(p => `
      <div class="product-item" data-id="${p._id}">
        <img src="${p.image}" alt="${p.name}">
        <h2>${p.name}</h2>
        <p class="price">${fmtVND(toNumberPrice(p.price))}</p>
      </div>
    `).join('');

    counterEl && (counterEl.textContent = `Hiển thị ${from}-${to} / ${total} sản phẩm`);
    renderPagination(totalPages, current);
  }

  function update(){
    let list = baseFilter(window.products);
    list = list.filter(p => !p.isHidden); // ẩn sản phẩm bị ẩn bên admin
    list = priceFilter(list);
    list = sortList(list);
    render(list);
  }

  // QuickView delegation
  box.addEventListener('click', (e) => {
    const card = e.target.closest('.product-item');
    if (!card) return;
    openQuickView(card.dataset.id);
  });

  function onSelectChange(key, value){
    setParam('page', 1);
    setParam(key, value);
    update();
  }
  priceSelect && priceSelect.addEventListener('change', e => onSelectChange('price_range', e.target.value));
  sortSelect  && sortSelect.addEventListener('change',  e => onSelectChange('sort',        e.target.value));

  // Render lần đầu
  update();
});
