/**
 * Home Page - Main Dashboard 🏠
 * Displays pregnancy progress, daily tips, and baby size.
 */
import { storage } from '../utils/storage.js';
import { getPregnancyProgress, getGreeting, getRandomLoveNote } from '../utils/pregnancy.js';

export function renderHome() {
  const defaults = { name: 'Andrine', dueDate: '2026-06-29' };
  const stored = storage.get('settings') || {};
  const settings = { ...defaults, ...stored };

  // Ensure we have a valid date
  if (!settings.dueDate || settings.dueDate === 'undefined') settings.dueDate = defaults.dueDate;

  const progress = getPregnancyProgress(settings.dueDate);
  const greeting = getGreeting(settings.name);
  const loveNote = getRandomLoveNote();

  return `
    <div class="page-home fade-in">
      <!-- Header -->
      <div class="flex-between mb-6" style="align-items: flex-end;">
        <div>
          <h1 class="heading-love mb-1">${greeting}</h1>
          <p class="text-warm">Uke ${progress.weeksPregnant} + ${progress.daysIntoWeek} dager</p>
        </div>
        <button class="settings-icon-btn" onclick="window.app.navigate('settings')" aria-label="Innstillinger">
          ⚙️
        </button>
      </div>

      <!-- Main Progress Card -->
      <div class="card card-love mb-6 text-center home-hero-card">
        <div class="progress-ring-wrapper">
          <svg class="progress-ring" width="220" height="220" viewBox="0 0 220 220" style="transform: rotate(-90deg);">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="var(--pink-300)" />
                <stop offset="100%" stop-color="var(--pink-600)" />
              </linearGradient>
            </defs>
            <circle class="progress-ring-track" cx="110" cy="110" r="94" fill="transparent"/>
            <circle class="progress-ring-fill" cx="110" cy="110" r="94" fill="transparent"
              stroke="url(#progressGradient)" stroke-width="8" stroke-linecap="round"
              style="stroke-dasharray: 591; stroke-dashoffset: ${591 - (591 * progress.percentage / 100)};"/>
          </svg>
          <div class="progress-center">
            <div class="progress-percent">${progress.percentage.toFixed(1)}%</div>
            <div class="progress-label">Fullført</div>
          </div>
        </div>
        
        <p class="heading-section mb-1" style="color: var(--pink-500);">${progress.daysLeft} dager igjen</p>
        <p class="text-small">Termin: ${new Date(settings.dueDate).toLocaleDateString('nb-NO')}</p>
      </div>

      <!-- Baby Size Card -->
      <div class="card bg-gradient-soft mb-6 baby-size-card">
        <span class="baby-size-label">Babyen er på størrelse med en</span>
        <div class="baby-emoji">${progress.babySize.emoji}</div>
        <h2 class="baby-size-name">${progress.babySize.name}</h2>
      </div>

      <!-- Baby Voice Greeting -->
      <div class="baby-speech-bubble mb-6">
        <div class="baby-speech-title">Hilsen fra lille 👶💭</div>
        <p class="baby-speech-text">"${progress.babyMessage}"</p>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid mb-6">
        <div class="stat-card">
          <div class="stat-value">${progress.trimester}</div>
          <div class="stat-label">Trimester</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${progress.month}</div>
          <div class="stat-label">Måned</div>
        </div>
      </div>

      <!-- Daily Insight -->
      <div class="card card-soft mb-6 fact-card">
        <div class="fact-label">${progress.dailyFact.emoji} ${progress.dailyFact.title}</div>
        <p class="fact-text">${progress.dailyFact.text}</p>
      </div>

      <!-- Love Note -->
      <div class="card love-note">
        <div class="love-note-icon">💌 Notat til deg</div>
        <p class="love-note-text">"${loveNote}"</p>
      </div>
    </div>

    <!-- Dev Mode Controls (Floating) -->
    <div class="dev-controls" id="dev-controls">
      <div class="dev-panel" id="dev-panel" style="display: none;">
        <p class="text-tiny mb-2">DEV MODE: TEST DAGER</p>
        <div class="flex-between mb-3">
          <input type="date" id="dev-date-input" class="settings-input" style="width: 100%; text-align: left; background: var(--surface); padding: 8px; border-radius: 8px;">
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <button class="btn btn-soft btn-small" id="dev-reset">Nullstill</button>
          <button class="btn btn-primary btn-small" id="dev-apply">Bruk</button>
        </div>
        <button class="btn btn-small" id="dev-celebrate" style="width: 100%; background: var(--pink-50); color: var(--pink-600); border: 1px solid var(--pink-200); font-weight: bold;">Test Feiring 💖</button>
      </div>
      <button class="dev-fab" id="dev-fab">🛠️</button>
    </div>

    <style>
      .dev-controls {
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
      }
      .dev-fab {
        width: 44px;
        height: 44px;
        border-radius: 22px;
        background: var(--surface);
        border: 2px solid var(--pink-400); /* Darker pink for visibility */
        box-shadow: var(--shadow-md);
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .dev-panel {
        background: var(--surface);
        padding: 16px;
        border-radius: 16px;
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--pink-100);
        width: 200px;
      }
      .btn-small {
        min-height: auto;
        padding: 8px;
        font-size: 12px;
      }
    </style>
  `;
}

export function initHome() {
  console.log('🛠️ Home initialized');
  const fab = document.getElementById('dev-fab');
  const panel = document.getElementById('dev-panel');
  const applyBtn = document.getElementById('dev-apply');
  const resetBtn = document.getElementById('dev-reset');
  const dateInput = document.getElementById('dev-date-input');

  // Set current date in input
  const currentOverride = localStorage.getItem('bumpy:dev_date_override');
  dateInput.value = currentOverride || new Date().toISOString().split('T')[0];

  fab?.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  applyBtn?.addEventListener('click', () => {
    const newDate = dateInput.value;
    if (newDate) {
      localStorage.setItem('bumpy:dev_date_override', newDate);
      // Refresh page to apply new date
      if (window.app?.refreshCurrentPage) {
        window.app.refreshCurrentPage();
      }
    }
  });

  resetBtn?.addEventListener('click', () => {
    localStorage.removeItem('bumpy:dev_date_override');
    if (window.app?.refreshCurrentPage) {
      window.app.refreshCurrentPage();
    }
  });

  document.getElementById('dev-celebrate')?.addEventListener('click', () => {
    if (window.celebrate) window.celebrate();
  });
}
