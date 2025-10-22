document.addEventListener('DOMContentLoaded', () => {
  const btnAdd      = document.getElementById('btnAdd');
  const modal       = document.getElementById('watchModal');
  const form        = document.getElementById('addForm');
  const btnCancel   = document.getElementById('btnCancel');
  const modalTitle  = document.querySelector('#watchModal .modal-title');
  const fileInput   = document.getElementById('watchImageFile');
  const imgPreview  = document.getElementById('imagePreview');

  function openModal() {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // khóa cuộn nền
  }
  function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  // MỞ modal khi bấm "+ Thêm đồng hồ"
  btnAdd?.addEventListener('click', (e) => {
    e.preventDefault?.();
    form?.reset();
    // reset preview
    if (imgPreview) {
      imgPreview.removeAttribute('src');
      imgPreview.style.display = 'none';
    }
    // tiêu đề & id (nếu có chế độ sửa)
    if (modalTitle) modalTitle.textContent = 'Thêm Đồng Hồ';
    document.getElementById('watchId')?.removeAttribute('value');

    openModal();
    document.getElementById('watchName')?.focus();
  });

  // ĐÓNG modal
  btnCancel?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('show')) closeModal();
  });

  // Preview ảnh khi chọn file
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
});
