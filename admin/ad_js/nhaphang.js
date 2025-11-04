const hangList = ["Casio", "Rolex", "Citizen", "Rado", "Seiko"];

const spData = {
  Casio: ["G-Shock GA-2100", "Edifice EFR-526", "Vintage F91W", "Pro Trek PRW-3500"],
  Rolex: ["Submariner 124060", "Datejust 126300", "Explorer 124270"],
  Citizen: ["Eco-Drive BM7100", "Promaster Diver", "Tsuyosa NJ015", "Chrono CA0690"],
  Rado: ["True Thinline", "Captain Cook R325", "Centrix"],
  Seiko: ["Presage SRPB43", "5 Sports SNK809", "Prospex Turtle", "Prospex SNE537"]
};

// ====== PHIẾU NHẬP MẪU ======
let phieuNhap = [
  { tensp: "G-Shock GA-2100", hang: "Casio", loai: "Nam", sl: 10, gia: 1500000, ngay: "2025-10-18" },
  { tensp: "Edifice EFR-526", hang: "Casio", loai: "Nam", sl: 6, gia: 2200000, ngay: "2025-08-20" },
  { tensp: "Submariner 124060", hang: "Rolex", loai: "Nam", sl: 11, gia: 250000000, ngay: "2025-08-25" },
  { tensp: "Datejust 126300", hang: "Rolex", loai: "Nam", sl: 10, gia: 300000000, ngay: "2025-08-28" },
  { tensp: "Eco-Drive BM7100", hang: "Citizen", loai: "Nam", sl: 8, gia: 2600000, ngay: "2025-09-01" },
  { tensp: "Promaster Diver", hang: "Citizen", loai: "Nam", sl: 23, gia: 3800000, ngay: "2025-10-03" },
  { tensp: "True Thinline", hang: "Rado", loai: "Nữ", sl: 4, gia: 12000000, ngay: "2025-09-06" },
  { tensp: "Captain Cook R325", hang: "Rado", loai: "Nam", sl: 27, gia: 9000000, ngay: "2025-09-08" },
  { tensp: "Presage SRPB43", hang: "Seiko", loai: "Nam", sl: 7, gia: 3300000, ngay: "2025-09-10" },
  { tensp: "5 Sports SNK809", hang: "Seiko", loai: "Nam", sl: 12, gia: 2100000, ngay: "2025-09-12" },
  { tensp: "Vintage F91W", hang: "Casio", loai: "Unisex", sl: 15, gia: 500000, ngay: "2025-10-15" },
  { tensp: "Prospex Turtle", hang: "Seiko", loai: "Nam", sl: 25, gia: 5200000, ngay: "2025-09-30" }
];

// ====== TỒN KHO MẪU ======
let tonKho = [
  { id: "SP01", tensp: "G-Shock GA-2100", hang: "Casio", loai: "Nam", sl: 22 },
  { id: "SP02", tensp: "Edifice EFR-526", hang: "Casio", loai: "Nam", sl: 10 },
  { id: "SP03", tensp: "Vintage F91W", hang: "Casio", loai: "Unisex", sl: 30 },
  { id: "SP04", tensp: "Pro Trek PRW-3500", hang: "Casio", loai: "Nam", sl: 25 },

  { id: "SP05", tensp: "Submariner 124060", hang: "Rolex", loai: "Nam", sl: 20 },
  { id: "SP06", tensp: "Datejust 126300", hang: "Rolex", loai: "Nam", sl: 31 },
  { id: "SP07", tensp: "Explorer 124270", hang: "Rolex", loai: "Nam", sl: 15 },

  { id: "SP08", tensp: "Eco-Drive BM7100", hang: "Citizen", loai: "Nam", sl: 9 },
  { id: "SP09", tensp: "Promaster Diver", hang: "Citizen", loai: "Nam", sl: 14 },
  { id: "SP10", tensp: "Tsuyosa NJ015", hang: "Citizen", loai: "Nam", sl: 6 },

  { id: "SP11", tensp: "True Thinline", hang: "Rado", loai: "Nữ", sl: 53 },
  { id: "SP12", tensp: "Captain Cook R325", hang: "Rado", loai: "Nam", sl: 42 },
  { id: "SP13", tensp: "Centrix", hang: "Rado", loai: "Nữ", sl: 5 },

  { id: "SP14", tensp: "Presage SRPB43", hang: "Seiko", loai: "Nam", sl: 11 },
  { id: "SP15", tensp: "5 Sports SNK809", hang: "Seiko", loai: "Nam", sl: 14 },
  { id: "SP16", tensp: "Prospex Turtle", hang: "Seiko", loai: "Nam", sl: 6 },
  { id: "SP17", tensp: "Prospex SNE537", hang: "Seiko", loai: "Nam", sl: 4 }
];

