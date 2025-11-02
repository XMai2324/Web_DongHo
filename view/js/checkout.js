(function () {
  /* ---------- Helpers hiển/ẩn cứng ---------- */
  function hardHide(el) {
    if (!el) return;
    if (el.classList) el.classList.add('hidden');
    el.setAttribute('hidden', '');
    el.style.display = 'none';
  }
  function hardShow(el) {
    if (!el) return;
    if (el.classList) el.classList.remove('hidden');
    el.removeAttribute('hidden');
    el.style.display = 'block';
  }

  /* ---------- Helpers đăng nhập & Prefill ---------- */
  function getUserSafe() {
    try {
      if (typeof window.getCurrentUser === 'function') return window.getCurrentUser() || null; // từ auth.js:contentReference[oaicite:0]{index=0}
      return JSON.parse(localStorage.getItem('current_user') || 'null');
    } catch (e) { return null; }
  }
  function openLoginModalSafe() {
    try {
      if (typeof window.openLoginModal === 'function') window.openLoginModal(); // từ auth.js:contentReference[oaicite:1]{index=1}
      else alert('Bạn chưa đăng nhập. Vui lòng đăng nhập để đặt hàng.');
    } catch (e) {}
  }

  // Gắn/Bỏ class .invalid cho các trường bắt buộc (trừ "Ghi chú")
  var REQUIRED_IDS = ['co-fullname','co-phone','co-email','co-address','co-city','co-district','co-ward'];
  function setRequiredState(isRequired) {
    REQUIRED_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      if (isRequired) {
        el.classList.add('invalid');
        el.setAttribute('required','');
      } else {
        el.classList.remove('invalid');
        el.setAttribute('required','');
      }
    });
  }

  // Tự điền Name + Email khi đã đăng nhập
  function prefillFromUser() {
    var user = getUserSafe();
    if (!user) return;
    var nameEl  = document.getElementById('co-fullname');
    var mailEl  = document.getElementById('co-email');
    if (nameEl && !nameEl.value)  nameEl.value  = user.name || user.username || '';
    if (mailEl && !mailEl.value)  mailEl.value  = user.email || '';
  }

  /* ---------- Alert hiển thị trên đầu form ---------- */
  function ensureAlert(id, html) {
    var rootLeft = document.querySelector('#delivery .delivery-content-left');
    if (!rootLeft) return null;
    var existed = document.getElementById(id);
    if (existed) { existed.innerHTML = html; return existed; }
    var div = document.createElement('div');
    div.id = id;
    div.className = 'auth-alert';
    div.innerHTML = html;
    rootLeft.insertBefore(div, rootLeft.firstChild);
    return div;
  }
  function removeAlert(id) {
    var el = document.getElementById(id);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function showNotLoggedInAlert() {
    ensureAlert('auth-alert', `
      <strong>⚠️ Bạn chưa đăng nhập.</strong>
      <span> Vui lòng <button type="button" class="auth-alert-login">Đăng nhập</button> để đặt hàng.</span>
    `);
    var btn = document.querySelector('#auth-alert .auth-alert-login');
    if (btn) btn.addEventListener('click', function(){ openLoginModalSafe(); });
  }
  function showFormErrorAlert(msg) {
    ensureAlert('form-error-alert', `❗ ${msg}`);
  }
  function clearAlerts() {
    removeAlert('auth-alert');
    removeAlert('form-error-alert');
  }

  // Áp dụng UI theo trạng thái đăng nhập
  function applyAuthUI() {
    var user = getUserSafe();
    if (user) {
      clearAlerts();
      setRequiredState(false);
      prefillFromUser();
    } else {
      showNotLoggedInAlert();
      setRequiredState(true);
    }
  }

  /* ---------- Tính tiền tóm tắt ---------- */
  function parseMoney(txt) {
    var n = String(txt || '').replace(/[^\d]/g, '');
    return Number(n || 0);
  }
  function vnd(n) { return (n || 0).toLocaleString('vi-VN') + ' đ'; }
  function refreshSummary() {
    var elQty = document.getElementById('co-qty');
    var elSubtotal = document.getElementById('co-subtotal');
    var elShip = document.getElementById('co-shipfee');
    var elDiscount = document.getElementById('co-discount');
    var elGrand = document.getElementById('co-grand');

    var sumQtyEl = document.getElementById('sum-qty');
    var subtotalTextEl = document.getElementById('subtotal');

    var qty = 0;
    if (sumQtyEl && sumQtyEl.textContent) qty = Number((sumQtyEl.textContent || '0').trim()) || 0;
    var subText = subtotalTextEl ? (subtotalTextEl.textContent || '0') : '0';
    var subtotal = parseMoney(subText);
    var ship = subtotal >= 1000000 ? 0 : 30000;
    var discount = 0;

    if (elQty) elQty.textContent = String(qty);
    if (elSubtotal) elSubtotal.textContent = vnd(subtotal);
    if (elShip) elShip.textContent = ship ? vnd(ship) : 'Miễn phí';
    if (elDiscount) elDiscount.textContent = vnd(discount);
    if (elGrand) elGrand.textContent = vnd(subtotal + ship - discount);
  }

  /* ---------- VALIDATION trước khi “Xác nhận thanh toán” ---------- */
  function validateCheckoutForm() {
    // reset trạng thái
    REQUIRED_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.classList.remove('invalid');
    });

    var firstInvalid = null;
    REQUIRED_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      var val = (el.value || '').trim();
      if (!val) {
        el.classList.add('invalid');
        if (!firstInvalid) firstInvalid = el;
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      showFormErrorAlert('Vui lòng điền đầy đủ thông tin bắt buộc trước khi đặt hàng.');
      return false;
    }
    removeAlert('form-error-alert');
    return true;
  }

  /* ---------- Router (#cart / #delivery / catalog) ---------- */
  function initRouter() {
    var cartEl = document.getElementById('cart');
    var deliveryEl = document.getElementById('delivery');
    var btnCheckout = document.getElementById('checkout-btn');   // nút “Đặt Hàng” trong giỏ:contentReference[oaicite:2]{index=2}
    var btnBack = document.getElementById('delivery-back');      // nút quay lại giỏ:contentReference[oaicite:3]{index=3}

    function route() {
      var h = window.location.hash;

      if (h === '#delivery') {
        // LUÔN cho vào trang thanh toán:contentReference[oaicite:4]{index=4}, kiểm soát mua ở nút “Xác nhận thanh toán”
        document.body.classList.remove('show-cart');
        document.body.classList.add('route-delivery');
        hardHide(cartEl);
        hardShow(deliveryEl);
        refreshSummary();
        applyAuthUI();
        try { deliveryEl && deliveryEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
      } else if (h === '#cart') {
        document.body.classList.add('show-cart');
        document.body.classList.remove('route-delivery');
        hardShow(cartEl);
        hardHide(deliveryEl);
        try { cartEl && cartEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
      } else {
        document.body.classList.remove('show-cart');
        document.body.classList.remove('route-delivery');
        hardHide(cartEl);
        hardHide(deliveryEl);
      }
    }

    // “Đặt Hàng” ở giỏ → chuyển sang #delivery (khách được vào xem):contentReference[oaicite:5]{index=5}
    if (btnCheckout) {
      btnCheckout.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.hash = '#delivery';
        route();
      });
    }

    if (btnBack) {
      btnBack.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.hash = '#cart';
        route();
      });
    }

    window.addEventListener('hashchange', route);
    route();
  }

  /* ---------- Combo generic (City/District...) ---------- */
  function initOneCombo(wrap) {
    if (!wrap) return;
    var input  = wrap.querySelector('input.form-input');
    var toggle = wrap.querySelector('.combo-toggle');
    var list   = wrap.querySelector('.combo-list');
    if (!input || !toggle || !list) return;

    var items  = Array.prototype.slice.call(list.querySelectorAll('li'));
    var activeIndex = -1;

    function open()  { list.classList.add('show'); }
    function close() { list.classList.remove('show'); activeIndex = -1; mark(); }
    function isOpen(){ return list.classList.contains('show'); }
    function mark(){ items.forEach(function(li,i){ li.classList.toggle('active', i===activeIndex); }); }

    function filter(){
      var q = (input.value || '').trim().toLowerCase();
      items.forEach(function(li){
        var ok = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
        li.style.display = ok ? '' : 'none';
      });
    }
    function visibleItems(){
      return items.filter(function(li){ return li.style.display !== 'none'; });
    }
    function pick(li){
      input.value = (li && li.textContent || '').trim();
      close();
      try { input.dispatchEvent(new Event('change', {bubbles:true})); } catch(e) {}
    }

    toggle.addEventListener('click', function(){
      isOpen() ? close() : (filter(), open(), input.focus());
    });
    input.addEventListener('focus', function(){ filter(); open(); });
    input.addEventListener('input', function(){ filter(); open(); });

    list.addEventListener('mousedown', function(e){
      var li = e.target.closest('li');
      if (li) pick(li);
    });

    input.addEventListener('keydown', function(e){
      if (!isOpen() && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { open(); }
      var vis = visibleItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, vis.length - 1);
        mark();
        if (vis[activeIndex]) vis[activeIndex].scrollIntoView({block:'nearest'});
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        mark();
        if (vis[activeIndex]) vis[activeIndex].scrollIntoView({block:'nearest'});
      } else if (e.key === 'Enter' && activeIndex >= 0 && vis[activeIndex]) {
        e.preventDefault();
        pick(vis[activeIndex]);
      } else if (e.key === 'Escape') {
        close();
      }
    });

    document.addEventListener('click', function(e){
      if (!wrap.contains(e.target)) close();
    });
  }

  function initAllCombos() {
    var root = document.getElementById('delivery');
    if (!root) return;
    var combos = root.querySelectorAll('.combo');
    for (var i = 0; i < combos.length; i++) initOneCombo(combos[i]);
  }

  /* ---------- Boot ---------- */
  function init() {
    initRouter();
    initAllCombos();   // kích hoạt city + district:contentReference[oaicite:6]{index=6}

    // Chặn “Xác nhận thanh toán”: kiểm tra đăng nhập + validate form
    var placeBtn = document.getElementById('place-order-btn'); // nút hiện có trong HTML:contentReference[oaicite:7]{index=7}
    if (placeBtn) {
      placeBtn.addEventListener('click', function(e){
        var user = getUserSafe();
        if (!user) {
          e.preventDefault();
          showNotLoggedInAlert();
          openLoginModalSafe();
          return;
        }
        // Đã đăng nhập → kiểm tra các trường bắt buộc
        if (!validateCheckoutForm()) {
          e.preventDefault();
          return;
        }
        // Nếu muốn, bạn có thể tiếp tục submit/tạo đơn tại đây
      });
    }

    // Cập nhật giao diện tức thì theo trạng thái hiện tại
    applyAuthUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
