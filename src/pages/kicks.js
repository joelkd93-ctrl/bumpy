/**
 * Kicks Page - Track Baby's Movements 🦶
 * Simple counter to track fetal activity sessions.
 */
import { storage } from '../utils/storage.js';

export function renderKicks() {
  const session = storage.get('current_kick_session');
  // If Yoel, use the synced session from Andrine if available
  const role = localStorage.getItem('who_am_i') || 'andrine';
  const displayedSession = (role === 'andrine') ? session : window.app.andrineActiveSession;

  console.log(`🦶 Rendering Kicks: Role=${role}, LocalSession=${!!session}, SyncedSession=${!!window.app.andrineActiveSession}`);

  const history = storage.getCollection('kicks');

  return `
    <div class="page-kicks fade-in">
      <div class="mb-6">
        <h1 class="heading-love mb-2">Sparketeller 🦶</h1>
        <p class="text-warm">Spor babyens små bevegelser</p>
      </div>

      <!-- Active Counter -->
      <div class="card card-love mb-6 text-center">
        ${displayedSession ? `
          <div class="kick-active-display">
            <div class="kick-count-ring">
              <span class="kick-count-number animate-pop">${displayedSession.count}</span>
              <span class="kick-count-label">spark</span>
            </div>
            <p class="text-muted mb-4 text-small">Økt startet ${new Date(displayedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            
            ${role === 'andrine' ? `
              <button class="btn btn-primary btn-block mb-4" id="add-kick">
                🦶 Tell et Spark!
              </button>
              <button class="btn btn-soft btn-block" id="finish-session">
                Avslutt & Lagre
              </button>
            ` : `
              <p class="text-warm font-medium">Andrine teller spark nå... 🤰</p>
            `}
          </div>
        ` : `
          <div class="kick-start-display">
            <div class="kick-icon-big">🦶</div>
            ${role === 'andrine' ? `
              <p class="heading-section mb-2">Klar til å telle?</p>
              <p class="text-warm mb-6">Finn et koselig sted, slapp av, og trykk start når du kjenner det første sparket.</p>
              <button class="btn btn-primary btn-block" id="start-kicks">
                Start Telling 💕
              </button>
            ` : `
              <p class="heading-section mb-2">Ingen aktiv telling</p>
              <p class="text-warm mb-6">Yoel, du får beskjed når Andrine begynner å telle spark! 👶🦶</p>
            `}
          </div>
        `}
      </div>

      <!-- History -->
      <div class="mt-6">
        <h2 class="heading-section mb-3">Nylige Økter</h2>
        <div class="kick-history">
          ${history.length > 0 ? history.slice(0, 5).map(s => `
            <div class="card mb-3 p-4 flex-between">
              <div>
                <p class="font-medium mb-1">${new Date(s.startTime).toLocaleDateString()}</p>
                <p class="text-xs text-muted">${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div class="text-right">
                <span class="text-love font-bold text-xl">${s.count}</span>
                <span class="text-xs text-muted block">spark</span>
              </div>
            </div>
          `).join('') : `
            <p class="text-muted text-center py-4">Ingen økter ennå. Start en over!</p>
          `}
        </div>
      </div>
      
    </div>
  `;
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

  // Add Kick
  addBtn?.addEventListener('click', () => {
    const session = storage.get('current_kick_session');
    if (session) {
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
            colors: ['#FF8FAB', '#FFC2D1', '#FFF']
          });
        }
      }

      window.app.refreshCurrentPage();
    }
  });

  // Finish Session
  finishBtn?.addEventListener('click', () => {
    const session = storage.get('current_kick_session');
    if (session) {
      const endTime = new Date();
      const startTime = new Date(session.startTime);
      const durationIdx = Math.round((endTime - startTime) / 60000); // minutes

      storage.addToCollection('kicks', {
        ...session,
        endTime: endTime.toISOString(),
        duration: durationIdx
      });

      storage.remove('current_kick_session');

      // Notify partner session is over
      notifySync(role, null);

      window.app.refreshCurrentPage();
    }
  });
}
