/**
 * Timeline Page - Our Journey Timeline ð
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
          <div class="empty-state-icon">â¨</div>
          <p class="heading-section mb-2">Historien deres begynner...</p>
          <p class="text-muted">Ãyeblikk du lagrer vil vises her i en vakker tidslinje.</p>
        </div>
      `;

  return `
    <div class="page-timeline">
      <div class="page-header-hero page-header-timeline" style="margin-bottom:var(--space-5);">
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
  const dateStr = new Date(event.sortDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  let content = '';
  let badgeClass = `badge-${event.type}`;
  let typeLabel = event.type;

  if (event.type === 'journal') {
    if (event.isSpecial) {
      content = `
        <div class="text-center py-2">
          <div class="timeline-special-icon">ð¶ð</div>
          <h3 class="timeline-special-heading">Det er en Gutt!</h3>
          <p class="timeline-special-note">${event.note}</p>
        </div>
      `;
      badgeClass = 'badge-boy';
      typeLabel = 'MilepÃ¦l';
    } else {
      content = `
        ${event.photo ? `<img src="${event.photo}" class="timeline-img" loading="lazy" decoding="async" />` : ''}
        <p class="font-bold">Uke ${event.week} Magebilde! ð¸</p>
        ${event.note ? `<p class="text-warm">"${event.note}"</p>` : ''}
      `;
    }
  } else if (event.type === 'mood') {
    content = `
      <div class="flex items-center gap-4">
        <span class="timeline-mood-icon">${event.mood}</span>
        <div>
          <p class="font-bold">FÃ¸ler seg ${event.mood}</p>
          ${event.note ? `<p class="text-warm">"${event.note}"</p>` : ''}
        </div>
      </div>
    `;
  } else if (event.type === 'kick') {
    content = `
      <div class="flex items-center gap-4">
        <span class="timeline-kick-icon">ð¦¶</span>
        <div>
          <p class="font-bold">${event.count} Spark Talt</p>
          <p class="text-warm">Varte i ${event.duration} minutter</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="timeline-item type-${event.type}" data-id="${event.id}" data-type="${event.type}">
      <div class="timeline-card type-${event.type}">
        <div class="flex-between">
          <div>
            <span class="timeline-date">${dateStr}</span>
            <span class="timeline-type-badge ${badgeClass}">${typeLabel}</span>
          </div>
          <button class="btn-icon-small delete-timeline-entry" data-id="${event.id}" data-type="${event.type}" aria-label="Slett">
            ðï¸
          </button>
        </div>
        ${content}
      </div>
    </div>
  `;
}

export function initTimeline() {
  // Handle delete buttons
  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-timeline-entry');
    if (!deleteBtn) return;

    const id = deleteBtn.dataset.id;
    const type = deleteBtn.dataset.type;

    // Confirm deletion
    const confirmed = confirm('Er du sikker pÃ¥ at du vil slette dette?');
    if (!confirmed) return;

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
  });
}
