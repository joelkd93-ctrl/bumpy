/**
 * Journal Page - Weekly Bump Photos & Notes 📔
 * Capturing precious moments of the journey
 */
import { storage } from '../utils/storage.js';
import { getPregnancyProgress } from '../utils/pregnancy.js';
import { getJournalPhotoDataUrl } from '../utils/media-store.js';

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
        <div class="journal-entry" data-id="${entry.id}">
          <div class="journal-header">
            <div>
              <span class="journal-week">Uke ${entry.week}</span>
              <span class="journal-date">${formatDate(entry.date)}</span>
            </div>
            <div>
              <button class="btn-icon-small edit-journal-entry" data-id="${entry.id}" aria-label="Rediger">
                ✏️
              </button>
              <button class="btn-icon-small delete-journal-entry" data-id="${entry.id}" aria-label="Slett">
                🗑️
              </button>
            </div>
          </div>
          ${entry.mediaType === 'video' && entry.mediaUrl
        ? `<div style="position:relative;">
             <video src="${entry.mediaUrl}" ${entry.mediaThumbUrl ? `poster="${entry.mediaThumbUrl}"` : ''} class="journal-photo" controls playsinline preload="metadata"></video>
             ${entry.mediaDuration ? `<span style="position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,.65);color:#fff;padding:2px 8px;border-radius:999px;font-size:12px;">${Math.floor(entry.mediaDuration / 60)}:${String(entry.mediaDuration % 60).padStart(2, '0')}</span>` : ''}
           </div>`
        : (entry.photo
            ? `<img src="${entry.photo}" alt="Uke ${entry.week} magebilde" class="journal-photo"/>`
            : (entry.photoRef
                ? `<img data-photo-ref="${entry.photoRef}" alt="Uke ${entry.week} magebilde" class="journal-photo journal-photo-deferred"/>`
                : (entry.photoUrl ? `<img src="${entry.photoUrl}" alt="Uke ${entry.week} magebilde" class="journal-photo"/>` : '')))
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

  const journeyEvents = [
    ...storage.getCollection('journal').map(e => ({ ...e, type: 'journal', sortDate: new Date(e.date) })),
    ...storage.getCollection('mood_entries').map(e => ({ ...e, type: 'mood', sortDate: new Date(e.timestamp || e.date) })),
    ...storage.getCollection('kicks').map(e => ({ ...e, type: 'kick', sortDate: new Date(e.startTime) })),
  ].sort((a, b) => b.sortDate - a.sortDate);

  const journeyHTML = journeyEvents.length
    ? journeyEvents.map(renderJourneyEvent).join('')
    : `<div class="empty-state"><div class="empty-state-icon">✨</div><p class="heading-section mb-2">Ingen reisehendelser enda</p></div>`;

  return `
    <div class="page-journal">
      <div class="page-header-hero page-header-journal">
        <h1 class="page-header-hero-title">Min Dagbok 📔</h1>
        <p class="page-header-hero-sub">Fang øyeblikk for ${settings.name}</p>
      </div>
      
      <div class="journal-tabs mb-4">
        <button id="journal-tab-dagbok" class="journal-tab active" type="button">Dagbok</button>
        <button id="journal-tab-reise" class="journal-tab" type="button">Vår Reise</button>
      </div>

      <div id="journal-pane-dagbok">
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
            <span class="photo-upload-icon" id="upload-icon">🤍</span>
            <p class="photo-upload-text" id="upload-text">Legg til et øyeblikk</p>
            <div class="photo-upload-buttons">
              <button class="btn btn-soft btn-small" id="camera-btn" type="button">
                📷 Ta bilde
              </button>
              <button class="btn btn-soft btn-small" id="gallery-btn" type="button">
                🖼️ Velg fra galleri
              </button>
            </div>
          </div>
          <input type="file" id="photo-input-camera" accept="image/*,video/*" capture="environment" style="display: none;"/>
          <input type="file" id="photo-input-gallery" accept="image/*,video/*" style="display: none;"/>
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
      </div>

      <div id="journal-pane-reise" style="display:none;">
        <div class="journal-timeline">
          ${journeyHTML}
        </div>
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

function renderJourneyEvent(event) {
  const dateStr = new Date(event.sortDate).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });

  if (event.type === 'journal') {
    return `
      <div class="journal-entry" data-id="${event.id}">
        <div class="journal-header">
          <div>
            <span class="journal-week">Uke ${event.week}</span>
            <span class="journal-date">${dateStr}</span>
          </div>
          <div><button class="btn-icon-small delete-timeline-entry" data-id="${event.id}" data-type="journal" aria-label="Slett">🗑️</button></div>
        </div>
        ${event.mediaType === 'video' && event.mediaUrl
          ? `<video src="${event.mediaUrl}" ${event.mediaThumbUrl ? `poster="${event.mediaThumbUrl}"` : ''} class="journal-photo" controls playsinline preload="metadata"></video>`
          : (event.photo
              ? `<img src="${event.photo}" alt="Uke ${event.week} magebilde" class="journal-photo"/>`
              : (event.photoRef
                  ? `<img data-photo-ref="${event.photoRef}" alt="Uke ${event.week} magebilde" class="journal-photo journal-photo-deferred"/>`
                  : (event.photoUrl ? `<img src="${event.photoUrl}" alt="Uke ${event.week} magebilde" class="journal-photo"/>` : '')))
        }
        ${event.note ? `<p class="journal-note">${event.note}</p>` : ''}
      </div>
    `;
  }

  if (event.type === 'mood') {
    return `
      <div class="journal-entry" data-id="${event.id}">
        <div class="journal-header">
          <div>
            <span class="journal-week">${event.mood} Stemning</span>
            <span class="journal-date">${dateStr}</span>
          </div>
          <div><button class="btn-icon-small delete-timeline-entry" data-id="${event.id}" data-type="mood" aria-label="Slett">🗑️</button></div>
        </div>
        ${event.note ? `<p class="journal-note">${event.note}</p>` : ''}
      </div>
    `;
  }

  return `
    <div class="journal-entry" data-id="${event.id}">
      <div class="journal-header">
        <div>
          <span class="journal-week">🦶 ${event.count} Spark</span>
          <span class="journal-date">${dateStr}</span>
        </div>
        <div><button class="btn-icon-small delete-timeline-entry" data-id="${event.id}" data-type="kick" aria-label="Slett">🗑️</button></div>
      </div>
      <p class="journal-note">Økten varte i ${event.duration} minutter</p>
    </div>
  `;
}

function ensureMediaLightboxStyles() {
  if (document.getElementById('media-lightbox-style')) return;
  const style = document.createElement('style');
  style.id = 'media-lightbox-style';
  style.textContent = `
    .media-lightbox {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.88);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .media-lightbox img {
      max-width: 95vw;
      max-height: 90vh;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,.35);
    }
  `;
  document.head.appendChild(style);
}

function openImageLightbox(src) {
  if (!src) return;
  ensureMediaLightboxStyles();
  const overlay = document.createElement('div');
  overlay.className = 'media-lightbox';
  overlay.innerHTML = `<img src="${src}" alt="Forstørret bilde"/>`;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
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
  const uploadIcon = document.getElementById('upload-icon');
  const uploadText = document.getElementById('upload-text');

  let currentPhoto = null;
  let currentMediaDataUrl = null;
  let currentMediaType = null;
  let currentMediaDuration = null;
  let currentMediaThumbUrl = null;
  let editingEntryId = null;

  const tabDagbok = document.getElementById('journal-tab-dagbok');
  const tabReise = document.getElementById('journal-tab-reise');
  const paneDagbok = document.getElementById('journal-pane-dagbok');
  const paneReise = document.getElementById('journal-pane-reise');

  const setTab = (tab) => {
    const isDagbok = tab !== 'reise';
    if (paneDagbok) paneDagbok.style.display = isDagbok ? '' : 'none';
    if (paneReise) paneReise.style.display = isDagbok ? 'none' : '';
    tabDagbok?.classList.toggle('active', isDagbok);
    tabReise?.classList.toggle('active', !isDagbok);
  };

  tabDagbok?.addEventListener('click', () => setTab('dagbok'));
  tabReise?.addEventListener('click', () => setTab('reise'));

  // Hydrate deferred photos from IndexedDB
  const hydrateDeferredPhotos = async () => {
    const imgs = document.querySelectorAll('img.journal-photo-deferred[data-photo-ref]');
    for (const img of imgs) {
      const ref = img.getAttribute('data-photo-ref');
      if (!ref) continue;
      const dataUrl = await getJournalPhotoDataUrl(ref).catch(() => null);
      if (dataUrl) {
        img.src = dataUrl;
        img.classList.remove('journal-photo-deferred');
      }
    }
  };
  hydrateDeferredPhotos();

  // Function to update upload button state
  function updateUploadButton(hasPhoto) {
    if (uploadIcon && uploadText) {
      if (hasPhoto) {
        uploadIcon.textContent = '📸';
        uploadText.textContent = 'Endre øyeblikk';
      } else {
        uploadIcon.textContent = '🤍';
        uploadText.textContent = 'Legg til et øyeblikk';
      }
    }
  }

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

  const handleSelectedFile = (file) => {
    if (!file) return;

    if (file.type?.startsWith('video/')) {
      if (file.size > 100 * 1024 * 1024) {
        alert('Videoen er for stor (maks 100MB akkurat nå).');
        return;
      }

      fileToDataUrl(file, async (dataUrl) => {
        currentPhoto = null;
        currentMediaDataUrl = dataUrl;
        currentMediaType = 'video';

        const meta = await getVideoMetadata(file).catch(() => null);
        currentMediaDuration = meta?.duration || null;
        currentMediaThumbUrl = meta?.thumbDataUrl || null;

        previewImg.src = currentMediaThumbUrl || '';
        previewImg.alt = 'Video valgt';
        photoUpload.style.display = 'none';
        photoPreview.style.display = 'block';
        updateUploadButton(true);
      });
      return;
    }

    compressImage(file, (result) => {
      currentPhoto = result;
      currentMediaDataUrl = null;
      currentMediaType = 'image';
      currentMediaDuration = null;
      currentMediaThumbUrl = null;
      previewImg.src = currentPhoto;
      photoUpload.style.display = 'none';
      photoPreview.style.display = 'block';
      updateUploadButton(true);
    });
  };

  // Handle file selection from camera
  photoInputCamera?.addEventListener('change', (e) => handleSelectedFile(e.target.files?.[0]));

  // Handle file selection from gallery
  photoInputGallery?.addEventListener('change', (e) => handleSelectedFile(e.target.files?.[0]));

  // Remove photo
  removePhotoBtn?.addEventListener('click', () => {
    currentPhoto = null;
    currentMediaDataUrl = null;
    currentMediaType = null;
    currentMediaDuration = null;
    currentMediaThumbUrl = null;
    photoPreview.style.display = 'none';
    photoUpload.style.display = 'flex';
    photoInputCamera.value = '';
    photoInputGallery.value = '';
    updateUploadButton(false);
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
    saveBtn.textContent = editingEntryId ? 'Oppdaterer... ☁️' : 'Lagrer... ☁️';
    saveBtn.disabled = true;

    try {
      if (editingEntryId) {
        // Update existing entry using dedicated endpoint (avoids full collection sync payload)
        await storage.upsertJournalEntry(editingEntryId, {
          week: progress.weeksPregnant,
          date: selectedDate || new Date().toISOString().split('T')[0],
          photo: currentPhoto,
          mediaDataUrl: currentMediaDataUrl,
          mediaType: currentMediaType,
          mediaDuration: currentMediaDuration,
          mediaThumbUrl: currentMediaThumbUrl,
          note: note
        });
        saveBtn.textContent = 'Oppdatert! 💕';
      } else {
        // Create new entry with deterministic id
        const newId = String(Date.now() + Math.floor(Math.random() * 1000));
        await storage.upsertJournalEntry(newId, {
          week: progress.weeksPregnant,
          date: selectedDate || new Date().toISOString().split('T')[0],
          photo: currentPhoto,
          mediaDataUrl: currentMediaDataUrl,
          mediaType: currentMediaType,
          mediaDuration: currentMediaDuration,
          mediaThumbUrl: currentMediaThumbUrl,
          note: note
        });
        saveBtn.textContent = 'Lagret! 💕';
      }

      setTimeout(() => {
        // Reset form
        currentPhoto = null;
        currentMediaDataUrl = null;
        currentMediaType = null;
        currentMediaDuration = null;
        currentMediaThumbUrl = null;
        editingEntryId = null;
        noteInput.value = '';
        dateInput.value = new Date().toISOString().split('T')[0];
        photoPreview.style.display = 'none';
        photoUpload.style.display = 'flex';
        photoInputCamera.value = '';
        photoInputGallery.value = '';
        saveBtn.textContent = 'Lagre Minne 💕';
        saveBtn.disabled = false;
        updateUploadButton(false);

        // Refresh entries - now safe because cloud sync completed
        if (window.app?.refreshCurrentPage) {
          window.app.refreshCurrentPage();
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to save journal entry:', err);
      
      // Specific handling for QuotaExceededError
      if (err.name === 'QuotaExceededError' || err.message.includes('quota')) {
        alert('Lagringsplassen er full! Slett noen gamle bilder for å frigjøre plass.');
        saveBtn.textContent = 'Lagring full 💾';
      } else {
        saveBtn.textContent = 'Feil! Prøv igjen';
      }
      
      setTimeout(() => {
        saveBtn.textContent = 'Lagre Minne 💕';
        saveBtn.disabled = false;
      }, 3000);
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

  // Close popup when clicking outside — replace handler each time page loads
  if (window._journalEmojiCloseHandler) document.removeEventListener('click', window._journalEmojiCloseHandler);
  window._journalEmojiCloseHandler = (e) => {
    const emojiPopup = document.getElementById('emoji-popup');
    const emojiToggle = document.getElementById('emoji-toggle');
    if (emojiPopup && !emojiPopup.contains(e.target) && e.target !== emojiToggle) {
      emojiPopup.style.display = 'none';
    }
  };
  document.addEventListener('click', window._journalEmojiCloseHandler);

  // Handle edit buttons — replace handler each time page loads
  if (window._journalEditHandler) document.removeEventListener('click', window._journalEditHandler);
  const handleEdit = async (e) => {
      const editBtn = e.target.closest('.edit-journal-entry');
      if (!editBtn) return;

      const id = editBtn.dataset.id;
      const entries = storage.getCollection('journal');
      const entry = entries.find(e => e.id === id);

      if (!entry) return;

      // Get form elements (correct IDs matching the rendered HTML)
      const noteInput = document.getElementById('journal-note');
      const dateInput = document.getElementById('entry-date');
      const photoUpload = document.getElementById('photo-upload');
      const photoPreview = document.getElementById('photo-preview');
      const previewImg = document.getElementById('preview-img');
      const saveBtn = document.getElementById('save-entry');

      // Populate form with entry data
      editingEntryId = id;
      noteInput.value = entry.note || '';
      dateInput.value = entry.date;

      if (entry.mediaType === 'video' && entry.mediaUrl) {
        currentPhoto = null;
        currentMediaType = 'video';
        currentMediaDataUrl = null; // keep existing cloud media unless replaced
        currentMediaDuration = entry.mediaDuration || null;
        currentMediaThumbUrl = entry.mediaThumbUrl || null;
        if (currentMediaThumbUrl) previewImg.src = currentMediaThumbUrl;
        else previewImg.removeAttribute('src');
        previewImg.alt = 'Video valgt';
        photoUpload.style.display = 'none';
        photoPreview.style.display = 'block';
        updateUploadButton(true);
      } else if (entry.photo || entry.photoRef) {
        let photoData = entry.photo || null;
        if (!photoData && entry.photoRef) {
          photoData = await getJournalPhotoDataUrl(entry.photoRef).catch(() => null);
        }

        if (photoData) {
          currentPhoto = photoData;
          currentMediaType = 'image';
          currentMediaDataUrl = null;
          currentMediaDuration = null;
          currentMediaThumbUrl = null;
          previewImg.src = photoData;
          photoUpload.style.display = 'none';
          photoPreview.style.display = 'block';
          updateUploadButton(true);
        }
      }

      // Update button text
      saveBtn.textContent = 'Oppdater Minne 💕';

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Haptic feedback
      if (window.haptic) window.haptic.light();
    };

  document.addEventListener('click', handleEdit);
  window._journalEditHandler = handleEdit;

  // Handle delete buttons — replace handler each time page loads
  if (window._journalDeleteHandler) document.removeEventListener('click', window._journalDeleteHandler);
  const handleDelete = async (e) => {
      const deleteBtn = e.target.closest('.delete-journal-entry');
      if (!deleteBtn) return;

      // Prevent multiple triggers
      if (deleteBtn.disabled) return;
      deleteBtn.disabled = true;

      const id = deleteBtn.dataset.id;

      // Confirm deletion
      const confirmed = confirm('Er du sikker på at du vil slette dette bildet?');
      if (!confirmed) {
        deleteBtn.disabled = false;
        return;
      }

      // Haptic feedback
      if (window.haptic) window.haptic.medium();

      // Delete entry locally + cloud (removeFromCollection handles both)
      await storage.removeFromCollection('journal', id);

      // Refresh page
      if (window.app?.refreshCurrentPage) {
        setTimeout(() => {
          window.app.refreshCurrentPage();
        }, 500);
      }
    };

  document.addEventListener('click', handleDelete);
  window._journalDeleteHandler = handleDelete;

  // Delete from Reise tab (journal/mood/kicks mixed feed)
  if (window._journalJourneyDeleteHandler) document.removeEventListener('click', window._journalJourneyDeleteHandler);
  const handleJourneyDelete = async (e) => {
    const deleteBtn = e.target.closest('.delete-timeline-entry');
    if (!deleteBtn) return;

    if (deleteBtn.disabled) return;
    deleteBtn.disabled = true;

    const id = deleteBtn.dataset.id;
    const type = deleteBtn.dataset.type;
    const confirmed = confirm('Er du sikker på at du vil slette dette?');
    if (!confirmed) {
      deleteBtn.disabled = false;
      return;
    }

    const prefix = type === 'journal' ? 'journal' : type === 'mood' ? 'mood_entries' : type === 'kick' ? 'kicks' : null;
    if (prefix) {
      await storage.removeFromCollection(prefix, id);
      if (type === 'kick') await storage.syncWithCloud({ only: ['kicks'] });
      if (window.app?.refreshCurrentPage) setTimeout(() => window.app.refreshCurrentPage(), 250);
    }
  };
  document.addEventListener('click', handleJourneyDelete);
  window._journalJourneyDeleteHandler = handleJourneyDelete;

  // Tap image to zoom
  if (window._journalMediaZoomHandler) document.removeEventListener('click', window._journalMediaZoomHandler);
  const handleZoom = (e) => {
    const img = e.target.closest('.journal-entry img.journal-photo');
    if (!img) return;
    const src = img.getAttribute('src');
    if (!src) return;
    openImageLightbox(src);
  };
  document.addEventListener('click', handleZoom);
  window._journalMediaZoomHandler = handleZoom;
}

function fileToDataUrl(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.onerror = () => {
    alert('Kunne ikke lese mediafil. Prøv igjen.');
  };
  reader.readAsDataURL(file);
}

function getVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      const duration = Number(video.duration || 0);
      const captureAt = Math.min(1, Math.max(0.1, duration / 4 || 0.1));
      video.currentTime = captureAt;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const duration = Number(video.duration || 0);
        cleanup();
        resolve({ duration: Math.round(duration), thumbDataUrl });
      } catch (e) {
        cleanup();
        resolve({ duration: Number(video.duration || 0) || null, thumbDataUrl: null });
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Video metadata load failed'));
    };
  });
}

// Compress image to reduce localStorage usage and prevent memory crashes
function compressImage(file, callback) {
  // 1. Check file size (warn if huge)
  if (file.size > 15 * 1024 * 1024) {
    alert(`Bildet er veldig stort (${(file.size / 1024 / 1024).toFixed(1)} MB). Det kan hende nettleseren ikke klarer å behandle det.`);
  }

  // 2. Check file type
  if (!file.type.match(/image.*/)) {
    alert(`Filtypen '${file.type}' støttes kanskje ikke. Prøv et vanlig bilde (JPG/PNG).`);
    return;
  }

  // Use createObjectURL instead of FileReader to avoid massive memory spikes
  const url = URL.createObjectURL(file);
  const img = new Image();
  
  img.onload = () => {
    // Release memory immediately after loading
    URL.revokeObjectURL(url);
    
    const canvas = document.createElement('canvas');
    // Slightly reduced max dimensions for better stability on older phones
    const maxWidth = 800; 
    const maxHeight = 800;

    let { width, height } = img;

    // Calculate new dimensions
    if (width > height) {
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round(width * (maxHeight / height));
        height = maxHeight;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    
    try {
      ctx.drawImage(img, 0, 0, width, height);
    } catch (e) {
      console.error('Canvas draw error:', e);
      alert('Kunne ikke tegne bildet. Det kan være skadet eller for stort for minnet.');
      return;
    }

    // Compress to JPEG at 60% quality (aggressive compression for localStorage)
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      
      // Check size before returning (aim for < 300KB)
      if (dataUrl.length > 500000) {
        console.warn('Image still too large:', dataUrl.length);
        // Retry with lower quality if needed? For now just warn.
      }
      
      callback(dataUrl);
    } catch (e) {
      console.error('Compression failed:', e);
      alert(`Komprimering feilet: ${e.message}. Prøv et mindre bilde.`);
    }
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    console.error('Image load failed');
    alert(`Kunne ikke laste bildet. Det kan være formatet (${file.type}) eller filen er skadet.`);
  };

  img.src = url;
}
