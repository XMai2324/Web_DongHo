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

// ======= SINH PHIẾU NHẬP NGẪU NHIÊN =======
const randPhieu = seededRandom(123); 
phieuNhap = [];

for(let i=0; i<11; i++) {
  const danhMuc = getDanhMuc()[Math.floor(randPhieu() * getDanhMuc().length)];
  const loaiList = getLoai(danhMuc);
  const loai = loaiList[Math.floor(randPhieu() * loaiList.length)];
  const tenList = getTen(danhMuc, loai);
  const tensp = tenList[Math.floor(randPhieu() * tenList.length)];
  const sl = Math.floor(randPhieu()*10) + 7; // 1-10
  const gia = getGia(danhMuc, loai, tensp);
  const ngay = `2025-${String(Math.floor(randPhieu()*12)+1).padStart(2,'0')}-${String(Math.floor(randPhieu()*28)+1).padStart(2,'0')}`;
  
  phieuNhap.push({tensp, danhmuc: danhMuc, loai, sl, gia, ngay, locked: false});
}

// ======= SINH TỒN KHO NGẪU NHIÊN =======
const randKho = seededRandom(789);
tonKho = [];

let totalSL = 0;
const maxStock = 137; // tổng tồn kho mong muốn

while(totalSL < maxStock) {
  const danhMuc = getDanhMuc()[Math.floor(randKho() * getDanhMuc().length)];
  const loaiList = getLoai(danhMuc);
  const loai = loaiList[Math.floor(randKho() * loaiList.length)];
  const tenList = getTen(danhMuc, loai);
  const tensp = tenList[Math.floor(randKho() * tenList.length)];

  // tránh trùng
  if(tonKho.find(x=>x.tensp===tensp && x.danhmuc===danhMuc)) continue;

  const sl = Math.min(Math.floor(randKho()*10)+13, maxStock - totalSL);
  totalSL += sl;

  tonKho.push({ ma: generateCode(tensp), tensp, danhmuc: danhMuc, loai, sl });

  if(tonKho.length >= 25) break;
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
  document.getElementById("statPhieu").textContent = phieuNhap.length;

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

// =================== FORM & SỰ KIỆN ===================
document.addEventListener('DOMContentLoaded', () => {
  rebuildStock();
  renderPhieu();

  function setupDropdowns(prefix) {
    const dm = document.getElementById(prefix + '_danhmuc');
    const loai = document.getElementById(prefix + '_loai');
    const ten = document.getElementById(prefix + '_tensp');
    const gia = document.getElementById(prefix + '_gia');

    // load danh mục
    dm.innerHTML = '<option value="">-- Chọn danh mục --</option>';
    getDanhMuc().forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = capitalizeWords(k);
      dm.appendChild(opt);
    });

    dm.addEventListener('change', () => {
      loai.innerHTML = '<option value="">-- Chọn loại --</option>';
      ten.innerHTML = '<option value="">-- Chọn tên --</option>';
      gia.value = '';

      if (!dm.value) {
        loai.disabled = true;
        ten.disabled = true;
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

    ten.addEventListener('change', () => {
      if (dm.value && loai.value && ten.value) {
        gia.value = getGia(dm.value, loai.value, ten.value);
        gia.readOnly = true;
      }
    });
  }

  setupDropdowns('p');
  setupDropdowns('e');

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

    renderPhieu();
    e.target.reset();
  });

  // xử lý bảng phiếu nhập
  document.getElementById('tblPhieu').addEventListener('click', e => {
    const btn = e.target;
    const idx = Number(btn.dataset.idx);
    if (btn.classList.contains('edit')) openEditModal(idx);
    else if (btn.classList.contains('complete')) completeReceipt(idx);
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

function deleteReceipt(idx) {
  const rec = phieuNhap[idx];
  if (!rec) return;
  const st = tonKho.find(x => x.tensp === rec.tensp && x.danhmuc === rec.danhmuc);
  if (st) st.sl -= rec.sl;
  tonKho = tonKho.filter(x => x.sl > 0);
  phieuNhap.splice(idx, 1);
  renderPhieu();
}
