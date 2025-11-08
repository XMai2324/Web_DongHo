// =================== GHÉP DỮ LIỆU ===================
const allData = { ...products };

// tạo danh mục riêng cho phụ kiện
const PHUKIEN_KEY = "phụ kiện";
allData[PHUKIEN_KEY] = {};

accessories.forEach(a => {
  const type = a.accessory || a.type || "Khác";
  if (!allData[PHUKIEN_KEY][type]) allData[PHUKIEN_KEY][type] = {};
  allData[PHUKIEN_KEY][type][a.name] = {
    gia: a.price || 0,
    ...a
  };
});

// ====== LOAD DỮ LIỆU TỪ LOCALSTORAGE ======
let phieuNhap = [];
let tonKho = [];

const savedPhieu = localStorage.getItem('phieuNhap');
const savedKho = localStorage.getItem('tonKho');
if (savedPhieu) phieuNhap = JSON.parse(savedPhieu);
if (savedKho) tonKho = JSON.parse(savedKho);

// ======= SEEDED RANDOM =======
function seededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
}

// ======= MAP HIỂN THỊ LOẠI =======
const LOAI_DISPLAY = {
  nam: "Nam",
  nu: "Nữ",
  capdoi: "Cặp đôi",

  glass: "Kính Cường Lực",
  box: "Hộp Đựng",
  strap: "Dây Treo"
};

// CHẶN GHI ĐÈ DỮ LIỆU MẪU
if (!savedPhieu || !savedKho) {
  // ======= SINH 10 PHIẾU NHẬP NGẪU NHIÊN =======
  const randPhieu = seededRandom(123); 
  const totalPhieu = 10;
  phieuNhap = [];
  const used = new Set();

  while(phieuNhap.length < totalPhieu) {
    const danhMucList = getDanhMuc();
    const danhMuc = danhMucList[Math.floor(randPhieu() * danhMucList.length)];
    const loaiList = getLoai(danhMuc);
    const loai = loaiList[Math.floor(randPhieu() * loaiList.length)];
    const tenList = getTen(danhMuc, loai);
    const tensp = tenList[Math.floor(randPhieu() * tenList.length)];

    const key = `${danhMuc}|${tensp}`;
    if (used.has(key)) continue;
    used.add(key);

    const sl = Math.floor(randPhieu() * 10) + 5;
    const gia = getGia(danhMuc, loai, tensp);
    const ngay = `2025-${String(Math.floor(randPhieu() * 12) + 1).padStart(2,'0')}-${String(Math.floor(randPhieu() * 28) + 1).padStart(2,'0')}`;

    phieuNhap.push({tensp, danhmuc: danhMuc, loai, sl, gia, ngay, locked: false});
  }

  // ======= TỒN KHO MẪU =======
  tonKho = phieuNhap.map(p => ({
    ma: generateCode(p.tensp),
    tensp: p.tensp,
    danhmuc: p.danhmuc,
    loai: p.loai,
    sl: p.sl
  }));

  // Lưu dữ liệu mẫu vào localStorage lần đầu
  localStorage.setItem('phieuNhap', JSON.stringify(phieuNhap));
  localStorage.setItem('tonKho', JSON.stringify(tonKho));
}

// =================== HÀM HỖ TRỢ BÁO CÁO ===================
function getTonDau(tensp, danhmuc, loai, startDate) {
  let ton = 0;
  phieuNhap.forEach(p => {
    if (p.danhmuc === danhmuc && p.tensp === tensp && p.loai === loai) {
      if (p.ngay < startDate) ton += Number(p.sl);
    }
  });
  return ton;
}

function getNhapTrongKhoang(tensp, danhmuc, loai, startDate, endDate) {
  let sl = 0;
  phieuNhap.forEach(p => {
    if (p.danhmuc === danhmuc && p.tensp === tensp && p.loai === loai) {
      if (p.ngay >= startDate && p.ngay <= endDate) sl += Number(p.sl);
    }
  });
  return sl;
}

function getXuatTrongKhoang(tensp, danhmuc, loai, startDate, endDate) {
  // tạm thời = 0 nếu chưa có dữ liệu xuất
  return 0;
}

// =================== HÀM HỖ TRỢ ===================
function rebuildStock() {
  tonKho = [];
  phieuNhap.forEach(p => {
    let exist = tonKho.find(t => t.tensp === p.tensp && t.danhmuc === p.danhmuc);
    if (!exist) {
      tonKho.push({
        ma: generateCode(p.tensp),
        tensp: p.tensp,
        danhmuc: p.danhmuc,
        loai: p.loai,
        sl: Number(p.sl)
      });
    } else {
      exist.sl += Number(p.sl);
    }
  });
}

