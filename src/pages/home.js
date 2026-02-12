/**
 * Home Page - Main Dashboard 💕
 * Masterpiece redesign — full-bleed hero, dramatic depth
 */
import { storage } from '../utils/storage.js';
import { getPregnancyProgress, getGreeting, getRandomLoveNote } from '../utils/pregnancy.js';

export function renderHome() {
  const defaults = { name: 'Andrine', dueDate: '2026-06-29' };
  const stored = storage.get('settings') || {};
  const settings = { ...defaults, ...stored };
  if (!settings.dueDate || settings.dueDate === 'undefined') settings.dueDate = defaults.dueDate;

  const progress = getPregnancyProgress(settings.dueDate);
  const loveNote = getRandomLoveNote();
  const firstName = (settings.name || 'Andrine').split(' ')[0];

  const C = 628; // ring circumference (2π × 100)
  const offset = C - (C * progress.percentage / 100);

  return `
    <div class="page-home">

      <!-- ═══ HERO ═══ -->
      <div class="home-hero">

        <div class="home-topbar">
          <div>
            <p class="home-greeting-label">God dag,</p>
            <h1 class="home-greeting-name">${firstName} 💕</h1>
          </div>
          <button class="home-settings-btn" onclick="window.app.navigate('settings')" aria-label="Innstillinger">⚙️</button>
        </div>

        <div class="home-week-pill">
          <span class="home-week-num">Uke ${progress.weeksPregnant}</span>
          <span class="home-week-dot">·</span>
          <span class="home-week-sub">${progress.daysIntoWeek} dager inn</span>
        </div>

        <div class="home-ring-stage">
          <div class="home-ring-glow"></div>
          <svg class="home-ring-svg" width="240" height="240" viewBox="0 0 240 240">
            <defs>
              <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFB8D9"/>
                <stop offset="50%" stop-color="#FF4DA6"/>
                <stop offset="100%" stop-color="#C4307A"/>
              </linearGradient>
              <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <!-- Track -->
            <circle cx="120" cy="120" r="100" fill="none"
              stroke="rgba(255,255,255,0.12)" stroke-width="10"
              transform="rotate(-90 120 120)"/>
            <!-- Progress fill -->
            <circle cx="120" cy="120" r="100" fill="none"
              stroke="url(#heroGrad)" stroke-width="10" stroke-linecap="round"
              stroke-dasharray="${C}" stroke-dashoffset="${offset}"
              transform="rotate(-90 120 120)"
              filter="url(#ringGlow)"/>
          </svg>
          <div class="home-ring-center">
            <div class="home-ring-pct">${progress.percentage.toFixed(1)}<span class="home-ring-pct-sym">%</span></div>
            <div class="home-ring-label">fullført</div>
          </div>
        </div>

        <div class="home-days-badge">
          <span class="home-days-num">${progress.daysLeft}</span>
          <span class="home-days-label">&nbsp;dager igjen · Termin ${new Date(settings.dueDate).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}</span>
        </div>

      </div>
      <!-- end hero -->

      <!-- ═══ CONTENT ═══ -->
      <div class="home-content">

        <!-- Baby size -->
        <div class="home-baby-card">
          <div class="home-baby-left">
            <p class="home-baby-eyebrow">Babyen er på størrelse med</p>
            <h2 class="home-baby-name">${progress.babySize.name}</h2>
            <p class="home-baby-sub">Uke ${progress.weeksPregnant} · ${progress.trimester}. trimester</p>
          </div>
          <div class="home-baby-emoji">${progress.babySize.emoji}</div>
        </div>

        <!-- Baby message -->
        <div class="home-message-card">
          <div class="home-message-from">💬 Fra lille en</div>
          <p class="home-message-text">"${progress.babyMessage}"</p>
        </div>

        <!-- Stats -->
        <div class="home-stats-row">
          <div class="home-stat">
            <div class="home-stat-value">${progress.trimester}</div>
            <div class="home-stat-label">Trimester</div>
          </div>
          <div class="home-stat-divider"></div>
          <div class="home-stat">
            <div class="home-stat-value">${progress.month}</div>
            <div class="home-stat-label">Måned</div>
          </div>
          <div class="home-stat-divider"></div>
          <div class="home-stat">
            <div class="home-stat-value">${progress.weeksPregnant}</div>
            <div class="home-stat-label">Uker</div>
          </div>
        </div>

        <!-- Daily fact -->
        <div class="home-fact-card">
          <div class="home-fact-header">
            <span class="home-fact-icon">${progress.dailyFact.emoji}</span>
            <span class="home-fact-title">${progress.dailyFact.title}</span>
          </div>
          <p class="home-fact-text">${progress.dailyFact.text}</p>
        </div>

        <!-- Love note -->
        <div class="home-lovenote-card">
          <div class="home-lovenote-label">💌 Notat til deg</div>
          <p class="home-lovenote-text">"${loveNote}"</p>
        </div>

      </div>

    </div>

    <!-- Dev controls -->
    <div class="dev-controls" id="dev-controls">
      <div class="dev-panel" id="dev-panel" style="display:none;">
        <p class="text-tiny mb-2">DEV MODE: TEST DAGER</p>
        <div class="flex-between mb-3">
          <input type="date" id="dev-date-input" class="settings-input" style="width:100%;text-align:left;background:var(--surface);padding:8px;border-radius:8px;">
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <button class="btn btn-soft btn-small" id="dev-reset">Nullstill</button>
          <button class="btn btn-primary btn-small" id="dev-apply">Bruk</button>
        </div>
        <button class="btn btn-small" id="dev-celebrate" style="width:100%;background:var(--pink-50);color:var(--pink-600);border:1px solid var(--pink-200);font-weight:bold;">Test Feiring 💖</button>
      </div>
      <button class="dev-fab" id="dev-fab">🛠️</button>
    </div>

    <style>
      .dev-controls{position:fixed;bottom:80px;right:20px;z-index:1000;display:flex;flex-direction:column;align-items:flex-end;gap:12px;}
      .dev-fab{width:44px;height:44px;border-radius:22px;background:var(--surface);border:2px solid var(--pink-400);box-shadow:var(--shadow-md);font-size:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;}
      .dev-panel{background:var(--surface);padding:16px;border-radius:16px;box-shadow:var(--shadow-lg);border:1px solid var(--pink-100);width:200px;}
      .btn-small{min-height:auto;padding:8px;font-size:12px;}
    </style>
  `;
}

export function initHome() {
  const fab = document.getElementById('dev-fab');
  const panel = document.getElementById('dev-panel');
  const applyBtn = document.getElementById('dev-apply');
  const resetBtn = document.getElementById('dev-reset');
  const dateInput = document.getElementById('dev-date-input');

  const override = localStorage.getItem('bumpy:dev_date_override');
  if (dateInput) dateInput.value = override || new Date().toISOString().split('T')[0];

  fab?.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  applyBtn?.addEventListener('click', () => {
    const d = dateInput?.value;
    if (d) { localStorage.setItem('bumpy:dev_date_override', d); window.app?.refreshCurrentPage?.(); }
  });
  resetBtn?.addEventListener('click', () => {
    localStorage.removeItem('bumpy:dev_date_override');
    window.app?.refreshCurrentPage?.();
  });
  document.getElementById('dev-celebrate')?.addEventListener('click', () => {
    if (window.celebrate) window.celebrate();
  });
}
