/**
 * Feelings Page - Daily Mood Tracker 😊
 * No judgment, no streaks — just gentle check-ins
 */
import { storage } from '../utils/storage.js';

// Premium mood definitions - color + SVG icon, no emoji
const MOODS = [
  {
    emoji: '🥰', label: 'Elsket',
    color: '#FF6BAF', gradient: 'linear-gradient(135deg,#FF6BAF,#FF4DA6)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 018.5-2.1A4.5 4.5 0 0121 8.5C21 14.5 12 21 12 21z" fill="currentColor" stroke="none" opacity=".9"/></svg>`
  },
  {
    emoji: '😊', label: 'Glad',
    color: '#FFB627', gradient: 'linear-gradient(135deg,#FFD166,#FFB627)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.5 2 3.5 2 3.5-2 3.5-2"/><line x1="9" y1="9.5" x2="9.01" y2="9.5" stroke-width="2.5"/><line x1="15" y1="9.5" x2="15.01" y2="9.5" stroke-width="2.5"/></svg>`
  },
  {
    emoji: '😌', label: 'Rolig',
    color: '#56CFB2', gradient: 'linear-gradient(135deg,#84EDDA,#56CFB2)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4M17 12h4M12 3v2M12 19v2M5.6 5.6l1.4 1.4M16.9 16.9l1.4 1.4M5.6 18.4l1.4-1.4M16.9 7.1l1.4-1.4"/><circle cx="12" cy="12" r="4" fill="currentColor" opacity=".3"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`
  },
  {
    emoji: '💪', label: 'Sterk',
    color: '#E06C75', gradient: 'linear-gradient(135deg,#F09090,#E06C75)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3a3 3 0 00-4.5 2.5L12 8l-2-1-2 3 3.5 3.5L13 21h4l2-8-1-10z" fill="currentColor" opacity=".25"/><path d="M12 8l1.5-2.5A3 3 0 0118 3M10 7l-2 1-2 3 3.5 3.5"/></svg>`
  },
  {
    emoji: '🤗', label: 'Takknemlig',
    color: '#C77DFF', gradient: 'linear-gradient(135deg,#E0AAFF,#C77DFF)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21C5 17 3 11 5 7a5 5 0 017-1 5 5 0 017 1c2 4 0 10-7 14z" fill="currentColor" opacity=".2"/><path d="M8 14s1-3 4-3 4 3 4 3"/><path d="M5 7c0-2 2-4 4-3M19 7c0-2-2-4-4-3"/></svg>`
  },
  {
    emoji: '💅', label: 'Selvsikker',
    color: '#F72585', gradient: 'linear-gradient(135deg,#FF6EB4,#F72585)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" opacity=".3"/><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77"/></svg>`
  },
  {
    emoji: '😋', label: 'Sulten',
    color: '#F4845F', gradient: 'linear-gradient(135deg,#F9B49A,#F4845F)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" fill="currentColor" opacity=".2"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`
  },
  {
    emoji: '😴', label: 'Trøtt',
    color: '#7B8CDE', gradient: 'linear-gradient(135deg,#B3BEF5,#7B8CDE)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" opacity=".25"/><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`
  },
  {
    emoji: '🥱', label: 'Sliten',
    color: '#9B8EA0', gradient: 'linear-gradient(135deg,#C9BFD0,#9B8EA0)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
  },
  {
    emoji: '🥺', label: 'Øm',
    color: '#FFB4A2', gradient: 'linear-gradient(135deg,#FFCFC3,#FFB4A2)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" opacity=".2"/><path d="M12 21.23L4.22 13.45"/></svg>`
  },
  {
    emoji: '🥵', label: 'Varm',
    color: '#FF6B6B', gradient: 'linear-gradient(135deg,#FF9A9A,#FF6B6B)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6M12 18v4M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h4M18 12h4"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity=".5"/></svg>`
  },
  {
    emoji: '🤢', label: 'Kvalm',
    color: '#7FC97F', gradient: 'linear-gradient(135deg,#A8E6A8,#7FC97F)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9" stroke-width="2.5"/><line x1="15" y1="9" x2="15.01" y2="9" stroke-width="2.5"/><path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" fill="currentColor" opacity=".1"/></svg>`
  },
  {
    emoji: '😰', label: 'Engstelig',
    color: '#4FC3F7', gradient: 'linear-gradient(135deg,#8DE0FF,#4FC3F7)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".1"/><path d="M12 8v5"/><circle cx="12" cy="17" r=".5" fill="currentColor" stroke-width="2"/><path d="M4.5 4.5l15 15" opacity=".15"/></svg>`
  },
  {
    emoji: '😢', label: 'Emosjonell',
    color: '#74B9FF', gradient: 'linear-gradient(135deg,#A8D4FF,#74B9FF)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 100-20 10 10 0 000 20z" fill="currentColor" opacity=".12"/><path d="M8 14s1.5 2.5 4 2.5 4-2.5 4-2.5M9 9h.01M15 9h.01" stroke-width="2"/><path d="M12 17v3M10 19l2 1 2-1" opacity=".5"/></svg>`
  },
  {
    emoji: '😤', label: 'Irritert',
    color: '#E17055', gradient: 'linear-gradient(135deg,#F0A08A,#E17055)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".1"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><path d="M9 9l2 1-2 1M15 9l-2 1 2 1"/></svg>`
  },
  {
    emoji: '😵\u200d💫', label: 'Svimmel',
    color: '#A29BFE', gradient: 'linear-gradient(135deg,#C8C0FF,#A29BFE)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M3 21L21 3" opacity=".2"/><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".08"/><path d="M12 6a6 6 0 016 6"/><path d="M12 18a6 6 0 01-6-6"/></svg>`
  },
  {
    emoji: '🤯', label: 'Overveldet',
    color: '#FD79A8', gradient: 'linear-gradient(135deg,#FFB3CF,#FD79A8)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".1"/><path d="M8 9h.01M16 9h.01" stroke-width="2.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M12 3v1M6 5l1 1M18 5l-1 1" stroke-width="2"/></svg>`
  },
  {
    emoji: '🤕', label: 'Vondt',
    color: '#B2BEC3', gradient: 'linear-gradient(135deg,#D8DFE2,#B2BEC3)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".1"/><path d="M9 10h6M9 10l1-3h4l1 3"/><path d="M7.5 13.5C7.5 15.5 9.5 17 12 17s4.5-1.5 4.5-3.5"/></svg>`
  },
  {
    emoji: '🧘\u200d♀️', label: 'Fokusert',
    color: '#00B894', gradient: 'linear-gradient(135deg,#55D8BE,#00B894)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><path d="M12 7v5l-3 3M12 12l3 3"/><path d="M5 17c2-2 4-3 7-3s5 1 7 3" opacity=".4"/></svg>`
  },
  {
    emoji: '🐣', label: 'Spent',
    color: '#FDCB6E', gradient: 'linear-gradient(135deg,#FFE4A0,#FDCB6E)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3C8 3 4 7 4 12s4 9 8 9 8-4 8-9-4-9-8-9z" fill="currentColor" opacity=".15"/><path d="M9 12l2 2 4-4"/><path d="M7 7l2-2M17 7l-2-2" opacity=".4"/></svg>`
  },
];