function generateCode(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6);
}

function capitalizeWords(str) {
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatNumber(n) {
  return new Intl.NumberFormat('vi-VN').format(n);
}

// ======= LỌC PHIẾU NHẬP =======
function filterPhieu(keyword) {
  keyword = keyword.trim().toLowerCase();
  if (!keyword) return phieuNhap; // rỗng thì trả về tất cả

  return phieuNhap.filter(p => 
    p.tensp.toLowerCase().includes(keyword) || 
    p.danhmuc.toLowerCase().startsWith(keyword) || 
    (p.loai && p.loai.toLowerCase().startsWith(keyword))
  );
}

// =================== HIỂN THỊ BẢNG ===================
function renderPhieu() {
  const tbl = document.querySelector('#tblPhieu tbody');
  tbl.innerHTML = '';

  phieuNhap.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.id = 'phieu-row-' + idx;

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${p.tensp}</td>
      <td>${capitalizeWords(p.danhmuc)}</td>
      <td>${LOAI_DISPLAY[p.loai?.toLowerCase()] || capitalizeWords(p.loai)}</td>
      <td>${p.sl}</td>
      <td>${formatNumber(p.gia)}</td>
      <td>${p.ngay}</td>
      <td>
        ${
          p.locked
            ? '<span style="color:green;font-weight:600;">Hoàn thành</span>'
            : `
              <button class="table-btn edit" data-idx="${idx}">Sửa</button>
              <button class="table-btn complete" data-idx="${idx}">Hoàn thành</button>
              <button class="table-btn delete" data-idx="${idx}">Xóa</button>
            `
        }
      </td>
    `;
    tbl.appendChild(tr);
  });

  renderKho();
  updateStats();
}

function renderPhieuFiltered(list) {
  const tbl = document.querySelector('#tblPhieu tbody');
  tbl.innerHTML = '';

  list.forEach((p) => {
    const idx = phieuNhap.indexOf(p);
    const tr = document.createElement('tr');
    tr.id = 'phieu-row-' + idx;

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${p.tensp}</td>
      <td>${capitalizeWords(p.danhmuc)}</td>
      <td>${LOAI_DISPLAY[p.loai?.toLowerCase()] || capitalizeWords(p.loai)}</td>
      <td>${p.sl}</td>
      <td>${formatNumber(p.gia)}</td>
      <td>${p.ngay}</td>
      <td>
        ${
          p.locked
            ? '<span style="color:green;font-weight:600;">Hoàn thành</span>'
            : `
              <button class="table-btn edit" data-idx="${idx}">Sửa</button>
              <button class="table-btn complete" data-idx="${idx}">Hoàn thành</button>
              <button class="table-btn delete" data-idx="${idx}">Xóa</button>
            `
        }
      </td>
    `;
    tbl.appendChild(tr);
  });
}

