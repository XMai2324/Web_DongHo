document.addEventListener('DOMContentLoaded', () => {
  // ===== DOM =====
  const tbody          = document.getElementById('productTbody');
  const searchInput    = document.getElementById('searchInput');
  const filterCategory = document.getElementById('filterCategory');
  const filterBrand    = document.getElementById('filterBrand');

  // ===== DATA =====
  const data = Array.isArray(window.products) ? window.products : [];
  const NOIMG = 'data:image/svg+xml;utf8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="#f3f3f3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">No Image</text></svg>');

  const money = (v) => Number(v || 0).toLocaleString('vi-VN');

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  // ===== RENDER =====
  function render(list) {
    if (!tbody) return;
    if (!Array.isArray(list) || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888">Không có sản phẩm</td></tr>`;
      return;
    }

    // Tạo 1 lần cho nhanh
    const rows = list.map(p => {
     const img = esc(resolveImgPath(p));
      return `
        <tr>
          <td>
            <img class="thumb" src="${img}" alt="${esc(p.name)}"
                 onerror="this.onerror=null;this.src='${NOIMG}';" />
          </td>
          <td title="${esc(p.description || '')}">${esc(p.name)}</td>
          <td>${money(p.price)}</td>
          <td>${esc(p.category)}</td>
          <td>${esc(p.brand)}</td>
          <td>
            <button class="btn icon" data-action="edit" data-name="${esc(p.name)}" title="Sửa">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn icon" data-action="del" data-name="${esc(p.name)}" title="Xóa">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>`;
    }).join('');

    tbody.innerHTML = rows;
  }

  // ===== FILTER + SEARCH =====
  function getFiltered() {
    const q   = (searchInput?.value || '').trim().toLowerCase();
    const cat = filterCategory?.value || '';
    const br  = filterBrand?.value || '';

    return data.filter(p => {
      const okSearch = !q || (p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
      const okCat    = !cat || p.category === cat;
      const okBrand  = !br  || p.brand === br;
      return okSearch && okCat && okBrand;
    });
  }
  function applyFilter() { render(getFiltered()); }

  // ===== EVENTS =====
  [searchInput, filterCategory, filterBrand].forEach(el => {
    el?.addEventListener('input', applyFilter);
    el?.addEventListener('change', applyFilter);
  });

  // (tuỳ chọn) hành động edit/xoá — hiện chỉ log để bạn nối CRUD sau
  tbody?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const name   = btn.getAttribute('data-name');
    console.log(`[${action}]`, name);
    // TODO: openEdit(name) hoặc deleteByName(name)
  });

  const IMG_BASE = '/view/'; // vì admin.html nằm ở /admin/

    function resolveImgPath(p) {
    const raw = (p.image || '').trim();
    if (!raw) return '';
    // nếu đã là tuyệt đối (/view/...) thì giữ nguyên
    if (raw.startsWith('/')) return raw;
    // nếu đã có ../ thì tôn trọng
    if (raw.startsWith('../')) return raw;
    // mặc định thêm /view/ phía trước
    return IMG_BASE + raw.replace(/^(\.\/)?/, '');
    }

  // ===== INIT =====
  render(data);
});
