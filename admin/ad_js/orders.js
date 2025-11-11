// ../admin/ad_js/orders.js (no seed version)
(function () {
  // ====== tiện ích ======
  const STATUS_TEXT = {
    'cho-xac-nhan':     'Chờ xác nhận',
    'cho-van-chuyen':   'Chờ vận chuyển',
    'dang-van-chuyen':  'Đang vận chuyển',
    'hoan-tat':         'Nhận hàng thành công',
    'da-huy':           'Đã hủy'
  };
  const ORDERS_KEY = 'orders';
  const money = n => (Number(n) || 0).toLocaleString('vi-VN');
  const qsi = (sel) => document.getElementById(sel);

  // parse ngày từ input date (yyyy-mm-dd)
  function parseDateInput(v) {
    if (!v) return null;
    const [y, m, d] = v.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d); // local 00:00
  }
  function endOfDay(dt) {
    const x = new Date(dt);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  // Chờ DOM + products sẵn sàng
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }
  function waitProducts(maxMs = 3000) {
    return new Promise(resolve => {
      const start = Date.now();
      (function loop() {
        if (Array.isArray(window.products) && window.products.length) return resolve();
        if (Date.now() - start > maxMs) return resolve();
        setTimeout(loop, 100);
      })();
    });
  }

  // IO localStorage
  function loadOrders() {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  // Map sản phẩm
  function buildProductMap() {
    return (window.products || []).reduce((m, p) => (m[p.name] = p, m), {});
  }
  function calcTotal(order, PRODUCT_MAP) {
    let sum = 0;
    (order.items || []).forEach(it => {
      const p = PRODUCT_MAP[it.productName] || {};
      const unit = (typeof it.price === 'number' ? it.price : p.price) || 0;
      sum += unit * (Number(it.qty) || 0);
    });
    return sum;
  }

  function statusBadge(code) {
    return `<span class="status ${code}">${STATUS_TEXT[code] || code}</span>`;
  }
  function rowIconCell(id) {
    return `<button class="icon-cell-btn" title="Chi tiết" data-action="detail" data-id="${id}">
              <i class="fa-regular fa-eye"></i>
            </button>`;
  }

  // ====== MIGRATE từ “inbox” của payment sang orders (1 lần) ======
  function mapStatusFromPayment(st) {
    // payment.js dùng: pending_confirmation, pending_shipment, shipping, delivered
    if (st === 'pending_confirmation') return 'cho-xac-nhan';
    if (st === 'pending_shipment')    return 'cho-van-chuyen';
    if (st === 'shipping')            return 'dang-van-chuyen';
    if (st === 'delivered')           return 'hoan-tat';
    return 'cho-xac-nhan';
  }
  function migrateFromAdminInboxIfNeeded() {
    const cur = loadOrders();
    if (cur.length) return; // đã có dữ liệu rồi thì thôi

    let inbox = [];
    try { inbox = JSON.parse(localStorage.getItem('admin:orders') || '[]'); } catch {}
    if (!Array.isArray(inbox) || !inbox.length) return;

    const mapped = inbox.map(o => ({
      id:        o.code || o.id || ('TT-' + Math.random().toString(36).slice(2,8).toUpperCase()),
      customer:  o.customer || 'Khách lẻ',
      date:      o.date || new Date().toISOString(),
      status:    mapStatusFromPayment(o.status),
      items:     (o.items || []).map(it => ({
        productName: it.name || it.productName || ('Sản phẩm #' + (it.id || '')),
        qty:         Number(it.qty) || 1,
        price:       typeof it.price === 'number' ? it.price : undefined
      }))
    }));

    // Ghi vào ORDERS_KEY để admin dùng chung 1 kho ổn định
    saveOrders(mapped);
  }

  // ====== Render ======
  function renderOrders(PRODUCT_MAP) {
    const tbody  = qsi('orderTbody');
    const status = qsi('orderStatusFilter')?.value || '';

    // lọc ngày (ưu tiên)
    const df = parseDateInput(qsi('orderDateFrom')?.value || '');
    const dt = parseDateInput(qsi('orderDateTo')?.value || '');
    const useDateFilter = !!(df || dt);

    const orders = loadOrders();

    const rows = orders
      .filter(o => {
        if (useDateFilter) {
          const t = new Date(o.date).getTime();
          if (df && t < df.getTime()) return false;
          if (dt && t > endOfDay(dt).getTime()) return false;
          return true;
        }
        return !status || o.status === status;
      })
      .map(o => {
        const total   = calcTotal(o, PRODUCT_MAP);
        const dateStr = new Date(o.date).toLocaleDateString('vi-VN');

        const confirmDisabled = o.status !== 'cho-xac-nhan';
        const shipDisabled    = o.status !== 'cho-van-chuyen';

        return `
          <tr>
            <td>${rowIconCell(o.id)}</td>
            <td>${dateStr}</td>
            <td>#${o.id}</td>
            <td>${o.customer}</td>
            <td>${money(total)}</td>
            <td>${statusBadge(o.status)}</td>
            <td>
              <button class="btn small ghost ${confirmDisabled ? 'disabled' : ''}"
                      data-action="confirm" data-id="${o.id}"
                      ${confirmDisabled ? 'disabled' : ''}>Xác nhận</button>
              <button class="btn small primary ${shipDisabled ? 'disabled' : ''}"
                      data-action="ship" data-id="${o.id}"
                      ${shipDisabled ? 'disabled' : ''}>Vận chuyển</button>
            </td>
          </tr>
        `;
      }).join('');

    tbody.innerHTML = rows || `<tr><td colspan="7">Không có đơn hàng phù hợp</td></tr>`;
  }

  // Modal chi tiết
  function openOrderDetail(order, PRODUCT_MAP) {
    qsi('mdOrderId').value   = '#' + order.id;
    qsi('mdCustomer').value  = order.customer;
    qsi('mdDate').value      = new Date(order.date).toLocaleDateString('vi-VN');
    qsi('mdTotal').value     = money(calcTotal(order, PRODUCT_MAP)) + ' ₫';

    const html = (order.items || []).map(it => {
      const p = PRODUCT_MAP[it.productName] || {};
      const unit = (typeof it.price === 'number' ? it.price : p.price) || 0;
      const line = unit * (Number(it.qty)||0);
      return `
        <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #eee">
          <div style="display:flex;gap:10px;align-items:center;">
            ${p.image ? `<img src="${p.image}" style="width:42px;height:42px;object-fit:cover;border-radius:6px;border:1px solid #eee;">` : ''}
            <span>${it.productName} × ${it.qty}</span>
          </div>
          <span>${money(line)}</span>
        </div>
      `;
    }).join('');
    qsi('mdItems').innerHTML = html || 'Không có sản phẩm';

    qsi('orderDetailModal').style.display = 'flex';
  }

  // ===== Khởi tạo =====
  ready(async () => {
    await waitProducts();
    const PRODUCT_MAP = buildProductMap();

    // Quan trọng: nhập dữ liệu từ "admin:orders" nếu "orders" còn trống
    migrateFromAdminInboxIfNeeded();

    renderOrders(PRODUCT_MAP);

    // Lọc trạng thái -> clear ô ngày
    qsi('orderStatusFilter')?.addEventListener('change', () => {
      const df = qsi('orderDateFrom'); const dt = qsi('orderDateTo');
      if (df) df.value = ''; if (dt) dt.value = '';
      renderOrders(PRODUCT_MAP);
    });

    // Lọc ngày -> clear trạng thái
    ['orderDateFrom', 'orderDateTo'].forEach(id => {
      qsi(id)?.addEventListener('change', () => {
        const st = qsi('orderStatusFilter'); if (st) st.value = '';
        renderOrders(PRODUCT_MAP);
      });
    });

    // Click trong bảng
    qsi('orderTbody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      const orders = loadOrders();
      const order = orders.find(o => o.id === id);
      if (!order) return;

      if (action === 'detail') {
        openOrderDetail(order, PRODUCT_MAP);
        return;
      }

      if (action === 'confirm') {
        if (order.status === 'cho-xac-nhan') {
          order.status = 'cho-van-chuyen';
          saveOrders(orders);
          renderOrders(PRODUCT_MAP);
        }
        return;
      }

      if (action === 'ship') {
        if (order.status === 'cho-van-chuyen') {
          order.status = 'dang-van-chuyen';
          saveOrders(orders);
          renderOrders(PRODUCT_MAP);
        }
        return;
      }
    });

    // Đóng modal
    qsi('btnCloseOrderDetail')?.addEventListener('click', () => qsi('orderDetailModal').style.display = 'none');
    qsi('orderDetailModal')?.addEventListener('click', (e) => {
      if (e.target === qsi('orderDetailModal')) qsi('orderDetailModal').style.display = 'none';
    });

    // Đồng bộ khi tab khác cập nhật
    window.addEventListener('storage', (e) => {
      if (e.key === ORDERS_KEY || e.key === 'admin:orders') {
        // nếu có thay đổi ở 'admin:orders' mà 'orders' rỗng -> migrate lại
        if (loadOrders().length === 0) migrateFromAdminInboxIfNeeded();
        renderOrders(PRODUCT_MAP);
      }
    });

    // API công khai (nếu phía khách gọi về)
    window.OrderAPI = {
      markReceived(id) {
        try {
          const orders = loadOrders();
          const o = orders.find(x => x.id === id);
          if (!o) return false;
          if (o.status === 'dang-van-chuyen') {
            o.status = 'hoan-tat';
            saveOrders(orders);
            renderOrders(PRODUCT_MAP);
            return true;
          }
          return false;
        } catch { return false; }
      }
    };
  });
})();