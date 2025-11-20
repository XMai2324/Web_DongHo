
// =================== BOOT & STORAGE ===================
(() => {
  'use strict';

  const STORAGE_KEY_PRODUCTS = 'admin_products';
  const STORAGE_KEY_ACCESS   = 'admin_accessories';

  const safeClone = (v) => Array.isArray(v) ? JSON.parse(JSON.stringify(v)) : [];

  const fromProdLS = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PRODUCTS)); } catch { return null; }
  })();
  const fromAccLS = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_ACCESS)); } catch { return null; }
  })();

  let productsData    = fromProdLS ?? safeClone(window.products);
  let accessoriesData = fromAccLS ?? safeClone(window.accessories);

  const saveProducts    = () => localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(productsData));
  const saveAccessories = () => localStorage.setItem(STORAGE_KEY_ACCESS,   JSON.stringify(accessoriesData));

  // Seed vào localStorage ngay lần đầu
  if (fromProdLS == null) saveProducts();
  if (fromAccLS  == null) saveAccessories();

  // Expose để khối dưới dùng
  window.productsData = productsData;
  window.accessoriesData = accessoriesData;
  window.saveData = saveProducts;
  window.saveAccessories = saveAccessories;

  // =================== ẢNH & ID ===================
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

  // Cấp ID số tăng dần nếu thiếu (chỉ áp dụng cho item chưa có id)
  const nextIdFactory = (arr) => {
    const nums = arr.map(x => Number(x.id)).filter(n => Number.isFinite(n));
    let current = nums.length ? Math.max(...nums) : 0;
    return () => String(++current);
  };
  const nextProdId = nextIdFactory(productsData);
  const nextAccId  = nextIdFactory(accessoriesData);

  // Ensure IDs / flags
  let touched = false;
  // productsData.forEach(p => { if (p.id == null || p.id === '') { p.id = nextProdId(); touched = true; } });
  // if (touched) saveProducts();
  productsData.forEach(p => { 
    if (p.id == null || p.id === '') { 
      p.id = nextProdId(); 
      touched = true; 
    }
    if (typeof p.isHidden === 'undefined') { 
      p.isHidden = false; 
      touched = true; 
    }
    if (typeof p.isDeleted === 'undefined') { 
      p.isDeleted = false;          // mặc định chưa bị xóa
      touched = true;
    }
  });
  if (touched) saveProducts();


  touched = false;
  accessoriesData.forEach((a, i) => {
    if (a.id == null || a.id === '') { a.id = a._id ?? nextAccId(); touched = true; }
    if (typeof a.isHidden === 'undefined') { a.isHidden = false; touched = true; }
    if (!a.category) { a.category = 'phukien'; touched = true; }
  });
  if (touched) saveAccessories();
})();

// // =================== UI & LOGIC: ĐỒNG HỒ ===================
// (() => {
//   'use strict';

//   let modal, modalBox, modalBody, form, btnAdd, btnCancel, modalTitle;
//   let inputId, inputName, inputPrice, inputCat, inputBrand, inputDesc, fileInput, imgPreview;
//   let tbody, filterCategory, filterBrand;

//   document.addEventListener('DOMContentLoaded', () => {
//     // Grab DOM
//     modal       = document.getElementById('watchModal');
//     modalBox    = modal?.querySelector('.modal-content');
//     modalBody   = modal?.querySelector('.modal-body');
//     form        = document.getElementById('addForm');
//     btnAdd      = document.getElementById('btnAdd');
//     btnCancel   = document.getElementById('btnCancel');
//     modalTitle  = modal?.querySelector('.modal-title');

//     inputId     = document.getElementById('watchId');
//     inputName   = document.getElementById('watchName');
//     inputPrice  = document.getElementById('watchPrice');
//     inputCat    = document.getElementById('watchCategory');
//     inputBrand  = document.getElementById('watchBrand');
//     inputDesc   = document.getElementById('watchDesc');
//     fileInput   = document.getElementById('watchImageFile');
//     imgPreview  = document.getElementById('imagePreview');


//     // select khôi phục sp đã xóa
//     const restoreBrand    = document.getElementById('restoreBrand');
//     const restoreCategory = document.getElementById('restoreCategory');
//     const restoreName     = document.getElementById('restoreName');

//     // lấy danh sách sp đã xóa
//     const getDeletedProducts = () => {
//     const list = window.productsData || [];
//     return list.filter(p => p.isDeleted);
// };

//     tbody          = document.getElementById('productTbody');
//     filterCategory = document.getElementById('filterCategory');
//     filterBrand    = document.getElementById('filterBrand');


  

//     // Helpers
//     const NOIMG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="#f3f3f3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">No Image</text></svg>');
//     const money = v => Number(v || 0).toLocaleString('vi-VN');
//     const esc   = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));

//     const lockScroll = () => {
//       const sbw = window.innerWidth - document.documentElement.clientWidth;
//       document.body.style.paddingRight = sbw ? sbw + 'px' : '';
//       document.body.style.overflow = 'hidden';
//     };
//     const unlockScroll = () => { document.body.style.overflow = ''; document.body.style.paddingRight = ''; };

