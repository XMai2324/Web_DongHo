document.addEventListener("DOMContentLoaded", () => {
  // ===== DỮ LIỆU GIẢ LẬP =====
  const MOCK = [
    {
      phone: "0912345678",
      customer: "Nguyễn Văn A",
      orders: [
        { order_code: "DH00123", product: "Đồng hồ Casio MTP-V002", from: "01/01/2025", to: "01/01/2026", status: "Còn hiệu lực" },
        { order_code: "DH00124", product: "Đồng hồ Orient FUNG2002B0", from: "01/03/2024", to: "01/03/2025", status: "Đã hết hạn" }
      ]
    },
    {
      phone: "0988001122",
      customer: "Trần Thị B",
      orders: [
        { order_code: "DH00999", product: "Seiko SNE039", from: "15/07/2024", to: "15/07/2026", status: "Còn hiệu lực" }
      ]
    }
  ];

  const $phone  = document.getElementById("wlp-phone");
  const $btn    = document.getElementById("wlp-btn");
  const $result = document.getElementById("wlp-result");

  function render(data) {
    if (!data) {
      $result.innerHTML = `<div class="empty">Không tìm thấy bảo hành theo số điện thoại đã nhập.</div>`;
      return;
    }
    let html = `<div class="wlp-customer"><b>Tên khách hàng:</b> ${data.customer}</div>`;
    html += data.orders.map(o => `
      <div class="wlp-order">
        <p><b>Mã đơn hàng:</b> ${o.order_code}</p>
        <p><b>Sản phẩm:</b> ${o.product}</p>
        <p><b>Thời hạn:</b> ${o.from} → ${o.to}</p>
        <p><b>Trạng thái:</b> <span class="badge ${o.status.includes('Còn') ? 'ok' : 'exp'}">${o.status}</span></p>
      </div>
    `).join("");
    html += `<div class="note">Lưu ý: Kết quả chỉ mang tính tham khảo.</div>`;
    $result.innerHTML = html;
  }

  function lookup() {
    const phone = ($phone.value || "").trim();
    if (!phone) {
      $result.innerHTML = `<div class="empty">Vui lòng nhập số điện thoại.</div>`;
      return;
    }
    const found = MOCK.find(x => x.phone === phone);
    render(found);
  }

  if ($btn)   $btn.addEventListener("click", lookup);
  if ($phone) $phone.addEventListener("keyup", e => { if (e.key === "Enter") lookup(); });
});
