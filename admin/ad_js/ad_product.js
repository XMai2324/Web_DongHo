// FILE: ../admin/ad_js/ad_product.js
(() => {
  'use strict';

  // ===== STORAGE KEYS =====
  const STORAGE_KEY_PRODUCTS = 'admin_products';
  const STORAGE_KEY_ACCESS   = 'admin_accessories';

  // ===== Watches data =====
  let productsData = [];
  const fromProdLS = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  productsData = fromProdLS ? JSON.parse(fromProdLS) : (Array.isArray(window.products) ? window.products.slice() : []);
  const saveProducts = () => localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(productsData));
  window.saveData = saveProducts;

  const getNextWatchId = () => {
    if (!productsData.length) return 1;
    const maxId = Math.max(...productsData.map(p => Number(p.id) || 0));
    return (isFinite(maxId) ? maxId : 0) + 1;
  };

  // ===== Accessories data =====
  let accessoriesData = [];
  const fromAccLS = localStorage.getItem(STORAGE_KEY_ACCESS);
  accessoriesData = fromAccLS ? JSON.parse(fromAccLS) : (Array.isArray(window.accessories) ? window.accessories.slice() : []);
  const saveAccessories = () => localStorage.setItem(STORAGE_KEY_ACCESS, JSON.stringify(accessoriesData));
  window.productsData    = productsData;
  window.accessoriesData = accessoriesData;
  window.saveAccessories = saveAccessories;

  // ===== Resolve image path =====
  const IMG_BASE = location.pathname.includes('/admin/') ? '/view/' : '';
  const resolveImgPath = (p) => {
    let raw = (p?.image || '').trim();
    if (!raw) return '';
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) return raw;
    raw = raw
      .replace(/^image\/Accessory\//i, 'image/accessories/')
      .replace(/^image\/Accessories\//i, 'image/accessories/')
      .replace(/^image\/Watchs?\//i, 'image/Watch/')
      .replace(/strap13\.jpg_\.avif$/i, 'strap13.jpg');
    if (raw.startsWith('image/')) return `${IMG_BASE}${raw}`;
    if (/^(Watch|accessories)\//i.test(raw)) return `${IMG_BASE}image/${raw}`;
    return `${IMG_BASE}image/${raw.replace(/^(\.\/)+/, '')}`;
  };
  window.resolveImgPath = resolveImgPath;

  // ===== Ensure IDs =====
  (function ensureIds() {
    let changed = false;
    productsData.forEach(p => { if (!p.id) { p.id = getNextWatchId(); changed = true; } });
    if (changed) saveProducts();
  })();

  (function ensureAccIds() {
    let maxId = 0;
    accessoriesData.forEach(a => { maxId = Math.max(maxId, Number(a.id)||0, Number(a._id)||0); });
    accessoriesData.forEach((a, idx) => {
      if (!a.id) a.id = Number(a._id) || (maxId + idx + 1);
      if (a.isHidden === undefined) a.isHidden = false;
      if (!a.category) a.category = 'phukien';
    });
    saveAccessories();
  })();

  // ===== DOM refs (Watches) =====
  let modal, modalBox, modalBody, form, btnAdd, btnCancel, modalTitle;
  let inputId, inputName, inputPrice, inputCat, inputBrand, inputDesc, fileInput, imgPreview;
  let tbody, filterCategory, filterBrand;

  document.addEventListener('DOMContentLoaded', () => {
    // Watches modal
    modal       = document.getElementById('watchModal');
    modalBox    = modal?.querySelector('.modal-content');
    modalBody   = modal?.querySelector('.modal-body');
    form        = document.getElementById('addForm');
    btnAdd      = document.getElementById('btnAdd');
    btnCancel   = document.getElementById('btnCancel');
    modalTitle  = modal?.querySelector('.modal-title');

    inputId     = document.getElementById('watchId');
    inputName   = document.getElementById('watchName');
    inputPrice  = document.getElementById('watchPrice');
    inputCat    = document.getElementById('watchCategory');
    inputBrand  = document.getElementById('watchBrand');
    inputDesc   = document.getElementById('watchDesc');
    fileInput   = document.getElementById('watchImageFile');
    imgPreview  = document.getElementById('imagePreview');

    // Table/filters
    tbody          = document.getElementById('productTbody');
    filterCategory = document.getElementById('filterCategory'); // <select id="filterCategory">
    filterBrand    = document.getElementById('filterBrand');    // <select id="filterBrand">

    // ===== UI helpers =====
    const lockScroll = () => {
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = sbw ? sbw + 'px' : '';
      document.body.style.overflow = 'hidden';
    };
    const unlockScroll = () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };

    let previewURL = null;
    const clearPreview = () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
      previewURL = null;
      if (imgPreview) {
        imgPreview.removeAttribute('src');
        imgPreview.style.display = 'none';
      }
      if (fileInput) fileInput.value = '';
    };

    const resetForm = () => {
      form?.reset();
      if (inputId) inputId.value = '';
      clearPreview();
      modalBody?.scrollTo?.({ top: 0 });
    };

    const openModal = (mode = 'add') => {
      if (!modal) return;
      resetForm();
      if (modalTitle) modalTitle.textContent = (mode === 'edit' ? 'Sửa Đồng Hồ' : 'Thêm Đồng Hồ');
      modal.classList.add('show');
      lockScroll();
      setTimeout(() => inputName?.focus(), 0);
    };
    const closeModal = () => {
      if (!modal) return;
      modal.classList.remove('show');
      unlockScroll();
      clearPreview();
    };
    window.openModal = openModal;
    window.closeModal = closeModal;

    btnCancel?.addEventListener('click', (e) => { e.preventDefault?.(); closeModal(); });
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    modalBox?.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('show')) closeModal(); });

    fileInput?.addEventListener('change', () => {
      const f = fileInput.files?.[0];
      if (!f || !f.type?.startsWith('image/')) { clearPreview(); return; }
      if (previewURL) URL.revokeObjectURL(previewURL);
      previewURL = URL.createObjectURL(f);
      imgPreview.src = previewURL;
      imgPreview.style.display = 'block';
    });

    // ===== table helpers =====
    const NOIMG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="#f3f3f3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">No Image</text></svg>');
    const money = v => Number(v || 0).toLocaleString('vi-VN');
    const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));

    // Chỉ lọc theo category/brand cho Đồng hồ (đÃ bỏ tìm kiếm bằng nhập tên)
    const applyWatchFilter = (list) => {
      const cat = (filterCategory?.value || '');
      const br  = (filterBrand?.value || '');
      return list.filter(p => (!cat || p.category === cat) && (!br || p.brand === br));
    };

    const render = (list) => {
      if (!tbody) return;
      if (!Array.isArray(list) || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888">Không có sản phẩm</td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(p => {
        const img = esc(resolveImgPath(p));
        return `
          <tr>
            <td><img class="thumb" src="${img}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='${NOIMG}'" /></td>
            <td title="${esc(p.description || '')}">${esc(p.name)} ${p.isHidden ? '<span class="badge muted">Ẩn</span>' : ''}</td>
            <td>${money(p.price)}</td>
            <td>${esc(p.category)}</td>
            <td>${esc(p.brand)}</td>
            <td>
              <button class="btn icon" type="button" data-action="edit" data-id="${p.id}" title="Sửa"><i class="fa-solid fa-pen"></i></button>
              <button class="btn icon" type="button" data-action="toggle-hide" data-id="${p.id}" title="${p.isHidden ? 'Hiện lên client' : 'Ẩn khỏi client'}"><i class="fa-solid ${p.isHidden ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
              <button class="btn icon" type="button" data-action="del" data-id="${p.id}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`;
      }).join('');
    };

    const update = () => render(applyWatchFilter(productsData));
    window.update = update;

    const openEdit = (id) => {
      const product = productsData.find(p => Number(p.id) === Number(id));
      if (!product) return alert('Không tìm thấy sản phẩm!');
      openModal('edit');
      inputId.value    = product.id;
      inputName.value  = product.name || '';
      inputPrice.value = product.price || 0;
      inputCat.value   = product.category || '';
      inputBrand.value = product.brand || '';
      inputDesc.value  = product.description || '';
      const path = resolveImgPath(product) || NOIMG;
      imgPreview.src = path;
      imgPreview.style.display = 'block';
    };
    window.openEdit = openEdit;

    const doDelete = (id) => {
      const idx = productsData.findIndex(p => Number(p.id) === Number(id));
      if (idx === -1) return;
      if (confirm(`Xóa "${productsData[idx].name}"?`)) {
        productsData.splice(idx, 1);
        saveProducts();
        update();
        alert('Đã xóa sản phẩm!');
      }
    };

    tbody?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = Number(btn.getAttribute('data-id'));
      if (action === 'edit') return openEdit(id);
      if (action === 'del')  return doDelete(id);
      if (action === 'toggle-hide') {
        const item = productsData.find(p => Number(p.id) === id);
        if (!item) return;
        item.isHidden = !item.isHidden;
        saveProducts();
        update();
        alert(item.isHidden ? 'Đã ẩn sản phẩm khỏi client.' : 'Đã hiện sản phẩm trên client.');
      }
    });

    // ===== Submit Watches =====
    function readFileAsDataURL(file){
      return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const isEditing   = !!inputId.value;
      const name        = inputName?.value?.trim() || '';
      const price       = Number(inputPrice?.value || 0);
      const category    = inputCat?.value || '';
      const brand       = inputBrand?.value || '';
      const description = inputDesc?.value?.trim() || '';
      if (!name || price <= 0 || !category || !brand) { alert('Vui lòng điền đầy đủ Tên, Giá (>0), Loại và Thương hiệu.'); return; }

      const hasNewFile = (fileInput?.files?.length || 0) > 0;
      let image = '';
      if (hasNewFile) { image = await readFileAsDataURL(fileInput.files[0]); }
      else { const slug = name.toLowerCase().replace(/\s+/g, '-'); image = `${slug}.jpg`; }

      if (isEditing) {
        const id = Number(inputId.value);
        const idx = productsData.findIndex(p => Number(p.id) === id);
        if (idx === -1) { alert('Không tìm thấy sản phẩm để cập nhật.'); return; }
        if (!hasNewFile) image = productsData[idx].image || image;
        productsData[idx] = { ...productsData[idx], name, price, category, brand, description, image };
      } else {
        if (productsData.some(p => (p.name || '').trim().toLowerCase() === name.toLowerCase())) { alert('Sản phẩm đã tồn tại (trùng tên).'); return; }
        const newItem = { id: getNextWatchId(), name, price, category, brand, description, image, isHidden: false };
        productsData.unshift(newItem);
      }

      saveProducts();
      update();
      closeModal();
      alert(isEditing ? `Đã cập nhật: ${name}` : `Đã thêm mới: ${name}`);
    });

    // Render lần đầu
    update();

    // ===== Lắng nghe thay đổi filter (chỉ cho "Đồng hồ")
    filterCategory?.addEventListener('change', () => update());
    filterBrand?.addEventListener('change', () => update());
  });
})();