function renderKho() {
  const tbl = document.querySelector('#tblKho tbody');
  tbl.innerHTML = '';

  tonKho.forEach((sp, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${sp.ma}</td>
      <td>${sp.tensp}</td>
      <td>${capitalizeWords(sp.danhmuc)}</td>
      <td>${LOAI_DISPLAY[sp.loai?.toLowerCase()] || capitalizeWords(sp.loai)}</td>
      <td class="${sp.sl <= 3 ? 'low' : ''}">${sp.sl}</td>
    `;
    tbl.appendChild(tr);
  });
}

function updateStats() {
  document.getElementById("statProducts").textContent = tonKho.length;
  document.getElementById("totalPhieuNhap").textContent = phieuNhap.length;

  const tong = tonKho.reduce((a, b) => a + (Number(b.sl) || 0), 0);
  document.getElementById("statTotalStock").textContent = tong;

  const sapHet = tonKho.filter(sp => sp.sl <= 3).length;
  document.getElementById("statLow").textContent = sapHet;
}

// =================== LẤY DỮ LIỆU ===================
function getDanhMuc() {
  const set = new Set(products.map(p => p.brand.toLowerCase()));
  set.add("phụ kiện");
  const order = ["casio","rolex","citizen","rado","seiko","phụ kiện"];
  return order.filter(k => set.has(k));
}

function getLoai(danhmuc) {
  if(danhmuc === "phụ kiện") {
    const types = new Set(accessories.map(a => a.accessory || a.type || "Khác"));
    return Array.from(types);
  } else {
    const loaiSet = new Set(products.filter(p => p.brand.toLowerCase() === danhmuc).map(p => p.category));
    return Array.from(loaiSet);
  }
}

function getTen(danhmuc, loai) {
  if(danhmuc === "phụ kiện") {
    return accessories.filter(a => (a.accessory || a.type || "Khác") === loai).map(a => a.name);
  } else {
    return products.filter(p => p.brand.toLowerCase() === danhmuc && p.category === loai).map(p => p.name);
  }
}

function getGia(danhmuc, loai, tensp) {
  if(danhmuc === "phụ kiện") {
    const found = accessories.find(a => (a.accessory || a.type || "Khác") === loai && a.name === tensp);
    return found ? found.price : 0;
  } else {
    const found = products.find(p => p.brand.toLowerCase() === danhmuc && p.category === loai && p.name === tensp);
    return found ? found.price : 0;
  }
}

// =================== FORM & EVEN ===================
document.addEventListener('DOMContentLoaded', () => {
  rebuildStock();
  renderPhieu();

  // ===== Tìm kiếm kho hàng =====
  const searchKhoInput = document.getElementById('searchKho');
  if(searchKhoInput){
    searchKhoInput.addEventListener('input', e => {
      const keyword = e.target.value.toLowerCase();
      const filtered = tonKho.filter(sp => 
        sp.tensp.toLowerCase().includes(keyword) ||
        sp.danhmuc.toLowerCase().includes(keyword) ||
        (sp.loai && sp.loai.toLowerCase().includes(keyword))
      );
      renderKhoFiltered(filtered);
    });
  }

  // Hàm render kho đã lọc
  function renderKhoFiltered(list) {
    const tbl = document.querySelector('#tblKho tbody');
    tbl.innerHTML = '';
    list.forEach((sp, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td>${sp.ma}</td>
        <td>${sp.tensp}</td>
        <td>${capitalizeWords(sp.danhmuc)}</td>
        <td>${LOAI_DISPLAY[sp.loai?.toLowerCase()] || capitalizeWords(sp.loai)}</td>
        <td class="${sp.sl<=3?'low':''}">${sp.sl}</td>
      `;
      tbl.appendChild(tr);
    });
  }

  // ===== Tìm kiếm =====
  const searchInput = document.getElementById('searchPhieu');
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value;
    const filtered = filterPhieu(keyword);

    // render lại bảng với dữ liệu đã lọc
    renderPhieuFiltered(filtered);
  });

  function setupDropdowns(prefix) {
    const dm = document.getElementById(prefix + '_danhmuc');
    const loai = document.getElementById(prefix + '_loai');
    const ten = document.getElementById(prefix + '_tensp');
    const gia = document.getElementById(prefix + '_gia');

    loai.disabled = true;
    ten.disabled = true;

    // load danh mục
    dm.innerHTML = '<option value="">-- Chọn danh mục --</option>';
    getDanhMuc().forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = capitalizeWords(k);
      dm.appendChild(opt);
    });

    //khi chọn danh mục
    dm.addEventListener('change', () => {
      loai.innerHTML = '<option value="">-- Chọn loại --</option>';
      ten.innerHTML = '<option value="">-- Chọn tên --</option>';
      gia.value = '';
      ten.disabled = true;

      if (!dm.value) {
        loai.disabled = true;
        return;
      }

      getLoai(dm.value).forEach(l => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = LOAI_DISPLAY[l] || capitalizeWords(l);
        loai.appendChild(opt);
      });

      loai.disabled = false;
    });

    //khi chọn loại
    loai.addEventListener('change', () => {
      ten.innerHTML = '<option value="">-- Chọn tên --</option>';
      gia.value = '';

      if (!loai.value) {
        ten.disabled = true;
        return;
      }

      getTen(dm.value, loai.value).forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        ten.appendChild(opt);
      });

      ten.disabled = false;
    });

    //khi chọn tên sản phẩm
    ten.addEventListener('change', () => {
      if (dm.value && loai.value && ten.value) {
        gia.value = getGia(dm.value, loai.value, ten.value);
        gia.readOnly = true;
      }
    });
  }

  setupDropdowns('p');
  setupDropdowns('e');
  setupDropdowns('r');

  document.getElementById('reportForm').addEventListener('submit', e => {
    e.preventDefault();

    const danhmuc = document.getElementById('r_danhmuc').value;
    const loai = document.getElementById('r_loai').value;
    const tensp = document.getElementById('r_tensp').value;
    const startDate = document.getElementById('r_dateStart').value;
    const endDate = document.getElementById('r_dateEnd').value;

    if (!danhmuc || !loai || !tensp || !startDate || !endDate) {
      return alert('Chọn đầy đủ sản phẩm và khoảng thời gian');
    }

    const tonDau = getTonDau(tensp, danhmuc, loai, startDate);
    const nhap = getNhapTrongKhoang(tensp, danhmuc, loai, startDate, endDate);
    const xuat = getXuatTrongKhoang(tensp, danhmuc, loai, startDate, endDate);
    const tonCuoi = tonDau + nhap - xuat;

    const tbl = document.querySelector('#tblReport tbody');
    tbl.innerHTML = `
      <tr>
        <td>${tensp}</td>
        <td>${capitalizeWords(danhmuc)}</td>
        <td>${LOAI_DISPLAY[loai?.toLowerCase()] || capitalizeWords(loai)}</td>
        <td>${tonDau}</td>
        <td>${nhap}</td>
        <td>${xuat}</td>
        <td>${tonCuoi}</td>
      </tr>
    `;
  });

  // Thêm phiếu nhập
  document.getElementById('phieuForm').addEventListener('submit', e => {
    e.preventDefault();
    const h = document.getElementById('p_danhmuc').value;
    const t = document.getElementById('p_tensp').value;
    const loai = document.getElementById('p_loai').value;
    const sl = Number(document.getElementById('p_sl').value || 0);
    const gia = Number(document.getElementById('p_gia').value || 0);
    const ngay = document.getElementById('p_ngay').value || new Date().toISOString().slice(0, 10);

    if (!h || !t) return alert('Chọn danh mục và sản phẩm');

    phieuNhap.push({ tensp: t, danhmuc: h, loai, sl, gia, ngay, locked: false });

    let rec = tonKho.find(x => x.tensp === t && x.danhmuc === h);
    if (rec) rec.sl += sl;
    else tonKho.push({ ma: generateCode(t), tensp: t, danhmuc: h, loai, sl });

    localStorage.setItem('phieuNhap', JSON.stringify(phieuNhap));
    localStorage.setItem('tonKho', JSON.stringify(tonKho));
    renderPhieu();
    e.target.reset();
  });

  // xử lý bảng phiếu nhập
  document.getElementById('tblPhieu').addEventListener('click', e => {
    const btn = e.target;
    const idx = Number(btn.dataset.idx);
    if (btn.classList.contains('edit')) openEditModal(idx);
    else if (btn.classList.contains('complete')) finishReceipt(idx);
    else if (btn.classList.contains('delete')) deleteReceipt(idx);
  });

  document.getElementById('btn-cancel-edit').addEventListener('click', closeEditModal);

  document.getElementById('editForm').addEventListener('submit', e => {
    e.preventDefault();
    const idx = Number(document.getElementById('e_index').value);
    const newDanhmuc = document.getElementById('e_danhmuc').value;
    const newTensp = document.getElementById('e_tensp').value;
    const newLoai = document.getElementById('e_loai').value;
    const newSl = Number(document.getElementById('e_sl').value || 0);
    const newGia = Number(document.getElementById('e_gia').value || 0);
    const newNgay = document.getElementById('e_ngay').value || new Date().toISOString().slice(0, 10);

    const old = phieuNhap[idx];
    if (!old || old.locked) return alert('Phiếu không tồn tại hoặc đã khóa');

    if (old.tensp !== newTensp || old.danhmuc !== newDanhmuc) {
      const oldStock = tonKho.find(x => x.tensp === old.tensp && x.danhmuc === old.danhmuc);
      if (oldStock) oldStock.sl -= old.sl;

      let newStock = tonKho.find(x => x.tensp === newTensp && x.danhmuc === newDanhmuc);
      if (newStock) newStock.sl += newSl;
      else tonKho.push({ ma: generateCode(newTensp), tensp: newTensp, danhmuc: newDanhmuc, loai: newLoai, sl: newSl });
    } else {
      const delta = newSl - old.sl;
      const rec = tonKho.find(x => x.tensp === old.tensp && x.danhmuc === old.danhmuc);
      if (rec) rec.sl += delta;
    }

    phieuNhap[idx] = { tensp: newTensp, danhmuc: newDanhmuc, loai: newLoai, sl: newSl, gia: newGia, ngay: newNgay, locked: old.locked };
    tonKho = tonKho.filter(x => x.sl > 0);

    localStorage.setItem('phieuNhap', JSON.stringify(phieuNhap));
    localStorage.setItem('tonKho', JSON.stringify(tonKho));
    renderPhieu();
    closeEditModal();
  });
});

