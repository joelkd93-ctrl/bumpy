/**
 * Journal Page - Weekly Bump Photos & Notes 📔
 * Capturing precious moments of the journey
 */
import { storage } from '../utils/storage.js';
import { getPregnancyProgress } from '../utils/pregnancy.js';

export function renderJournal() {
  const storedSettings = storage.get('settings');
  const settings = {
    name: 'Andrine',
    dueDate: '2026-06-29',
    ...storedSettings
  };
  const progress = getPregnancyProgress(settings.dueDate);
  const entries = storage.getCollection('journal');

  const entriesHTML = entries.length > 0
    ? entries.map(entry => `
        <div class="journal-entry">
          <div class="journal-header">
            <span class="journal-week">Uke ${entry.week}</span>
            <span class="journal-date">${formatDate(entry.date)}</span>
          </div>
          ${entry.photo
        ? `<img src="${entry.photo}" alt="Uke ${entry.week} magebilde" class="journal-photo"/>`
        : ''
      }
          ${entry.note ? `<p class="journal-note">${entry.note}</p>` : ''}
        </div>
      `).join('')
    : `
        <div class="empty-state">
          <div class="empty-state-icon">📸</div>
          <p class="heading-section mb-2">Reisen din starter her</p>
          <p class="text-muted">Legg til ditt første magebilde over</p>
        </div>
      `;

  return `
    <div class="page-journal">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="heading-love mb-2">Min Dagbok 📔</h1>
        <p class="text-warm">Fang øyeblikk for ${settings.name}</p>
      </div>
      
      <!-- Add New Entry Card -->
      <div class="card card-soft mb-6">
        <div class="journal-week-badge mb-4">
          <span>Uke ${progress.weeksPregnant}</span>
        </div>
        
        <!-- Photo Upload -->
        <div class="journal-photo-placeholder" id="photo-upload">
          <div class="photo-upload-content">
            <span class="photo-upload-icon">📷</span>
            <p class="photo-upload-text">Legg til magebilde</p>
            <p class="photo-upload-hint">Trykk for å ta bilde</p>
          </div>
          <input type="file" id="photo-input" accept="image/*" capture="environment" style="display: none;"/>
        </div>
        
        <div id="photo-preview" class="text-center" style="display: none;">
          <img id="preview-img" class="journal-photo mb-3" alt="Preview"/>
          <button class="btn btn-ghost btn-small" id="remove-photo">Fjern bilde</button>
        </div>
        
        <!-- Note Input -->
        <textarea 
          id="journal-note" 
          class="textarea mt-4" 
          placeholder="Hvordan føler du deg denne uken, ${settings.name}? Noen spesielle øyeblikk å huske?"
          rows="4"
        ></textarea>
        
        <!-- Emoji Picker -->
        <div class="emoji-picker-wrapper mt-2">
          <button class="btn btn-ghost emoji-picker-toggle" id="emoji-toggle" type="button">😊 Emoji</button>
        </div>
        
        <!-- Save Button -->
        <button class="btn btn-primary btn-block mt-4" id="save-entry">
          Lagre Minne 💕
        </button>
      </div>
      
      <!-- Timeline Header -->
      ${entries.length > 0 ? `
        <div class="journal-timeline-header mb-4">
          <p class="heading-section">Din Reise</p>
          <span class="text-muted">${entries.length} ${entries.length === 1 ? 'minne' : 'minner'}</span>
        </div>
      ` : ''}
      
      <!-- Entries Timeline -->
      <div id="journal-entries" class="journal-timeline">
        ${entriesHTML}
      </div>
      
      <div class="emoji-picker-popup" id="emoji-popup" style="display: none;">
        <div class="emoji-picker-grid" id="emoji-grid"></div>
      </div>
    </div>
  `;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function initJournal() {
  const photoUpload = document.getElementById('photo-upload');
  const photoInput = document.getElementById('photo-input');
  const photoPreview = document.getElementById('photo-preview');
  const previewImg = document.getElementById('preview-img');
  const removePhotoBtn = document.getElementById('remove-photo');
  const saveBtn = document.getElementById('save-entry');
  const noteInput = document.getElementById('journal-note');

  let currentPhoto = null;

  // Handle photo upload tap
  photoUpload?.addEventListener('click', () => {
    photoInput?.click();
  });

  // Handle file selection
  photoInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress image for storage
      compressImage(file, (result) => {
        currentPhoto = result;
        previewImg.src = currentPhoto;
        photoUpload.style.display = 'none';
        photoPreview.style.display = 'block';
      });
    }
  });

  // Remove photo
  removePhotoBtn?.addEventListener('click', () => {
    currentPhoto = null;
    photoPreview.style.display = 'none';
    photoUpload.style.display = 'flex';
    photoInput.value = '';
  });

  // Save entry
  saveBtn?.addEventListener('click', () => {
    const note = noteInput?.value?.trim();

    if (!currentPhoto && !note) {
      // Subtle shake animation
      saveBtn.style.animation = 'shake 0.3s';
      setTimeout(() => saveBtn.style.animation = '', 300);
      return;
    }

    const settings = storage.get('settings') || { dueDate: '2026-06-29' };
    const progress = getPregnancyProgress(settings.dueDate);

    storage.addToCollection('journal', {
      week: progress.weeksPregnant,
      photo: currentPhoto,
      note: note
    });

    // Success feedback
    saveBtn.textContent = 'Lagret! 💕';
    saveBtn.disabled = true;

    setTimeout(() => {
      // Reset form
      currentPhoto = null;
      noteInput.value = '';
      photoPreview.style.display = 'none';
      photoUpload.style.display = 'flex';
      photoInput.value = '';
      saveBtn.textContent = 'Lagre Minne 💕';
      saveBtn.disabled = false;

      // Refresh entries
      if (window.app?.refreshCurrentPage) {
        window.app.refreshCurrentPage();
      }
    }, 1500);
  });

  // ── Emoji Picker ──
  const emojiToggle = document.getElementById('emoji-toggle');
  const emojiPopup = document.getElementById('emoji-popup');
  const emojiGrid = document.getElementById('emoji-grid');

  const JOURNAL_EMOJIS = [
    '❤️', '💖', '💗', '💕', '💓', '🥰', '😍', '😊',
    '😢', '😭', '🥺', '😤', '😴', '🤢', '🤮', '😵‍💫',
    '🤰', '👶', '🍼', '🧸', '👣', '🎀', '🩵', '💙',
    '✨', '🌟', '🎉', '🥳', '🎈', '🌸', '🌺', '🦋',
    '💪', '🤗', '🙏', '😇', '🫶', '🤍', '👨‍👩‍👦', '🏠'
  ];

  if (emojiGrid) {
    emojiGrid.innerHTML = JOURNAL_EMOJIS.map(e =>
      `<button class="emoji-pick-btn" type="button" data-emoji="${e}">${e}</button>`
    ).join('');
  }

  emojiToggle?.addEventListener('click', () => {
    const isVisible = emojiPopup.style.display !== 'none';
    emojiPopup.style.display = isVisible ? 'none' : 'block';
  });

  emojiGrid?.addEventListener('click', (e) => {
    const btn = e.target.closest('.emoji-pick-btn');
    if (!btn || !noteInput) return;

    const emoji = btn.dataset.emoji;
    const start = noteInput.selectionStart;
    const end = noteInput.selectionEnd;
    const text = noteInput.value;

    noteInput.value = text.substring(0, start) + emoji + text.substring(end);
    noteInput.selectionStart = noteInput.selectionEnd = start + emoji.length;
    noteInput.focus();

    emojiPopup.style.display = 'none';
  });

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (emojiPopup && !emojiPopup.contains(e.target) && e.target !== emojiToggle) {
      emojiPopup.style.display = 'none';
    }
  });
}

// Compress image to reduce localStorage usage
function compressImage(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxWidth = 800;
      const maxHeight = 1000;

      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      callback(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