export function renderFeelings() {
  const settings = storage.get('settings') || { name: 'Andrine' };
  const todayKey = getTodayKey();
  const todayEntry = storage.get(`feeling:${todayKey}`);
  const allEntries = storage.getCollection('mood_entries');

  const moodButtons = MOODS.map(mood => `
    <button
      class="mood-btn ${todayEntry?.mood === mood.emoji ? 'selected' : ''}"
      data-mood="${mood.emoji}"
      aria-label="${mood.label}"
      style="--mood-color:${mood.color};--mood-gradient:${mood.gradient}"
    >
      <span class="mood-icon">${mood.icon}</span>
      <span class="mood-label">${mood.label}</span>
    </button>
  `).join('');

  return `
    <div class="page-feelings">
      <div class="feelings-header-pearl">
        <h1 class="feelings-header-title">Følelser</h1>
        <p class="feelings-header-sub">Ingen fasit, bare en sjekk inn</p>
      </div>

      <!-- Today's Mood Card -->
      <div class="feelings-today-card">
        ${todayEntry ? `
          <!-- Already logged today -->
          <div class="text-center">
            <div class="mood-display-large mb-4 animate-pop" style="--mood-gradient:${getMoodGradient(todayEntry.mood)}">
              <span class="mood-display-icon">${getMoodIcon(todayEntry.mood)}</span>
            </div>
            <p class="heading-section mb-2">Du føler deg ${getMoodLabel(todayEntry.mood).toLowerCase()}</p>
            ${todayEntry.note ? `
              <p class="text-warm italic mb-6">"${todayEntry.note}"</p>
            ` : ''}
            <button class="btn btn-soft" id="change-mood">Endre</button>
          </div>
        ` : `
          <!-- Mood selector -->
          <p class="text-center text-muted mb-4">Trykk på hvordan du føler deg, ${settings.name}</p>
          
          <div class="mood-grid" id="mood-selector">
            ${moodButtons}
          </div>
          
          <div id="selected-mood" class="text-center mb-4" style="min-height: 24px;">
            <span class="text-love text-small"></span>
          </div>
          
          <textarea 
            id="mood-note" 
            class="textarea mb-4" 
            placeholder="Noe du vil legge til? (valgfritt)"
          ></textarea>
          
          <button class="btn btn-primary btn-block" id="save-mood" disabled>
            Lagre 💕
          </button>
        `}
      </div>
      
      <!-- Detailed History List -->
      <div class="mb-4">
        <p class="heading-section mb-4">Min Reise</p>
        <div class="feelings-history-list">
          ${allEntries.length > 0 ? allEntries.map(entry => `
            <div class="card mb-4 feelings-history-item" data-mood="${entry.mood}">
              <div class="flex-between">
                <div class="flex-items-center gap-4">
                  <span class="mood-history-dot" style="background:${getMoodColor(entry.mood)}"><span class="mood-history-icon">${getMoodIcon(entry.mood)}</span></span>
                  <div>
                    <p class="font-bold">${getMoodLabel(entry.mood)}</p>
                    <p class="text-xs text-muted">${formatDate(entry.date)}</p>
                  </div>
                </div>
                ${entry.note ? `<div class="history-note-indicator"><svg viewBox="0 0 16 16" fill="none" width="14" height="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V3a1 1 0 00-1-1z"/><path d="M5 6h6M5 9h4"/></svg></div>` : ''}
              </div>
              ${entry.note ? `
                <div class="history-note-content mt-3 text-warm text-sm">
                  "${entry.note}"
                </div>
              ` : ''}
            </div>
          `).join('') : `
            <p class="text-center text-muted py-8">Her vil din reise vises...</p>
          `}
        </div>
      </div>
      
    </div>
  `;
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getMoodLabel(emoji) {
  return MOODS.find(m => m.emoji === emoji)?.label || '';
}
function getMoodColor(emoji) {
  return MOODS.find(m => m.emoji === emoji)?.color || '#FF4DA6';
}
function getMoodGradient(emoji) {
  return MOODS.find(m => m.emoji === emoji)?.gradient || 'linear-gradient(135deg,#FF8FC0,#FF4DA6)';
}
function getMoodIcon(emoji) {
  return MOODS.find(m => m.emoji === emoji)?.icon || '';
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
}

export function initFeelings() {
  const moodSelector = document.getElementById('mood-selector');
  const selectedMoodEl = document.getElementById('selected-mood');
  const noteInput = document.getElementById('mood-note');
  const saveBtn = document.getElementById('save-mood');
  const changeBtn = document.getElementById('change-mood');

  let selectedMood = null;

  // Handle mood selection
  moodSelector?.addEventListener('click', (e) => {
    const btn = e.target.closest('.mood-btn');
    if (!btn) return;

    // Remove previous selection
    moodSelector.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));

    // Select new
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;

    // Update display
    if (selectedMoodEl) {
      selectedMoodEl.innerHTML = `<span class="mood-selected-label">${getMoodLabel(selectedMood)}</span>`;
    }

    // Enable save button
    if (saveBtn) {
      saveBtn.disabled = false;
    }
  });

  // Save mood
  saveBtn?.addEventListener('click', async () => {
    if (!selectedMood) return;
    saveBtn.disabled = true;

    const todayKey = getTodayKey();
    const note = noteInput?.value?.trim() || '';
    const timestamp = new Date().toISOString();

    await storage.upsertMoodEntry(todayKey, {
      mood: selectedMood,
      note,
      date: timestamp,
      timestamp,
    });

    if (window.app?.refreshCurrentPage) {
      window.app.refreshCurrentPage();
    } else {
      location.reload();
    }
  });

  // Change mood (clear today's entry)
  changeBtn?.addEventListener('click', async () => {
    const todayKey = getTodayKey();
    storage.remove(`feeling:${todayKey}`);
    await storage.removeFromCollection('mood_entries', todayKey);

    if (window.app?.refreshCurrentPage) {
      window.app.refreshCurrentPage();
    } else {
      location.reload();
    }
  });
}
