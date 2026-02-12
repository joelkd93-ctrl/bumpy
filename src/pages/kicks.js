/**
 * Kicks Page - Track Baby's Movements ð¦¶
 * Simple counter to track fetal activity sessions.
 */
import { storage } from '../utils/storage.js';

export function renderKicks() {
  const session = storage.get('current_kick_session');
  // If Yoel, use the synced session from Andrine if available
  const role = localStorage.getItem('who_am_i') || 'andrine';
  const displayedSession = (role === 'andrine') ? session : window.app.andrineActiveSession;

  console.log(`ð¦¶ Rendering Kicks: Role=${role}, LocalSession=${!!session}, SyncedSession=${!!window.app.andrineActiveSession}`);

  const history = storage.getCollection('kicks');

  return `
    <div class="page-kicks fade-in">
      <div class="page-header-hero page-header-kicks" style="margin-bottom:var(--space-5);">
        <h1 class="page-header-hero-title">Sparketeller 🦶</h1> ð¦¶</h1>
        <p class="page-header-hero-sub">Spor babyens små bevegelser</p>
      </div>

      <!-- Active Counter -->
      <div class="kick-hero-card mb-4">
        ${displayedSession ? `
          <div>
            <div class="kick-count-big">${displayedSession.count}</div>
            <div class="kick-count-sub">spark</div>
          </div>
          <p style="color:rgba(255,255,255,0.65);font-size:var(--text-sm);margin:var(--space-2) 0 0;">Økt startet ${new Date(displayedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p class="text-muted mb-4 text-small">Ãkt startet ${new Date(displayedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            
          ${role === 'andrine' ? `
            <button class="kick-btn-big" id="add-kick">🦶 Tell et Spark!</button>
            <button class="btn btn-soft btn-block mt-4" id="finish-session" style="background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.25);">Avslutt &amp; Lagre</button>
          ` : `
            <p style="color:rgba(255,255,255,0.8);font-size:var(--text-base);">Andrine teller spark nå... 🤰</p>
            `}
          </div>
        ` : `
          <div>
            <div style="font-size:72px;margin-bottom:var(--space-4);filter:drop-shadow(0 4px 12px rgba(0,0,0,0.2));">🦶</div>
            ${role === 'andrine' ? `
              <p style="font-size:var(--text-xl);font-weight:var(--weight-heavy);color:#fff;margin-bottom:var(--space-3);">Klar til å telle?</p>
              <p style="color:rgba(255,255,255,0.7);font-size:var(--text-sm);margin-bottom:var(--space-6);">Finn et koselig sted og trykk start.</p>
              <button class="kick-btn-big" id="start-kicks">Start Telling 💕</button>
            ` : `
              <p class="heading-section mb-2">Ingen aktiv telling</p>
              <p class="text-warm mb-6">Yoel, du fÃ¥r beskjed nÃ¥r Andrine begynner Ã¥ telle spark! ð¶ð¦¶</p>
            `}
          </div>
        `}
      </div>

      <!-- History -->
      <div class="mt-6">
        <h2 class="heading-section mb-3">Nylige Ãkter</h2>
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
            <p class="text-muted text-center py-4">Ingen Ã¸kter ennÃ¥. Start en over!</p>
          `}
        </div>
      </div>
      
    </div>
  `;
}

async function notifySync(role, session) {
  try {
    const url = `${window.API_BASE}/api/presence`;
    console.log(`ð¦¶ notifySync sending to ${url}:`, session);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, kickSession: session })
    });
    const data = await res.json();
    console.log('ð¦¶ notifySync response:', data);
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
    console.log('ð¦¶ Starting kick session, notifying partner...', newSession);
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
      console.log('ð¦¶ Adding kick, notifying partner...', session);
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
