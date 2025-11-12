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
if (savedPhieu) {
  phieuNhap = JSON.parse(savedPhieu);
} else {
  phieuNhap = generateSampleReceipts(10);
  localStorage.setItem('phieuNhap', JSON.stringify(phieuNhap));
}

const savedKho = localStorage.getItem('tonKho');
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
  strap: "Dây đeo"
};

// =================== HÀM HỖ TRỢ BÁO CÁO ===================
function getTonDau(tensp, danhmuc, loai, startDate) {
  return phieuNhap.reduce((acc, p) => acc + (p.danhmuc === danhmuc && p.tensp === tensp && p.loai === loai && p.ngay < startDate ? p.sl : 0), 0);
}

function getNhapTrongKhoang(tensp, danhmuc, loai, startDate, endDate) {
  return phieuNhap.reduce((acc, p) => acc + (p.danhmuc === danhmuc && p.tensp === tensp && p.loai === loai && p.ngay >= startDate && p.ngay <= endDate ? p.sl : 0), 0);
}

function getXuatTrongKhoang(tensp, danhmuc, loai, startDate, endDate) {
  return 0; // placeholder
}

// =================== HÀM HỖ TRỢ ===================
function generateCode(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6);
}

function capitalizeWords(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatNumber(n) {
  return new Intl.NumberFormat('vi-VN').format(n);
}

function rebuildStock() {
  const base = JSON.parse(localStorage.getItem('tonKhoInit') || '[]');
  if (!base.length)
    return;

  tonKho = structuredClone(base);

  phieuNhap
    .filter(p => p.locked)
    .forEach(p => {
      const sp = tonKho.find(t =>
        t.tensp === p.tensp &&
        t.danhmuc === p.danhmuc &&
        t.loai === p.loai
      );
      if (sp) sp.sl += Number(p.sl);
      else tonKho.push({
        ma: generateCode(p.tensp),
        tensp: p.tensp,
        danhmuc: p.danhmuc,
        loai: p.loai,
        sl: Number(p.sl),
        gia: Number(p.gia)
      });
    });

  localStorage.setItem('tonKho', JSON.stringify(tonKho));
}

function generateSampleReceipts(n = 10) {
  const sampleQuantities = [10, 15, 8, 12, 31, 27, 15, 9, 11, 24]; 
  const list = [];
  for(let i=0;i<n;i++){
    const p = products[i % products.length];
    const sl = sampleQuantities[i];
    list.push({
      tensp: p.name,
      danhmuc: p.brand,
      loai: p.category,
      sl: sl,
      gia: p.price,
      ngay: new Date().toISOString().slice(0,10),
      locked: false
    });
  }
  return list;
}

// =================== LẤY DỮ LIỆU ===================
function getDanhMuc() {
  const set = new Set(products.map(p => p.brand.toLowerCase()));
  set.add("phụ kiện");
  const order = ["casio","rolex","citizen","rado","seiko","phụ kiện"];
  return order.filter(k => set.has(k));
}

function getLoai(danhmuc) {
  if(danhmuc === "phụ kiện") return Array.from(new Set(accessories.map(a => a.accessory || a.type || "Khác")));
  return Array.from(new Set(products.filter(p => p.brand.toLowerCase() === danhmuc).map(p => p.category)));
}

function getTen(danhmuc, loai) {
  if(danhmuc === "phụ kiện") return accessories.filter(a => (a.accessory || a.type || "Khác") === loai).map(a => a.name);
  return products.filter(p => p.brand.toLowerCase() === danhmuc && p.category === loai).map(p => p.name);
}

function getGia(danhmuc, loai, tensp) {
  if(danhmuc === "phụ kiện") return (accessories.find(a => (a.accessory || a.type || "Khác") === loai && a.name === tensp) || {}).price || 0;
  return (products.find(p => p.brand.toLowerCase() === danhmuc && p.category === loai && p.name === tensp) || {}).price || 0;
}

// =================== RENDER PHIẾU & KHO ===================
function renderPhieu() {
  const tbl = document.querySelector('#tblPhieu tbody');
  tbl.innerHTML = '';
  phieuNhap.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.id = 'phieu-row-' + idx;
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${p.tensp}</td>
      <td>${capitalizeWords(p.danhmuc)}</td>
      <td>${LOAI_DISPLAY[p.loai?.toLowerCase()] || capitalizeWords(p.loai)}</td>
      <td>${p.sl}</td>
      <td>${formatNumber(p.gia)}</td>
      <td>${p.ngay}</td>
      <td>${p.locked ? '<span style="color:green;font-weight:600;">Hoàn thành</span>' : `
        <button class="table-btn edit" data-idx="${idx}">Sửa</button>
        <button class="table-btn complete" data-idx="${idx}">Hoàn thành</button>
        <button class="table-btn delete" data-idx="${idx}">Xóa</button>`}
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
  list.forEach(p => {
    const idx = phieuNhap.indexOf(p);
    const tr = document.createElement('tr');
    tr.id = 'phieu-row-' + idx;
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${p.tensp}</td>
      <td>${capitalizeWords(p.danhmuc)}</td>
      <td>${LOAI_DISPLAY[p.loai?.toLowerCase()] || capitalizeWords(p.loai)}</td>
      <td>${p.sl}</td>
      <td>${formatNumber(p.gia)}</td>
      <td>${p.ngay}</td>
      <td>${p.locked ? '<span style="color:green;font-weight:600;">Hoàn thành</span>' : `
        <button class="table-btn edit" data-idx="${idx}">Sửa</button>
        <button class="table-btn complete" data-idx="${idx}">Hoàn thành</button>
        <button class="table-btn delete" data-idx="${idx}">Xóa</button>`}
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

function updateStats() {
  document.getElementById("statProducts").textContent = tonKho.length;
  document.getElementById("totalPhieuNhap").textContent = phieuNhap.length;
  const tong = tonKho.reduce((a,b)=>a+(b.sl||0),0);
  document.getElementById("statTotalStock").textContent = tong;
  document.getElementById("statLow").textContent = tonKho.filter(sp=>sp.sl<=3).length;
}

// === KHỞI TẠO KHO HÀNG ===
function initTonKho() {
  const saved = localStorage.getItem("tonKho");
  if (saved) {
    try {
      tonKho = JSON.parse(saved);
      renderKho?.();
      updateStats?.();
      return;
    } catch {
      console.warn("Lỗi parse tonKho, sẽ tạo mới.");
    }
  }

  tonKho = [];

  // ====== SẢN PHẨM CHÍNH ======
  products.forEach(p => {
    tonKho.push({
      ma: generateCode(p.name),
      tensp: p.name,
      danhmuc: p.brand,
      loai: p.category,
      sl: 100,
      gia: p.price ?? 0
    });
  });

  // ====== PHỤ KIỆN ======
  accessories.forEach(a => {
    const loai = a.accessory || a.type || "Khác";
    tonKho.push({
      ma: generateCode(a.name),
      tensp: a.name,
      danhmuc: "phụ kiện",
      loai,
      sl: 100,
      gia: a.price ?? 0
    });
  });

  localStorage.setItem("tonKho", JSON.stringify(tonKho));
  renderKho?.();
  updateStats?.();
}

function deductStockFromOrder(order) {
  if (!order || !order.items) return;

  order.items.forEach(it => {
    // tìm sản phẩm trong tonKho theo tên (có thể mở rộng theo danh mục/loại)
    const sp = tonKho.find(p => p.tensp === it.name);
    if (sp) {
      sp.sl = Math.max(0, sp.sl - (it.qty || 0));
    }
  });

  // Lưu và render lại kho
  localStorage.setItem('tonKho', JSON.stringify(tonKho));
  renderKho();
  updateStats();
}

// =================== DOM READY ===================
document.addEventListener('DOMContentLoaded', () => {
  initTonKho();
  renderPhieu();

  //-- SEARCH & FILTER --
  const searchInput = document.getElementById('searchPhieu');
  searchInput?.addEventListener('input', () => renderPhieuFiltered(filterPhieu(searchInput.value)));

  const searchKhoInput = document.getElementById('searchKho');
  searchKhoInput?.addEventListener('input', e => {
    const keyword = e.target.value.toLowerCase();
    renderKhoFiltered(tonKho.filter(sp => 
      sp.tensp.toLowerCase().includes(keyword) ||
      sp.danhmuc.toLowerCase().includes(keyword) ||
      (sp.loai && sp.loai.toLowerCase().includes(keyword))
    ));
  });

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

  //-- SETUP DROPDOWNS --
  function setupDropdowns(prefix) {
    const dm = document.getElementById(prefix + '_danhmuc');
    const loai = document.getElementById(prefix + '_loai');
    const ten = document.getElementById(prefix + '_tensp');
    const gia = document.getElementById(prefix + '_gia');

    loai.disabled = true;
    ten.disabled = true;

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
      ten.disabled = true;
      if (!dm.value) { loai.disabled = true; return; }
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
      if (!loai.value) { ten.disabled = true; return; }
      getTen(dm.value, loai.value).forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        ten.appendChild(opt);
      });
      ten.disabled = false;
    });

    ten.addEventListener('change', () => {
      if(dm.value && loai.value && ten.value) {
        gia.value = getGia(dm.value, loai.value, ten.value);
        gia.readOnly = true;
      }
    });
  }

  setupDropdowns('p');
  setupDropdowns('e');
  setupDropdowns('r');

  //-- FORM REPORT --
  document.getElementById('reportForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const danhmuc = document.getElementById('r_danhmuc').value;
    const loai = document.getElementById('r_loai').value;
    const tensp = document.getElementById('r_tensp').value;
    const startDate = document.getElementById('r_dateStart').value;
    const endDate = document.getElementById('r_dateEnd').value;
    if(!danhmuc || !loai || !tensp || !startDate || !endDate) return alert('Chọn đầy đủ sản phẩm và khoảng thời gian');
    const tonDau = getTonDau(tensp, danhmuc, loai, startDate);
    const nhap = getNhapTrongKhoang(tensp, danhmuc, loai, startDate, endDate);
    const xuat = getXuatTrongKhoang(tensp, danhmuc, loai, startDate, endDate);
    const tonCuoi = tonDau + nhap - xuat;
    document.querySelector('#tblReport tbody').innerHTML = `
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

  //-- FORM PHIẾU NHẬP --
  document.getElementById('phieuForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const h = document.getElementById('p_danhmuc').value;
    const t = document.getElementById('p_tensp').value;
    const loai = document.getElementById('p_loai').value;
    const sl = Number(document.getElementById('p_sl').value || 0);
    const gia = Number(document.getElementById('p_gia').value || 0);
    const ngay = document.getElementById('p_ngay').value || new Date().toISOString().slice(0,10);
    if(!h || !t) return alert('Chọn danh mục và sản phẩm');
    phieuNhap.push({ tensp: t, danhmuc: h, loai, sl, gia, ngay, locked:false });
    localStorage.setItem('phieuNhap', JSON.stringify(phieuNhap));
    renderPhieu();
    e.target.reset();
  });

  //-- BẢNG PHIẾU NHẬP --
  document.getElementById('tblPhieu')?.addEventListener('click', e => {
    const btn = e.target;
    const idx = Number(btn.dataset.idx);
    if(btn.classList.contains('edit')) openEditModal(idx);
    else if(btn.classList.contains('complete')) finishReceipt(idx);
    else if(btn.classList.contains('delete')) deleteReceipt(idx);
  });

  document.getElementById('btn-cancel-edit')?.addEventListener('click', closeEditModal);

  document.getElementById('editForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const idx = Number(document.getElementById('e_index').value);
    const newDanhmuc = document.getElementById('e_danhmuc').value;
    const newTensp = document.getElementById('e_tensp').value;
    const newLoai = document.getElementById('e_loai').value;
    const newSl = Number(document.getElementById('e_sl').value || 0);
    const newGia = Number(document.getElementById('e_gia').value || 0);
    const newNgay = document.getElementById('e_ngay').value || new Date().toISOString().slice(0,10);
    const old = phieuNhap[idx];
    if(!old || old.locked) return alert('Phiếu không tồn tại hoặc đã khóa');
    phieuNhap[idx] = { tensp:newTensp, danhmuc:newDanhmuc, loai:newLoai, sl:newSl, gia:newGia, ngay:newNgay, locked:old.locked };
    tonKho = tonKho.filter(x=>x.sl>0);
    rebuildStock();
    localStorage.setItem('phieuNhap', JSON.stringify(phieuNhap));
    localStorage.setItem('tonKho', JSON.stringify(tonKho));
    renderPhieu();
    closeEditModal();
  });

  //-- MODAL EDIT --
  function openEditModal(idx) {
    const rec = phieuNhap[idx];
    if(!rec) return;
    document.getElementById('e_index').value = idx;
    const dm = document.getElementById('e_danhmuc');
    const loai = document.getElementById('e_loai');
    const ten = document.getElementById('e_tensp');
    const sl = document.getElementById('e_sl');
    const gia = document.getElementById('e_gia');
    const ngay = document.getElementById('e_ngay');
    dm.innerHTML = '<option value="">-- Chọn danh mục --</option>';
    getDanhMuc().forEach(k => { const opt = document.createElement('option'); opt.value=k; opt.textContent=capitalizeWords(k); dm.appendChild(opt); });
    dm.value = rec.danhmuc;
    loai.innerHTML = '<option value="">-- Chọn loại --</option>';
    getLoai(dm.value).forEach(l=>{const opt=document.createElement('option'); opt.value=l; opt.textContent=LOAI_DISPLAY[l]||capitalizeWords(l); loai.appendChild(opt); });
    loai.value = rec.loai;
    ten.innerHTML = '<option value="">-- Chọn tên --</option>';
    getTen(dm.value, loai.value).forEach(t=>{const opt=document.createElement('option'); opt.value=t; opt.textContent=t; ten.appendChild(opt); });
    ten.value = rec.tensp;
    loai.disabled=false; ten.disabled=false;
    sl.value=rec.sl; gia.value=rec.gia; gia.readOnly=true; ngay.value=rec.ngay;
    document.getElementById('modal-overlay').style.display='flex';
  }

  function closeEditModal() { document.getElementById('modal-overlay').style.display='none'; }

  //-- COMPLETE & DELETE --
  let pendingDeleteIndex=null, pendingFinishIndex=null;
  function deleteReceipt(idx){ pendingDeleteIndex=idx; document.getElementById('confirm-overlay').style.display='flex'; }
  function finishReceipt(idx){ pendingFinishIndex=idx; document.getElementById('confirm-finish-overlay').style.display='flex'; }
  document.getElementById('btn-cancel-delete')?.addEventListener('click',()=>{pendingDeleteIndex=null;document.getElementById('confirm-overlay').style.display='none';});
  document.getElementById('btn-confirm-delete')?.addEventListener('click',()=>{
    if(pendingDeleteIndex===null) return; phieuNhap.splice(pendingDeleteIndex,1); rebuildStock();
    localStorage.setItem('phieuNhap',JSON.stringify(phieuNhap)); localStorage.setItem('tonKho',JSON.stringify(tonKho));
    renderPhieu(); pendingDeleteIndex=null; document.getElementById('confirm-overlay').style.display='none';
  });
  document.getElementById('btn-cancel-finish')?.addEventListener('click',()=>{pendingFinishIndex=null;document.getElementById('confirm-finish-overlay').style.display='none';});
  document.getElementById('btn-confirm-finish')?.addEventListener('click',()=>{
    if (pendingFinishIndex === null) return;
    const p = phieuNhap[pendingFinishIndex];
    if (p.locked) return;

    p.locked = true;

    // Cộng thẳng vào kho (chỉ 1 lần)
    const sp = tonKho.find(t =>
      t.tensp === p.tensp &&
      t.danhmuc === p.danhmuc &&
      t.loai === p.loai
    );

    if (sp) {
      sp.sl += Number(p.sl);
    } else {
      tonKho.push({
        ma: generateCode(p.tensp),
        tensp: p.tensp,
        danhmuc: p.danhmuc,
        loai: p.loai,
        sl: Number(p.sl),
        gia: Number(p.gia)
      });
    }

    // Lưu & cập nhật hiển thị
    localStorage.setItem('phieuNhap', JSON.stringify(phieuNhap));
    localStorage.setItem('tonKho', JSON.stringify(tonKho));
    renderPhieu();
    updateStats();

    pendingFinishIndex = null;
    document.getElementById('confirm-finish-overlay').style.display = 'none';
  });



  //-- NAVIGATION --
  document.getElementById("btnPhieuNhap")?.addEventListener("click",()=>{
    document.getElementById("phieuNhapSection").style.display="block";
    document.getElementById("tonKhoSection").style.display="none";
    document.getElementById("btnPhieuNhap").classList.add("active");
    document.getElementById("btnTonKho").classList.remove("active");
    document.querySelector(".header h1").textContent="Quản lý nhập hàng";
  });
  document.getElementById("btnTonKho")?.addEventListener("click",()=>{
    document.getElementById("phieuNhapSection").style.display="none";
    document.getElementById("tonKhoSection").style.display="block";
    document.getElementById("btnTonKho").classList.add("active");
    document.getElementById("btnPhieuNhap").classList.remove("active");
    document.querySelector(".header h1").textContent="Tổng quan kho hàng";
  });

  window.addEventListener('storage', function(e) {
    if (e.key === 'last_order' && e.newValue) {
      try {
        const order = JSON.parse(e.newValue);
        deductStockFromOrder(order);
      } catch(err) {
        console.error('Lỗi parse đơn hàng từ localStorage:', err);
      }
    }
  });

});
