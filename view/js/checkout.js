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
      if (typeof window.getCurrentUser === 'function') return window.getCurrentUser() || null; // từ auth.js
      return JSON.parse(localStorage.getItem('current_user') || 'null');
    } catch (e) { return null; }
  }
  function openLoginModalSafe() {
    try {
      if (typeof window.openLoginModal === 'function') window.openLoginModal(); // từ auth.js
      else alert('Bạn chưa đăng nhập. Vui lòng đăng nhập để đặt hàng.');
    } catch (e) {}
  }
  
  function setFieldError(el, msg) {
    if (!el) return;
    // tìm <small class="field-error"> ngay sau input; nếu chưa có thì tạo
    var err = el.nextElementSibling;
    if (!err || !err.classList || !err.classList.contains('field-error')) {
      err = document.createElement('small');
      err.className = 'field-error';
      el.parentNode.insertBefore(err, el.nextSibling);
    }
    err.textContent = msg || '';
    err.style.display = msg ? 'block' : 'none';
  }

  // Các trường bắt buộc (trừ ghi chú)
  var REQUIRED_IDS = ['co-fullname','co-phone','co-email','co-address','co-city','co-district','co-ward'];

  // KHÔNG set required cho email vì là "tùy chọn"
  function setRequiredState(isRequired) {
    REQUIRED_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;

      if (isRequired) {
        if (id !== 'co-email') el.setAttribute('required',''); else el.removeAttribute('required');

        var val = (el.value || '').trim();
        if (!val && id !== 'co-email') {
          // Lấy thông điệp từ RULES để hiển thị giống SĐT
          var rule = FIELD_RULES[id];
          var msg = rule ? rule('') : 'Vui lòng nhập thông tin.';
          if (msg === true) msg = 'Vui lòng nhập thông tin.';
          markInvalid(el, msg);
        } else {
          clearInvalid(el);
        }
      } else {
        el.classList.remove('invalid');
        el.removeAttribute('required');
        el.removeAttribute('title');
        // nếu bạn có setFieldError thì ẩn luôn:
        if (typeof setFieldError === 'function') setFieldError(el, '');
      }
    });
  }
  /* ---------- RULES & LIVE VALIDATION ---------- */
  var FIELD_RULES = {
    // Họ tên
    'co-fullname': function (v) {
      return v.trim()
        ? true
        : 'Vui lòng nhập Họ và tên. Ví dụ: Nguyễn Văn A';
    },

    // Số điện thoại
    'co-phone': function (vRaw) {
      var v = String(vRaw || '').replace(/\D/g, '');
      if (!v) return 'Vui lòng nhập Số điện thoại.';
      if (!/^0\d{9}$/.test(v))
        return 'Số điện thoại không hợp lệ. Ví dụ: 0XXX XXX XXX (10 số, bắt đầu bằng 0).';
      return true;
    },

    // Email (tùy chọn): có nhập thì phải đúng
    'co-email': function (v) {
      var s = String(v || '').trim();
      if (!s) return true;
      if (s.indexOf('@') === -1)
        return 'Email không đúng định dạng. Ví dụ: abc@gmail.com';
      return true;
    },

    // Địa chỉ
    'co-address': function (v) {
      return v.trim()
        ? true
        : 'Vui lòng nhập Địa chỉ. Ví dụ: 12 Nguyễn Huệ, P. Bến Nghé';
    },

    // Tỉnh/Thành (input combo)
    'co-city': function (v) {
      return v.trim()
        ? true
        : 'Vui lòng chọn Tỉnh/Thành. Ví dụ: Hà Nội';
    },

    // Quận/Huyện (input combo)
    'co-district': function (v) {
      return v.trim()
        ? true
        : 'Vui lòng chọn Quận/Huyện. Ví dụ: Quận 1';
    },

    // Phường/Xã (input text hoặc combo)
    'co-ward': function (v) {
      return v.trim()
        ? true
        : 'Vui lòng nhập/Chọn Phường/Xã. Ví dụ: Phường Bến Nghé';
    },
  };

  function getEl(id){ return document.getElementById(id); }

  function markInvalid(el, msg){
    if (!el) return;
    el.classList.add('invalid');
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('title', msg || '');
    setFieldError(el, msg || 'Vui lòng kiểm tra lại.');
  }
  function clearInvalid(el){
    if (!el) return;
    el.classList.remove('invalid');
    el.removeAttribute('aria-invalid');
    el.removeAttribute('title');
    setFieldError(el, ''); // ẩn inline error
  }

  function allValid() {
    // chú ý: validateOne có tác dụng phụ (gỡ/đặt viền đỏ) — ở đây là điều ta muốn
    for (var i = 0; i < REQUIRED_IDS.length; i++) {
      var r = validateOne(REQUIRED_IDS[i]);
      if (!r.ok) return false;
    }
    return true;
  }
  // validate 1 field theo rule & trả về {ok, msg}
  function validateOne(id){
    var el = getEl(id);
    if (!el) return { ok:true };
    var val = el.value || '';
    var rule = FIELD_RULES[id];
    var res = rule ? rule(val) : (val.trim() ? true : 'Vui lòng nhập thông tin.');
    if (res === true){
      clearInvalid(el);                 // => nhập đúng là mất viền đỏ ngay
      return { ok:true };
    } else {
      markInvalid(el, res);
      return { ok:false, msg: res, el: el };
    }
  }

  // === BẬT/TẮT NÚt "Xác nhận thanh toán" theo trạng thái hợp lệ + đăng nhập
  var placeBtn = null;
  function recomputePlaceButtonState() {
    if (!placeBtn) return;
    var user = getUserSafe();
    // kiểm tra nhanh: tất cả trường đều ok?
    var allOk = true;
    for (var i=0; i<REQUIRED_IDS.length; i++){
      var r = validateOne(REQUIRED_IDS[i]);
      if (!r.ok) { allOk = false; break; }
    }
    placeBtn.disabled = !(user && allOk);
  }

  // Gắn live-validation: nhập xong là tự mất viền đỏ + cập nhật trạng thái nút
  function attachLiveValidation(){
    REQUIRED_IDS.forEach(function(id){
      var el = getEl(id);
      if (!el) return;

      function run() {
        var r = validateOne(id);
        // nếu đang blur hoặc người dùng dừng gõ, hiển thị banner đầu form cho lỗi đầu tiên
        if (!r.ok) {
          showFormErrorAlert(r.msg || 'Vui lòng kiểm tra lại thông tin.');
        } else if (allValid()) {
          removeAlert('form-error-alert');
        }
        // (nếu bạn có cơ chế disable nút, gọi lại tính toán)
        if (typeof recomputePlaceButtonState === 'function') recomputePlaceButtonState();
      }

      el.addEventListener('input', run);
      el.addEventListener('change', run);
      el.addEventListener('blur', run);
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
      prefillFromUser();
      // BẬT yêu cầu nhập để ô trống hiển thị lỗi ngay
      setRequiredState(true);
    } else {
      showNotLoggedInAlert();
      setRequiredState(true);
    }

    // Sau khi áp UI, kiểm tra lại để:
    // - xóa đỏ các ô đã hợp lệ
    // - bật/tắt nút "Xác nhận thanh toán"
    recomputePlaceButtonState();
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
    REQUIRED_IDS.forEach(function(id){ clearInvalid(getEl(id)); });

    var firstBad = null, firstMsg = '';
    REQUIRED_IDS.forEach(function(id){
      var r = validateOne(id);
      if (!r.ok && !firstBad) {
        firstBad = r.el;
        firstMsg = r.msg || 'Vui lòng kiểm tra lại thông tin.';
      }
    });

    if (firstBad) {
      try { firstBad.focus(); } catch(e) {}
      showFormErrorAlert(firstMsg);
      return false;
    }
    removeAlert('form-error-alert');
    return true;
  }

  /* ---------- Router (#cart / #delivery / catalog) ---------- */
  function initRouter() {
    var cartEl = document.getElementById('cart');
    var deliveryEl = document.getElementById('delivery');
    var btnCheckout = document.getElementById('checkout-btn');   // nút “Đặt Hàng” trong giỏ
    var btnBack = document.getElementById('delivery-back');      // nút quay lại giỏ

    function route() {
      var h = window.location.hash;

      if (h === '#delivery') {
        // Luôn cho vào trang thanh toán, điều kiện sẽ chặn ở nút “Xác nhận thanh toán”
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
    initAllCombos();                // kích hoạt city + district
    attachLiveValidation();         // bật validate theo thời gian thực

    // Chặn “Xác nhận thanh toán”: kiểm tra đăng nhập + validate form
    placeBtn = (document.getElementById('place-order-btn') || document.querySelector('.place-order-btn')); // hỗ trợ id & class
    if (placeBtn) {
      placeBtn.addEventListener('click', function(e){
        var user = getUserSafe();
        if (!user) {
          e.preventDefault(); e.stopPropagation();
          showNotLoggedInAlert();
          openLoginModalSafe();
          return false;
        }
        // Đã đăng nhập → kiểm tra các trường theo rule
        if (!validateCheckoutForm()) {
          e.preventDefault(); e.stopPropagation();
          return false;
        }
        // Hợp lệ → cho phép tiếp tục (submit/đi trang kết quả)
      });
    }

    // Nếu có form bao quanh, chặn submit mặc định khi chưa hợp lệ
    var deliveryForm = document.querySelector('#delivery form');
    if (deliveryForm){
      deliveryForm.addEventListener('submit', function(e){
        var user = getUserSafe();
        if (!user || !validateCheckoutForm()){
          e.preventDefault(); e.stopPropagation();
          if (!user){ showNotLoggedInAlert(); openLoginModalSafe(); }
          return false;
        }
      });
    }

    // Lần đầu vào trang: tính trạng thái nút theo dữ liệu hiện có
    recomputePlaceButtonState();

    // Cập nhật giao diện tức thì theo trạng thái hiện tại
    applyAuthUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
