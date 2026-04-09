/* ========================================
   Egypt Trip 2026 — Main JS
   ======================================== */

// ── Navbar mobile toggle ──────────────────
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !links.contains(e.target)) {
        links.classList.remove('open');
      }
    });
  }

  // Active nav link
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Accordion
  document.querySelectorAll('.accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      item.classList.toggle('open');
    });
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('[data-tabs]') || btn.parentElement.parentElement;
      const target = btn.dataset.tab;
      group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      group.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      group.querySelector(`[data-panel="${target}"]`).classList.add('active');
    });
  });

  // Rating buttons
  document.querySelectorAll('.rating-group').forEach(group => {
    group.querySelectorAll('.rating-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const input = group.nextElementSibling;
        if (input && input.type === 'hidden') input.value = btn.dataset.val;
      });
    });
  });
});

// ── Countdown ────────────────────────────
function updateCountdown(targetDateStr, elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const target = new Date(targetDateStr).getTime();

  function tick() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      el.innerHTML = '<span class="countdown-num text-gold">Поехали! 🛫</span>';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    el.innerHTML = `
      <div class="countdown-item"><span class="countdown-num">${d}</span><span class="countdown-lbl">дней</span></div>
      <div class="countdown-sep">:</div>
      <div class="countdown-item"><span class="countdown-num">${String(h).padStart(2,'0')}</span><span class="countdown-lbl">часов</span></div>
      <div class="countdown-sep">:</div>
      <div class="countdown-item"><span class="countdown-num">${String(m).padStart(2,'0')}</span><span class="countdown-lbl">минут</span></div>
      <div class="countdown-sep">:</div>
      <div class="countdown-item"><span class="countdown-num">${String(s).padStart(2,'0')}</span><span class="countdown-lbl">секунд</span></div>
    `;
  }
  tick();
  setInterval(tick, 1000);
}

// ── LocalStorage Checkboxes ───────────────
function initCheckboxes(namespace) {
  document.querySelectorAll(`[data-cb="${namespace}"]`).forEach(cb => {
    const key = `${namespace}::${cb.id}`;
    cb.checked = localStorage.getItem(key) === '1';
    applyCheckedStyle(cb);
    cb.addEventListener('change', () => {
      localStorage.setItem(key, cb.checked ? '1' : '0');
      applyCheckedStyle(cb);
    });
  });
}

function applyCheckedStyle(cb) {
  // Budget rows
  const row = cb.closest('tr');
  if (row) {
    row.classList.toggle('is-paid', cb.checked);
  }
  // Checklist labels
  const label = cb.nextElementSibling || cb.parentElement.querySelector('label[for="' + cb.id + '"]');
  if (label && label.tagName === 'LABEL') {
    label.style.textDecoration = cb.checked ? 'line-through' : '';
    label.style.color = cb.checked ? 'var(--text-lt)' : '';
  }
}

// ── Password Gate ─────────────────────────
const PASS_KEY = 'egypt_auth';
// Password: egypt2026 (stored as simple obfuscation)
const PASS_HASH = 'ZWd5cHQyMDI2'; // btoa('egypt2026')

function checkPassword(input) {
  return btoa(input.trim()) === PASS_HASH;
}

function initPasswordGate() {
  const overlay = document.getElementById('password-overlay');
  const content = document.getElementById('private-content');
  if (!overlay) return;

  // Already authenticated this session?
  if (sessionStorage.getItem(PASS_KEY) === '1') {
    overlay.style.display = 'none';
    if (content) content.style.display = 'block';
    return;
  }

  const form    = document.getElementById('pass-form');
  const input   = document.getElementById('pass-input');
  const errorEl = document.getElementById('pass-error');

  form && form.addEventListener('submit', e => {
    e.preventDefault();
    if (checkPassword(input.value)) {
      sessionStorage.setItem(PASS_KEY, '1');
      overlay.style.display = 'none';
      if (content) content.style.display = 'block';
      // Init checkboxes after auth
      initCheckboxes('itinerary');
      initCheckboxes('budget');
      initCheckboxes('pack');
      initCheckboxes('book');
    } else {
      errorEl.textContent = 'Неверный пароль. Попробуй ещё раз.';
      input.value = '';
      input.focus();
      setTimeout(() => errorEl.textContent = '', 3000);
    }
  });
}

// ── Music Player ─────────────────────────
function toggleMusic() {
  const audio = document.getElementById('bg-audio');
  const btn   = document.getElementById('music-btn');
  if (!audio) return;
  if (audio.paused) {
    audio.play();
    btn.classList.add('playing');
  } else {
    audio.pause();
    btn.classList.remove('playing');
  }
}

// ── Feedback form ─────────────────────────
function initFeedbackForm() {
  const form = document.getElementById('feedback-form');
  if (!form) return;
  form.addEventListener('submit', () => {
    // Formspree handles the submission, we just set a flag
    localStorage.setItem('feedback_sent', Date.now());
  });
}