//     // Preview
//     let previewURL = null;
//     const clearPreview = () => {
//       if (previewURL) URL.revokeObjectURL(previewURL);
//       previewURL = null;
//       if (imgPreview) { imgPreview.removeAttribute('src'); imgPreview.style.display = 'none'; }
//       if (fileInput) fileInput.value = '';
//     };

//     const resetForm = () => {
//       form?.reset();
//       if (inputId) inputId.value = '';
//       clearPreview();
//       modalBody?.scrollTo?.({ top: 0 });
//     };

//     // Open/Close modal
//     const openModal = (mode = 'add') => {
//       if (!modal) return;
//       resetForm();
//       if (modalTitle) modalTitle.textContent = (mode === 'edit' ? 'Sửa Đồng Hồ' : 'Thêm Đồng Hồ');
//       modal.classList.add('show'); lockScroll();
//       setTimeout(() => inputName?.focus(), 0);
//     };
//     const closeModal = () => { if (!modal) return; modal.classList.remove('show'); unlockScroll(); clearPreview(); };
//     window.openModal = openModal; window.closeModal = closeModal;

//     btnCancel?.addEventListener('click', (e) => { e.preventDefault?.(); closeModal(); });
//     modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
//     modalBox?.addEventListener('click', (e) => e.stopPropagation());
//     document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('show')) closeModal(); });

//     fileInput?.addEventListener('change', () => {
//       const f = fileInput.files?.[0];
//       if (!f || !f.type?.startsWith('image/')) { clearPreview(); return; }
//       if (previewURL) URL.revokeObjectURL(previewURL);
//       previewURL = URL.createObjectURL(f);
//       imgPreview.src = previewURL; imgPreview.style.display = 'block';
//     });

//     // FILTER + RENDER
//     const applyWatchFilter = (list) => {
//       const cat = (filterCategory?.value || '');
//       const br  = (filterBrand?.value || '');
//       //return list.filter(p => (!cat || p.category === cat) && (!br || p.brand === br));
//       return list.filter(p => 
//                           !p.isDeleted &&                      // bỏ sp đã xóa
//                           (!cat || p.category === cat) && 
//                           (!br  || p.brand === br)
//                         );
//     };

//     const render = (list) => {
//       if (!tbody) return;
//       if (!Array.isArray(list) || list.length === 0) {
//         tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888">Không có sản phẩm</td></tr>`;
//         return;
//       }
//       tbody.innerHTML = list.map(p => {
//         const img = esc(window.resolveImgPath ? window.resolveImgPath(p) : (p.image || ''));
//         return `
//           <tr>
//             <td><img class="thumb" src="${img}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='${NOIMG}'" /></td>
//             <td title="${esc(p.description || '')}">${esc(p.name)} ${p.isHidden ? '<span class="badge muted">Ẩn</span>' : ''}</td>
//             <td>${money(p.price)}</td>
//             <td>${esc(p.category)}</td>
//             <td>${esc(p.brand)}</td>
//             <td>
//               <button class="btn icon" type="button" data-action="edit" data-id="${esc(p.id)}" title="Sửa"><i class="fa-solid fa-pen"></i></button>
//               <button class="btn icon" type="button" data-action="toggle-hide" data-id="${esc(p.id)}" title="${p.isHidden ? 'Hiện lên client' : 'Ẩn khỏi client'}"><i class="fa-solid ${p.isHidden ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
//               <button class="btn icon" type="button" data-action="del" data-id="${esc(p.id)}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
//             </td>
//           </tr>`;
//       }).join('');
//     };

//     const update = () => render(applyWatchFilter(window.productsData || []));
//     window.update = update;

//     // EDIT / DELETE / TOGGLE-HIDE
//     const openEdit = (id) => {
//       const list = window.productsData || [];
//       const product = list.find(p => String(p.id) === String(id));
//       if (!product) { alert('Không tìm thấy sản phẩm!'); return; }

//       openModal('edit');
//       inputId.value    = product.id ?? '';
//       inputName.value  = product.name ?? '';
//       inputPrice.value = product.price ?? 0;
//       inputCat.value   = product.category ?? '';
//       inputBrand.value = product.brand ?? '';
//       inputDesc.value  = product.description ?? '';

//       const path = (window.resolveImgPath ? window.resolveImgPath(product) : (product.image || '')) || NOIMG;
//       imgPreview.src = path; imgPreview.style.display = 'block';
//     };
//     window.openEdit = openEdit;

//     const doDelete = (id) => {
//       const list = window.productsData || [];
//       const idx = list.findIndex(p => String(p.id) === String(id));
//       if (idx === -1) return;
//       if (confirm(`Xóa "${list[idx].name}"?`)) {
//         //list.splice(idx, 1);
//         item.isDeleted = true;
//         window.saveData?.();
//         update();
//         alert('Đã xóa sản phẩm!');
//       }
//     };

