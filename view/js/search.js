document.addEventListener('DOMContentLoaded', () => {
  // Lấy input & icon ở thanh tìm kiếm
  const input = document.querySelector('.search input');
  const btn   = document.querySelector('.search .fa-magnifying-glass');
  if (!input) return;

  // Lấy brand từ dữ liệu nếu có
  const fallbackBrands = ['casio','rolex','citizen','rado','seiko'];
  const brandsFromData = Array.isArray(window.products)
    ? Array.from(new Set(
        window.products
          .map(p => (p && p.brand || '').toString().toLowerCase())
          .filter(Boolean)
      ))
    : [];
  const BRANDS = (brandsFromData.length ? brandsFromData : fallbackBrands);

  // Chuẩn hoá: bỏ dấu, về thường
  const norm = s => (s||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D')
    .toLowerCase().trim();

  // Tìm brand xuất hiện trong chuỗi
  function parseBrand(s){
    const n = norm(s);
    let found = BRANDS.find(b => new RegExp(`\\b${b}\\b`).test(n));
    if (!found) found = BRANDS.find(b => n.includes(b));
    return found || null;
  }

  // Bắt category: nam | nu | capdoi
  function parseCategory(s){
    const n = norm(s); // đã bỏ dấu nên "nữ" -> "nu", "cặp đôi" -> "cap doi"
    const isCapDoi = /\b(cap\s*doi|cap-doi|capdoi|couple|pair)\b/.test(n);
    const isMale   = /\b(nam|men|male)\b/.test(n);
    const isFemale = /\b(nu|women|female)\b/.test(n);

    if (isCapDoi) return 'capdoi';
    if (isMale && !isFemale)   return 'nam';
    if (isFemale && !isMale)   return 'nu';
    return null; // không chỉ rõ => hiển thị cả Nam & Nữ
  }

  // Điều hướng
  function runSearch(raw){
    const brand    = parseBrand(raw);
    const category = parseCategory(raw);   // 'nam' | 'nu' | 'capdoi' | null

    const qs = new URLSearchParams();
    if (brand)    qs.set('brand', brand);
    if (category) qs.set('category', category);

    const query = qs.toString();
    // Điều hướng TƯƠNG ĐỐI:
    window.location.href = `client.html${query ? `?${query}` : ''}`;
  }

  // Enter & click icon
  input.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(input.value); });
  btn && btn.addEventListener('click', () => runSearch(input.value));
});