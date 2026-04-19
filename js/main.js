/* ========================================
   Egypt Trip 2026 — Main JS
   ======================================== */

// ── Navbar mobile toggle ──────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMusicPlayer();
  initCurrencyCalculator();
  initEgyptTimeWidget();

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

// ── Egypt Time Widget ─────────────────────
const TIME_ZONES_RU = [
  { city: 'Калининград', zone: 'Europe/Kaliningrad' },
  { city: 'Москва', zone: 'Europe/Moscow' },
  { city: 'Самара', zone: 'Europe/Samara' },
  { city: 'Екатеринбург', zone: 'Asia/Yekaterinburg' },
  { city: 'Омск', zone: 'Asia/Omsk' },
  { city: 'Красноярск', zone: 'Asia/Krasnoyarsk' },
  { city: 'Иркутск', zone: 'Asia/Irkutsk' },
  { city: 'Якутск', zone: 'Asia/Yakutsk' },
  { city: 'Владивосток', zone: 'Asia/Vladivostok' },
  { city: 'Магадан', zone: 'Asia/Magadan' },
  { city: 'Камчатка', zone: 'Asia/Kamchatka' }
];

function getTimeParts(timeZone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).formatToParts(now);

  const part = type => parts.find(item => item.type === type)?.value || '';
  return {
    hour: part('hour'),
    minute: part('minute'),
    weekday: part('weekday'),
    day: part('day'),
    month: part('month')
  };
}

function formatZoneTime(timeZone) {
  const parts = getTimeParts(timeZone);
  return `${parts.hour}:${parts.minute}`;
}

function getDayPhase(timeZone) {
  const hour = Number(getTimeParts(timeZone).hour);
  if (hour >= 7 && hour < 18) {
    return 'is-day';
  }
  if ((hour >= 5 && hour < 7) || (hour >= 18 && hour < 21)) {
    return 'is-twilight';
  }
  return 'is-night';
}

function getZoneOffsetMinutes(timeZone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset'
  }).formatToParts(now);
  const offset = parts.find(part => part.type === 'timeZoneName')?.value || 'GMT+0';
  const match = offset.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  return sign * (hours * 60 + minutes);
}

function formatTimeDifference(cityZone) {
  const egyptOffset = getZoneOffsetMinutes('Africa/Cairo');
  const cityOffset = getZoneOffsetMinutes(cityZone);
  const diff = cityOffset - egyptOffset;
  if (diff === 0) return '0 ч';

  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const value = minutes ? `${hours}:${String(minutes).padStart(2, '0')} ч` : `${hours} ч`;
  return diff > 0 ? `+${value}` : `-${value}`;
}

