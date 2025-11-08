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
  function getUser(){ try { return JSON.parse(localStorage.getItem('current_user')||'null'); } catch { return null; } }
  function cartKey(){ const u=getUser(); return (u&&u.id)?`cart:${u.id}`:'cart:guest'; }
  function readCart(){
    try{ const t=localStorage.getItem('tt_cart'); if(t) return JSON.parse(t); }catch{}
    try{ return JSON.parse(localStorage.getItem(cartKey())||'[]'); }catch{ return []; }
  }
  function getCheckoutInfo(){
    try{ return JSON.parse(localStorage.getItem('checkout:info')||'{}'); }catch{ return {}; }
  }

  /* ========= HÀM MỚI: Cập nhật số lượng trên Header ========= */
  function updateHeaderCartCount() {
    const el = document.getElementById('cart-count');
    if (!el) return;
    
    const cart = readCart(); // Dùng lại hàm readCart() đã có
    let totalQty = 0;
    
    if (Array.isArray(cart) && cart.length > 0) {
      // Tính tổng số lượng của tất cả sản phẩm
      totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    }
    
    el.textContent = totalQty; // Cập nhật con số trên badge
  }
  /* ========================================================== */

  /* ========= Trạng thái đơn hàng (UI phía khách) ========= */
  const ST = {
    PENDING_CONFIRM: 'pending_confirmation',
    PENDING_SHIP:    'pending_shipment',
    SHIPPING:        'shipping',
    DELIVERED:       'delivered'
  };
  function statusLabel(s){
    if (s===ST.PENDING_CONFIRM) return 'Chờ xác nhận';
    if (s===ST.PENDING_SHIP)    return 'Chờ vận chuyển';
    if (s===ST.SHIPPING)        return 'Vui lòng Xác nhận đơn hàng';
    if (s===ST.DELIVERED)       return 'Đơn hàng của bạn đã giao thành công, cảm ơn bạn đã mua hàng';
    return s || '';
  }

  /* ========= Map trạng thái FRONT <-> ADMIN ========= */
  function frontToAdminStatus(s) {
    if (s === ST.PENDING_CONFIRM) return 'cho-xac-nhan';
    if (s === ST.PENDING_SHIP)    return 'cho-van-chuyen';
    if (s === ST.SHIPPING)        return 'dang-van-chuyen';
    if (s === ST.DELIVERED)       return 'hoan-tat';
    return 'cho-xac-nhan';
  }
  function adminToFrontStatus(s) {
    if (s === 'cho-xac-nhan')    return ST.PENDING_CONFIRM;
    if (s === 'cho-van-chuyen')  return ST.PENDING_SHIP;
    if (s === 'dang-van-chuyen') return ST.SHIPPING;
    if (s === 'hoan-tat')        return ST.DELIVERED;
    return ST.PENDING_CONFIRM;
  }

  /* ========= Kho đơn cho Admin (key 'orders' đúng với orders.js) ========= */
  const ADMIN_ORDERS_KEY = 'orders';
  function readOrdersForAdmin(){
    try { return JSON.parse(localStorage.getItem(ADMIN_ORDERS_KEY) || '[]'); } catch { return []; }
  }
  function writeOrdersForAdmin(list){
    try { localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(list || [])); } catch {}
  }
  function pushOrderForAdmin(order){
    const list = readOrdersForAdmin();
    if (!list.some(o => o.id === order.id)) {
      list.unshift(order);
      writeOrdersForAdmin(list);
    }
  }
  function updateAdminStatusFromFront(code, frontStatus) {
    const orders = readOrdersForAdmin();
    const o = orders.find(x => x.id === code);
    if (!o) return false;
    o.status = frontToAdminStatus(frontStatus);
    writeOrdersForAdmin(orders);
    return true;
  }

  /* ========= (Tuỳ nơi khác dùng) Inbox cũ 'admin:orders' ========= */
  function readAdminOrdersLegacy(){
    try { return JSON.parse(localStorage.getItem('admin:orders')||'[]'); } catch { return []; }
  }
  function writeAdminOrdersLegacy(list){
    try { localStorage.setItem('admin:orders', JSON.stringify(list||[])); } catch {}
  }
  function sendOrderToAdminLegacy(order){
    const list = readAdminOrdersLegacy();
    if (!list.some(o => o.code === order.code)) {
      list.unshift(order);
      writeAdminOrdersLegacy(list);
    }
  }

  /* ========= Render “Đơn hàng của bạn” + Ghi vào Admin ========= */
  function renderOrderSummary(){
    var elDate  = document.getElementById('ord-date');
    var elCode  = document.getElementById('ord-code');
    var elCus   = document.getElementById('ord-customer');
    var elItems = document.getElementById('ord-items');
    var elTotal = document.getElementById('ord-total');
    var elNote  = document.getElementById('ord-note');

    var cart = readCart();
    var info = getCheckoutInfo();
    var user = getUser();

    var now = new Date();
    var code = 'TT-' + now.getFullYear().toString().slice(-2)
                     + (now.getMonth()+1).toString().padStart(2,'0')
                     + now.getDate().toString().padStart(2,'0') + '-'
                     + Math.random().toString(36).slice(2,8).toUpperCase();

    // Tính tổng
    var total = 0;
    if (Array.isArray(cart) && cart.length){
      cart.forEach(function(it){
        var line = (Number(it.price)||0) * (Number(it.qty)||1);
        total += line;
      });
    }

    // tên khách ưu tiên từ tài khoản đăng nhập
    var user = getUser();
    var name =
      (user && (user.displayName || user.name || user.username || user.email)) ||
      info.fullname || info.name || info.customer || 'Khách lẻ';
    var customerId = user && user.id ? user.id : null;

    // (A) Lưu bản cho UI payment (front)
    var orderFront = {
      code,
      date: now.toISOString(),
      customer: name,
      customerId: customerId,
      items: cart,
      total,
      status: ST.PENDING_CONFIRM
    };
    localStorage.setItem('last_order', JSON.stringify(orderFront));

    // (B) Lưu bản cho Admin (schema khớp orders.js: key 'orders')
    const adminOrder = {
      id: code,
      customer: name,
      customerId: customerId,
      date: now.toISOString(),      
      status: 'cho-xac-nhan',
      userId: user ? user.id : null,   
      items: (cart || []).map(it => ({
        productId: it.id || null,
        productName: it.name || it.title || ('Sản phẩm #' + (it.id || '')),
        qty: Number(it.qty) || 1,
        price: (typeof it.price === 'number' ? it.price : Number(it.price) || 0)
      }))
    };
    pushOrderForAdmin(adminOrder);

    // (tuỳ) vẫn ghi vào 'admin:orders' nếu nơi khác đang đọc key này
    sendOrderToAdminLegacy(orderFront);

    // Cập nhật UI tóm tắt ở payment
    if (elDate)  elDate.textContent  = now.toLocaleString('vi-VN');
    if (elCode)  elCode.textContent  = code;
    if (elCus)   elCus.textContent   = name;
    if (elItems) {
      elItems.innerHTML = '';
      if (Array.isArray(cart) && cart.length){
        cart.forEach(function(it){
          var li = document.createElement('li');
          li.innerHTML = `<span class="pname">${it.name || ('Sản phẩm #'+(it.id||''))}</span>
                          <span class="pqty">SL: ${it.qty||1}</span>`;
          elItems.appendChild(li);
        });
      } else {
        var li = document.createElement('li');
        li.textContent = 'Giỏ hàng trống.';
        elItems.appendChild(li);
      }
    }
    if (elTotal) elTotal.textContent = currency(total) + ' đ';
    if (elNote)  elNote.textContent  = 'Cảm ơn bạn đã mua hàng tại TickTock. Chúng tôi sẽ liên hệ để xác nhận đơn.';

    return code;
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
    if (header) hardShow(header, 'grid');
    if (footer) hardShow(footer, 'flex');
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

  /* ========= Trạng thái đơn hàng (nút trong payment) ========= */
  function loadOrder(){
    try { return JSON.parse(localStorage.getItem('last_order')||'null'); } catch { return null; }
  }
  function saveOrder(order){
    localStorage.setItem('last_order', JSON.stringify(order));
    const list = readAdminOrdersLegacy();
    const idx = list.findIndex(o => o.code === order.code);
    if (idx >= 0) { list[idx] = order; writeAdminOrdersLegacy(list); }
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
    const cancelBtn = document.getElementById('ord-cancel-btn');
    const historyBtn = document.getElementById('btn-history'); // Lấy nút lịch sử

    setStepActive(order.status);
    if (textEl) textEl.textContent = statusLabel(order.status);
    if (!btn) return;

    // Logic ẨN/HIỆN nút lịch sử theo yêu cầu của bạn
    if (historyBtn) {
        if (order.status === ST.DELIVERED) {
            historyBtn.style.display = 'block'; // HIỆN
        } else {
            historyBtn.style.display = 'none'; // ẨN
        }
    }

    if (order.status === ST.PENDING_CONFIRM){ btn.textContent='Chờ xác nhận'; btn.disabled=true; }
    else if (order.status === ST.PENDING_SHIP){ btn.textContent='Chờ vận chuyển'; btn.disabled=true; }
    else if (order.status === ST.SHIPPING){ btn.textContent='Xác nhận đã nhận hàng'; btn.disabled=false; }
    else if (order.status === ST.DELIVERED){ btn.textContent='Đã giao'; btn.disabled=true; }

    if (cancelBtn) {
        if (order.status === ST.PENDING_CONFIRM) {
            // Chỉ cho phép hủy khi đang "Chờ xác nhận"
            cancelBtn.style.display = ''; // Hiện nút
            cancelBtn.disabled = false; // Cho phép nhấn
        } else {
            // Ẩn và vô hiệu hóa nếu đã qua trạng thái chờ (đã xác nhận hoặc đang giao)
            cancelBtn.style.display = 'none'; // Ẩn nút
            cancelBtn.disabled = true; // Chặn nhấn
        }
    }

    if (!btn._bound){
      btn.addEventListener('click',function(e){
        e.preventDefault();
        const ord=loadOrder(); if(!ord)return;


          // Dọn giỏ hàng sau khi xác nhận (VÌ ĐƠN NÀY ĐÃ HOÀN TẤT)
          // LƯU Ý: Nếu bạn muốn dọn giỏ ngay khi "Đặt hàng"
          // thì chuyển 2 dòng này vào hàm renderOrderSummary()
        if(ord.status===ST.SHIPPING){
          ord.status=ST.DELIVERED;
          saveOrder(ord);
          updateAdminStatusFromFront(ord.code, ord.status);
          localStorage.removeItem('tt_cart');
          localStorage.removeItem(cartKey());
          
          renderStatus();
          updateHeaderCartCount();
        }
      });
      btn._bound=true;
    }
  }

  /* ===================nút "Hủy "================= */
  function removeOrder(orderCode) {
    if (!orderCode) return;

    // 1. Xóa khỏi 'last_order' (đơn hàng hiện tại của khách)
    try {
      const lastOrder = JSON.parse(localStorage.getItem('last_order') || 'null');
      if (lastOrder && lastOrder.code === orderCode) {
        localStorage.removeItem('last_order');
      }
    } catch {}

    // 2. Xóa khỏi 'orders' (Danh sách của Admin - key mới)
    try {
      let adminOrders = readOrdersForAdmin();
      adminOrders = adminOrders.filter(o => o.id !== orderCode);
      writeOrdersForAdmin(adminOrders);
    } catch {}

    // 3. Xóa khỏi 'admin:orders' (Danh sách của Admin - key cũ)
    try {
      let legacyOrders = readAdminOrdersLegacy();
      legacyOrders = legacyOrders.filter(o => o.code !== orderCode);
      writeAdminOrdersLegacy(legacyOrders);
    } catch {}
  }


  /**
   * ===== HÀM MỚI 2: GẮN SỰ KIỆN HỦY =====
   * (Cần cho chức năng Hủy đơn)
   */
  function attachCancelOrder() {
    const btn = document.getElementById('ord-cancel-btn');
    if (!btn) return;

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (btn.disabled) return; // Kiểm tra lại nếu bị vô hiệu hóa

      const order = loadOrder();
      // Điều kiện an toàn: Phải có đơn hàng và đơn hàng phải ĐANG CHỜ XÁC NHẬN
      if (!order || order.status !== ST.PENDING_CONFIRM) {
        alert("Không thể hủy đơn ở trạng thái này.");
        renderStatus(); // Cập nhật lại UI lỡ bị lệch
        return;
      }

      // Yêu cầu xác nhận trước khi hủy
      if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
        return;
      }

      // 1. CẬP NHẬT TRẠNG THÁI (thay vì XÓA)
      try {
          let adminOrders = readOrdersForAdmin(); // Đọc từ 'orders'
          const orderIndex = adminOrders.findIndex(o => o.id === order.code);
          
          if (orderIndex > -1) {
              adminOrders[orderIndex].status = 'da-huy'; // Đặt trạng thái mới
              writeOrdersForAdmin(adminOrders); // Ghi đè lại
          } else {
              // Nếu không tìm thấy, vẫn xóa đơn hàng 'last_order'
              localStorage.removeItem('last_order');
          }
      } catch (e) { 
          console.error("Lỗi cập nhật lịch sử admin:", e);
      }
      
      // 2. Xóa 'last_order' (nếu vẫn còn) vì đơn hàng này không còn "active"
      localStorage.removeItem('last_order');

      // 3. Xóa giỏ hàng (nếu có)
      localStorage.removeItem('tt_cart');
      localStorage.removeItem(cartKey());
      if (window.ttUpdateCartBadge) window.ttUpdateCartBadge(); // Cập nhật badge giỏ hàng

      // 4. Thông báo thành công
      alert("Bạn đã hủy đơn hàng thành công.");

      // 5. Chuyển hướng về trang chủ
      window.location.href = 'client.html'; 
    });
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

  /* ========= NHẢY VỀ GIỎ HÀNG ========= */
  function goToCart() {
    exitPaymentMode();
    window.location.hash = '#cart';
    const cartEl = document.getElementById('cart');
    cartEl && cartEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // 1) Icon giỏ hàng ở header
  function attachGoCartFromHeader() {
    const candidates = ['.cart', '.cart-link', '.header-cart', '.cart-icon', '[data-go-cart]'];
    const headerCart = candidates.map(q=>document.querySelector(q)).find(Boolean);
    if (!headerCart) return;
    headerCart.style.cursor = 'pointer';
    headerCart.addEventListener('click', (e) => { e.preventDefault(); goToCart(); });
  }
  // 2) Icon/step giỏ hàng trong stepper tiến trình
  function attachGoCartFromStepper() {
    const candidates = ['#step-cart', '.payment-steps .step.cart', '.progress .step.cart'];
    const stepCart = candidates.map(q=>document.querySelector(q)).find(Boolean);
    if (!stepCart) return;
    stepCart.style.cursor = 'pointer';
    stepCart.addEventListener('click', (e) => { e.preventDefault(); goToCart(); });
  }

  /* ========= Router theo hash ========= */
  function route() {
    const last = loadOrder();
    if (window.location.hash === '#payment' && last) {
      onlyShowPayment();
      renderStatus();
    } else {
      exitPaymentMode();
    }
  }

  /* ========= Boot ========= */
  function init() {
    const p = document.querySelector('.payment');
    if (p) { p.setAttribute('hidden', ''); p.style.display = 'none'; }

    const historyBtn = document.getElementById('btn-history');
    if (historyBtn) historyBtn.style.display = 'none';

    attachConfirm();
    attachCancelOrder();
    attachGoCartFromHeader();
    attachGoCartFromStepper();

    window.addEventListener('hashchange', route);
    route();

    // Đồng bộ ngược: Admin đổi trạng thái → trang khách tự cập nhật
    window.addEventListener('storage', function(e){
      if (e.key !== ADMIN_ORDERS_KEY) return;
      try {
        const orders = JSON.parse(e.newValue || '[]');
        const front = loadOrder();
        if (!front) return;
        const matched = orders.find(o => o.id === front.code);
        if (!matched) return;
        const newFrontStatus = adminToFrontStatus(matched.status);
        if (newFrontStatus !== front.status) {
          front.status = newFrontStatus;
          saveOrder(front);
          renderStatus();
        }
      } catch {}
    });
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}

  /* ======== LỊCH SỬ MUA HÀNG ======== */
  function ensureHistoryTbody() {
    var table = document.getElementById('history-table');
    if (!table) return null;
    var tbody = table.querySelector('tbody');
    if (!tbody) { tbody = document.createElement('tbody'); table.appendChild(tbody); }
    return tbody;
  }

  /** Render bảng: Tên sp | Số lượng | Ngày đặt | Trạng thái */
  function renderOrderHistory() {
    var tbody = ensureHistoryTbody();
    if (!tbody) return;

    var orders = readOrdersForAdmin();

    // Lọc theo tên khách (nếu có hiển thị trên trang)
    var customerEl = document.getElementById('ord-customer');
    var customer = (customerEl ? (customerEl.textContent || '') : '').trim();
    if (customer) {
      orders = orders.filter(function (o) { return ((o.customer || '').trim() === customer); });
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
      trEmpty.innerHTML = '<td colspan="5" style="padding:14px 12px;color:#666;">Chưa có đơn nào.</td>';
      tbody.appendChild(trEmpty);
      return;
    }

    // Duyệt từng đơn và từng item
    orders.forEach(function (o) {
      var when = '';
      try { var d = new Date(o.date); if (!isNaN(d)) when = d.toLocaleString('vi-VN'); } catch {}

      (o.items || []).forEach(function (it) {
        var id = it.productId || '—';
        var name = it.productName || it.name || ('Sản phẩm #' + (it.id || ''));
        var qty = Number(it.qty) || 1;

        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td style="padding:10px 12px;border-top:1px solid #f1f1f1;">' + (o.id || '—') + '</td>' +
          '<td style="padding:10px 12px;border-top:1px solid #f1f1f1;">' + name + '</td>' +
          '<td style="padding:10px 12px;border-top:1px solid #f1f1f1;text-align:center;">' + qty + '</td>' +
          '<td style="padding:10px 12px;border-top:1px solid #f1f1f1;white-space:nowrap;">' + when + '</td>' +
          '<td style="padding:10px 12px;border-top:1px solid #f1f1f1;white-space:nowrap;">' + (o.status || '—') + '</td>';
        tbody.appendChild(tr);
      });
    });
  }

  /** Mở/đóng panel lịch sử */
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

  (function bindHistoryDelegation() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('#btn-history');
      if (!btn) return;
      e.preventDefault();
      toggleHistoryPanel();
    });
  })();
})();