// =================== MODAL ===================
function openEditModal(idx) {
  const rec = phieuNhap[idx];
  if (!rec) return;

  document.getElementById('e_index').value = idx;
  const dm = document.getElementById('e_danhmuc');
  const loai = document.getElementById('e_loai');
  const ten = document.getElementById('e_tensp');
  const sl = document.getElementById('e_sl');
  const gia = document.getElementById('e_gia');
  const ngay = document.getElementById('e_ngay');

  // reset dropdown
  dm.innerHTML = '<option value="">-- Chọn danh mục --</option>';
  getDanhMuc().forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = capitalizeWords(k);
    dm.appendChild(opt);
  });

  dm.value = rec.danhmuc;

  // load loại theo danh mục
  loai.innerHTML = '<option value="">-- Chọn loại --</option>';
  getLoai(dm.value).forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = LOAI_DISPLAY[l] || capitalizeWords(l);
    loai.appendChild(opt);
  });
  loai.value = rec.loai;

  // load tên theo danh mục + loại
  ten.innerHTML = '<option value="">-- Chọn tên --</option>';
  getTen(dm.value, loai.value).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    ten.appendChild(opt);
  });
  ten.value = rec.tensp;

  loai.disabled = false;
  ten.disabled = false;

  // load các input còn lại
  sl.value = rec.sl;
  gia.value = rec.gia;
  gia.readOnly = true;
  ngay.value = rec.ngay;

  // hiển thị modal
  document.getElementById('modal-overlay').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

