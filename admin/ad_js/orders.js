// ../admin/ad_js/orders.js
(function () {
  // ====== tiện ích ======
  const STATUS_TEXT = {
    'cho-xac-nhan': 'Chờ xác nhận',
    'cho-van-chuyen': 'Chờ vận chuyển',
    'dang-van-chuyen': 'Đang vận chuyển',
    'hoan-tat': 'Nhận hàng thành công'
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
        if (Date.now() - start > maxMs) return resolve(); // hết thời gian vẫn resolve
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

  // Tính tổng từ items + products (nếu item không có price thì lấy theo tên trong products)
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
    // icon con mắt
    return `<button class="icon-cell-btn" title="Chi tiết" data-action="detail" data-id="${id}">
              <i class="fa-regular fa-eye"></i>
            </button>`;
  }

  // Render bảng theo cột: (icon) Ngày đặt, Mã đơn, Khách hàng, Tổng tiền, Trạng thái, Thao tác
  function renderOrders(PRODUCT_MAP) {
    const tbody  = qsi('orderTbody');
    const status = qsi('orderStatusFilter')?.value || '';

    // đọc bộ lọc ngày (nếu nhập 1 trong 2 ô ngày => dùng lọc ngày, bỏ lọc trạng thái)
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

        // làm mờ nút theo trạng thái
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

    // show modal center
    qsi('orderDetailModal').style.display = 'flex';
  }

  // Seed dữ liệu mẫu nếu rỗng hoặc merge nếu có sẵn (tránh trùng id)
  function seedOrMergeSamples() {
    const cur = loadOrders();
    const exist = new Set(cur.map(o => o.id));

    const samples = [
      { id: 'DH001', customer: 'Nguyễn Văn A', date: new Date().toISOString(),
        status: 'cho-xac-nhan',
        items: [{ productName: 'Casio World Time AE-1200WHD-1A', qty: 1 }] },

      { id: 'DH002', customer: 'Trần Thị B',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'hoan-tat',
        items: [{ productName: 'Casio W-737H-8AV Digital 10-Year Battery', qty: 1 }] },

      { id: 'DH003', customer: 'Lê Văn C',
        date: new Date(Date.now() - 2*86400000).toISOString(),
        status: 'cho-xac-nhan',
        items: [{ productName: 'Citizen Eco-Drive BM7100-59E', qty: 1 }] },

      { id: 'DH004', customer: 'Phạm Thị D',
        date: new Date(Date.now() - 3*86400000).toISOString(),
        status: 'cho-van-chuyen',
        items: [{ productName: 'Rolex Oyster Perpetual 126000', qty: 1 }] },

      { id: 'DH005', customer: 'Ngô Văn E',
        date: new Date(Date.now() - 4*86400000).toISOString(),
        status: 'dang-van-chuyen',
        items: [{ productName: 'Seiko 5 Sports SRPD55K1', qty: 2 }] },

      { id: 'DH006', customer: 'Hoàng Thị F',
        date: new Date(Date.now() - 5*86400000).toISOString(),
        status: 'hoan-tat',
        items: [{ productName: 'Rado Centrix Automatic Open Heart', qty: 1 }] },

      { id: 'DH007', customer: 'Đỗ Quang G',
        date: new Date(Date.now() - 6*86400000).toISOString(),
        status: 'cho-xac-nhan',
        items: [{ productName: 'Casio MTP-V300D-1A2V', qty: 1 }] },

      { id: 'DH008', customer: 'Bùi Thị H',
        date: new Date(Date.now() - 7*86400000).toISOString(),
        status: 'cho-van-chuyen',
        items: [{ productName: 'Citizen EM0680-50D Eco-Drive', qty: 1 }] },

      { id: 'DH009', customer: 'Phan Văn I',
        date: new Date(Date.now() - 8*86400000).toISOString(),
        status: 'dang-van-chuyen',
        items: [{ productName: 'Seiko Presage Cocktail Time SRPB43J1', qty: 1 }] },

      { id: 'DH010', customer: 'Trịnh Thị K',
        date: new Date(Date.now() - 9*86400000).toISOString(),
        status: 'hoan-tat',
        items: [{ productName: 'Casio Edifice EFV-540D-1AV', qty: 1 }] },
    ];

    const merged = cur.concat(samples.filter(o => !exist.has(o.id)));
    saveOrders(merged);
  }

  // ===== Helpers reset để không chạy cùng lúc =====
  function clearDateInputs() {
    const df = qsi('orderDateFrom');
    const dt = qsi('orderDateTo');
    if (df) df.value = '';
    if (dt) dt.value = '';
  }
  function clearStatusFilter() {
    const st = qsi('orderStatusFilter');
    if (st) st.value = '';
  }

  // ==== Khởi tạo an toàn ====
  ready(async () => {
    await waitProducts();
    const PRODUCT_MAP = buildProductMap();
    seedOrMergeSamples();
    renderOrders(PRODUCT_MAP);

    // Lọc trạng thái: khi đổi trạng thái -> xóa 2 ô ngày (độc lập)
    qsi('orderStatusFilter')?.addEventListener('change', () => {
      clearDateInputs();
      renderOrders(PRODUCT_MAP);
    });

    // Tra cứu theo ngày: khi đổi ngày -> xóa lọc trạng thái (độc lập)
    ['orderDateFrom', 'orderDateTo'].forEach(id => {
      qsi(id)?.addEventListener('change', () => {
        clearStatusFilter();
        renderOrders(PRODUCT_MAP);
      });
    });

    // Click hành động trong bảng
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
        // "Xác nhận" -> "Chờ vận chuyển"
        if (order.status === 'cho-xac-nhan') {
          order.status = 'cho-van-chuyen';
          saveOrders(orders);
          renderOrders(PRODUCT_MAP);
        }
        return;
      }

      if (action === 'ship') {
        // Admin đẩy tới "Đang vận chuyển" (KH nhấn 'Đã nhận hàng' ở phía khách mới thành 'hoan-tat')
        if (order.status === 'cho-van-chuyen') {
          order.status = 'dang-van-chuyen';
          saveOrders(orders);
          renderOrders(PRODUCT_MAP);
        }
        return;
      }
    });

    // Modal close
    qsi('btnCloseOrderDetail')?.addEventListener('click', () => qsi('orderDetailModal').style.display = 'none');
    qsi('orderDetailModal')?.addEventListener('click', (e) => {
      if (e.target === qsi('orderDetailModal')) qsi('orderDetailModal').style.display = 'none';
    });

    // Tự cập nhật khi localStorage.orders thay đổi (ví dụ phía khách nhấn "Đã nhận hàng")
    window.addEventListener('storage', (e) => {
      if (e.key === 'orders') renderOrders(PRODUCT_MAP);
    });

    // API public cho trang khách (tuỳ bạn dùng)
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
