(function () {
  /* ========= Helpers ẩn/hiện cứng ========= */
  function hardHide(el) {
    if (!el) return;
    el.classList && el.classList.add('hidden');
    el.setAttribute('hidden', '');
    el.style.display = 'none';
  }
  function hardShow(el, as = 'block') {
    if (!el) return;
    el.classList && el.classList.remove('hidden');
    el.removeAttribute('hidden');
    el.style.display = as;
  }

  /* ========= Helpers dữ liệu ========= */
  function currency(v){ try { return Number(v).toLocaleString('vi-VN'); } catch { return v; } }
  function getUser(){ try { return JSON.parse(localStorage.getItem('auth:user')||'null'); } catch { return null; } }
  function cartKey(){ const u=getUser(); return (u&&u.id)?`cart:${u.id}`:'cart:guest'; }
  function readCart(){
    try{ const t=localStorage.getItem('tt_cart'); if(t) return JSON.parse(t); }catch{}
    try{ return JSON.parse(localStorage.getItem(cartKey())||'[]'); }catch{ return []; }
  }
  function getCheckoutInfo(){
    try{ return JSON.parse(localStorage.getItem('checkout:info')||'{}'); }catch{ return {}; }
  }

  /* ========= Render “Đơn hàng của bạn” ========= */
  function renderOrderSummary(){
    var elDate  = document.getElementById('ord-date');
    var elCode  = document.getElementById('ord-code');
    var elCus   = document.getElementById('ord-customer');
    var elItems = document.getElementById('ord-items');
    var elTotal = document.getElementById('ord-total');
    var elNote  = document.getElementById('ord-note');
    if (!elDate || !elCode || !elCus || !elItems || !elTotal) return;

    var cart = readCart();
    var info = getCheckoutInfo();

    var now = new Date();
    var code = 'TT-' + now.getFullYear().toString().slice(-2)
                     + (now.getMonth()+1).toString().padStart(2,'0')
                     + now.getDate().toString().padStart(2,'0') + '-'
                     + Math.random().toString(36).slice(2,8).toUpperCase();

    elDate.textContent = now.toLocaleString('vi-VN');
    elCode.textContent = code;

    var name = info.fullname || info.name || info.customer || 'Khách lẻ';
    elCus.textContent = name;

    elItems.innerHTML = '';
    var total = 0;
    if (Array.isArray(cart) && cart.length){
      cart.forEach(function(it){
        var li = document.createElement('li');
        var line = (Number(it.price)||0) * (Number(it.qty)||1);
        total += line;
        li.innerHTML =
          '<span class="pname">' + (it.name || ('Sản phẩm #'+(it.id||''))) + '</span>' +
          '<span class="pqty">SL: ' + (it.qty||1) + '</span>';
        elItems.appendChild(li);
      });
    } else {
      var li = document.createElement('li');
      li.textContent = 'Giỏ hàng trống.';
      elItems.appendChild(li);
    }
    elTotal.textContent = currency(total) + ' đ';

    var order = { code: code, date: now.toISOString(), customer: name, items: cart, total: total };
    localStorage.setItem('last_order', JSON.stringify(order));

    if (elNote)
      elNote.textContent = 'Cảm ơn bạn đã mua hàng tại TickTock. Chúng tôi sẽ liên hệ để xác nhận đơn.';
  }

  /* ========= Đẩy .payment xuống theo chiều cao header (không thêm HTML) ========= */
  function applyHeaderOffset(){
    var header  = document.querySelector('header');
    var payment = document.querySelector('.payment');
    if (!header || !payment) return;

    var cssVar = parseInt(getComputedStyle(document.documentElement)
                .getPropertyValue('--header-h').trim(), 10);
    var h = Math.ceil(header.getBoundingClientRect().height || cssVar || 100);

    payment.style.marginTop = (h + 12) + 'px';

    var title = document.querySelector('.payment .order-title');
    if (title) title.style.scrollMarginTop = (h + 12) + 'px';
  }

  function onResize(fn, wait){
    var t;
    return function(){ clearTimeout(t); t=setTimeout(fn, wait||150); };
  }

  /* ========= Chỉ hiển thị header + .payment + footer ========= */
  function onlyShowPayment(){
    var payment = document.querySelector('.payment');
    var header  = document.querySelector('header');
    var footer  = document.querySelector('footer');

    hardShow(header, 'block');
    hardShow(footer, 'block');

    Array.prototype.forEach.call(document.body.children, function(ch){
      if (ch === header || ch === footer || ch === payment) return;
      hardHide(ch);
    });

    if (payment && payment.parentElement) {
      Array.prototype.forEach.call(payment.parentElement.children, function(ch){
        if (ch !== payment) hardHide(ch);
      });
    }

    var extra = document.querySelectorAll(
      '#cart, .cart, .cart-container, .cart-summary, .cart-table,'+
      '.checkout-container, .checkout-content, .checkout-section, .payment-form,'+
      '.slider,'+ /* slider thường nằm ngoài <main> */
      'main > section:not(.payment), main > div:not(.payment)'
    );
    extra.forEach(hardHide);

    if (payment) {
      hardShow(payment);
      applyHeaderOffset();                        // << đẩy xuống theo header
      try { payment.scrollIntoView({behavior:'smooth'}); } catch(e){}
    }

    window.addEventListener('resize', onResize(applyHeaderOffset, 150));
    document.body.classList.add('order-confirmed');
  }

  /* ========= Gắn nút xác nhận ========= */
  function attachConfirm(){
    var selectors = [
      '#place-order-btn',
      '#checkout-btn',
      'button[name="checkout-confirm"]',
      '.btn-checkout-confirm',
      '#confirm-payment'
    ];
    var btn = selectors.map(function(s){ return document.querySelector(s); }).find(Boolean);
    if (!btn) return;

    btn.addEventListener('click', function(e){
      e.preventDefault();             // nếu submit form thật, bỏ dòng này
      renderOrderSummary();
      onlyShowPayment();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ========= Boot ========= */
  function init(){
    var p = document.querySelector('.payment');
    if (p) { p.setAttribute('hidden',''); p.style.display = 'none'; }

    renderOrderSummary();
    attachConfirm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
