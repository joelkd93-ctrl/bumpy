/**
 * Timeline Page - Our Journey Timeline 💖
 * A combined view of all pregnancy moments
 */
import { storage } from '../utils/storage.js';

export function renderTimeline() {
  const journal = storage.getCollection('journal');
  const moods = storage.getCollection('mood_entries');
  const kicks = storage.getCollection('kicks');

  // Combine all events
  const events = [
    ...journal.map(e => ({ ...e, type: 'journal', sortDate: new Date(e.date) })),
    ...moods.map(e => ({ ...e, type: 'mood', sortDate: new Date(e.timestamp || e.date) })),
    ...kicks.map(e => ({ ...e, type: 'kick', sortDate: new Date(e.startTime) }))
  ].sort((a, b) => b.sortDate - a.sortDate);

  const timelineHTML = events.length > 0
    ? events.map(event => renderEvent(event)).join('')
    : `
        <div class="empty-state">
          <div class="empty-state-icon">✨</div>
          <p class="heading-section mb-2">Historien deres begynner...</p>
          <p class="text-muted">Øyeblikk du lagrer vil vises her i en vakker tidslinje.</p>
        </div>
      `;

  return `
    <div class="page-timeline">
      <div class="page-header-hero page-header-timeline">
        <h1 class="page-header-hero-title">Vår Reise 💖</h1>
        <p class="page-header-hero-sub">Hvert lille øyeblikk, trygt bevart</p>
      </div>

      <div class="timeline-container">
        ${timelineHTML}
      </div>

    </div>
  `;
}

function renderEvent(event) {
  const dateStr = new Date(event.sortDate).toLocaleDateString('nb-NO', {
    day: 'numeric', month: 'short'
  });

  // Use journal-entry styling for all events
  if (event.type === 'journal') {
    return `
      <div class="journal-entry" data-id="${event.id}">
        <div class="journal-header">
          <div>
            <span class="journal-week">Uke ${event.week}</span>
            <span class="journal-date">${dateStr}</span>
          </div>
          <div>
            <button class="btn-icon-small delete-timeline-entry" data-id="${event.id}" data-type="${event.type}" aria-label="Slett">
              🗑️
            </button>
          </div>
        </div>
        ${event.photo ? `<img src="${event.photo}" alt="Uke ${event.week} magebilde" class="journal-photo"/>` : ''}
        ${event.note ? `<p class="journal-note">${event.note}</p>` : ''}
      </div>
    `;
  } else if (event.type === 'mood') {
    return `
      <div class="journal-entry" data-id="${event.id}">
        <div class="journal-header">
          <div>
            <span class="journal-week">${event.mood} Stemning</span>
            <span class="journal-date">${dateStr}</span>
          </div>
          <div>
            <button class="btn-icon-small delete-timeline-entry" data-id="${event.id}" data-type="${event.type}" aria-label="Slett">
              🗑️
            </button>
          </div>
        </div>
        ${event.note ? `<p class="journal-note">${event.note}</p>` : ''}
      </div>
    `;
  } else if (event.type === 'kick') {
    return `
      <div class="journal-entry" data-id="${event.id}">
        <div class="journal-header">
          <div>
            <span class="journal-week">🦶 ${event.count} Spark</span>
            <span class="journal-date">${dateStr}</span>
          </div>
          <div>
            <button class="btn-icon-small delete-timeline-entry" data-id="${event.id}" data-type="${event.type}" aria-label="Slett">
              🗑️
            </button>
          </div>
        </div>
        <p class="journal-note">Økten varte i ${event.duration} minutter</p>
      </div>
    `;
  }
}

export function initTimeline() {
  // Handle delete buttons (prevent duplicate listeners)
  if (!window._timelineDeleteHandlerAttached) {
    const handleDelete = async (e) => {
      const deleteBtn = e.target.closest('.delete-timeline-entry');
      if (!deleteBtn) return;

      // Prevent multiple triggers
      if (deleteBtn.disabled) return;
      deleteBtn.disabled = true;

      const id = deleteBtn.dataset.id;
      const type = deleteBtn.dataset.type;

      // Confirm deletion
      const confirmed = confirm('Er du sikker på at du vil slette dette?');
      if (!confirmed) {
        deleteBtn.disabled = false;
        return;
      }

      // Haptic feedback
      if (window.haptic) window.haptic.medium();

      // Delete based on type
      const prefix = type === 'journal' ? 'journal' :
                     type === 'mood' ? 'mood_entries' :
                     type === 'kick' ? 'kicks' : null;

      if (prefix) {
        await storage.removeFromCollection(prefix, id);

        // Refresh page
        if (window.app?.refreshCurrentPage) {
          setTimeout(() => {
            window.app.refreshCurrentPage();
          }, 500);
        }
      }
    };

    document.addEventListener('click', handleDelete);
    window._timelineDeleteHandlerAttached = true;
  }
}
