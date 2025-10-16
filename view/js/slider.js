document.addEventListener("DOMContentLoaded", function () {
    const slider = document.querySelector('.slider');
    const slides = Array.from(slider.querySelectorAll('.slide'));
    if (!slides.length) return;

    // tạo dots
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'slider-dots';
    slides.forEach((_, idx) => {
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Slide ' + (idx + 1));
        b.addEventListener('click', () => go(idx, true));
        dotsWrap.appendChild(b);
    });
    slider.appendChild(dotsWrap);

    let i = 0, timer = null;

    function render() {
        slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
        dotsWrap.querySelectorAll('button').forEach((d, idx) => d.classList.toggle('active', idx === i));
    }

    function next() {
        i = (i + 1) % slides.length;
        render();
    }

    function go(n, pause = false) {
        i = n % slides.length;
        render();
        if (pause) restart();
    }

    function start() {
        timer = setInterval(next, 3000); // đổi 3000 thành 5000 nếu muốn chạy chậm hơn
    }

    function stop() {
        if (timer) clearInterval(timer);
    }

    function restart() {
        stop();
        start();
    }

    // pause khi hover
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);

    // init
    render();
    start();
});


window.addEventListener("scroll", function() {
  const header = document.querySelector("header");
  if (window.scrollY > 50) { // Khi cuộn quá 50px
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});