//     tbody?.addEventListener('click', (e) => {
//       const btn = e.target.closest('button[data-action]');
//       if (!btn) return;
//       const action = btn.getAttribute('data-action');
//       const id = btn.getAttribute('data-id');
//       if (action === 'edit') return openEdit(id);
//       if (action === 'del')  return doDelete(id);
//       if (action === 'toggle-hide') {
//         const list = window.productsData || [];
//         const item = list.find(p => String(p.id) === String(id));
//         if (!item) return alert('Không tìm thấy sản phẩm!');
//         item.isHidden = !item.isHidden;
//         window.saveData?.();
//         update();
//         alert(item.isHidden ? 'Đã ẩn sản phẩm khỏi client.' : 'Đã hiện sản phẩm trên client.');
//       }
//     });

//     function readFileAsDataURL(file){
//       return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
//     }

//     const getNextWatchId = () => {
//       const list = window.productsData || [];
//       // nếu đã có id chuỗi (p1, a5...), vẫn tạo số tăng dần an toàn nhưng trả về chuỗi
//       const nums = list.map(p => Number(p.id)).filter(n => Number.isFinite(n));
//       let next = nums.length ? Math.max(...nums) + 1 : list.length + 1;
//       return String(next);
//     };

//     // SUBMIT (ADD/EDIT)
//     // form?.addEventListener('submit', async (e) => {
//     //   e.preventDefault();
//     //   const list = window.productsData || [];

//     //   const isEditing   = !!inputId.value;
//     //   const name        = inputName?.value?.trim() || '';
//     //   const price       = Number(inputPrice?.value || 0);
//     //   const category    = inputCat?.value || '';
//     //   const brand       = inputBrand?.value || '';
//     //   const description = inputDesc?.value?.trim() || '';

//     //   if (!name || price <= 0 || !category || !brand) {
//     //     alert('Vui lòng điền đầy đủ Tên, Giá (>0), Loại và Thương hiệu.');
//     //     return;
//     //   }

//     //   const hasNewFile = (fileInput?.files?.length || 0) > 0;
//     //   let image = '';
//     //   if (hasNewFile) image = await readFileAsDataURL(fileInput.files[0]);
//     //   else { const slug = name.toLowerCase().replace(/\s+/g, '-'); image = `${slug}.jpg`; }

//     //   if (isEditing) {
//     //     const id = inputId.value;
//     //     const idx = list.findIndex(p => String(p.id) === String(id));
//     //     if (idx === -1) { alert('Không tìm thấy sản phẩm để cập nhật.'); return; }
//     //     if (!hasNewFile) image = list[idx].image || image;
//     //     list[idx] = { ...list[idx], name, price, category, brand, description, image };
//     //   } else {
//     //     if (list.some(p => (p.name || '').trim().toLowerCase() === name.toLowerCase())) {
//     //       alert('Sản phẩm đã tồn tại (trùng tên).'); return;
//     //     }
//     //     list.unshift({ id: getNextWatchId(), name, price, category, brand, description, image, isHidden: false });
//     //   }

//     //   window.saveData?.();
//     //   update();
//     //   closeModal();
//     //   alert(isEditing ? `Đã cập nhật: ${name}` : `Đã thêm mới: ${name}`);
//     // });


//     form?.addEventListener('submit', async (e) => {
//       e.preventDefault();
//       const list = window.productsData || [];

//       const isEditing    = !!inputId.value;
//       const isRestoring  = isEditing && form?.dataset.restoreMode === 'true';

//       const name        = inputName?.value?.trim() || '';
//       const price       = Number(inputPrice?.value || 0);
//       const category    = inputCat?.value || '';
//       const brand       = inputBrand?.value || '';
//       const description = inputDesc?.value?.trim() || '';

//       if (!name || price <= 0 || !category || !brand) {
//         alert('Vui lòng điền đầy đủ Tên, Giá (>0), Loại và Thương hiệu.');
//         return;
//       }

//       const hasNewFile = (fileInput?.files?.length || 0) > 0;
//       let image = '';
//       if (hasNewFile) image = await readFileAsDataURL(fileInput.files[0]);
//       else {
//         const slug = name.toLowerCase().replace(/\s+/g, '-');
//         image = `${slug}.jpg`;
//       }

//       if (isEditing) {
//         const id = inputId.value;
//         const idx = list.findIndex(p => String(p.id) === String(id));
//         if (idx === -1) { alert('Không tìm thấy sản phẩm để cập nhật.'); return; }

//         if (!hasNewFile) image = list[idx].image || image;

//         list[idx] = {
//           ...list[idx],
//           name,
//           price,
//           category,
//           brand,
//           description,
//           image,
//           isDeleted: false   // <--- KHÔI PHỤC lại
//         };

//         // reset trạng thái restore
//         if (form?.dataset.restoreMode) delete form.dataset.restoreMode;

//         window.saveData?.();
//         update();
//         closeModal();
//         alert(isRestoring ? `Đã khôi phục sản phẩm: ${name}` : `Đã cập nhật: ${name}`);
//       } else {
//         // thêm mới như cũ, nhớ set isDeleted = false
//         if (list.some(p => (p.name || '').trim().toLowerCase() === name.toLowerCase() && !p.isDeleted)) {
//           alert('Sản phẩm đã tồn tại (trùng tên).');
//           return;
//         }
//         list.unshift({
//           id: getNextWatchId(),
//           name,
//           price,
//           category,
//           brand,
//           description,
//           image,
//           isHidden: false,
//           isDeleted: false
//         });

