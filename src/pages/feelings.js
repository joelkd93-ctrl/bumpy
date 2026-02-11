/**
 * Feelings Page - Daily Mood Tracker 😊
 * No judgment, no streaks — just gentle check-ins
 */
import { storage } from '../utils/storage.js';

const MOODS = [
  { emoji: '🥰', label: 'Elsket' },
  { emoji: '😊', label: 'Glad' },
  { emoji: '😌', label: 'Rolig' },
  { emoji: '💪', label: 'Sterk' },
  { emoji: '🤗', label: 'Takknemlig' },
  { emoji: '💅', label: 'Selvsikker' },
  { emoji: '😋', label: 'Sulten' },
  { emoji: '😴', label: 'Trøtt' },
  { emoji: '🥱', label: 'Sliten' },
  { emoji: '🥺', label: 'Øm' },
  { emoji: '🥵', label: 'Varm' },
  { emoji: '🤢', label: 'Kvalm' },
  { emoji: '😰', label: 'Engstelig' },
  { emoji: '😢', label: 'Emosjonell' },
  { emoji: '😤', label: 'Irritert' },
  { emoji: '😵‍💫', label: 'Svimmel' },
  { emoji: '🤯', label: 'Overveldet' },
  { emoji: '🤕', label: 'Vondt' },
  { emoji: '🧘‍♀️', label: 'Fokusert' },
  { emoji: '🐣', label: 'Spent' }
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
    >
      ${mood.emoji}
    </button>
  `).join('');

  return `
    <div class="page-feelings">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="heading-love mb-2">Mine Følelser</h1>
        <p class="text-warm">Ingen fasit, bare en sjekk 💕</p>
      </div>
      
      <!-- Today's Mood Card -->
      <div class="card card-soft mb-6">
        ${todayEntry ? `
          <!-- Already logged today -->
          <div class="text-center">
            <div class="history-emoji mb-4 animate-pop">${todayEntry.mood}</div>
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
            <div class="card mb-4 feelings-history-item">
              <div class="flex-between">
                <div class="flex-items-center gap-4">
                  <span class="history-emoji">${entry.mood}</span>
                  <div>
                    <p class="font-bold">${getMoodLabel(entry.mood)}</p>
                    <p class="text-xs text-muted">${formatDate(entry.date)}</p>
                  </div>
                </div>
                ${entry.note ? `<div class="history-note-indicator">📝</div>` : ''}
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
      selectedMoodEl.innerHTML = `<span class="text-love">Føler seg ${getMoodLabel(selectedMood).toLowerCase()}</span>`;
    }

    // Enable save button
    if (saveBtn) {
      saveBtn.disabled = false;
    }
  });

  // Save mood
  saveBtn?.addEventListener('click', () => {
    if (!selectedMood) return;

    const todayKey = getTodayKey();
    storage.set(`feeling:${todayKey}`, {
      mood: selectedMood,
      note: noteInput?.value?.trim() || '',
      timestamp: new Date().toISOString()
    });

    // Also add to collection for easier querying
    storage.addToCollection('mood_entries', {
      mood: selectedMood,
      note: noteInput?.value?.trim() || ''
    });

    // Refresh page
    if (window.app?.refreshCurrentPage) {
      window.app.refreshCurrentPage();
    } else {
      location.reload();
    }
  });

  // Change mood (clear today's entry)
  changeBtn?.addEventListener('click', () => {
    const todayKey = getTodayKey();
    storage.remove(`feeling:${todayKey}`);

    if (window.app?.refreshCurrentPage) {
      window.app.refreshCurrentPage();
    } else {
      location.reload();
    }
  });
}