// ===== MULTI-SECTION & ACCESSORY MODAL (không tìm kiếm) =====
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  document.addEventListener('DOMContentLoaded', () => {
    const leftMenu   = document.getElementById('leftMenu');
    const h1Title    = document.querySelector('.toolbar h1');
    const btnAdd     = document.getElementById('btnAdd');
    const btnAddAcc  = document.getElementById('btnAddAcc');
    const tbody      = document.getElementById('productTbody');
    const table      = document.getElementById('productTable');
    const thead      = table?.querySelector('thead');

    // Filter select (dù ở tab nào vẫn hiện, nhưng chỉ áp dụng cho "Đồng hồ")
    const filterCat = document.getElementById('filterCategory');
    const filterBr  = document.getElementById('filterBrand');

    let current = 'watch'; // watch | strap | box | glass
    const money = v => Number(v || 0).toLocaleString('vi-VN');
    const esc   = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
    const NOIMG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="#f3f3f3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">No Image</text></svg>');

    // ===== Accessory modal refs =====
    const accModal      = $('#accessoryModal');
    const accTitleEl    = $('#accessoryModal .modal-title');
    const accForm       = $('#addAccForm');
    const accIdEl       = $('#accId');
    const accNameEl     = $('#accName');
    const accPriceEl    = $('#accPrice');
    const accKindEl     = $('#accKind');
    const accTypeEl     = $('#accType');      // glass only
    const accMatEl      = $('#accMaterial');  // strap only
    const accColorEl    = $('#accColor');     // strap only
    const accDescEl     = $('#accDesc');
    const accPreviewEl  = $('#accImagePreview');
    const accImageFile  = $('#accImageFile');

    const accLabel = (k) => ({ strap:'Dây đeo', box:'Hộp đựng', glass:'Kính cường lực' }[k] || 'Phụ kiện');
    function toggleAccFields(k){
      $$('.acc-only').forEach(el => el.style.display = 'none');
      if (k === 'strap') { $$('.acc-strap').forEach(el => el.style.display = ''); }
      if (k === 'glass') { $$('.acc-glass').forEach(el => el.style.display = ''); }
    }

    function getList() {
      if (current === 'watch') return window.productsData || [];
      const all = (window.accessoriesData || []);
      return all.filter(a => (a.accessory || '').toLowerCase() === current);
    }

    function renderHead() {
      if (current === 'watch') {
        thead.innerHTML = `
          <tr>
            <th style="width:150px;">Ảnh</th>
            <th>Tên</th>
            <th style="width:120px;">Giá (₫)</th>
            <th style="width:120px;">Danh mục</th>
            <th style="width:120px;">Thương hiệu</th>
            <th style="width:220px;">Thao tác</th>
          </tr>`;
      } else if (current === 'strap') {
        thead.innerHTML = `
          <tr>
            <th style="width:150px;">Ảnh</th>
            <th>Tên dây</th>
            <th style="width:120px;">Giá (₫)</th>
            <th style="width:140px;">Chất liệu</th>
            <th style="width:120px;">Màu</th>
            <th style="width:120px;">Loại</th>
            <th style="width:220px;">Thao tác</th>
          </tr>`;
      } else if (current === 'box') {
        thead.innerHTML = `
          <tr>
            <th style="width:150px;">Ảnh</th>
            <th>Tên hộp</th>
            <th style="width:120px;">Giá (₫)</th>
            <th>Mô tả</th>
            <th style="width:120px;">Loại</th>
            <th style="width:220px;">Thao tác</th>
          </tr>`;
      } else {
        thead.innerHTML = `
          <tr>
            <th style="width:150px;">Ảnh</th>
            <th>Tên kính</th>
            <th style="width:120px;">Giá (₫)</th>
            <th style="width:140px;">Loại kính</th>
            <th style="width:120px;">Loại</th>
            <th style="width:220px;">Thao tác</th>
          </tr>`;
      }
    }

    function renderBody(list) {
      if (current === 'watch') { window.update?.(); return; } // phần đồng hồ đã render ở IIFE trên
      if (!list.length) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888">Không có sản phẩm</td></tr>`; return; }
      const rows = list.map((p, idx) => {
        const pid = Number(p.id ?? (p._id ?? (p._id = Date.now() + idx)));
        const img = (window.resolveImgPath ? window.resolveImgPath(p) : (p.image || '')) || '';
        const src = img ? img : NOIMG;

        const actionBtns = `
          <button class="btn icon" data-action="a-edit" data-id="${pid}" title="Sửa"><i class="fa-solid fa-pen"></i></button>
          <button class="btn icon" data-action="a-toggle-hide" data-id="${pid}" title="${p.isHidden ? 'Hiện lên client' : 'Ẩn khỏi client'}">
            <i class="fa-solid ${p.isHidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
          </button>
          <button class="btn icon" data-action="a-del" data-id="${pid}" title="Xóa"><i class="fa-solid fa-trash"></i></button>`;

        if (current === 'strap') {
          return `
            <tr>
              <td><img class="thumb" src="${src}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='${NOIMG}'" /></td>
              <td>${esc(p.name)} ${p.isHidden ? '<span class="badge muted">Ẩn</span>' : ''}</td>
              <td>${money(p.price)}</td>
              <td>${esc(p.material || '')}</td>
              <td>${esc(p.color || '')}</td>
              <td>${esc(p.accessory)}</td>
              <td>${actionBtns}</td>
            </tr>`;
        }
        if (current === 'box') {
          return `
            <tr>
              <td><img class="thumb" src="${src}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='${NOIMG}'" /></td>
              <td>${esc(p.name)} ${p.isHidden ? '<span class="badge muted">Ẩn</span>' : ''}</td>
              <td>${money(p.price)}</td>
              <td title="${esc(p.description || '')}">${esc(p.description || '')}</td>
              <td>${esc(p.accessory)}</td>
              <td>${actionBtns}</td>
            </tr>`;
        }
        // glass
        return `
          <tr>
            <td><img class="thumb" src="${src}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='${NOIMG}'" /></td>
            <td>${esc(p.name)} ${p.isHidden ? '<span class="badge muted">Ẩn</span>' : ''}</td>
            <td>${money(p.price)}</td>
            <td>${esc(p.type || '')}</td>
            <td>${esc(p.accessory)}</td>
            <td>${actionBtns}</td>
          </tr>`;
      }).join('');
      tbody.innerHTML = rows;
    }

    function update() {
      renderHead();
      const list = getList();
      if (current === 'watch') { window.update?.(); return; } // đã apply filter ở IIFE trên
      renderBody(list); // phụ kiện không có tìm kiếm, không filter
    }

    // ==== EVENTS ====
    leftMenu?.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-entity]');
      if (!li) return;
      current = li.getAttribute('data-entity');
      leftMenu.querySelectorAll('li').forEach(x => x.classList.remove('is-active'));
      li.classList.add('is-active');
      // Luôn bật filter cho UI (nhưng chỉ tác dụng ở tab Đồng hồ)
      filterCat && (filterCat.disabled = false);
      filterBr  && (filterBr.disabled  = false);
      // Cập nhật tiêu đề + bảng
      const titleMap = { watch:'Quản lý đồng hồ', strap:'Quản lý dây đeo', box:'Quản lý hộp đựng', glass:'Kính cường lực' };
      if (h1Title) h1Title.textContent = titleMap[current];
      update();
    });

    // Add buttons
    btnAdd?.addEventListener('click', (e) => { e.preventDefault?.(); current === 'watch' ? window.openModal?.('add') : openAccessoryModal('add'); });
    btnAddAcc?.addEventListener('click', (e) => { e.preventDefault?.(); openAccessoryModal('add'); });

    // Table actions for accessories
    tbody?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = Number(btn.dataset.id);
      if (!action.startsWith('a-')) return; // not accessory action

      const idx = (window.accessoriesData || []).findIndex(x => Number(x.id) === id);
      if (idx < 0) return;

      if (action === 'a-edit') return openAccessoryModal('edit', window.accessoriesData[idx]);

      if (action === 'a-toggle-hide') {
        window.accessoriesData[idx].isHidden = !window.accessoriesData[idx].isHidden;
        window.saveAccessories?.();
        return update();
      }

      if (action === 'a-del') {
        if (!confirm('Xoá phụ kiện này?')) return;
        window.accessoriesData.splice(idx,1);
        window.saveAccessories?.();
        return update();
      }
    });

    // ===== Accessory modal logic =====
    function openAccessoryModal(mode='add', item=null){
      if (!accModal) return;
      accForm?.reset();
      accIdEl.value = item?.id || '';
      const kind = (item?.accessory || current || '').toLowerCase();
      if (['strap','box','glass'].includes(kind)) accKindEl.value = kind;
      toggleAccFields(accKindEl.value);

      if (item){
        accNameEl.value  = item.name || '';
        accPriceEl.value = item.price || 0;
        accTypeEl.value  = item.type || '';
        accMatEl.value   = item.material || '';
        accColorEl.value = item.color || '';
        accDescEl.value  = item.description || '';
        const src = window.resolveImgPath ? window.resolveImgPath(item) : (item.image || '');
        if (src) { accPreviewEl.src = src; accPreviewEl.style.display = 'block'; }
      } else {
        accPreviewEl.removeAttribute('src');
        accPreviewEl.style.display = 'none';
      }

      const label = accLabel(accKindEl.value || kind);
      accTitleEl.textContent = (mode === 'edit' ? 'Sửa ' : 'Thêm ') + (label || 'Phụ kiện');
      accModal.classList.add('show');
      document.body.style.overflow = 'hidden';
      setTimeout(()=>accNameEl?.focus(), 0);
    }
    function closeAccessoryModal(){ accModal?.classList.remove('show'); document.body.style.overflow = ''; }

    document.getElementById('btnAccCancel')?.addEventListener('click', closeAccessoryModal);
    accKindEl?.addEventListener('change', e => { const k = e.target.value; toggleAccFields(k); accTitleEl.textContent = (accIdEl.value ? 'Sửa ' : 'Thêm ') + accLabel(k || ''); });

    // Preview accessory image
    accImageFile?.addEventListener('change', () => {
      const f = accImageFile.files?.[0];
      if (!f || !f.type?.startsWith('image/')) { accPreviewEl.removeAttribute('src'); accPreviewEl.style.display='none'; return; }
      const url = URL.createObjectURL(f);
      accPreviewEl.src = url; accPreviewEl.style.display='block';
    });

    // Submit Accessory
    function readFileAsDataURL(file){ return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }

    accForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idStr = accIdEl.value;
      const name  = (accNameEl.value || '').trim();
      const price = Number(accPriceEl.value || 0);
      const accessory = (accKindEl.value || '').toLowerCase(); // strap | box | glass
      const category  = 'phukien';
      const description = (accDescEl.value || '').trim();
      const material = (accMatEl.value || '').trim();
      const color    = (accColorEl.value || '').trim();
      const type     = (accTypeEl.value || '').trim();

      if (!name || price <= 0 || !accessory) { alert('Điền đủ Tên, Giá (>0), Loại phụ kiện.'); return; }

      let image = '';
      const hasNewFile = (accImageFile?.files?.length || 0) > 0;
      if (hasNewFile) image = await readFileAsDataURL(accImageFile.files[0]);
      else { const slug = name.toLowerCase().replace(/\s+/g, '-'); image = `${slug}.jpg`; }

      if (idStr) {
        const id = Number(idStr);
        const idx = accessoriesData.findIndex(a => Number(a.id) === id);
        if (idx === -1) { alert('Không tìm thấy phụ kiện để cập nhật.'); return; }
        if (!hasNewFile) image = accessoriesData[idx].image || image;

        const base = { id, name, price, accessory, category, description, image };
        if (accessory === 'strap') { base.material = material; base.color = color; delete base.type; }
        else if (accessory === 'glass') { base.type = type; delete base.material; delete base.color; }
        else { delete base.material; delete base.color; delete base.type; }

        accessoriesData[idx] = { ...accessoriesData[idx], ...base };
        saveAccessories();
        closeAccessoryModal();
        update();
        alert(`Đã cập nhật: ${name}`);
      } else {
        const nextId = (() => { const m = accessoriesData.reduce((acc,x)=>Math.max(acc, Number(x.id)||0),0); return m+1; })();
        const base = { id: nextId, name, price, accessory, category, description, image, isHidden:false };
        if (accessory === 'strap') { base.material = material; base.color = color; }
        if (accessory === 'glass') { base.type = type; }
        accessoriesData.unshift(base);
        saveAccessories();
        closeAccessoryModal();
        update();
        alert(`Đã thêm mới: ${name}`);
      }
    });

    // INIT
    update();

    // Khi đổi filter => cập nhật danh sách (tác dụng khi current === 'watch')
    filterCat?.addEventListener('change', () => (current === 'watch') && window.update?.());
    filterBr ?.addEventListener('change', () => (current === 'watch') && window.update?.());
  });
})();