//         window.saveData?.();
//         update();
//         closeModal();
//         alert(`Đã thêm mới: ${name}`);
//       }

//       // cập nhật lại 3 select khôi phục (vì list sp đã xóa có thể thay đổi)
//       populateRestoreFilters();
//     });

//     // INIT
//     update();
//     filterCategory?.addEventListener('change', update);
//     filterBrand?.addEventListener('change', update);
//   });
// })();

// =================== UI & LOGIC: ĐỒNG HỒ ===================
(() => {
  'use strict';

  let modal, modalBox, modalBody, form, btnAdd, btnCancel, modalTitle;
  let inputId, inputName, inputPrice, inputCat, inputBrand, inputDesc, fileInput, imgPreview;
  let tbody, filterCategory, filterBrand;

  document.addEventListener('DOMContentLoaded', () => {
    // Grab DOM
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

    // select khôi phục sp đã xóa (3 ô select trong modal)
    const restoreBrand    = document.getElementById('restoreBrand');
    const restoreCategory = document.getElementById('restoreCategory');
    const restoreName     = document.getElementById('restoreName');
    const restoreGroup = document.getElementById('restoreGroup');



    // lấy danh sách sp đã xóa
    const getDeletedProducts = () => {
      const list = window.productsData || [];
      return list.filter(p => p.isDeleted);
    };

    


    tbody          = document.getElementById('productTbody');
    filterCategory = document.getElementById('filterCategory');
    filterBrand    = document.getElementById('filterBrand');

    // Helpers
    const NOIMG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="#f3f3f3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">No Image</text></svg>');
    const money = v => Number(v || 0).toLocaleString('vi-VN');
    const esc   = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));

    const lockScroll = () => {
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = sbw ? sbw + 'px' : '';
      document.body.style.overflow = 'hidden';
    };
    const unlockScroll = () => { document.body.style.overflow = ''; document.body.style.paddingRight = ''; };

    // Preview
    let previewURL = null;
    const clearPreview = () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
      previewURL = null;
      if (imgPreview) { imgPreview.removeAttribute('src'); imgPreview.style.display = 'none'; }
      if (fileInput) fileInput.value = '';
    };

    
    // Enable/Disable editable fields
    const setEditableFields = (enabled) => {
      [inputName, inputPrice, inputCat, inputBrand, inputDesc].forEach(el => {
        if (el) el.disabled = !enabled;
      });
      if (fileInput) fileInput.disabled = !enabled;
    };
    
    const resetForm = () => {
      form?.reset();
      if (inputId) inputId.value = '';
      if (form?.dataset.restoreMode) delete form.dataset.restoreMode;
      setEditableFields(true);
      clearPreview();
      modalBody?.scrollTo?.({ top: 0 });
    };



    // Open/Close modal
    // const openModal = (mode = 'add') => {
    //   if (!modal) return;
    //   resetForm();
    //   if (modalTitle) modalTitle.textContent = (mode === 'edit' ? 'Sửa Đồng Hồ' : 'Thêm Đồng Hồ');
    //   modal.classList.add('show'); lockScroll();
    //   setTimeout(() => inputName?.focus(), 0);
    // };
    const openModal = (mode = 'add') => {
      if (!modal) return;
      resetForm();

      if (mode === 'add') {
        if (modalTitle) modalTitle.textContent = 'Khôi phục sản phẩm đã xóa';
        restoreGroup && (restoreGroup.style.display = '');  // hiện phần khôi phục
        setEditableFields(false);                           // không cho nhập tay
      } else {
        if (modalTitle) modalTitle.textContent = 'Sửa Đồng Hồ';
        restoreGroup && (restoreGroup.style.display = 'none'); // ẩn phần khôi phục
        setEditableFields(true);                              // cho phép chỉnh sửa
      }

      modal.classList.add('show');
      lockScroll();
      setTimeout(() => inputName?.focus(), 0);
    };



    
    const closeModal = () => { if (!modal) return; modal.classList.remove('show'); unlockScroll(); clearPreview(); };
    window.openModal = openModal; window.closeModal = closeModal;

    btnCancel?.addEventListener('click', (e) => { e.preventDefault?.(); closeModal(); });
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    modalBox?.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('show')) closeModal(); });

    fileInput?.addEventListener('change', () => {
      const f = fileInput.files?.[0];
      if (!f || !f.type?.startsWith('image/')) { clearPreview(); return; }
      if (previewURL) URL.revokeObjectURL(previewURL);
      previewURL = URL.createObjectURL(f);
      imgPreview.src = previewURL; imgPreview.style.display = 'block';
    });

    // FILTER + RENDER
    const applyWatchFilter = (list) => {
      const cat = (filterCategory?.value || '');
      const br  = (filterBrand?.value || '');
      return list.filter(p =>
        !p.isDeleted &&                    // bỏ sản phẩm đã xóa
        (!cat || p.category === cat) &&
        (!br  || p.brand === br)
      );
    };

    const render = (list) => {
      if (!tbody) return;
      if (!Array.isArray(list) || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888">Không có sản phẩm</td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(p => {
        const img = esc(window.resolveImgPath ? window.resolveImgPath(p) : (p.image || ''));
        return `
          <tr>
            <td><img class="thumb" src="${img}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='${NOIMG}'" /></td>
            <td title="${esc(p.description || '')}">${esc(p.name)} ${p.isHidden ? '<span class="badge muted">Ẩn</span>' : ''}</td>
            <td>${money(p.price)}</td>
            <td>${esc(p.category)}</td>
            <td>${esc(p.brand)}</td>
            <td>
              <button class="btn icon" type="button" data-action="edit" data-id="${esc(p.id)}" title="Sửa"><i class="fa-solid fa-pen"></i></button>
              <button class="btn icon" type="button" data-action="toggle-hide" data-id="${esc(p.id)}" title="${p.isHidden ? 'Hiện lên client' : 'Ẩn khỏi client'}"><i class="fa-solid ${p.isHidden ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
              <button class="btn icon" type="button" data-action="del" data-id="${esc(p.id)}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`;
      }).join('');
    };

    const update = () => render(applyWatchFilter(window.productsData || []));
    window.update = update;

    // ======== KHÔI PHỤC SẢN PHẨM ĐÃ XÓA ========
    const populateRestoreFilters = () => {
      if (!restoreBrand || !restoreCategory || !restoreName) return;

      const deleted = getDeletedProducts();

      restoreBrand.innerHTML    = '<option value="">Thương hiệu (đã xóa)</option>';
      restoreCategory.innerHTML = '<option value="">Loại (đã xóa)</option>';
      restoreName.innerHTML     = '<option value="">Tên sản phẩm (đã xóa)</option>';

      const brandSet = new Set();
      const catSet   = new Set();

      deleted.forEach(p => {
        if (p.brand)    brandSet.add(p.brand);
        if (p.category) catSet.add(p.category);
      });

      brandSet.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        restoreBrand.appendChild(opt);
      });

      catSet.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        restoreCategory.appendChild(opt);
      });
    };

    const populateRestoreNames = () => {
      if (!restoreName) return;
      const deleted = getDeletedProducts();

      const br  = restoreBrand?.value || '';
      const cat = restoreCategory?.value || '';

      restoreName.innerHTML = '<option value="">Tên sản phẩm (đã xóa)</option>';

      const filtered = deleted.filter(p =>
        (!br  || p.brand === br) &&
        (!cat || p.category === cat)
      );

      filtered.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        restoreName.appendChild(opt);
      });
    };

    restoreBrand?.addEventListener('change', populateRestoreNames);
    restoreCategory?.addEventListener('change', populateRestoreNames);

    restoreName?.addEventListener('change', () => {
      const id = restoreName.value;
      if (!id) return;

      const list = window.productsData || [];
      const p = list.find(x => String(x.id) === String(id) && x.isDeleted);
      if (!p) return;

      inputId.value    = p.id;
      inputName.value  = p.name || '';
      inputPrice.value = p.price || 0;
      inputCat.value   = p.category || '';
      inputBrand.value = p.brand || '';
      inputDesc.value  = p.description || '';

      const path = (window.resolveImgPath ? window.resolveImgPath(p) : (p.image || '')) || NOIMG;
      imgPreview.src = path;
      imgPreview.style.display = 'block';

      form.dataset.restoreMode = 'true';
    });

    // EDIT / DELETE / TOGGLE-HIDE
    const openEdit = (id) => {
      const list = window.productsData || [];
      const product = list.find(p => String(p.id) === String(id));
      if (!product) { alert('Không tìm thấy sản phẩm!'); return; }

      openModal('edit');
      inputId.value    = product.id ?? '';
      inputName.value  = product.name ?? '';
      inputPrice.value = product.price ?? 0;
      inputCat.value   = product.category ?? '';
      inputBrand.value = product.brand ?? '';
      inputDesc.value  = product.description ?? '';

      const path = (window.resolveImgPath ? window.resolveImgPath(product) : (product.image || '')) || NOIMG;
      imgPreview.src = path; imgPreview.style.display = 'block';
    };
    window.openEdit = openEdit;

    // const doDelete = (id) => {
    //   const list = window.productsData || [];
    //   const item = list.find(p => String(p.id) === String(id));
    //   if (!item) return alert('Không tìm thấy sản phẩm!');

    //   if (confirm(`Xóa"${item.name}"?`)) {
    //     //list.splice(index, 1);
    //     item.isDeleted = true;
    //     window.saveData?.();
    //     update();
    //     populateRestoreFilters();
    //     alert('Đã chuyển sản phẩm vào danh sách đã xóa!');
    //   }
    // };


    const doDelete = (id, type = 'soft') => {   
      const list = window.productsData || [];

      // Tìm vị trí sản phẩm
      const index = list.findIndex(p => String(p.id) === String(id));
      if (index === -1) {
        return alert('Không tìm thấy sản phẩm!');
      }

      const item = list[index];

      // SOFT DELETE (xóa ẩn)
      if (type === 'soft') {

        if (confirm(`Xóa (ẩn) "${item.name}"?`)) {
          item.isDeleted = true;   // KHÔI PHỤC ĐƯỢC

          window.saveData?.();
          update();
          populateRestoreFilters();

          alert('Đã chuyển sản phẩm vào danh sách đã xóa!');
        }

      }

      // HARD DELETE (xóa vĩnh viễn)
      else if (type === 'hard') {

        if (confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN "${item.name}"?`)) {

          list.splice(index, 1); // XÓA KHỎI MẢNG

          window.productsData = list;
          window.saveData?.();
          update();
          populateRestoreFilters();

          alert('Đã xóa vĩnh viễn sản phẩm!');
        }

      }
    };

    tbody?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'edit') return openEdit(id);
      if (action === 'del')  return doDelete(id, 'soft'); 
      if (action === 'toggle-hide') {
        const list = window.productsData || [];
        const item = list.find(p => String(p.id) === String(id));
        if (!item) return alert('Không tìm thấy sản phẩm!');

        item.isHidden = !item.isHidden;
        window.saveData?.();
        update();
        alert(item.isHidden ? 'Đã ẩn sản phẩm khỏi client.' : 'Đã hiện sản phẩm trên client.');
      }
    });

    function readFileAsDataURL(file){
      return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    }

    const getNextWatchId = () => {
      const list = window.productsData || [];
      const nums = list.map(p => Number(p.id)).filter(n => Number.isFinite(n));
      let next = nums.length ? Math.max(...nums) + 1 : list.length + 1;
      return String(next);
    };

    // SUBMIT (ADD/EDIT/RESTORE)
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const list = window.productsData || [];

      const isEditing    = !!inputId.value;
      const isRestoring  = isEditing && form?.dataset.restoreMode === 'true';

      const name        = inputName?.value?.trim() || '';
      const price       = Number(inputPrice?.value || 0);
      const category    = inputCat?.value || '';
      const brand       = inputBrand?.value || '';
      const description = inputDesc?.value?.trim() || '';

      if (!name || price <= 0 || !category || !brand) {
        alert('Vui lòng điền đầy đủ Tên, Giá (>0), Loại và Thương hiệu.');
        return;
      }

      const hasNewFile = (fileInput?.files?.length || 0) > 0;
      let image = '';
      if (hasNewFile) image = await readFileAsDataURL(fileInput.files[0]);
      else {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        image = `${slug}.jpg`;
      }

      if (isEditing) {
        const id = inputId.value;
        const idx = list.findIndex(p => String(p.id) === String(id));
        if (idx === -1) { alert('Không tìm thấy sản phẩm để cập nhật.'); return; }

        if (!hasNewFile) image = list[idx].image || image;

        list[idx] = {
          ...list[idx],
          name,
          price,
          category,
          brand,
          description,
          image,
          isDeleted: false
        };

        if (form?.dataset.restoreMode) delete form.dataset.restoreMode;

        window.saveData?.();
        update();
        closeModal();
        alert(isRestoring ? `Đã khôi phục sản phẩm: ${name}` : `Đã cập nhật: ${name}`);
      } else {
        if (list.some(p => (p.name || '').trim().toLowerCase() === name.toLowerCase() && !p.isDeleted)) {
          alert('Sản phẩm đã tồn tại (trùng tên).');
          return;
        }
        list.unshift({
          id: getNextWatchId(),
          name,
          price,
          category,
          brand,
          description,
          image,
          isHidden: false,
          isDeleted: false
        });

        window.saveData?.();
        update();
        closeModal();
        alert(`Đã thêm mới: ${name}`);
      }

      populateRestoreFilters();
    });

    // INIT
    update();
    populateRestoreFilters();    // lần đầu load
    filterCategory?.addEventListener('change', update);
    filterBrand   ?.addEventListener('change', update);
  });
})();



// =================== KHÔI PHỤC SẢN PHẨM ĐÃ XÓA ===================
const populateRestoreFilters = () => {
  if (!restoreBrand || !restoreCategory || !restoreName) return;

  const deleted = getDeletedProducts();

  // reset options
  restoreBrand.innerHTML    = '<option value="">Thương hiệu</option>';
  restoreCategory.innerHTML = '<option value="">Loại</option>';
  restoreName.innerHTML     = '<option value="">Tên sản phẩm</option>';

  const brandSet = new Set();
  const catSet   = new Set();

  deleted.forEach(p => {
    if (p.brand)    brandSet.add(p.brand);
    if (p.category) catSet.add(p.category);
  });

  brandSet.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    restoreBrand.appendChild(opt);
  });

  catSet.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    restoreCategory.appendChild(opt);
  });
};


const populateRestoreNames = () => {
  if (!restoreName) return;
  const deleted = getDeletedProducts();

  const br  = restoreBrand?.value || '';
  const cat = restoreCategory?.value || '';

  restoreName.innerHTML = '<option value="">Tên sản phẩm</option>';

  const filtered = deleted.filter(p =>
    (!br  || p.brand === br) &&
    (!cat || p.category === cat)
  );

  filtered.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;           // lưu id
    opt.textContent = p.name;   // hiển thị tên
    restoreName.appendChild(opt);
  });
};


restoreName?.addEventListener('change', () => {
  const id = restoreName.value;
  if (!id) return;

  const list = window.productsData || [];
  const p = list.find(x => String(x.id) === String(id) && x.isDeleted);
  if (!p) return;

  // gán cho form giống như đang "edit" sp đó
  inputId.value    = p.id;                 // để submit hiểu là cập nhật
  inputName.value  = p.name || '';
  inputPrice.value = p.price || 0;
  inputCat.value   = p.category || '';
  inputBrand.value = p.brand || '';
  inputDesc.value  = p.description || '';

  // hiển thị ảnh
  const path = (window.resolveImgPath ? window.resolveImgPath(p) : (p.image || '')) || NOIMG;
  imgPreview.src = path;
  imgPreview.style.display = 'block';

  // đánh dấu là "khôi phục" (nếu muốn phân biệt)
  form.dataset.restoreMode = 'true';
});



// =================== TAB & ACCESSORIES ===================
(() => {
  'use strict';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  document.addEventListener('DOMContentLoaded', () => {
    const leftMenu   = document.getElementById('leftMenu');
    const h1Title    = document.querySelector('.toolbar h1');
    const btnAdd     = document.getElementById('btnAdd');
    const btnAddAcc  = document.getElementById('btnAddAcc');
    const table      = document.getElementById('productTable');
    const thead      = table?.querySelector('thead');
    const tbody      = document.getElementById('productTbody');

    // Filter chỉ tác dụng ở tab watch
    const filterCat = document.getElementById('filterCategory');
    const filterBr  = document.getElementById('filterBrand');

    // Modal phụ kiện
    const accModal      = $('#accessoryModal');
    const accTitleEl    = $('#accessoryModal .modal-title');
    const accForm       = $('#addAccForm');
    const accIdEl       = $('#accId');
    const accNameEl     = $('#accName');
    const accPriceEl    = $('#accPrice');
    const accKindEl     = $('#accKind');      // strap | box | glass
    const accTypeEl     = $('#accType');      // glass only
    const accMatEl      = $('#accMaterial');  // strap only
    const accColorEl    = $('#accColor');     // strap only
    const accDescEl     = $('#accDesc');
    const accPreviewEl  = $('#accImagePreview');
    const accImageFile  = $('#accImageFile');
    const btnAccCancel  = $('#btnAccCancel');

    const NOIMG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="#f3f3f3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">No Image</text></svg>');
    const money = v => Number(v || 0).toLocaleString('vi-VN');
    const esc   = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));

    let current = 'watch';

    const renderHead = () => {
      if (!thead) return;
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
      } else { // glass
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
    };

    const getList = () => {
      if (current === 'watch') return window.productsData || [];
      const all = window.accessoriesData || [];
      return all.filter(a => String(a.accessory || '').toLowerCase() === current);
    };

    const renderBody = (list) => {
      if (!tbody) return;
      if (current === 'watch') { window.update?.(); return; }
      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888">Không có sản phẩm</td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(p => {
        const pid = p.id;
        const img = (window.resolveImgPath ? window.resolveImgPath(p) : (p.image || '')) || '';
        const src = img || NOIMG;
        const actionBtns = `
          <button class="btn icon" data-action="a-edit" data-id="${esc(pid)}" title="Sửa"><i class="fa-solid fa-pen"></i></button>
          <button class="btn icon" data-action="a-toggle-hide" data-id="${esc(pid)}" title="${p.isHidden ? 'Hiện lên client' : 'Ẩn khỏi client'}"><i class="fa-solid ${p.isHidden ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
          <button class="btn icon" data-action="a-del" data-id="${esc(pid)}" title="Xóa"><i class="fa-solid fa-trash"></i></button>`;

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
    };

    const update = () => { renderHead(); const list = getList(); if (current === 'watch') window.update?.(); else renderBody(list); };

    // Switch tab
    leftMenu?.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-entity]');
      if (!li) return;
      current = (li.getAttribute('data-entity') || 'watch').toLowerCase();
      leftMenu.querySelectorAll('li').forEach(x => x.classList.remove('is-active'));
      li.classList.add('is-active');
      const titleMap = { watch:'Quản lý đồng hồ', strap:'Quản lý dây đeo', box:'Quản lý hộp đựng', glass:'Kính cường lực' };
      if (h1Title) h1Title.textContent = titleMap[current] || 'Quản lý';
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
      const id = btn.dataset.id;
      if (!action || !action.startsWith('a-')) return;

      const list = window.accessoriesData || [];
      const idx = list.findIndex(x => String(x.id) === String(id));
      if (idx < 0) { alert('Không tìm thấy phụ kiện!'); return; }

      if (action === 'a-edit') return openAccessoryModal('edit', list[idx]);
      if (action === 'a-toggle-hide') {
        list[idx].isHidden = !list[idx].isHidden;
        window.saveAccessories?.();
        return update();
      }
      if (action === 'a-del') {
        if (!confirm('Xoá phụ kiện này?')) return;
        list.splice(idx, 1);
        window.saveAccessories?.();
        return update();
      }
    });

    // Accessory modal helpers
    function openAccessoryModal(mode='add', item=null){
      if (!accModal) return alert('Thiếu modal phụ kiện (#accessoryModal) trong HTML.');

      accForm?.reset();
      accIdEl && (accIdEl.value = item?.id || '');

      const kind = (item?.accessory || current || '').toLowerCase();
      if (['strap','box','glass'].includes(kind)) accKindEl && (accKindEl.value = kind);
      toggleAccFields(accKindEl?.value || kind);

      if (item){
        accNameEl && (accNameEl.value  = item.name || '');
        accPriceEl && (accPriceEl.value = item.price || 0);
        accTypeEl && (accTypeEl.value  = item.type || '');
        accMatEl  && (accMatEl.value   = item.material || '');
        accColorEl&& (accColorEl.value = item.color || '');
        accDescEl && (accDescEl.value  = item.description || '');
        const src = window.resolveImgPath ? window.resolveImgPath(item) : (item.image || '');
        if (src && accPreviewEl) { accPreviewEl.src = src; accPreviewEl.style.display = 'block'; }
      } else {
        if (accPreviewEl) { accPreviewEl.removeAttribute('src'); accPreviewEl.style.display = 'none'; }
      }

      const label = ({ strap:'Dây đeo', box:'Hộp đựng', glass:'Kính cường lực' }[accKindEl?.value || kind] || 'Phụ kiện');
      accTitleEl && (accTitleEl.textContent = (mode === 'edit' ? 'Sửa ' : 'Thêm ') + label);

      accModal.classList.add('show');
      document.body.style.overflow = 'hidden';
      setTimeout(()=>accNameEl?.focus(), 0);
    }
    function closeAccessoryModal(){ accModal?.classList.remove('show'); document.body.style.overflow = ''; }
    btnAccCancel?.addEventListener('click', (e)=>{ e.preventDefault?.(); closeAccessoryModal(); });

    function toggleAccFields(k){
      $$('.acc-only').forEach(el => el.style.display = 'none');
      if (k === 'strap') { $$('.acc-strap').forEach(el => el.style.display = ''); }
      if (k === 'glass') { $$('.acc-glass').forEach(el => el.style.display = ''); }
    }
    accKindEl?.addEventListener('change', e => {
      const k = e.target.value;
      toggleAccFields(k);
      accTitleEl && (accTitleEl.textContent = (accIdEl?.value ? 'Sửa ' : 'Thêm ') + ({ strap:'Dây đeo', box:'Hộp đựng', glass:'Kính cường lực' }[k] || 'Phụ kiện'));
    });

    accImageFile?.addEventListener('change', () => {
      const f = accImageFile.files?.[0];
      if (!f || !f.type?.startsWith('image/')) { accPreviewEl?.removeAttribute('src'); if (accPreviewEl) accPreviewEl.style.display='none'; return; }
      const url = URL.createObjectURL(f);
      if (accPreviewEl){ accPreviewEl.src = url; accPreviewEl.style.display='block'; }
    });

    function readFileAsDataURL(file){ return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }

    accForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const list = window.accessoriesData || [];

      const idStr = accIdEl?.value || '';
      const name  = (accNameEl?.value || '').trim();
      const price = Number(accPriceEl?.value || 0);
      const accessory = (accKindEl?.value || '').toLowerCase();
      const category  = 'phukien';
      const description = (accDescEl?.value || '').trim();
      const material = (accMatEl?.value || '').trim();
      const color    = (accColorEl?.value || '').trim();
      const type     = (accTypeEl?.value || '').trim();

      if (!name || price <= 0 || !accessory) { alert('Điền đủ Tên, Giá (>0), Loại phụ kiện.'); return; }

      let image = '';
      const hasNewFile = (accImageFile?.files?.length || 0) > 0;
      if (hasNewFile) image = await readFileAsDataURL(accImageFile.files[0]);
      else { const slug = name.toLowerCase().replace(/\s+/g, '-'); image = `${slug}.jpg`; }

      if (idStr) {
        const idx = list.findIndex(a => String(a.id) === String(idStr));
        if (idx === -1) { alert('Không tìm thấy phụ kiện để cập nhật.'); return; }
        if (!hasNewFile) image = list[idx].image || image;

        const base = { id: list[idx].id, name, price, accessory, category, description, image };
        if (accessory === 'strap') { base.material = material; base.color = color; delete base.type; }
        else if (accessory === 'glass') { base.type = type; delete base.material; delete base.color; }
        else { delete base.material; delete base.color; delete base.type; }

        list[idx] = { ...list[idx], ...base };
        window.saveAccessories?.();
        closeAccessoryModal();
        update();
        alert(`Đã cập nhật: ${name}`);
      } else {
        const newId = String((() => {
          const nums = list.map(x => Number(x.id)).filter(Number.isFinite);
          return (nums.length ? Math.max(...nums) : 0) + 1;
        })());
        const base = { id: newId, name, price, accessory, category, description, image, isHidden:false };
        if (accessory === 'strap') { base.material = material; base.color = color; }
        if (accessory === 'glass') { base.type = type; }
        list.unshift(base);
        window.saveAccessories?.();
        closeAccessoryModal();
        update();
        alert(`Đã thêm mới: ${name}`);
      }
    });

    // INIT
    update();
    // filter chỉ tác dụng ở tab watch (đã gọi window.update trong renderBody)
    filterCat?.addEventListener('change', () => (current === 'watch') && window.update?.());
    filterBr ?.addEventListener('change', () => (current === 'watch') && window.update?.());
  });
})();