function completeReceipt(idx) {
  const rec = phieuNhap[idx];
  if (!rec) return;
  rec.locked = true;
  renderPhieu();
}

//-- Xác nhận xóa --//
let pendingDeleteIndex = null;

function deleteReceipt(idx) {
  const rec = phieuNhap[idx];
  if (!rec) return;

  pendingDeleteIndex = idx;
  document.getElementById('confirm-overlay').style.display = 'flex';
}

document.getElementById('btn-cancel-delete').addEventListener('click', () => {
  pendingDeleteIndex = null;
  document.getElementById('confirm-overlay').style.display = 'none';
});

document.getElementById('btn-confirm-delete').addEventListener('click', () => {
  if (pendingDeleteIndex === null) return;
  const rec = phieuNhap[pendingDeleteIndex];
  if (!rec) return;

  // cập nhật tồn kho
  const st = tonKho.find(x => x.tensp === rec.tensp && x.danhmuc === rec.danhmuc);
  if (st) st.sl -= rec.sl;
  tonKho = tonKho.filter(x => x.sl > 0);

  // xóa phiếu
  phieuNhap.splice(pendingDeleteIndex, 1);
  localStorage.setItem('phieuNhap', JSON.stringify(phieuNhap));
  localStorage.setItem('tonKho', JSON.stringify(tonKho));
  renderPhieu();

  // đóng popup
  pendingDeleteIndex = null;
  document.getElementById('confirm-overlay').style.display = 'none';
});

//-- Xác nhận hoàn thành phiếu --//
let pendingFinishIndex = null;

function finishReceipt(idx) {
  const rec = phieuNhap[idx];
  if (!rec) return;

  pendingFinishIndex = idx;
  document.getElementById('confirm-finish-overlay').style.display = 'flex';
}

document.getElementById('btn-cancel-finish').addEventListener('click', () => {
  pendingFinishIndex = null;
  document.getElementById('confirm-finish-overlay').style.display = 'none';
});

document.getElementById('btn-confirm-finish').addEventListener('click', () => {
  if (pendingFinishIndex === null) return;
  const rec = phieuNhap[pendingFinishIndex];
  if (!rec) return;

  // cập nhật trạng thái phiếu
  rec.locked = true;

  // cập nhật hiển thị và lưu
  localStorage.setItem('phieuNhap', JSON.stringify(phieuNhap));
  localStorage.setItem('tonKho', JSON.stringify(tonKho));
  renderPhieu();

  // đóng popup
  pendingFinishIndex = null;
  document.getElementById('confirm-finish-overlay').style.display = 'none';
});

document.getElementById("btnPhieuNhap").addEventListener("click", () => {
  document.getElementById("phieuNhapSection").style.display = "block";
  document.getElementById("tonKhoSection").style.display = "none";
  document.getElementById("btnPhieuNhap").classList.add("active");
  document.getElementById("btnTonKho").classList.remove("active");
  document.querySelector(".header h1").textContent = "Quản lý nhập hàng";
});

document.getElementById("btnTonKho").addEventListener("click", () => {
  document.getElementById("phieuNhapSection").style.display = "none";
  document.getElementById("tonKhoSection").style.display = "block";
  document.getElementById("btnTonKho").classList.add("active");
  document.getElementById("btnPhieuNhap").classList.remove("active");
  document.querySelector(".header h1").textContent = "Tổng quan kho hàng";
});