// ====== DOM REFERENCES ======
const selHang = document.getElementById("p_hang");
const selTenSP = document.getElementById("p_tensp");
const form = document.getElementById("phieuForm");
const tblPhieu = document.querySelector("#tblPhieu tbody");
const tblKho = document.querySelector("#tblKho tbody");

// ====== INIT ======
function init() {
  // điền hãng
  hangList.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = h;
    selHang.appendChild(opt);
  });

  renderPhieuNhap();
  renderTonKho();
  updateStats();
}
document.addEventListener("DOMContentLoaded", init);

selHang.addEventListener("change", () => {
  const hang = selHang.value;
  selTenSP.innerHTML = `<option value="">-- Chọn tên sản phẩm --</option>`;
  if (!hang) return selTenSP.disabled = true;
  (spData[hang] || []).forEach(sp => {
    const opt = document.createElement("option");
    opt.value = sp;
    opt.textContent = sp;
    selTenSP.appendChild(opt);
  });
  selTenSP.disabled = false;
});

form.addEventListener("submit", e => {
  e.preventDefault();
  const hang = selHang.value.trim();
  const tensp = selTenSP.value.trim();
  const loai = document.getElementById("p_loai").value.trim();
  const sl = parseInt(document.getElementById("p_sl").value, 10);
  const gia = parseInt(document.getElementById("p_gia").value, 10);
  const ngay = document.getElementById("p_ngay").value;

  if (!hang || !tensp || !loai || !ngay || isNaN(sl) || isNaN(gia)) {
    alert("Vui lòng điền đầy đủ thông tin hợp lệ.");
    return;
  }

  phieuNhap.push({ tensp, hang, loai, sl, gia, ngay });

  const existing = tonKho.find(i => i.tensp === tensp && i.hang === hang);
  if (existing) existing.sl += sl;
  else tonKho.push({ id: "SP" + String(tonKho.length + 1).padStart(2, "0"), tensp, hang, loai, sl });

  renderPhieuNhap();
  renderTonKho();
  updateStats();

  form.reset();
  selTenSP.disabled = true;
});

function renderPhieuNhap() {
  tblPhieu.innerHTML = "";
  phieuNhap.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.tensp}</td>
      <td>${p.hang}</td>
      <td>${p.loai}</td>
      <td>${p.sl}</td>
      <td>${p.gia.toLocaleString("vi-VN")}đ</td>
      <td>${p.ngay}</td>
      <td><button class="btn-delete" data-index="${i}">Xóa</button></td>
    `;
    tblPhieu.appendChild(tr);
  });

  document.querySelectorAll(".btn-delete").forEach(btn =>
    btn.addEventListener("click", e => {
      const idx = e.target.dataset.index;
      xoaPhieu(idx);
    })
  );
}

function xoaPhieu(index) {
  const phieu = phieuNhap[index];
  if (!confirm(`Xóa phiếu "${phieu.tensp}" (${phieu.sl} cái)?`)) return;

  const sp = tonKho.find(i => i.tensp === phieu.tensp && i.hang === phieu.hang);
  if (sp) {
    sp.sl -= phieu.sl;
    if (sp.sl <= 0) tonKho = tonKho.filter(x => x !== sp);
  }

  phieuNhap.splice(index, 1);

  renderPhieuNhap();
  renderTonKho();
  updateStats();
}

function renderTonKho() {
  tblKho.innerHTML = "";
  tonKho.forEach((sp, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${sp.id}</td>
      <td>${sp.tensp}</td>
      <td>${sp.hang}</td>
      <td>${sp.loai}</td>
      <td>${sp.sl}</td>
    `;
    tblKho.appendChild(tr);
  });
}

function updateStats() {
  document.getElementById("statProducts").textContent = tonKho.length;
  document.getElementById("statPhieu").textContent = phieuNhap.length;
  const tong = tonKho.reduce((acc, cur) => acc + (Number(cur.sl) || 0), 0);
  document.getElementById("statTotalStock").textContent = tong;
  const sapHet = tonKho.filter(sp => sp.sl <= 3).length;
  document.getElementById("statLow").textContent = sapHet;
}