function initEgyptTimeWidget() {
  const navbar = document.querySelector('.navbar');
  const brand = document.querySelector('.navbar-brand');
  if (!navbar || !brand || document.getElementById('egypt-time-btn')) return;

  const holder = document.querySelector('.navbar-left') || navbar;
  const button = document.createElement('button');
  button.className = 'egypt-time-btn';
  button.id = 'egypt-time-btn';
  button.type = 'button';
  button.setAttribute('aria-label', 'Сравнить время Египта и России');
  button.innerHTML = `
    <span class="egypt-time-icon">◷</span>
    <span class="egypt-time-main">
      <span class="egypt-time-value">--:--</span>
      <span class="egypt-time-date">Египет</span>
    </span>
  `;

  if (holder.classList.contains('navbar-left')) {
    brand.insertAdjacentElement('afterend', button);
  } else {
    brand.insertAdjacentElement('afterend', button);
  }

  const overlay = document.createElement('div');
  overlay.className = 'time-overlay';
  overlay.id = 'time-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="time-modal" role="dialog" aria-modal="true" aria-labelledby="time-title">
      <div class="time-head">
        <div>
          <div class="time-kicker">Местное время</div>
          <h3 id="time-title">🇪🇬 Египет</h3>
          <p id="time-date">Считаем время...</p>
        </div>
        <button class="time-close" id="time-close" type="button" aria-label="Закрыть">×</button>
      </div>
      <div class="time-body">
        <div class="time-egypt-now" id="time-egypt-now">--:--</div>
        <p class="time-note">Сравнение с основными часовыми поясами России. Время считается по часовым зонам браузера, поэтому учитывает сезонные изменения там, где они есть.</p>
        <div class="time-zones" id="time-zones"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('#time-close');
  const valueEl = button.querySelector('.egypt-time-value');
  const buttonDateEl = button.querySelector('.egypt-time-date');
  const egyptNowEl = overlay.querySelector('#time-egypt-now');
  const dateEl = overlay.querySelector('#time-date');
  const zonesEl = overlay.querySelector('#time-zones');

  const open = () => {
    renderTimeWidget();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  };
  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  };

  function renderTimeWidget() {
    const egyptParts = getTimeParts('Africa/Cairo');
    const egyptTime = `${egyptParts.hour}:${egyptParts.minute}`;
    valueEl.textContent = egyptTime;
    buttonDateEl.textContent = `${egyptParts.weekday}, ${egyptParts.day} ${egyptParts.month}`;
    egyptNowEl.textContent = egyptTime;
    dateEl.textContent = `${egyptParts.weekday}, ${egyptParts.day} ${egyptParts.month}`;

    zonesEl.innerHTML = TIME_ZONES_RU.map(item => {
      const phase = getDayPhase(item.zone);
      return `
        <div class="time-zone-row ${phase}">
          <span class="time-city">${item.city}</span>
          <span class="time-diff">${formatTimeDifference(item.zone)}</span>
          <span class="time-clock">${formatZoneTime(item.zone)}</span>
        </div>
      `;
    }).join('');
  }

  button.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', event => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('open')) close();
  });

  renderTimeWidget();
  setInterval(renderTimeWidget, 30000);
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
// Password: 1111 (stored as simple obfuscation)
const PASS_HASH = 'MTExMQ=='; // btoa('1111')

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
  const heroImage = document.getElementById('hero-postcard-img');
  const heroHint = document.querySelector('.hero-music-hint');
  if (btn) {
    btn.classList.toggle('playing', isPlaying);
    btn.setAttribute('aria-label', isPlaying ? 'Выключить музыку' : 'Включить музыку');
    btn.setAttribute('title', isPlaying ? 'Выключить атмосферу Египта' : 'Включить атмосферу Египта');
  }
  if (heroHint) {
    heroHint.textContent = isPlaying ? 'Атмосфера включена' : 'Приправить звуком';
  }
  if (heroImage) {
    const idleSrc = heroImage.dataset.idleSrc || heroImage.getAttribute('src');
    const playingSrc = heroImage.dataset.playingSrc || idleSrc;
    heroImage.src = isPlaying ? playingSrc : idleSrc;
  }
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
  const { audio, btn } = getMusicElements();
  if (!audio) return;

  const state = readMusicState();

  if (typeof state.time === 'number' && Number.isFinite(state.time) && state.time > 0) {
    audio.currentTime = state.time;
  }

  audio.volume = MUSIC_TARGET_VOLUME;

  audio.addEventListener('timeupdate', () => {
    writeMusicState({ time: audio.currentTime });
  });

  if (btn && !btn.dataset.boundMusic) {
    btn.addEventListener('click', toggleMusic);
    btn.dataset.boundMusic = '1';
  }

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
  eurToEgp: null,
  eurToRub: null,
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

