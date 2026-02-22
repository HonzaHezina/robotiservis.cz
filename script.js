const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
const form = document.querySelector('.contact-form');
const status = document.querySelector('.form-status');
const year = document.querySelector('#year');
const revealItems = document.querySelectorAll('[data-reveal]');
const counters = document.querySelectorAll('.counter');
const tiltItems = document.querySelectorAll('.tilt');
const filterButtons = document.querySelectorAll('.filter-btn');
const serviceCards = document.querySelectorAll('.card[data-kind]');
const typewriterEl = document.querySelector('.typewriter');
const particlesWrap = document.querySelector('.particles');

if (year) year.textContent = new Date().getFullYear();

if (particlesWrap) {
  for (let i = 0; i < 24; i += 1) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.style.setProperty('--s', `${Math.random() * 4 + 2}px`);
    p.style.setProperty('--d', `${Math.random() * 7 + 7}s`);
    p.style.top = `${Math.random() * 100}%`;
    p.style.left = `${Math.random() * 100}%`;
    particlesWrap.appendChild(p);
  }
}

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if (form && status) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      status.textContent = 'Prosím vyplňte všechna povinná pole ve správném formátu.';
      return;
    }
    status.textContent = 'Děkujeme, poptávka je připravena k odeslání. Brzy se vám ozveme.';
    form.reset();
  });
}

const animateCounter = (el) => {
  const target = Number(el.dataset.target || 0);
  const duration = 1200;
  let start;

  const frame = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    el.textContent = Math.floor(progress * target).toLocaleString('cs-CZ');
    if (progress < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    if (entry.target.classList.contains('counter')) animateCounter(entry.target);
    obs.unobserve(entry.target);
  });
}, { threshold: 0.18 });

revealItems.forEach((item) => observer.observe(item));
counters.forEach((counter) => observer.observe(counter));

const isTouch = window.matchMedia('(hover: none)').matches;
if (!isTouch) {
  tiltItems.forEach((item) => {
    item.addEventListener('mousemove', (event) => {
      const box = item.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      const rotateY = (x - 0.5) * 8;
      const rotateX = (0.5 - y) * 8;
      item.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    item.addEventListener('mouseleave', () => {
      item.style.transform = '';
    });
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const selected = btn.dataset.filter;

    filterButtons.forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    serviceCards.forEach((card) => {
      const show = selected === 'all' || card.dataset.kind === selected;
      card.classList.toggle('is-hidden', !show);
    });
  });
});

if (typewriterEl) {
  const text = typewriterEl.dataset.text || '';
  let i = 0;

  const type = () => {
    if (i <= text.length) {
      typewriterEl.textContent = text.slice(0, i);
      i += 1;
      setTimeout(type, 17);
    }
  };

  type();
}
