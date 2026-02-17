/**
 * Kicks Page - Track Baby's Movements 🦶
 * Simple counter to track fetal activity sessions.
 */
import { storage } from '../utils/storage.js';

export function renderKicks() {
  const session = storage.get('current_kick_session');
  const role = localStorage.getItem('who_am_i') || 'andrine';
  const displayedSession = (role === 'andrine') ? session : window.app.andrineActiveSession;
  const history = storage.getCollection('kicks');

  return `
    <div class="page-kicks kick-pearl-page fade-in">
      <div class="kick-pearl-topbar">
        <button class="kick-pearl-icon-btn" aria-label="Tilbake" type="button" onclick="window.app?.navigate('home')">←</button>
        <h1 class="kick-pearl-title">Sparketeller</h1>
        <button class="kick-pearl-icon-btn" aria-label="Info" type="button">i</button>
      </div>

      <div class="kick-pearl-hero">
        <div class="kick-pearl-circle" id="add-kick" role="button" aria-label="Registrer spark">
          <span class="kick-pearl-circle-label">I dag</span>
          <span class="kick-pearl-circle-count">${displayedSession?.count || 0}</span>
          <span class="kick-pearl-circle-sub">SPARK</span>
        </div>

        ${displayedSession
          ? `<p class="kick-pearl-help">Trykk på perlen for å registrere et nytt spark</p>
             ${role === 'andrine' ? `<button class="kick-pearl-finish" id="finish-session">Avslutt økt</button>` : `<p class="kick-pearl-help">Andrine teller spark nå…</p>`}`
          : `${role === 'andrine'
              ? `<p class="kick-pearl-help">Trykk på perlen for å starte telling</p><button class="kick-pearl-start" id="start-kicks">Start telling</button>`
              : `<p class="kick-pearl-help">Venter på at Andrine starter telling…</p>`}`
        }
      </div>

      <div class="kick-pearl-sheet">
        <div class="kick-pearl-sheet-handle"></div>
        <div class="kick-pearl-sheet-head">
          <h2>Tidligere økter</h2>
          <span>Vis alle</span>
        </div>

        <div class="kick-pearl-history">
          ${history.length > 0 ? history.slice(0, 8).map(s => {
            const start = new Date(s.startTime);
            const end = s.endTime ? new Date(s.endTime) : null;
            const label = getSessionLabel(start);
            const from = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const to = end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const duration = Number(s.duration || 0);
            return `
              <div class="kick-pearl-row">
                <div class="kick-pearl-row-left">
                  <div class="kick-pearl-row-icon">${getSessionIcon(start)}</div>
                  <div>
                    <div class="kick-pearl-row-title">${label}</div>
                    <div class="kick-pearl-row-meta">${from} - ${to} <span>|</span> ${duration} min</div>
                  </div>
                </div>
                <div class="kick-pearl-row-right">
                  <div class="kick-pearl-row-count">${s.count || 0}</div>
                  <div class="kick-pearl-row-sub">SPARK</div>
                </div>
              </div>
            `;
          }).join('') : `<p class="text-muted text-center py-4">Ingen økter ennå.</p>`}
        </div>
      </div>
    </div>
  `;
}

function getSessionLabel(date) {
  const h = date.getHours();
  if (h < 11) return 'Morgenøkt';
  if (h < 17) return 'Ettermiddagsøkt';
  return 'Kveldsøkt';
}

function getSessionIcon(date) {
  const h = date.getHours();
  if (h < 11) return '⚡';
  if (h < 17) return '☀️';
  return '☾';
}

async function notifySync(role, session) {
  try {
    const url = `${window.API_BASE}/api/presence`;
    console.log(`🦶 notifySync sending to ${url}:`, session);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, kickSession: session })
    });
    const data = await res.json();
    console.log('🦶 notifySync response:', data);
  } catch (err) {
    console.warn('Could not sync kick session:', err);
  }
}

export function initKicks() {
  const startBtn = document.getElementById('start-kicks');
  const addBtn = document.getElementById('add-kick');
  const finishBtn = document.getElementById('finish-session');
  const role = localStorage.getItem('who_am_i') || 'andrine';

  // Pull latest kick data from cloud on page load
  // But skip if we just synced (avoids pulling stale data over fresh local state)
  const skipPull = localStorage.getItem('bumpy:skip_pull') === 'true';
  if (!skipPull && window.storage && window.storage.pullFromCloud) {
    window.storage.pullFromCloud().then((hasChanges) => {
      if (hasChanges && window.app.getCurrentTab() === 'kicks') {
        window.app.refreshCurrentPage();
      }
    }).catch(err => {
      console.warn('⚠️ Could not pull kick data:', err);
    });
  }

  // Start Session
  startBtn?.addEventListener('click', async () => {
    const newSession = {
      startTime: new Date().toISOString(),
      count: 0
    };
    storage.set('current_kick_session', newSession);

    // Notify partner of start AND send session
    console.log('🦶 Starting kick session, notifying partner...', newSession);
    try {
      await fetch(`${window.API_BASE}/api/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, kickStart: true, kickSession: newSession })
      });
    } catch (err) {
      console.warn('Could not notify partner of kick session start');
    }

    window.app.refreshCurrentPage();
  });

  // Add Kick (or start via pearl tap when no active session)
  addBtn?.addEventListener('click', async () => {
    let session = storage.get('current_kick_session');

    if (!session) {
      if (role !== 'andrine') return;
      const newSession = {
        startTime: new Date().toISOString(),
        count: 1
      };
      storage.set('current_kick_session', newSession);
      await notifySync(role, newSession);
      if (navigator.vibrate) navigator.vibrate(40);
      window.app.refreshCurrentPage();
      return;
    }

    session.count++;
    storage.set('current_kick_session', session);

    // Notify partner of update
    console.log('🦶 Adding kick, notifying partner...', session);
    notifySync(role, session);

    // Haptic & Visual Feedback
    if (navigator.vibrate) navigator.vibrate(50);

    // Celebrate every 10 kicks
    if (session.count > 0 && session.count % 10 === 0) {
      if (window.confetti) {
        window.confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#C5D9CD', '#749E91', '#FFFFFF']
        });
      }
    }

    window.app.refreshCurrentPage();
  });

  // Finish Session
  finishBtn?.addEventListener('click', async () => {
    const session = storage.get('current_kick_session');
    if (session) {
      const endTime = new Date();
      const startTime = new Date(session.startTime);
      const durationMinutes = Math.round((endTime - startTime) / 60000);

      // Use a stable ID based on startTime — prevents double-save if button tapped twice
      const sessionId = String(new Date(session.startTime).getTime());

      const savedSession = {
        startTime: session.startTime,
        endTime: endTime.toISOString(),
        count: session.count,
        duration: durationMinutes,
        date: session.startTime
      };

      // Save directly with explicit ID — avoids addToCollection generating a second ID
      storage.set(`kicks:${sessionId}`, savedSession, true); // skipSync
      // Now sync just kicks to cloud
      await storage.syncWithCloud({ only: ['kicks'] });

      storage.remove('current_kick_session');

      // Notify partner session is over
      notifySync(role, null);

      window.app.refreshCurrentPage();
    }
  });
}
