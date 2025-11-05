// FILE: ../admin/ad_js/product.js

document.addEventListener('DOMContentLoaded', () => {
    // ===== DOM =====
    const btnAdd = document.getElementById('btnAdd');
    const modal = document.getElementById('watchModal');
    const form = document.getElementById('addForm');
    const btnCancel = document.getElementById('btnCancel');
    const modalTitle = document.querySelector('#watchModal .modal-title');
    const fileInput = document.getElementById('watchImageFile');
    const imgPreview = document.getElementById('imagePreview');

    // === CHỨC NĂNG MODAL (GLOBAL) ===
    window.openModal = function(mode = 'add') {
        if (!modal) return;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; 
        if (mode === 'add') document.getElementById('watchName')?.focus(); 
    }

    window.closeModal = function() {
        if (!modal) return;
        modal.classList.remove('show');
        document.body.style.overflow = '';
        form?.reset(); // Reset form khi đóng
        // Reset preview
        if (imgPreview) {
          imgPreview.removeAttribute('src');
          imgPreview.style.display = 'none';
        }
    }

    // ===== GẮN SỰ KIỆN =====

    // 1. MỞ modal khi bấm "+ Thêm đồng hồ"
    btnAdd?.addEventListener('click', (e) => {
        e.preventDefault?.();
        // Setup UI cho chế độ Thêm mới
        if (modalTitle) modalTitle.textContent = 'Thêm Đồng Hồ';
        document.getElementById('watchId')?.value = ''; 
        window.openModal('add');
    });

    // 2. ĐÓNG modal
    btnCancel?.addEventListener('click', window.closeModal);
    modal?.addEventListener('click', (e) => { 
        if (e.target === modal) window.closeModal(); 
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) window.closeModal();
    });

    // 3. Preview ảnh khi chọn file
    fileInput?.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) {
            if (imgPreview) { imgPreview.removeAttribute('src'); imgPreview.style.display = 'none'; }
            return;
        }
        const url = URL.createObjectURL(file);
        imgPreview.src = url;
        imgPreview.style.display = 'block';
    });
    
    // 4. GẮN SỰ KIỆN SUBMIT (LƯU/CẬP NHẬT)
    // Gọi hàm handleAddWatch đã được định nghĩa là global trong watch_table.js
    if(window.handleAddWatch) {
        form?.addEventListener('submit', window.handleAddWatch); 
    } else {
        // Log lỗi nếu watch_table.js chưa tải hoặc bị lỗi
        console.error("Lỗi: Không tìm thấy hàm window.handleAddWatch. Kiểm tra lại watch_table.js.");
    }
});