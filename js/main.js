/* ========================================
   Egypt Trip 2026 — Main JS
   ======================================== */

// ── Navbar mobile toggle ──────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMusicPlayer();

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
const MUSIC_STATE_KEY = 'egypt_music_state';
const MUSIC_FADE_MS = 900;
const MUSIC_TARGET_VOLUME = 0.42;

function getMusicElements() {
  return {
    audio: document.getElementById('bg-audio'),
    btn: document.getElementById('music-btn')
  };
}

function readMusicState() {
  try {
    return JSON.parse(sessionStorage.getItem(MUSIC_STATE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeMusicState(patch) {
  const next = { ...readMusicState(), ...patch };
  sessionStorage.setItem(MUSIC_STATE_KEY, JSON.stringify(next));
}

function setMusicButtonState(isPlaying) {
  const { btn } = getMusicElements();
  if (!btn) return;
  btn.classList.toggle('playing', isPlaying);
}

function fadeAudio(audio, from, to, duration, onDone) {
  const startedAt = performance.now();
  audio.volume = from;

  function step(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    audio.volume = from + (to - from) * progress;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else if (onDone) {
      onDone();
    }
  }

  requestAnimationFrame(step);
}

async function playMusicWithFade(audio) {
  audio.volume = 0;
  await audio.play();
  fadeAudio(audio, 0, MUSIC_TARGET_VOLUME, MUSIC_FADE_MS);
  setMusicButtonState(true);
  writeMusicState({ playing: true });
}

function pauseMusicWithFade(audio) {
  const startVolume = typeof audio.volume === 'number' ? audio.volume : MUSIC_TARGET_VOLUME;
  fadeAudio(audio, startVolume, 0, 450, () => {
    audio.pause();
    audio.volume = MUSIC_TARGET_VOLUME;
  });
  setMusicButtonState(false);
  writeMusicState({ playing: false });
}

function initMusicPlayer() {
  const { audio } = getMusicElements();
  if (!audio) return;

  const state = readMusicState();

  if (typeof state.time === 'number' && Number.isFinite(state.time) && state.time > 0) {
    audio.currentTime = state.time;
  }

  audio.volume = MUSIC_TARGET_VOLUME;

  audio.addEventListener('timeupdate', () => {
    writeMusicState({ time: audio.currentTime });
  });

  window.addEventListener('pagehide', () => {
    writeMusicState({
      time: audio.currentTime,
      playing: !audio.paused
    });
  });

  if (state.playing) {
    playMusicWithFade(audio).catch(() => {
      setMusicButtonState(false);
    });
  } else {
    setMusicButtonState(false);
  }
}

function toggleMusic() {
  const { audio } = getMusicElements();
  if (!audio) return;

  if (audio.paused) {
    playMusicWithFade(audio).catch(() => {
      setMusicButtonState(false);
    });
  } else {
    pauseMusicWithFade(audio);
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

// ── Live Egypt data ──────────────────────
function weatherCodeToRu(code) {
  const map = {
    0: ['Ясно', '☀️'],
    1: ['Почти ясно', '🌤️'],
    2: ['Переменная облачность', '⛅'],
    3: ['Пасмурно', '☁️'],
    45: ['Туман', '🌫️'],
    48: ['Туман', '🌫️'],
    51: ['Лёгкая морось', '🌦️'],
    53: ['Морось', '🌦️'],
    55: ['Сильная морось', '🌧️'],
    61: ['Небольшой дождь', '🌦️'],
    63: ['Дождь', '🌧️'],
    65: ['Сильный дождь', '🌧️'],
    71: ['Снег', '❄️'],
    80: ['Кратковременный дождь', '🌦️'],
    81: ['Ливень', '🌧️'],
    82: ['Сильный ливень', '⛈️'],
    95: ['Гроза', '⛈️']
  };

  return map[code] || ['Нормальная погода', '🌍'];
}

const egyptRates = {
  usdToEgp: null,
  usdToRub: null,
  rubToEgp: null
};

function setLiveWeatherCard(id, payload) {
  const tempEl = document.getElementById(`live-${id}-temp`);
  const descEl = document.getElementById(`live-${id}-desc`);
  const iconEl = document.getElementById(`live-${id}-icon`);
  if (!tempEl || !descEl || !iconEl) return;

  if (!payload) {
    tempEl.textContent = '—';
    descEl.textContent = 'Не удалось получить данные прямо сейчас.';
    iconEl.textContent = '🌍';
    return;
  }

  const [label, icon] = weatherCodeToRu(payload.weatherCode);
  tempEl.textContent = `${Math.round(payload.temperature)}°C`;
  descEl.textContent = `${label} · ощущается как ${Math.round(payload.apparentTemperature)}°C`;
  iconEl.textContent = icon;
}

async function fetchCityWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto&forecast_days=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
  const data = await response.json();
  return {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    weatherCode: data.current.weather_code
  };
}

async function fetchRates(baseCurrency) {
  const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
  if (!response.ok) throw new Error(`Rate request failed: ${response.status}`);
  const data = await response.json();
  if (!data || !data.rates) throw new Error('Rates missing');
  return data.rates;
}

async function initEgyptLiveData() {
  const rateValue = document.getElementById('live-rate-usd');
  const rateDesc = document.getElementById('live-rate-desc');
  const rateBadge = document.getElementById('live-rate-badge');
  const updatedEl = document.getElementById('live-updated');

  if (!rateValue && !updatedEl && !document.getElementById('live-hurghada-temp')) return;

  const weatherTargets = [
    { id: 'hurghada', latitude: 27.2579, longitude: 33.8116 },
    { id: 'luxor', latitude: 25.6872, longitude: 32.6396 },
    { id: 'cairo', latitude: 30.0444, longitude: 31.2357 }
  ];

  const weatherResults = await Promise.allSettled(
    weatherTargets.map(target => fetchCityWeather(target.latitude, target.longitude))
  );

  weatherResults.forEach((result, index) => {
    const target = weatherTargets[index];
    setLiveWeatherCard(target.id, result.status === 'fulfilled' ? result.value : null);
  });

  try {
    const [usdRates, rubRates] = await Promise.all([
      fetchRates('USD'),
      fetchRates('RUB')
    ]);

    const usdToEgp = usdRates.EGP;
    const rubToEgp = rubRates.EGP;
    const usdToRub = usdRates.RUB;

    if (!usdToEgp || !rubToEgp || !usdToRub) throw new Error('Required rates missing');

    egyptRates.usdToEgp = usdToEgp;
    egyptRates.usdToRub = usdToRub;
    egyptRates.rubToEgp = rubToEgp;

    if (rateValue) rateValue.innerHTML = `1 USD ≈ ${usdToEgp.toFixed(2)} EGP ≈ ${usdToRub.toFixed(2)} RUB`;
    if (rateDesc) rateDesc.textContent = `Дополнительно: 100 RUB ≈ ${(rubToEgp * 100).toFixed(2)} EGP. Небольшой ориентир, чтобы быстрее понимать местные цены.`;
    if (rateBadge) rateBadge.textContent = 'На сейчас';
    initCurrencyCalculator();
  } catch (error) {
    if (rateValue) rateValue.textContent = '—';
    if (rateDesc) rateDesc.textContent = 'Курс временно не загрузился, позже подтянется сам.';
    if (rateBadge) rateBadge.textContent = 'Обновится';
  }

  if (updatedEl) {
    const now = new Date();
    updatedEl.textContent = `Обновлено: ${now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function initCurrencyCalculator() {
  const card = document.getElementById('live-rate-card');
  const overlay = document.getElementById('calc-overlay');
  const closeBtn = document.getElementById('calc-close');
  const egpInput = document.getElementById('calc-egp');
  const usdInput = document.getElementById('calc-usd');
  const rubInput = document.getElementById('calc-rub');
  const foot = document.getElementById('calc-foot');

  if (!card || !overlay || !closeBtn || !egpInput || !usdInput || !rubInput) return;

  if (foot && egyptRates.usdToEgp && egyptRates.usdToRub) {
    foot.textContent = `Ориентир сейчас: 1 USD ≈ ${egyptRates.usdToEgp.toFixed(2)} EGP ≈ ${egyptRates.usdToRub.toFixed(2)} RUB`;
  }

  const open = () => {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    egpInput.focus();
  };

  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  };

  if (!card.dataset.boundCalc) {
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
    card.dataset.boundCalc = '1';
  }

  let syncing = false;

  function fillFromEgp(amount) {
    if (!egyptRates.usdToEgp || !egyptRates.rubToEgp) return;
    syncing = true;
    egpInput.value = amount === '' ? '' : roundCurrency(Number(amount));
    usdInput.value = amount === '' ? '' : roundCurrency(Number(amount) / egyptRates.usdToEgp);
    rubInput.value = amount === '' ? '' : roundCurrency(Number(amount) / egyptRates.rubToEgp);
    syncing = false;
  }

  function fillFromUsd(amount) {
    if (!egyptRates.usdToEgp || !egyptRates.usdToRub) return;
    syncing = true;
    usdInput.value = amount === '' ? '' : roundCurrency(Number(amount));
    egpInput.value = amount === '' ? '' : roundCurrency(Number(amount) * egyptRates.usdToEgp);
    rubInput.value = amount === '' ? '' : roundCurrency(Number(amount) * egyptRates.usdToRub);
    syncing = false;
  }

  function fillFromRub(amount) {
    if (!egyptRates.rubToEgp || !egyptRates.usdToRub) return;
    syncing = true;
    rubInput.value = amount === '' ? '' : roundCurrency(Number(amount));
    egpInput.value = amount === '' ? '' : roundCurrency(Number(amount) * egyptRates.rubToEgp);
    usdInput.value = amount === '' ? '' : roundCurrency(Number(amount) / egyptRates.usdToRub);
    syncing = false;
  }

  if (!egpInput.dataset.boundCalc) {
    egpInput.addEventListener('input', () => {
      if (syncing) return;
      fillFromEgp(egpInput.value);
    });
    usdInput.addEventListener('input', () => {
      if (syncing) return;
      fillFromUsd(usdInput.value);
    });
    rubInput.addEventListener('input', () => {
      if (syncing) return;
      fillFromRub(rubInput.value);
    });

    document.querySelectorAll('.calc-chip').forEach(btn => {
      btn.addEventListener('click', () => fillFromEgp(btn.dataset.egp || ''));
    });
    egpInput.dataset.boundCalc = '1';
  }
}
