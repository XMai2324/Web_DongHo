document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('.search input');
  const btn   = document.querySelector('.search .fa-magnifying-glass');
  if (!input) return;

  // data brand
  const fallbackBrands = ['casio','rolex','citizen','rado','seiko'];
  const brandsFromData = Array.isArray(window.products)
    ? Array.from(new Set(
        window.products
          .map(p => (p && p.brand || '').toString().toLowerCase())
          .filter(Boolean)
      ))
    : [];
  const BRANDS = (brandsFromData.length ? brandsFromData : fallbackBrands);

  // chuẩn hoá: bỏ dấu, về thường
  const norm = s => (s||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D')
    .toLowerCase().trim();

  function parseBrand(s){
    const n = norm(s);
    let found = BRANDS.find(b => new RegExp(`\\b${b}\\b`).test(n));
    if (!found) found = BRANDS.find(b => n.includes(b));
    return found || null;
  }

  function parseCategory(s){
    const n = norm(s);
    const isCapDoi = /\b(cap\s*doi|cap-doi|capdoi|couple|pair)\b/.test(n);
    const isMale   = /\b(nam|men|male)\b/.test(n);
    const isFemale = /\b(nu|women|female)\b/.test(n);
    if (isCapDoi) return 'capdoi';
    if (isMale && !isFemale)   return 'nam';
    if (isFemale && !isMale)   return 'nu';
    return null;
  }

  function runSearch(raw){
    const qRaw = (raw || '').trim();
    if (!qRaw) { input.focus(); return; }

    const brand    = parseBrand(qRaw);
    const category = parseCategory(qRaw);

    // Tạo URL tuyệt đối đến client.html (cùng thư mục trang hiện tại)
    const url = new URL('client.html', window.location.href);
    if (brand)    url.searchParams.set('brand', brand);
    if (category) url.searchParams.set('category', category);
    url.searchParams.set('q', qRaw); // luôn đính kèm từ khoá gốc

    if (location.pathname.endsWith('/client.html')) {
      // đã ở trang kết quả -> chỉ thay query
      location.search = url.search;
    } else {
      // điều hướng sang trang kết quả
      location.href = url.toString();
    }
  }

  // Enter & click icon
  input.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(input.value); });
  btn && btn.addEventListener('click', () => runSearch(input.value));
});