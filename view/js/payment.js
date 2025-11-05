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

  /* ========= Trạng thái đơn hàng ========= */
  const ST = {
    PENDING_CONFIRM: 'pending_confirmation',
    PENDING_SHIP:    'pending_shipment',
    SHIPPING:        'shipping',
    DELIVERED:       'delivered'
  };
  function statusLabel(s){
    if (s===ST.PENDING_CONFIRM) return 'Chờ xác nhận';
    if (s===ST.PENDING_SHIP)    return 'Chờ vận chuyển';
    if (s===ST.SHIPPING)        return 'Đang vận chuyển';
    if (s===ST.DELIVERED)       return 'Đã giao';
    return s || '';
  }

  /* ========= Admin Inbox ========= */
  function readAdminOrders(){
    try { return JSON.parse(localStorage.getItem('admin:orders')||'[]'); } catch { return []; }
  }
  function writeAdminOrders(list){
    try { localStorage.setItem('admin:orders', JSON.stringify(list||[])); } catch {}
  }
  function sendOrderToAdmin(order){
    const list = readAdminOrders();
    if (!list.some(o => o.code === order.code)) {
      list.unshift(order);
      writeAdminOrders(list);
    }
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
        li.innerHTML = `<span class="pname">${it.name || ('Sản phẩm #'+(it.id||''))}</span>
                        <span class="pqty">SL: ${it.qty||1}</span>`;
        elItems.appendChild(li);
      });
    } else {
      var li = document.createElement('li');
      li.textContent = 'Giỏ hàng trống.';
      elItems.appendChild(li);
    }
    elTotal.textContent = currency(total) + ' đ';

    var order = { code, date: now.toISOString(), customer: name, items: cart, total, status: ST.PENDING_CONFIRM };
    localStorage.setItem('last_order', JSON.stringify(order));
    sendOrderToAdmin(order);

    if (elNote)
      elNote.textContent = 'Cảm ơn bạn đã mua hàng tại TickTock. Chúng tôi sẽ liên hệ để xác nhận đơn.';
  }

  /* ========= Header offset ========= */
  function applyHeaderOffset(){
    var header  = document.querySelector('header');
    var payment = document.querySelector('.payment');
    if (!header || !payment) return;
    var cssVar = parseInt(getComputedStyle(document.documentElement)
                .getPropertyValue('--header-h').trim(), 10);
    var h = Math.ceil(header.getBoundingClientRect().height || cssVar || 100);
    payment.style.marginTop = (h + 12) + 'px';
  }

  /* ========= Hiển thị payment mà không ẩn toàn trang ========= */
  function onlyShowPayment(){
    var payment = document.querySelector('.payment');
    var header  = document.querySelector('header');
    var footer  = document.querySelector('footer');
    document.body.classList.add('order-confirmed');
    if (header) hardShow(header, 'block');
    if (footer) hardShow(footer, 'block');
    if (payment) {
      hardShow(payment, 'block');
      applyHeaderOffset();
      try { payment.scrollIntoView({behavior:'smooth'}); } catch(e){}
    }
  }

  /* ========= Thoát chế độ payment ========= */
  function exitPaymentMode(){
    document.body.classList.remove('order-confirmed');
  }

  /* ========= Trạng thái đơn hàng ========= */
  function loadOrder(){
    try { return JSON.parse(localStorage.getItem('last_order')||'null'); } catch { return null; }
  }
  function saveOrder(order){
    localStorage.setItem('last_order', JSON.stringify(order));
    const list = readAdminOrders();
    const idx = list.findIndex(o => o.code === order.code);
    if (idx >= 0) { list[idx] = order; writeAdminOrders(list); }
  }
  function setStepActive(status){
    const s1 = document.getElementById('step-confirm');
    const s2 = document.getElementById('step-ship');
    const s3 = document.getElementById('step-done');
    [s1,s2,s3].forEach(el => el && el.classList.remove('active','done'));
    if (status === ST.PENDING_CONFIRM){ s1&&s1.classList.add('active'); }
    if (status === ST.PENDING_SHIP){ s1&&s1.classList.add('done'); s2&&s2.classList.add('active'); }
    if (status === ST.SHIPPING){ s1&&s1.classList.add('done'); s2&&s2.classList.add('done'); s3&&s3.classList.add('active'); }
    if (status === ST.DELIVERED){ [s1,s2,s3].forEach(el=>el&&el.classList.add('done')); }
  }

  function renderStatus(){
    const order = loadOrder(); if (!order) return;
    const textEl = document.getElementById('ord-status-text');
    const btn = document.getElementById('ord-status-btn');
    setStepActive(order.status);
    if (textEl) textEl.textContent = statusLabel(order.status);
    if (!btn) return;
    if (order.status === ST.PENDING_CONFIRM){ btn.textContent='Chờ xác nhận'; btn.disabled=true; }
    else if (order.status === ST.PENDING_SHIP){ btn.textContent='Chờ vận chuyển'; btn.disabled=true; }
    else if (order.status === ST.SHIPPING){ btn.textContent='Xác nhận đã nhận hàng'; btn.disabled=false; }
    else if (order.status === ST.DELIVERED){ btn.textContent='Đã giao'; btn.disabled=true; }

    if (!btn._bound){
      btn.addEventListener('click',function(e){
        e.preventDefault();
        const ord=loadOrder(); if(!ord)return;
        if(ord.status===ST.SHIPPING){
          ord.status=ST.DELIVERED;
          saveOrder(ord);
          localStorage.removeItem('tt_cart');
          localStorage.removeItem(cartKey());
          renderStatus();
        }
      });
      btn._bound=true;
    }
  }

  /* ========= Nút “Xác nhận thanh toán” ========= */
  function attachConfirm(){
    const selectors=['#place-order-btn','#checkout-btn','button[name="checkout-confirm"]','.btn-checkout-confirm','#confirm-payment'];
    const btn=selectors.map(s=>document.querySelector(s)).find(Boolean);
    if(!btn)return;
    btn.addEventListener('click',function(e){
      e.preventDefault();
      renderOrderSummary();
      window.location.hash='#payment';
      onlyShowPayment();
      renderStatus();
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }

  /* ========= Router theo hash ========= */
  function route(){
    const last=loadOrder();
    if(window.location.hash==='#payment' && last){
      onlyShowPayment();
      renderStatus();
    } else {
      exitPaymentMode();
    }
  }

  /* ========= Boot ========= */
  function init(){
    const p=document.querySelector('.payment');
    if(p){p.setAttribute('hidden','');p.style.display='none';}
    attachConfirm();
    window.addEventListener('hashchange',route);
    route();
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}

   /* ======== LỊCH SỬ MUA HÀNG (không đè hàm cũ) ======== */
    function ensureHistoryTbody() {
    var table = document.getElementById('history-table');
    if (!table) return null;
    var tbody = table.querySelector('tbody');
    if (!tbody) {
      tbody = document.createElement('tbody');
      table.appendChild(tbody);
    }
    return tbody;
  }

  /** Render bảng: Tên sp | Số lượng | Ngày đặt | Trạng thái */
  function renderOrderHistory() {
    var tbody = ensureHistoryTbody();
    if (!tbody) return;

    var orders = readAdminOrders();

    // Lọc theo tên khách (nếu có hiển thị trên trang)
    var customerEl = document.getElementById('ord-customer');
    var customer = (customerEl ? (customerEl.textContent || '') : '').trim();
    if (customer) {
      orders = orders.filter(function (o) {
        return ((o.customer || '').trim() === customer);
      });
    }

    // Sắp xếp mới nhất lên đầu
    orders.sort(function (a, b) {
      var da = Date.parse((a && a.date) || 0) || 0;
      var db = Date.parse((b && b.date) || 0) || 0;
      return db - da;
    });

    // Xoá nội dung cũ
    tbody.innerHTML = '';

    if (!orders.length) {
      var trEmpty = document.createElement('tr');
      trEmpty.innerHTML = '<td colspan="4" style="padding:14px 12px;color:#666;">Chưa có đơn nào.</td>';
      tbody.appendChild(trEmpty);
      return;
    }

    // Duyệt từng đơn và từng item
    orders.forEach(function (o) {
      var when = '';
      try {
        var d = new Date(o.date);
        if (!isNaN(d)) when = d.toLocaleString('vi-VN');
      } catch {}

      (o.items || []).forEach(function (it) {
        var name = it.name || ('Sản phẩm #' + (it.id || ''));
        var qty = Number(it.qty) || 1;

        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td style="padding:10px 12px;border-top:1px solid #f1f1f1;">' + name + '</td>' +
          '<td style="padding:10px 12px;border-top:1px solid #f1f1f1;text-align:center;">' + qty + '</td>' +
          '<td style="padding:10px 12px;border-top:1px solid #f1f1f1;white-space:nowrap;">' + when + '</td>' +
          '<td style="padding:10px 12px;border-top:1px solid #f1f1f1;white-space:nowrap;">' + statusLabel(o.status) + '</td>';
        tbody.appendChild(tr);
      });
    });
  }

  /** Mở/đóng panel lịch sử (đảm bảo hiển thị đúng) */
  function toggleHistoryPanel() {
    var panel = document.getElementById('history-panel');
    if (!panel) return;

    var willOpen = panel.hasAttribute('hidden');
    if (willOpen) {
      renderOrderHistory();
      panel.removeAttribute('hidden');
      panel.style.display = 'block';
    } else {
      panel.setAttribute('hidden', '');
      panel.style.display = 'none';
    }
  }

  /** Gắn event theo kiểu uỷ quyền — tránh miss khi DOM thay đổi */
  (function bindHistoryDelegation() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('#btn-history');
      if (!btn) return;
      e.preventDefault();
      toggleHistoryPanel();
    });
  })();
})();