function setAverageEgyptTemperature(weatherResults) {
  const chip = document.getElementById('nav-average-temp');
  const valueEl = document.getElementById('nav-average-temp-value');
  if (!chip || !valueEl) return;

  const temperatures = weatherResults
    .filter(result => result.status === 'fulfilled' && result.value && typeof result.value.temperature === 'number')
    .map(result => result.value.temperature);

  if (!temperatures.length) {
    chip.classList.remove('is-visible');
    valueEl.textContent = '';
    return;
  }

  const average = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
  valueEl.textContent = `${Math.round(average)}°C`;
  chip.classList.add('is-visible');
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
  setAverageEgyptTemperature(weatherResults);

  try {
    const [usdRates, eurRates, rubRates] = await Promise.all([
      fetchRates('USD'),
      fetchRates('EUR'),
      fetchRates('RUB')
    ]);

    const usdToEgp = usdRates.EGP;
    const eurToEgp = eurRates.EGP;
    const eurToRub = eurRates.RUB;
    const rubToEgp = rubRates.EGP;
    const usdToRub = usdRates.RUB;

    if (!usdToEgp || !eurToEgp || !eurToRub || !rubToEgp || !usdToRub) throw new Error('Required rates missing');

    egyptRates.usdToEgp = usdToEgp;
    egyptRates.usdToRub = usdToRub;
    egyptRates.eurToEgp = eurToEgp;
    egyptRates.eurToRub = eurToRub;
    egyptRates.rubToEgp = rubToEgp;

    if (rateValue) rateValue.innerHTML = `1 USD ≈ ${usdToEgp.toFixed(2)} EGP ≈ ${usdToRub.toFixed(2)} RUB`;
    if (rateDesc) rateDesc.textContent = `1 EUR ≈ ${eurToEgp.toFixed(2)} EGP ≈ ${eurToRub.toFixed(2)} RUB. Дополнительно: 100 RUB ≈ ${(rubToEgp * 100).toFixed(2)} EGP.`;
    if (rateBadge) rateBadge.textContent = 'На сейчас';
  } catch (error) {
    if (rateValue) rateValue.textContent = '—';
    if (rateDesc) rateDesc.textContent = 'Курс временно не загрузился, позже подтянется сам.';
    if (rateBadge) rateBadge.textContent = 'Обновится';
  }

  initCurrencyCalculator();

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

function parseCurrencyInput(value) {
  const raw = String(value).trim().replace(/\s/g, '').replace(',', '.');
  if (raw === '') return { empty: true, value: null };
  if (raw === '.' || !/^\d*\.?\d*$/.test(raw)) return { empty: false, value: null };
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? { empty: false, value: parsed } : { empty: false, value: null };
}

function initCurrencyCalculator() {
  const card = document.getElementById('live-rate-card');
  const triggers = document.querySelectorAll('[data-calc-trigger]');
  const overlay = document.getElementById('calc-overlay');
  const closeBtn = document.getElementById('calc-close');
  const egpInput = document.getElementById('calc-egp');
  const usdInput = document.getElementById('calc-usd');
  const eurInput = document.getElementById('calc-eur');
  const rubInput = document.getElementById('calc-rub');
  const foot = document.getElementById('calc-foot');

  if (!overlay || !closeBtn || !egpInput || !usdInput || !eurInput || !rubInput) return;

  if (foot && egyptRates.usdToEgp && egyptRates.usdToRub && egyptRates.eurToEgp && egyptRates.eurToRub) {
    foot.textContent = `Ориентир сейчас: 1 USD ≈ ${egyptRates.usdToEgp.toFixed(2)} EGP ≈ ${egyptRates.usdToRub.toFixed(2)} RUB · 1 EUR ≈ ${egyptRates.eurToEgp.toFixed(2)} EGP ≈ ${egyptRates.eurToRub.toFixed(2)} RUB`;
  } else if (foot) {
    foot.textContent = 'Курс ещё загружается. Если данные не подтянулись, попробуй открыть калькулятор чуть позже.';
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

  if (card && !card.dataset.boundCalc) {
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
    card.dataset.boundCalc = '1';
  }

  triggers.forEach(trigger => {
    if (trigger.dataset.boundCalc) return;
    trigger.addEventListener('click', open);
    trigger.dataset.boundCalc = '1';
  });

  if (!overlay.dataset.boundCalc) {
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
    overlay.dataset.boundCalc = '1';
  }

  let syncing = false;

  function clearConvertedInputs(sourceInput) {
    [egpInput, usdInput, eurInput, rubInput].forEach(input => {
      if (input !== sourceInput) input.value = '';
    });
  }

  function setConvertedValue(input, value, sourceInput) {
    if (input !== sourceInput) input.value = roundCurrency(value);
  }

  function fillFromEgp(amount, sourceInput = null) {
    if (!egyptRates.usdToEgp || !egyptRates.eurToEgp || !egyptRates.rubToEgp) return;
    const parsed = parseCurrencyInput(amount);
    if (parsed.empty) {
      clearConvertedInputs(sourceInput);
      return;
    }
    if (parsed.value === null) return;
    const value = parsed.value;
    syncing = true;
    setConvertedValue(egpInput, value, sourceInput);
    setConvertedValue(usdInput, value / egyptRates.usdToEgp, sourceInput);
    setConvertedValue(eurInput, value / egyptRates.eurToEgp, sourceInput);
    setConvertedValue(rubInput, value / egyptRates.rubToEgp, sourceInput);
    syncing = false;
  }

  function fillFromUsd(amount, sourceInput = null) {
    if (!egyptRates.usdToEgp || !egyptRates.usdToRub || !egyptRates.eurToEgp) return;
    const parsed = parseCurrencyInput(amount);
    if (parsed.empty) {
      clearConvertedInputs(sourceInput);
      return;
    }
    if (parsed.value === null) return;
    const value = parsed.value;
    syncing = true;
    setConvertedValue(usdInput, value, sourceInput);
    setConvertedValue(egpInput, value * egyptRates.usdToEgp, sourceInput);
    setConvertedValue(eurInput, (value * egyptRates.usdToEgp) / egyptRates.eurToEgp, sourceInput);
    setConvertedValue(rubInput, value * egyptRates.usdToRub, sourceInput);
    syncing = false;
  }

  function fillFromEur(amount, sourceInput = null) {
    if (!egyptRates.eurToEgp || !egyptRates.eurToRub || !egyptRates.usdToEgp) return;
    const parsed = parseCurrencyInput(amount);
    if (parsed.empty) {
      clearConvertedInputs(sourceInput);
      return;
    }
    if (parsed.value === null) return;
    const value = parsed.value;
    syncing = true;
    setConvertedValue(eurInput, value, sourceInput);
    setConvertedValue(egpInput, value * egyptRates.eurToEgp, sourceInput);
    setConvertedValue(usdInput, (value * egyptRates.eurToEgp) / egyptRates.usdToEgp, sourceInput);
    setConvertedValue(rubInput, value * egyptRates.eurToRub, sourceInput);
    syncing = false;
  }

  function fillFromRub(amount, sourceInput = null) {
    if (!egyptRates.rubToEgp || !egyptRates.usdToRub || !egyptRates.eurToRub) return;
    const parsed = parseCurrencyInput(amount);
    if (parsed.empty) {
      clearConvertedInputs(sourceInput);
      return;
    }
    if (parsed.value === null) return;
    const value = parsed.value;
    syncing = true;
    setConvertedValue(rubInput, value, sourceInput);
    setConvertedValue(egpInput, value * egyptRates.rubToEgp, sourceInput);
    setConvertedValue(usdInput, value / egyptRates.usdToRub, sourceInput);
    setConvertedValue(eurInput, value / egyptRates.eurToRub, sourceInput);
    syncing = false;
  }

  if (!egpInput.dataset.boundCalc) {
    egpInput.addEventListener('input', () => {
      if (syncing) return;
      fillFromEgp(egpInput.value, egpInput);
    });
    usdInput.addEventListener('input', () => {
      if (syncing) return;
      fillFromUsd(usdInput.value, usdInput);
    });
    eurInput.addEventListener('input', () => {
      if (syncing) return;
      fillFromEur(eurInput.value, eurInput);
    });
    rubInput.addEventListener('input', () => {
      if (syncing) return;
      fillFromRub(rubInput.value, rubInput);
    });

    document.querySelectorAll('.calc-chip').forEach(btn => {
      btn.addEventListener('click', () => fillFromEgp(btn.dataset.egp || ''));
    });
    egpInput.dataset.boundCalc = '1';
  }
}
