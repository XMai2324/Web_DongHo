// FILE: ../admin/ad_js/watch_table.js

// === KHAI BÁO GLOBAL ===
window.STORAGE_KEY = 'admin_products';
// Tải dữ liệu từ LocalStorage hoặc dữ liệu gốc
window.productsData = JSON.parse(localStorage.getItem(window.STORAGE_KEY)) || (Array.isArray(window.products) ? window.products : []); 

window.saveData = function() {
    localStorage.setItem(window.STORAGE_KEY, JSON.stringify(window.productsData));
}

window.getNextId = function() {
    if (window.productsData.length === 0) return 1;
    const maxId = Math.max(...window.productsData.map(p => p.id || 0)); 
    return maxId + 1;
}

window.resolveImgPath = function(p) {
    const IMG_BASE = '/view/'; 
    const raw = (p.image || '').trim();
    if (!raw) return '';
    if (raw.startsWith('/')) return raw;
    if (raw.startsWith('../')) return raw;
    return IMG_BASE + raw.replace(/^(\.\/)?/, '');
}

// Hàm XỬ LÝ LƯU (Thêm/Sửa) - Global
window.handleAddWatch = function(e) {
    e.preventDefault();
    
    // ... (Logic thu thập dữ liệu và Validate giữ nguyên)
    const watchIdEl = document.getElementById('watchId');
    const isEditing = !!watchIdEl.value; 
    
    const newWatch = {
        id: isEditing ? Number(watchIdEl.value) : window.getNextId(),
        name: document.getElementById('watchName').value.trim(),
        price: Number(document.getElementById('watchPrice').value),
        category: document.getElementById('watchCategory').value,
        brand: document.getElementById('watchBrand').value,
        description: document.getElementById('watchDesc').value.trim(),
        image: document.getElementById('watchName').value.trim().toLowerCase().replace(/\s+/g, '-') + '.jpg', 
    };

    if (!newWatch.name || newWatch.price <= 0 || !newWatch.category || !newWatch.brand) {
        alert('Vui lòng điền đầy đủ Tên, Giá, Loại và Thương hiệu.');
        return;
    }

    if (isEditing) {
        const index = window.productsData.findIndex(p => p.id === newWatch.id);
        if (index !== -1) {
            const isNewFileSelected = document.getElementById('watchImageFile').files.length > 0;
            newWatch.image = isNewFileSelected ? newWatch.image : window.productsData[index].image;
            window.productsData[index] = newWatch; 
        }
    } else {
        if (window.productsData.some(p => p.name === newWatch.name)) {
            alert('Sản phẩm đã tồn tại!');
            return;
        }
        window.productsData.push(newWatch);
    }

    window.saveData(); 
    window.update(); // ⭐ Gọi update() thay vì applyFilter() ⭐
    
    if (window.closeModal) window.closeModal(); 
    
    alert(`Đã ${isEditing ? 'cập nhật' : 'thêm mới'} sản phẩm: ${newWatch.name}`);
}

document.addEventListener('DOMContentLoaded', () => {
    // ===== DOM =====
    const tbody = document.getElementById('productTbody');
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const filterBrand = document.getElementById('filterBrand');
    
    // ===== UTILS =====
    const NOIMG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="#f3f3f3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">No Image</text></svg>');
    const money = (v) => Number(v || 0).toLocaleString('vi-VN');
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

    // ===== LỌC (FILTER) - Tương tự Client =====
    function baseFilter(list) {
        const q = (searchInput?.value || '').trim().toLowerCase();
        const cat = filterCategory?.value || '';
        const br = filterBrand?.value || '';

        return list.filter(p => { 
            const okSearch = !q || (p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
            const okCat = !cat || p.category === cat;
            const okBrand = !br || p.brand === br;
            return okSearch && okCat && okBrand;
        });
    }

    // ===== RENDER =====
    function render(list) {
        if (!tbody) return;
        if (!Array.isArray(list) || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888">Không có sản phẩm</td></tr>`;
            return;
        }
        
        const rows = list.map(p => {
             const img = esc(window.resolveImgPath(p));
             return `
                 <tr>
                    <td><img class="thumb" src="${img}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='${NOIMG}';" /></td>
                    <td title="${esc(p.description || '')}">${esc(p.name)}</td>
                    <td>${money(p.price)}</td>
                    <td>${esc(p.category)}</td>
                    <td>${esc(p.brand)}</td>
                    <td>
                        <button class="btn icon" data-action="edit" data-id="${p.id}" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn icon" data-action="del" data-id="${p.id}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                    </td>
                 </tr>`;
        }).join('');
        tbody.innerHTML = rows;
    }

    // ===== HÀM CẬP NHẬT CHÍNH (UPDATE) - Global =====
    window.update = function() {
        let list = baseFilter(window.productsData);
        // Admin không cần sort, nhưng nếu muốn thì thêm: list = sortList(list);
        render(list);
    }

    // Hàm XỬ LÝ MỞ FORM SỬA (Edit) - Global
    window.openEdit = function(productId) {
        const product = window.productsData.find(p => p.id === productId);
        if (!product) return alert("Không tìm thấy sản phẩm!");

        // ... (Logic điền dữ liệu giữ nguyên)
        document.getElementById('watchId').value = product.id;
        document.getElementById('watchName').value = product.name;
        document.getElementById('watchPrice').value = product.price;
        document.getElementById('watchCategory').value = product.category;
        document.getElementById('watchBrand').value = product.brand;
        document.getElementById('watchDesc').value = product.description || '';
        
        // Mở modal (gọi hàm global từ product.js)
        if (window.openModal) {
             const modalTitle = document.querySelector('#watchModal .modal-title');
             if (modalTitle) modalTitle.textContent = 'Sửa Đồng Hồ: ' + product.name;

             const imgPreview = document.getElementById('imagePreview');
             if (imgPreview) {
                 const imgPath = window.resolveImgPath(product);
                 imgPreview.src = imgPath || NOIMG;
                 imgPreview.style.display = 'block';
             }
             window.openModal('edit'); 
        }
    }
    
    // Hàm XỬ LÝ XÓA (Delete)
    function handleDelete(productId) {
        const index = window.productsData.findIndex(p => p.id === productId);
        if (index === -1) return;

        if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm ${window.productsData[index].name}?`)) {
            window.productsData.splice(index, 1);
            window.saveData();
            window.update(); // ⭐ Gọi update() thay vì applyFilter() ⭐
            alert("Đã xóa sản phẩm thành công!");
        }
    }

    // ===== GẮN SỰ KIỆN LỌC/TÌM KIẾM VÀ SỬA/XÓA =====
    [searchInput, filterCategory, filterBrand].forEach(el => {
        el?.addEventListener('input', window.update);
        el?.addEventListener('change', window.update);
    });

    // Sự kiện cho nút Sửa/Xóa trong bảng
    tbody?.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = Number(btn.getAttribute('data-id'));

        if (action === 'edit') {
            window.openEdit(id);
        } else if (action === 'del') {
            handleDelete(id);
        }
    });

    // ===== INIT =====
    window.update(); // Tải dữ liệu ban đầu
});