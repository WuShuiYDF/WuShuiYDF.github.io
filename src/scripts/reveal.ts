// 滚动淡入：给 .reveal 加 .is-in；View Transitions 换页后重新扫描
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.15 },
);

function scan() {
  document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => io.observe(el));
}

document.addEventListener('astro:page-load', scan);
scan();
