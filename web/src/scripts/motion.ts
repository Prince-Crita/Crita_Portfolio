// Motion and small interactions. Everything degrades to a static page without JS,
// and parallax/tour transitions switch off under prefers-reduced-motion.

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function reveals() {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window)) return els.forEach((el) => el.classList.add('is-in'));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

function header() {
  const hdr = document.querySelector<HTMLElement>('[data-header]');
  if (!hdr) return;
  const sections = [...document.querySelectorAll<HTMLElement>('[data-tone-section]')];
  const update = () => {
    hdr.classList.toggle('is-scrolled', window.scrollY > 12);
    const probe = hdr.offsetHeight / 2;
    const under = sections.find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= probe && r.bottom > probe;
    });
    if (under) hdr.dataset.tone = under.dataset.toneSection;
  };
  update();
  addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  addEventListener('resize', update);
}

// Hero layers only. data-parallax is a fraction of the distance scrolled: positive lags
// behind the page (layers at the back), negative leads it (devices in front). At the top
// of the page every layer sits exactly where the CSS puts it, so nothing jumps on the
// first scroll and front devices only ever rise, never into the next section.
// Desktop only: on phones and tablets it fights touch scrolling.
function parallax() {
  if (reduced()) return;
  const els = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  if (!els.length) return;
  const narrow = window.matchMedia('(max-width: 900px)');
  let last = NaN;
  let ticking = false;
  const frame = () => {
    ticking = false;
    // Two screens down the hero is long gone: stop moving layers nobody can see.
    const y = narrow.matches ? 0 : Math.min(scrollY, innerHeight * 2);
    if (y === last) return;
    last = y;
    for (const el of els) {
      el.style.transform = y ? `translate3d(0, ${(y * parseFloat(el.dataset.parallax || '0')).toFixed(1)}px, 0)` : '';
    }
  };
  const request = () => {
    if (!ticking) requestAnimationFrame(frame);
    ticking = true;
  };
  addEventListener('scroll', request, { passive: true });
  narrow.addEventListener('change', request);
  frame();
}

function tours() {
  document.querySelectorAll<HTMLElement>('[data-tour]').forEach((tour) => {
    const steps = [...tour.querySelectorAll<HTMLElement>('[data-tour-step]')];
    const media = [...tour.querySelectorAll<HTMLElement>('[data-tour-media]')];
    const activate = (i: number) => {
      steps.forEach((s, j) => s.classList.toggle('is-active', i === j));
      media.forEach((m, j) => m.classList.toggle('is-active', i === j));
    };
    activate(0);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) activate(steps.indexOf(e.target as HTMLElement));
      },
      { rootMargin: '-46% 0px -46% 0px' }
    );
    steps.forEach((s) => io.observe(s));
  });
}

function menu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !panel) return;
  const set = (open: boolean) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    document.querySelector<HTMLElement>('[data-header]')?.classList.toggle('is-menu', open);
  };
  toggle.addEventListener('click', () => set(panel.hidden));
  panel.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) set(false);
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && !panel.hidden && set(false));
}

// Presenters move between case studies with ← and →.
function keys() {
  const prev = document.querySelector<HTMLAnchorElement>('[data-nav-prev]');
  const next = document.querySelector<HTMLAnchorElement>('[data-nav-next]');
  if (!prev && !next) return;
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'ArrowLeft' && prev) prev.click();
    if (e.key === 'ArrowRight' && next) next.click();
  });
}

function copy() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy || '');
        const was = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = was), 1400);
      } catch {
        /* clipboard unavailable: the value stays visible to select manually */
      }
    });
  });
}

export function initMotion() {
  reveals();
  header();
  parallax();
  tours();
  menu();
  keys();
  copy();
}
