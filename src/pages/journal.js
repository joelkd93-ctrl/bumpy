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

  // DEBUG: Log entries to help troubleshoot
  console.log('📔 Journal rendering with', entries.length, 'entries:', entries.map(e => e.id));

  const entriesHTML = entries.length > 0
    ? entries.map(entry => `
        <div class="journal-entry" data-id="${entry.id}">
          <div class="journal-header">
            <div>
              <span class="journal-week">Uke ${entry.week}</span>
              <span class="journal-date">${formatDate(entry.date)}</span>
            </div>
            <button class="btn-icon-small delete-journal-entry" data-id="${entry.id}" aria-label="Slett">
              🗑️
            </button>
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

        <!-- Date Picker -->
        <div class="form-field mb-4">
          <label class="form-label" for="entry-date">Dato</label>
          <input
            type="date"
            id="entry-date"
            class="input"
            value="${new Date().toISOString().split('T')[0]}"
            max="${new Date().toISOString().split('T')[0]}"
          />
        </div>

        <!-- Photo Upload Options -->
        <div class="journal-photo-placeholder" id="photo-upload">
          <div class="photo-upload-content">
            <span class="photo-upload-icon">📷</span>
            <p class="photo-upload-text">Legg til magebilde</p>
            <div class="photo-upload-buttons">
              <button class="btn btn-soft btn-small" id="camera-btn" type="button">
                📷 Ta bilde
              </button>
              <button class="btn btn-soft btn-small" id="gallery-btn" type="button">
                🖼️ Velg fra galleri
              </button>
            </div>
          </div>
          <input type="file" id="photo-input-camera" accept="image/*" capture="environment" style="display: none;"/>
          <input type="file" id="photo-input-gallery" accept="image/*" style="display: none;"/>
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
  const cameraBtn = document.getElementById('camera-btn');
  const galleryBtn = document.getElementById('gallery-btn');
  const photoInputCamera = document.getElementById('photo-input-camera');
  const photoInputGallery = document.getElementById('photo-input-gallery');
  const photoPreview = document.getElementById('photo-preview');
  const previewImg = document.getElementById('preview-img');
  const removePhotoBtn = document.getElementById('remove-photo');
  const saveBtn = document.getElementById('save-entry');
  const noteInput = document.getElementById('journal-note');
  const dateInput = document.getElementById('entry-date');

  let currentPhoto = null;

  // Handle camera button
  cameraBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.haptic) window.haptic.light();
    photoInputCamera?.click();
  });

  // Handle gallery button
  galleryBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.haptic) window.haptic.light();
    photoInputGallery?.click();
  });

  // Handle file selection from camera
  photoInputCamera?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (result) => {
        currentPhoto = result;
        previewImg.src = currentPhoto;
        photoUpload.style.display = 'none';
        photoPreview.style.display = 'block';
      });
    }
  });

  // Handle file selection from gallery
  photoInputGallery?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
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
    photoInputCamera.value = '';
    photoInputGallery.value = '';
  });

  // Save entry
  saveBtn?.addEventListener('click', async () => {
    const note = noteInput?.value?.trim();
    const selectedDate = dateInput?.value;

    if (!currentPhoto && !note) {
      // Subtle shake animation
      saveBtn.style.animation = 'shake 0.3s';
      setTimeout(() => saveBtn.style.animation = '', 300);
      return;
    }

    const settings = storage.get('settings') || { dueDate: '2026-06-29' };

    // Calculate week based on selected date
    const entryDate = selectedDate ? new Date(selectedDate) : new Date();
    const progress = getPregnancyProgress(settings.dueDate, entryDate);

    // Show saving feedback
    saveBtn.textContent = 'Lagrer... ☁️';
    saveBtn.disabled = true;

    try {
      // Save journal entry - backend now works properly!
      await storage.addToCollection('journal', {
        week: progress.weeksPregnant,
        date: selectedDate || new Date().toISOString().split('T')[0],
        photo: currentPhoto,
        note: note
      });

      // Success feedback
      saveBtn.textContent = 'Lagret! 💕';

      setTimeout(() => {
        // Reset form
        currentPhoto = null;
        noteInput.value = '';
        dateInput.value = new Date().toISOString().split('T')[0];
        photoPreview.style.display = 'none';
        photoUpload.style.display = 'flex';
        photoInputCamera.value = '';
        photoInputGallery.value = '';
        saveBtn.textContent = 'Lagre Minne 💕';
        saveBtn.disabled = false;

        // Refresh entries - now safe because cloud sync completed
        if (window.app?.refreshCurrentPage) {
          window.app.refreshCurrentPage();
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to save journal entry:', err);
      saveBtn.textContent = 'Feil! Prøv igjen';
      setTimeout(() => {
        saveBtn.textContent = 'Lagre Minne 💕';
        saveBtn.disabled = false;
      }, 2000);
    }
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

  // Handle delete buttons
  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-journal-entry');
    if (!deleteBtn) return;

    const id = deleteBtn.dataset.id;

    // Confirm deletion
    const confirmed = confirm('Er du sikker på at du vil slette dette bildet?');
    if (!confirmed) return;

    // Haptic feedback
    if (window.haptic) window.haptic.medium();

    // Delete entry
    await storage.removeFromCollection('journal', id);

    // Refresh page
    if (window.app?.refreshCurrentPage) {
      setTimeout(() => {
        window.app.refreshCurrentPage();
      }, 500);
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
