/**
 * Together Page - Couple Bonding Mini Games 💗
 * No competition, no pressure - just connection
 */
import { storage } from '../utils/storage.js';
import { modal as modalManager } from '../utils/modal.js';

// ═══════════════════════════════════════════════════════════════
// 🎮 GAME CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const GAMES = [
  {
    id: 'heartbeat',
    icon: '💓',
    title: 'Hjerteslag',
    description: 'Trykk i takt sammen'
  },
  {
    id: 'weekly',
    icon: '💬',
    title: 'Oss, Denne Uken',
    description: 'Del tankene deres'
  },
  {
    id: 'guess',
    icon: '🤍',
    title: 'Gjett Humøret',
    description: 'Hvor godt kjenner du henne?'
  },
  {
    id: 'names',
    icon: '🍼',
    title: 'Navnelek',
    description: 'Finn favorittnavnene deres'
  },
  {
    id: 'missions',
    icon: '💌',
    title: 'Kjærlighets-oppdrag',
    description: 'Små daglige utfordringer'
  },
  {
    id: 'predictions',
    icon: '🎲',
    title: 'Gjettelek',
    description: 'Hva tror dere om fremtiden?'
  },
  {
    id: 'auction',
    icon: '💸',
    title: 'Love Auction',
    description: 'Coins + små kjærlighetskjøp'
  },
  {
    id: 'naughty',
    icon: '😈',
    title: 'Rampete Kveld',
    description: 'Litt spicy moro for to 🔥'
  }
];

// Weekly questions - one per week
const WEEKLY_QUESTIONS = [
  "Hva gleder du deg mest til denne uken?",
  "Er det noe du vil jeg skal vite?",
  "Hva fikk deg til å smile i dag?",
  "Hva er én ting du trenger akkurat nå?",
  "Hvordan kan jeg støtte deg bedre?",
  "Hva er du takknemlig for i dag?",
  "Hva har du tenkt på i det siste?",
  "Hva er ditt håp for babyen vår?",
  "Hvilket øyeblikk denne uken føltes spesielt?",
  "Hva trenger du mer av akkurat nå?",
];

// Baby names to swipe through (users can add their own)
const DEFAULT_NAMES = [
  "Adam", "Aiden", "Albie", "Alexander", "Andrew", "Anton", "Archie", "Arlo",
  "Arthur", "Asher", "August", "Axel", "Benjamin", "Caleb", "Carter", "Charlie",
  "Christian", "Clément", "Daniel", "David", "Eden", "Eliah", "Elias", "Elijah",
  "Elliot", "Emil", "Ethan", "Ezra", "Felix", "Filip", "Finley", "Finn",
  "Frans", "Freddie", "Gabriel", "George", "Grayson", "Henry", "Hugo", "Isaac",
  "Isak", "Isaiah", "Jack", "Jakob", "James", "Jeremiah", "Jonah", "Jonathan",
  "Joseph", "Joshua", "Jude", "Jules", "Julian", "Kasper", "Leo", "Leon",
  "Levi", "Liam", "Logan", "Louis", "Luca", "Lucas", "Lukas", "Maël", "Malte",
  "Marceau", "Markus", "Mason", "Matheo", "Mathis", "Matthew", "Max", "Michael",
  "Milo", "Nathan", "Nicolas", "Noé", "Noah", "Nolan", "Oliver", "Oskar",
  "Owen", "Paul", "Peter", "Raphaël", "Reggie", "Reuben", "Rio", "Rowan",
  "Samuel", "Sacha", "Saül", "Simon", "Sonny", "Teddy", "Theo", "Theodor",
  "Thomas", "Tiago", "Valentin", "Victor", "William", "Wyatt"
];

const MOODS = ['😊', '🥰', '😌', '🤔', '😴', '😢', '🤢', '😤', '😰', '💪'];

// Love Missions
const MISSIONS = {
  andrine: [
    "Fortell noe du er stolt av ved Yoel i dag. 👨🏾‍🚀",
    "Send en ekstra varm melding til Yoel nå. 💌",
    "Gi Yoel en god klem når du ser ham neste gang. 🤗",
    "Be Yoel velge kveldens film – uten diskusjon! 🎬",
    "Skriv ned én ting dere skal gjøre sammen etter fødselen. 🗓️",
    "Del et morsomt minne fra da dere møttes første gang. 💕",
    "Fortell Yoel hva du gleder deg mest til når babyen kommer. 👶",
    "Gi Yoel tre komplimenter – helt ærlige! 🌟",
    "Send Yoel et bilde av noe som minner deg om ham. 📸",
    "Planlegg en enkel date-kveld hjemme med Yoel. 🕯️",
    "Fortell Yoel om en egenskap du håper babyen arver fra ham. 🧬",
    "Spør Yoel om hans drømmedag – hva ville han gjort? 💭",
    "Skriv en kort kjærlighetslapp og gjem den et sted han finner den. 💝",
    "Be Yoel fortelle om favorittminnet deres sammen. 🎞️",
    "Lag en liste over 5 ting du setter pris på ved Yoel. 📝"
  ],
  partner: [
    "Gi Andrine 10 minutter med fotmassasje i dag. 🦶",
    "Lag yndlingsmaten hennes eller hent noe hun craver skikkelig. 🥗",
    "Fortell henne hvor utrolig flink hun er som bærer frem barnet deres. 👑",
    "Ta alt det praktiske med rydding og matlaging i kveld. 🧹",
    "Kjøp med en liten overraskelse til henne på vei hjem. 🎁",
    "Ordne med ekstra puter og teppe slik at hun kan hvile skikkelig. 🛋️",
    "Les høyt for babyen mens du holder på magen hennes. 📖",
    "Gjør klart et varmt bad med lys og god musikk for henne. 🛁",
    "Ta deg av alle husarbeid i dag uten at hun trenger å spørre. 💪",
    "Send henne en melding midt på dagen som sier hvor glad du er i henne. 📱",
    "Planlegg en overraskelsesdate hjemme – med mat, lys og musikk. 🕯️",
    "Gjør favorittdesserten hennes fra bunnen av. 🍰",
    "Si tre ting du gleder deg til når babyen kommer. 🎈",
    "Ta initiativ til en kveld hvor dere bare snakker om fremtiden. 💬",
    "Gi henne en skikkelig god massasje – rygg, skuldre og føtter. 💆‍♀️",
    "Lag en spilleliste med sanger som minner dere om hverandre. 🎵",
    "Fortell henne om et øyeblikk hvor du var ekstra stolt av henne. 🏆",
    "Ordne med en helt vanlig kosekveld – ingen stress, bare dere to. 🌙"
  ]
};

const PREDICTION_QUESTIONS = [
  { id: 'birth_date', label: 'Hvilken dato kommer den lille?', type: 'date' },
  { id: 'birth_time', label: 'Klokkeslett for fødsel?', type: 'time', placeholder: 'f.eks. 14:30' },
  { id: 'birth_weight', label: 'Estimert vekt (gram)?', type: 'number', placeholder: 'f.eks. 3500' },
  { id: 'birth_length', label: 'Estimert lengde (cm)?', type: 'number', placeholder: 'f.eks. 50' },
  { id: 'eye_color', label: 'Hvilken øyenfarge får han?', type: 'text', placeholder: 'f.eks. Blå/Brune' },
  { id: 'hair_color', label: 'Hvilken hårfarge?', type: 'text', placeholder: 'f.eks. Mørk/Lys' },
  { id: 'hair_amount', label: 'Mye eller lite hår?', type: 'text', placeholder: 'f.eks. Fyldig/Lite' },
  { id: 'who_looks_like', label: 'Hvem kommer han til å ligne mest på?', type: 'text', placeholder: 'Mamma eller Pappa?' },
  { id: 'first_word', label: 'Hva blir hans første ord?', type: 'text', placeholder: 'f.eks. Mamma/Pappa' },
  { id: 'personality', label: 'Hvilken personlighet tror du han får?', type: 'text', placeholder: 'f.eks. Rolig/Aktiv' },
  { id: 'favorite_activity', label: 'Hva kommer han til å elske å gjøre?', type: 'text', placeholder: 'f.eks. Fotball/Musikk' },
  { id: 'zodiac_trait', label: 'Hvilken stjernetegn-egenskap passer best?', type: 'text', placeholder: 'f.eks. Modig/Omtenksom' }
];



// Helper to get mission of the day
function getMission(role) {
  const dayOfYear = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
  const roleMissions = MISSIONS[role] || MISSIONS.partner;
  return roleMissions[dayOfYear % roleMissions.length];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 🪙 Coin Helper
// 🪙 Coin Helper
async function awardCoins(role, amount, reason) {
  // Pull latest v2 state
  let state = storage.get('love_auction_v2', null);

  if (!state) {
    console.warn('⚠️ No auction state found, cannot award coins');
    return;
  }

  // Update balance
  if (!state.profiles[role]) {
    state.profiles[role] = { coins: 50, weeklyEarned: 0, streak: 0 };
  }

  state.profiles[role].coins += amount;
  state.profiles[role].weeklyEarned += amount;

  // Add to ledger
  state.ledger.unshift({
    kind: 'EARN',
    profileId: role,
    amount,
    meta: { desc: reason },
    timestamp: new Date().toISOString()
  });

  // Keep ledger reasonable
  if (state.ledger.length > 50) state.ledger.pop();

  storage.set('love_auction_v2', state);
  // Note: storage.set() already syncs to cloud
  console.log(`🪙 Awarded ${amount} coins to ${role} for ${reason}`);
}

// ═══════════════════════════════════════════════════════════════
// 📄 RENDER
// ═══════════════════════════════════════════════════════════════

export function renderTogether() {
  const gameGrid = GAMES.map(game => `
    <button class="game-card" data-game="${game.id}">
      <div class="game-card-top">
        <span class="game-icon">${game.icon}</span>
        <span class="game-chip">Spill</span>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-desc">${game.description}</div>
    </button>
  `).join('');

  return `
    <div class="page-together">
      <div class="page-header-hero page-header-together">
        <h1 class="page-header-hero-title">Sammen 💗</h1>
        <p class="page-header-hero-sub">Små øyeblikk å dele med partneren din</p>
      </div>
      
      <div id="together-content">
        <div class="game-grid" id="game-grid">
          ${gameGrid}
        </div>
      </div>
      
      <!-- Game Modal -->
      <div id="game-modal" class="game-modal" style="display: none;">
        <div class="game-modal-content">
          <button class="game-modal-close" id="close-modal">✕</button>
          <div id="game-content"></div>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// 🎯 INIT & EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 🎯 INIT & EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

export function initTogether() {
  const container = document.querySelector('.page-together');
  const gameGrid = document.getElementById('game-grid');
  const modal = document.getElementById('game-modal');
  const closeBtn = document.getElementById('close-modal');

  // Portal mount: keep game modal outside scroll container to avoid fixed-position anchoring bugs
  const modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    const staleModal = modalRoot.querySelector('#game-modal');
    if (staleModal && staleModal !== modal) {
      staleModal.remove();
    }
  }
  if (modal && modalRoot) {
    modalRoot.appendChild(modal);
  }

  // Check identity
  const currentIdentity = localStorage.getItem('who_am_i');

  if (!currentIdentity) {
    if (gameGrid) gameGrid.style.display = 'none';

    // Show Identity Selection
    const contentArea = document.getElementById('together-content');
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="identity-selection text-center fade-in">
          <h2 class="heading-love mb-6">Hvem er du? 💕</h2>
          <div class="identity-buttons">
            <button class="btn btn-soft identity-btn mb-4" data-id="andrine">
              <span>👩</span>
              Jeg er Andrine
            </button>
            <button class="btn btn-soft identity-btn" data-id="partner">
              <span>👨🏾</span>
              Jeg er Yoel
            </button>
          </div>
        </div>
      `;

      // Handle selection
      contentArea.querySelectorAll('.identity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          localStorage.setItem('who_am_i', id);
          window.app.refreshCurrentPage();
        });
      });
    }
    return;
  }

  // Show Identity Badge
  const header = container.querySelector('.heading-love');
  if (header && !document.getElementById('identity-badge')) {
    const badge = document.createElement('div');
    badge.id = 'identity-badge';
    badge.className = 'identity-badge mb-6';
    badge.innerHTML = `
      <span>Logget inn som ${currentIdentity === 'andrine' ? 'Andrine 👩' : 'Yoel 👨🏾'}</span>
      <button id="switch-identity" class="btn-bytt">Bytt</button>
    `;
    header.after(badge);

    document.getElementById('switch-identity').addEventListener('click', () => {
      localStorage.removeItem('who_am_i');
      window.app.refreshCurrentPage();
    });
  }

  // Open game
  gameGrid?.addEventListener('click', (e) => {
    const card = e.target.closest('.game-card');
    if (!card) return;
    openGame(card.dataset.game);
  });

  // Close modal
  closeBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });


  // Cleanup management
  let modalCleanupStack = [];

  function closeModal() {
    // Delegate all modal visibility/scroll state to modal manager
    modalManager.close(modal);

    // Show nav bar again
    const navBar = document.getElementById('nav-bar');
    if (navBar) navBar.style.display = 'flex';

    // Execute all cleanup functions
    modalCleanupStack.forEach(fn => {
      try { fn(); } catch (e) { console.warn('Modal cleanup error:', e); }
    });
    modalCleanupStack = []; // Clear stack

    lastPartnerTapReceived = null;
    console.log('💓 Game closed, cleanup completed');
  }

  function openGame(gameId) {
    // Hide nav bar when modal is open
    const navBar = document.getElementById('nav-bar');
    if (navBar) navBar.style.display = 'none';

    const content = document.getElementById('game-content');

    // Add generic close-on-click for buttons that should explicitly exit
    modalCleanupStack.push(() => {
      // Any generic cleanup
    });

    switch (gameId) {
      case 'heartbeat':
        renderHeartbeatGame(content, modalCleanupStack);
        break;
      case 'weekly':
        renderWeeklyGame(content, modalCleanupStack);
        break;
      case 'guess':
        renderGuessGame(content, modalCleanupStack);
        break;
      case 'names':
        renderNamesGame(content, modalCleanupStack);
        break;
      case 'missions':
        renderMissions(content, modalCleanupStack);
        break;
      case 'predictions':
        renderPredictionsGame(content, modalCleanupStack);
        break;
      case 'auction':
        renderAuctionGame(content, modalCleanupStack);
        break;
      case 'naughty':
        renderNaughtyGame(content, modalCleanupStack);
        break;
    }

    // Single authority: modal manager controls visibility + scroll lock
    modalManager.open(modal);
  }
}

// ═══════════════════════════════════════════════════════════════
// 💓 GAME 1: HEARTBEAT SYNC
// ═══════════════════════════════════════════════════════════════

let heartbeatPollInterval = null;
let lastPartnerTapReceived = null;

function renderHeartbeatGame(container, cleanupStack) {
  const role = localStorage.getItem('who_am_i') || 'andrine';

  container.innerHTML = `
    <div class="text-center" style="display: flex; flex-direction: column; min-height: 100%; padding-top: 20px;">
      <div style="flex: 0 0 auto;">
        <h2 class="heading-section mb-2">Hjerteslag 💓</h2>
        <p class="text-warm mb-4">Trykk for å sende et dunk til ${role === 'andrine' ? 'Yoel 👨🏾' : 'Andrine 👩'}.</p>
      </div>

      <div class="heartbeat-area" style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 200px;">
        <span id="heart-icon" class="heart-pulse reveal-emoji-big">💗</span>
      </div>

      <div style="flex: 0 0 auto; margin-bottom: 16px;">
        <div id="heart-status" class="text-muted mb-4 text-sm">Ser etter partner...</div>
        <button class="btn btn-primary btn-block" id="tap-heart" style="min-height: 100px;">
          Send hjertebank 💕
        </button>
      </div>
    </div>
  `;

  const heart = document.getElementById('heart-icon');
  const status = document.getElementById('heart-status');
  const tapBtn = document.getElementById('tap-heart');

  function pulse() {
    heart.classList.add('beat');
    setTimeout(() => heart.classList.remove('beat'), 150);
    if (navigator.vibrate) navigator.vibrate(50);
  }

  // Polling loop
  const statusInterval = setInterval(() => {
    const isOnline = window.app.isPartnerOnline();
    if (status) {
      status.textContent = isOnline
        ? `${role === 'andrine' ? 'Yoel' : 'Andrine'} er pålogget 🟢`
        : 'Partner er ikke pålogget ⚪';
    }
  }, 5000);

  cleanupStack.push(() => clearInterval(statusInterval));

  if (!tapBtn) {
    console.error('❌ Tap button not found! DOM:', document.getElementById('tap-heart'));
    return;
  }

  console.log('✅ Heartbeat initialized, button found:', tapBtn);

  tapBtn.addEventListener('click', async () => {
    console.log('💓 Heart button clicked!');

    try {
      pulse();
      if (window.app?.triggerHeartbeat) window.app.triggerHeartbeat();
      const response = await fetch(`${window.API_BASE}/api/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, tap: true })
      });
      if (response.ok && status) {
        status.textContent = '💕 Sendt!';
        setTimeout(() => {
          if (status) status.textContent = window.app?.isPartnerOnline?.()
            ? `${role === 'andrine' ? 'Yoel' : 'Andrine'} er pålogget 🟢`
            : 'Partner er ikke pålogget ⚪';
        }, 2000);
      }
    } catch (err) {
      if (status) status.textContent = '⚠️ Ikke tilkoblet – prøv igjen';
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// 💬 GAME 2: US, THIS WEEK
// ═══════════════════════════════════════════════════════════════

function renderWeeklyGame(container) {
  const weekNum = getWeekNumber();
  const question = WEEKLY_QUESTIONS[weekNum % WEEKLY_QUESTIONS.length];
  const storageKey = `weekly_${weekNum}`;
  const answers = storage.get(storageKey, { andrine: null, partner: null });
  const settings = storage.get('settings') || {};
  const anName = settings.name || 'Andrine';
  const paName = settings.partnerName || 'Yoel';

  const bothAnswered = answers.andrine && answers.partner;

  container.innerHTML = `
    <div class="text-center">
      <h2 class="heading-section mb-2">Oss, Denne Uken 💬</h2>
      <p class="text-warm mb-8">"${question}"</p>
      
      ${bothAnswered ? `
        <div class="answers-reveal fade-in">
          <div class="card card-soft mb-6 text-left">
            <p class="text-tiny mb-2" style="color: var(--pink-600);">${anName}</p>
            <p class="heading-card">"${answers.andrine}"</p>
          </div>
          <div class="card card-glass text-left">
            <p class="text-tiny mb-2" style="color: var(--pink-600);">${paName}</p>
            <p class="heading-card">"${answers.partner}"</p>
          </div>
        </div>
      ` : `
        <div class="card card-warm mb-6">
          <textarea 
            class="textarea weekly-textarea" 
            id="weekly-answer" 
            placeholder="Skriv dine tanker her..."
          ></textarea>
        </div>
        
        <button class="btn btn-primary btn-block mb-8" id="save-answer">
          Lagre Svar
        </button>
        
        <div class="locked-state-card">
          <div class="locked-emoji">🔒</div>
          <p class="text-tiny opacity-70 mb-2">Svarene avsløres kun når begge har svart</p>
          <div class="flex justify-center gap-4">
            <span class="badge ${answers.andrine ? 'badge-success' : 'badge-soft'}">${answers.andrine ? `✓ ${anName} klar` : `${anName} tenker...`}</span>
            <span class="badge ${answers.partner ? 'badge-success' : 'badge-soft'}">${answers.partner ? `✓ ${paName} klar` : `${paName} tenker...`}</span>
          </div>
        </div>
      `}
    </div>
  `;

  if (!bothAnswered) {
    document.getElementById('save-answer')?.addEventListener('click', () => {
      const answer = document.getElementById('weekly-answer')?.value?.trim();
      const identity = localStorage.getItem('who_am_i') || 'andrine'; // 'andrine' or 'partner'

      if (answer) {
        answers[identity] = answer;
        storage.set(storageKey, answers);
        storage.syncWithCloud({ only: [storageKey] });

        // Award coins if both answered
        if (answers.andrine && answers.partner) {
          // Check if already awarded for this week
          const awardKey = `weekly_coins_${weekNum}`;
          if (!storage.get(awardKey, false)) {
            awardCoins(identity === 'andrine' ? 'partner' : 'andrine', 20, 'Ukens Spørsmål'); // Award the OTHER person usually? Or both?
            // Actually let's award BOTH.
            awardCoins('andrine', 20, 'Ukens Spørsmål');
            awardCoins('partner', 20, 'Ukens Spørsmål');
            storage.set(awardKey, true);
          }
        }

        renderWeeklyGame(container);
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 🤍 GAME 3: GUESS WHAT I'M THINKING
// ═══════════════════════════════════════════════════════════════

function renderGuessGame(container) {
  const gameState = storage.get('mood_guess_today', { date: null, mood: null, guess: null });
  const today = new Date().toDateString();

  // Reset if new day
  if (gameState.date !== today) {
    gameState.date = today;
    gameState.mood = null;
    gameState.guess = null;
    storage.set('mood_guess_today', gameState);
  }

  // Phase 1: Andrine picks mood (hidden from partner)
  const currentIdentity = localStorage.getItem('who_am_i') || 'andrine';

  // If Andrine hasn't picked yet
  if (!gameState.mood) {
    if (currentIdentity === 'partner') {
      container.innerHTML = `
        <div class="text-center">
          <h2 class="heading-section mb-4">Venter på Andrine... ⏳</h2>
          <p class="text-muted">Hun velger humøret sitt nå.</p>
        </div>
      `;
      setTimeout(async () => { await storage.pullFromCloud({ skipCelebration: true }); renderGuessGame(container); }, 5000);
      return;
    }

    container.innerHTML = `
      <div class="text-center">
        <h2 class="heading-section mb-2">Gjett Humøret 🤍</h2>
        <p class="text-warm mb-6">Andrine: Velg hvordan du føler deg akkurat nå.<br>Gi så telefonen til partneren din.</p>
        
        <div class="mood-grid" id="mood-select">
          ${MOODS.map(m => `
            <button class="mood-btn" data-mood="${m}">${m}</button>
          `).join('')}
        </div>
      </div>
    `;

    document.querySelectorAll('#mood-select .mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        gameState.mood = btn.dataset.mood;
        storage.set('mood_guess_today', gameState);
        storage.syncWithCloud({ only: ['mood_guess_today'] });
        renderGuessGame(container);
      });
    });
    return;
  }

  // Phase 2: Partner guesses
  if (!gameState.guess) {
    if (currentIdentity === 'andrine') {
      container.innerHTML = `
        <div class="text-center">
          <h2 class="heading-section mb-4">Venter på Yoel... ⏳</h2>
          <p class="text-muted">Han gjetter humøret ditt nå.</p>
        </div>
      `;
      setTimeout(async () => { await storage.pullFromCloud({ skipCelebration: true }); renderGuessGame(container); }, 5000);
      return;
    }

    container.innerHTML = `
      <div class="text-center">
        <h2 class="heading-section mb-2">Partners Tur 🤍</h2>
        <p class="text-warm mb-6">Hvordan tror du Andrine føler seg akkurat nå?</p>
        
        <div class="mood-grid" id="mood-guess">
          ${MOODS.map(m => `
            <button class="mood-btn" data-mood="${m}">${m}</button>
          `).join('')}
        </div>
      </div>
    `;

    document.querySelectorAll('#mood-guess .mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        gameState.guess = btn.dataset.mood;
        storage.set('mood_guess_today', gameState);
        storage.syncWithCloud({ only: ['mood_guess_today'] });
        storage.addToCollection('mood_guesses', {
          date: today,
          actual: gameState.mood,
          guess: gameState.guess
        });
        renderGuessGame(container);
      });
    });
    return;
  }

  // Phase 3: Reveal
  const correct = gameState.mood === gameState.guess;
  const guessAwardKey = `guess_coins_${today}`;
  if (!storage.get(guessAwardKey, false)) {
    awardCoins('andrine', 10, 'Gjett Humøret');
    awardCoins('partner', 10, 'Gjett Humøret');
    storage.set(guessAwardKey, true);
  }
  container.innerHTML = `
    <div class="text-center">
      <div class="reveal-animation">
        <div class="reveal-emoji-big">${gameState.mood}</div>
        <p class="heading-love mb-6">${correct ? 'Du klarte det! 💗' : 'Nesten — hun føler seg sett ✨'}</p>
      </div>
      
      <div class="guess-comparison mb-8">
        <div class="guess-item">
          <p class="text-muted text-tiny mb-2">Andrine følte</p>
          <span class="history-emoji">${gameState.mood}</span>
        </div>
        <div class="guess-item">
          <p class="text-muted text-tiny mb-2">Du gjettet</p>
          <span class="history-emoji">${gameState.guess}</span>
        </div>
      </div>
      
      <button class="btn btn-soft btn-block" onclick="this.textContent='Ses i morgen! ✨'">
        Spill Igjen I Morgen
      </button>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// 🍼 GAME 4: NAME VIBES
// ═══════════════════════════════════════════════════════════════

// State tracking to prevent flickering
let lastRenderedState = { name: null, waiting: null, finished: null };
let pendingMatch = null; // Track name that just matched

function renderNamesGame(container, cleanupStack) {
  const votes = storage.get('name_votes', {});
  const customNames = storage.get('custom_names', []);
  const allNames = [...DEFAULT_NAMES, ...customNames];

  // Use global identity
  const currentPlayer = localStorage.getItem('who_am_i') || 'andrine';
  const partnerRole = currentPlayer === 'andrine' ? 'partner' : 'andrine';

  // Check if any name just became a match (both voted love)
  const matches = storage.get('matched_names', []);

  // Silently save any matches found in votes WITHOUT showing modal
  // This prevents spam after cloud pulls restore old matches
  const allMatchedInVotes = allNames.filter(name => {
    const v = votes[name] || {};
    return v.andrine === 'love' && v.partner === 'love';
  });
  let silentlyAdded = false;
  allMatchedInVotes.forEach(name => {
    if (!matches.includes(name) && name !== pendingMatch) {
      matches.push(name);
      silentlyAdded = true;
    }
  });
  if (silentlyAdded) {
    storage.set('matched_names', matches, true); // skipSync
  }

  // Only show match modal if pendingMatch is set (THIS session cast deciding vote)
  if (pendingMatch && matches.includes(pendingMatch)) {
    const matchToShow = pendingMatch;
    setTimeout(() => {
      showMatchOverlay(matchToShow);
      setTimeout(() => {
        pendingMatch = null;
        renderNamesGame(container, cleanupStack);
      }, 2500);
    }, 100);
    return;
  }

  // Find the first name that is NOT fully completed (both voted)
  const currentName = allNames.find(name => {
    const v = votes[name] || {};
    return !v.andrine || !v.partner;
  });

  const isFinished = !currentName;
  const hasVoted = currentName && votes[currentName] && votes[currentName][currentPlayer];
  const safeCurrentName = escapeHtml(currentName || '');

  // Check if state actually changed to avoid re-rendering DOM
  const newState = { name: currentName, waiting: hasVoted, finished: isFinished };

  // If we are already rendering this state, DO NOT touch the DOM (prevents flicker)
  // We only re-render if:
  // 1.Name changed
  // 2. We moved from voting -> waiting (or vice versa)
  // 3. We finished
  if (lastRenderedState.name === newState.name &&
    lastRenderedState.waiting === newState.waiting &&
    lastRenderedState.finished === newState.finished &&
    document.getElementById('name-game-container')) {
    return;
  }

  // Update state cache
  lastRenderedState = newState;

  const content = `
    <div class="text-center" id="name-game-container">
      <div class="header-row mb-4">
        <h2 class="heading-section">Navnelek 🍼</h2>
        <button class="btn-text text-small underline" id="view-results">Se Resultater 📜</button>
      </div>
      
      ${!isFinished ? `
        ${hasVoted ? `
          <!-- WAITING STATE -->
          <div class="waiting-card fade-in">
            <div class="spinner mb-4">⏳</div>
            <h3 class="heading-love mb-4">Venter på ${partnerRole === 'andrine' ? 'Andrine' : 'Yoel'}...</h3>
            <p class="text-muted mb-6">Du har stemt på <strong>${safeCurrentName}</strong>.</p>
            <p class="text-warm">Gi beskjed til partneren din!</p>
            
            <button class="btn btn-soft btn-block mt-8" id="check-sync">
              Sjekk igjen 🔄
            </button>
          </div>
        ` : `
          <!-- VOTING STATE -->
          <div class="name-card mb-8 fade-in" id="name-card">
            <span class="name-text">${safeCurrentName}</span>
          </div>
          
          <div class="swipe-buttons">
            <button class="swipe-btn nope" data-vote="nope" data-name="${safeCurrentName}">
              <span>❌</span>
              <small>Nei</small>
            </button>
            <button class="swipe-btn maybe" data-vote="maybe" data-name="${safeCurrentName}">
              <span>😐</span>
              <small>Kanskje</small>
            </button>
            <button class="swipe-btn love" data-vote="love" data-name="${safeCurrentName}">
              <span>💗</span>
              <small>Elsker</small>
            </button>
          </div>
        `}
      ` : `
        <!-- FINISHED STATE -->
        <div class="finished-card fade-in">
          <p class="heading-love mb-4">Dere er ferdige! 🎉</p>
          <p class="text-muted mb-6">Ingen flere navn igjen.</p>
          
          <button class="btn btn-soft btn-block mb-3" id="add-name-btn">
            Legg Til Flere Navn
          </button>
          <button class="btn btn-primary btn-block" id="view-results-main">
            Se Resultater
          </button>
        </div>
      `}
      
      <div id="add-name-form" style="display: none;" class="mt-6">
        <input type="text" class="textarea mb-2" id="new-name-input" placeholder="Skriv inn et navn..." style="min-height: auto;">
        <button class="btn btn-primary btn-block" id="save-new-name">Legg til</button>
      </div>

      <!-- Presence Indicator -->
      <div id="presence-indicator" class="presence-badge ${currentPlayer === 'andrine' ? 'partner-status' : 'andrine-status'} mt-8 fade-in">
        <span class="status-dot">⚪</span>
        <span class="status-text">Venter på partner...</span>
      </div>
    </div>
  `;

  container.innerHTML = content;

  // Vote handlers
  document.querySelectorAll('.swipe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const vote = btn.dataset.vote;
      const card = document.getElementById('name-card');

      // Animate card
      if (vote === 'love') {
        card?.classList.add('swipe-right');
      } else if (vote === 'nope') {
        card?.classList.add('swipe-left');
      }

      // Save vote
      if (!votes[name]) votes[name] = {};
      votes[name][currentPlayer] = vote;
      storage.set('name_votes', votes);

      // If THIS vote created a match, set pendingMatch so modal shows
      const partnerVote = votes[name][partnerRole];
      if (vote === 'love' && partnerVote === 'love') {
        pendingMatch = name;
      }

      const namesTimeout = setTimeout(() => {
        renderNamesGame(container, cleanupStack);
      }, 300);
      cleanupStack.push(() => clearTimeout(namesTimeout));
    });
  });

  // Event Listeners
  document.getElementById('view-results')?.addEventListener('click', () => renderNameStats(container, cleanupStack));
  document.getElementById('view-results-main')?.addEventListener('click', () => renderNameStats(container, cleanupStack));

  document.getElementById('check-sync')?.addEventListener('click', async () => {
    // FORCE A FULL SYNC (Push + Pull) to heal any lost data
    const btn = document.getElementById('check-sync');
    if (btn) btn.textContent = 'Synkroniserer... 🔄';

    await storage.syncWithCloud({ only: ['name_votes', 'matched_names', 'custom_names'] });
    await storage.pullFromCloud({ skipCelebration: true });

    // Clear rendering cache to force fresh render
    lastRenderedState = { name: null, waiting: null, finished: null };
    pendingMatch = null;

    renderNamesGame(container, cleanupStack);
  });

  document.getElementById('add-name-btn')?.addEventListener('click', () => {
    document.getElementById('add-name-form').style.display = 'block';
  });

  document.getElementById('save-new-name')?.addEventListener('click', () => {
    const input = document.getElementById('new-name-input');
    const name = input?.value?.trim();
    if (name && !allNames.includes(name)) {
      customNames.push(name);
      storage.set('custom_names', customNames);
      input.value = '';
      renderNamesGame(container, cleanupStack);
    }
  });

  // Start Presence Heartbeat
  const currentIdentity = localStorage.getItem('who_am_i') || 'andrine';
  startPresenceHeartbeat(currentIdentity, container, cleanupStack);
}

// Tinder-style match overlay animation
function showMatchOverlay(matchedName) {
  // Haptic celebration
  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'match-overlay';
  overlay.innerHTML = `
    <div class="match-content">
      <h1 class="match-title">Det er en match! 💕</h1>
      <div class="match-name">${escapeHtml(matchedName)}</div>
      <p class="match-subtitle">Dere elsker begge dette navnet!</p>
    </div>
  `;

  // Add to modal content
  const modalContent = document.querySelector('.game-modal-content');
  if (modalContent) {
    modalContent.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });

    // Remove after animation
    setTimeout(() => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    }, 2200);
  }
}

function renderNameStats(container, cleanupStack) {
  const votes = storage.get('name_votes', {});
  const customNames = storage.get('custom_names', []);
  const allNames = [...DEFAULT_NAMES, ...customNames];
  const identity = localStorage.getItem('who_am_i') || 'andrine';

  // 1. Matches (Both Love)
  const matches = allNames.filter(name =>
    votes[name]?.andrine === 'love' && votes[name]?.partner === 'love'
  );

  // 2. Maybes (At least one love/maybe pairings that aren't matches)
  const maybes = allNames.filter(name => {
    if (matches.includes(name)) return false;
    const v = votes[name];
    if (!v) return false;
    // Check if both have voted positively (love or maybe)
    const posA = v.andrine === 'love' || v.andrine === 'maybe';
    const posB = v.partner === 'love' || v.partner === 'maybe';
    return posA && posB;
  });

  // 3. My Loves (that partner hasn't loved yet or said no to)
  const myLoves = allNames.filter(name => {
    if (matches.includes(name)) return false;
    return votes[name]?.[identity] === 'love';
  });

  container.innerHTML = `
    <div class="stats-page fade-in">
      <div class="header-row mb-6">
        <button class="btn-text btn-back-arrow" id="back-to-game">←</button>
        <h2 class="heading-section">Resultater 📜</h2>
      </div>

      <div class="stats-section mb-10">
        <h3 class="heading-love mb-4">Vi Elsker! 💗</h3>
        ${matches.length ? `
          <div class="tag-cloud">
            ${matches.map(n => `<span class="tag match">${escapeHtml(n)}</span>`).join('')}
          </div>
        ` : `<p class="text-muted text-center">Ingen fulltreffere ennå...</p>`}
      </div>

      <div class="stats-section mb-10">
        <h3 class="heading-love mb-4 text-primary">Kanskje-listen 🤔</h3>
        <p class="text-muted mb-4 text-small">Navn vi begge liker litt</p>
        ${maybes.length ? `
          <div class="tag-cloud">
            ${maybes.map(n => `<span class="tag maybe">${escapeHtml(n)}</span>`).join('')}
          </div>
        ` : `<p class="text-muted text-center">Ingenting her ennå.</p>`}
      </div>

      <div class="stats-section">
        <h3 class="heading-love mb-4 text-primary">Mine Favoritter 👤</h3>
        <p class="text-muted mb-4 text-small">Navn jeg elsker (men vi ikke har matchet på)</p>
        ${myLoves.length ? `
          <div class="tag-cloud">
            ${myLoves.map(n => `<span class="tag mine">${escapeHtml(n)}</span>`).join('')}
          </div>
        ` : `<p class="text-muted text-center">Du har ikke favorittmarkert noen andre navn.</p>`}
      </div>

      <!-- Reset Button -->
      <div class="mt-10 pt-6" style="border-top: 1px solid rgba(255,143,171,0.2);">
        <button class="btn btn-ghost btn-block" id="reset-votes" style="color: rgba(255,143,171,0.7);">
          🔄 Start på nytt
        </button>
        <p class="text-xs text-muted text-center mt-2">Nullstiller alle stemmer</p>
      </div>
    </div>
  `;

  document.getElementById('back-to-game')?.addEventListener('click', () => {
    renderNamesGame(container, cleanupStack);
  });

  document.getElementById('reset-votes')?.addEventListener('click', async () => {
    const confirmed = confirm('Er du sikker på at du vil nullstille alle stemmer? Dette kan ikke angres!');
    if (!confirmed) return;

    // Clear all votes, matches, AND custom names
    storage.set('name_votes', {}, true);
    storage.set('matched_names', [], true);
    storage.set('custom_names', [], true);
    pendingMatch = null;

    const resetEpoch = Date.now();
    localStorage.setItem('bumpy:name_votes_epoch', String(resetEpoch));
    await storage.syncWithCloud({
      only: ['name_votes', 'matched_names', 'custom_names'],
      resetNameVotes: true,
      nameVotesEpoch: resetEpoch,
    });
    localStorage.setItem('bumpy:skip_pull', 'true');

    // Show feedback
    const btn = document.getElementById('reset-votes');
    if (btn) {
      btn.textContent = '✅ Nullstilt!';
      btn.disabled = true;
    }

    // Return to game after 1 second
    setTimeout(() => {
      renderNamesGame(container, cleanupStack);
    }, 1000);
  });
}

// ═══════════════════════════════════════════════════════════════
// 💌 GAME 5: LOVE MISSIONS
// ═══════════════════════════════════════════════════════════════

function renderMissions(container) {
  const role = localStorage.getItem('who_am_i') || 'andrine';
  const mission = getMission(role);
  const today = new Date().toDateString();
  const completed = storage.get(`mission_completed_${today}`, false);

  container.innerHTML = `
    <div class="text-center">
      <h2 class="heading-love mb-4">Dagens Oppdrag 💌</h2>
      <p class="text-muted mb-8">En liten ting du kan gjøre for ${role === 'andrine' ? 'Yoel 👨🏾‍🚀' : 'Andrine 👩'} i dag.</p>
      
      <div class="card card-soft mb-8">
        <div class="game-chip mb-4">Mål for dagen</div>
        <p class="heading-card mb-4 mission-text">"${mission}"</p>
        ${completed ? '<span class="text-love font-bold">✓ Fullført med kjærlighet!</span>' : ''}
      </div>

      ${!completed ? `
        <button class="btn btn-primary btn-block" id="complete-mission">
          Jeg har gjort det! ✨
        </button>
      ` : `
        <div class="animate-heartbeat reveal-emoji-big">❤️</div>
        <p class="text-warm italic">Godt jobba! Din omtanke betyr alt. ❤️</p>
      `}
    </div>
  `;

  document.getElementById('complete-mission')?.addEventListener('click', () => {
    storage.set(`mission_completed_${today}`, true);
    awardCoins(role, 15, 'Dagens Oppdrag');
    storage.syncWithCloud({ only: [`mission_completed_${today}`] });
    renderMissions(container);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  });
}

// ═══════════════════════════════════════════════════════════════
// 🎲 GAME 6: BABY PREDICTIONS
// ═══════════════════════════════════════════════════════════════

function renderPredictionsGame(container) {
  const role = localStorage.getItem('who_am_i') || 'andrine';
  const predictions = storage.get('baby_predictions', { andrine: {}, partner: {} });
  const myPredictions = predictions[role] || {};

  container.innerHTML = `
    <div class="text-center">
      <h2 class="heading-section mb-2">Gjettelek 🎲</h2>
      <p class="text-muted mb-10">Hva tror du om fremtiden? Dine gjetninger lagres i hvelvet.</p>
      
      <div class="prediction-form text-left">
        ${PREDICTION_QUESTIONS.map(q => `
          <div class="mb-8">
            <label class="text-tiny mb-2 d-block">${q.label}</label>
            <input 
              type="${q.type}" 
              class="textarea p-2" 
              id="pred-${q.id}" 
              placeholder="${q.placeholder || ''}" 
              value="${myPredictions[q.id] || ''}"
            >
          </div>
        `).join('')}
        
        <button class="btn btn-primary btn-block mb-4" id="save-predictions">
          Lagre i Hvelvet 🔒
        </button>
        <button class="btn btn-soft btn-block" id="view-vault">
          Se alle gjetninger 👀
        </button>
      </div>
    </div>
  `;

  document.getElementById('save-predictions')?.addEventListener('click', () => {
    PREDICTION_QUESTIONS.forEach(q => {
      const val = document.getElementById(`pred-${q.id}`).value;
      myPredictions[q.id] = val;
    });
    predictions[role] = myPredictions;
    storage.set('baby_predictions', predictions);
    storage.syncWithCloud({ only: ['baby_predictions'] });

    container.innerHTML = `
      <div class="text-center fade-in">
        <div class="reveal-emoji-big">🔒</div>
        <h2 class="heading-love mb-4">Lagret!</h2>
        <p class="text-warm mb-6">Dine gjetninger er trygt lagret. Vi sjekker dem når den lille kommer!</p>
        <button class="btn btn-soft btn-block" id="back-to-together">Ferdig</button>
      </div>
    `;

    document.getElementById('back-to-together')?.addEventListener('click', () => {
      document.getElementById('close-modal')?.click();
    });
  });

  document.getElementById('view-vault')?.addEventListener('click', async () => {
    await storage.pullFromCloud({ skipCelebration: true });
    renderVault(container);
  });
}

function renderVault(container) {
  const predictions = storage.get('baby_predictions', { andrine: {}, partner: {} });

  container.innerHTML = `
    <div class="text-center">
      <h2 class="heading-love mb-2">Babyhvelvet 🔒✨</h2>
      <p class="text-muted mb-8 text-small">Våre gjetninger om den lille</p>
      
      <div class="vault-grid">
        ${PREDICTION_QUESTIONS.map(q => `
          <div class="card vault-card mb-6 text-left">
            <p class="vault-label">${q.label}</p>
            <div class="flex gap-4">
              <div class="flex-1">
                <span class="text-tiny opacity-50">Andrine</span>
                <p class="vault-value">${predictions.andrine?.[q.id] || '---'}</p>
              </div>
              <div class="flex-1 border-l border-pink-100 pl-4">
                <span class="text-tiny opacity-50">Yoel</span>
                <p class="vault-value">${predictions.partner?.[q.id] || '---'}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <button class="btn btn-soft btn-block mt-4" id="back-to-predictions">Tilbake</button>
    </div>
  `;
  document.getElementById('back-to-predictions')?.addEventListener('click', () => {
    renderPredictionsGame(container);
  });
}

// ═══════════════════════════════════════════════════════════════
// 💸 GAME 7: LOVE AUCTION
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 💸 GAME 7: LOVE AUCTION V2
// ═══════════════════════════════════════════════════════════════

const SEED_ITEMS = [
  // KOS & RELAX (Cheap/Medium)
  { id: 'item_back_massage', title: '15 min Ryggmassasje', desc: 'Du gir en god og avslappende massasje.', cost: 15, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_foot_massage', title: 'Fotmassasje', desc: '10 minutter med full fokus på slitne føtter.', cost: 15, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_head_scratch', title: 'Hodebunnskos', desc: '5 minutter med ren nytelse.', cost: 10, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_scratch_back', title: 'Kile på ryggen', desc: 'Lett kiling/kløing til man sovner.', cost: 10, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_movie_pick', title: 'Velg Filmkveld 🎬', desc: 'Du bestemmer kveldens film (ingen veto).', cost: 30, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_series_ep', title: 'Én episode til', desc: 'Vi ser en episode til, selv om det er sent.', cost: 10, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_back_scratch_20', title: '20 min Rygge-kløing 😌', desc: 'Perfekt for kos.', cost: 35, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_game_night', title: 'Spillkveld av Ditt Valg 🎮', desc: 'Brett- eller videospill!', cost: 45, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_music_choice', title: 'Velg Musikk i Bilen 🎵', desc: 'Full kontroll på spillelisten!', cost: 25, category: 'Kos', payer: 'BEGGE' },

  // MAT & CRAVINGS
  { id: 'item_breakfast_bed', title: 'Frokost på senga', desc: 'Luksusstart på dagen servert av partner.', cost: 50, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_dinner_chef', title: 'Du lager middag', desc: 'Partneren slipper å løfte en finger.', cost: 20, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_water_fetch', title: 'Hente vann', desc: 'Hent iskaldt vann til meg (når som helst).', cost: 5, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_snack_run', title: 'Snack Levering', desc: 'Gå og hent cravings fra butikken/skapet.', cost: 15, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_coffee_bed', title: 'Kaffe på senga', desc: 'Nylaget kaffe servert før man står opp.', cost: 10, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_pizza_night', title: 'Pizza-kveld', desc: 'Vi bestiller pizza (spleisepott).', cost: 30, category: 'Mat', payer: 'BEGGE', requiresBoth: true, requiresBothConfirm: true },
  { id: 'item_takeout', title: 'Takeaway etter Eget Valg 🍕', desc: 'Bestill akkurat det du vil ha!', cost: 70, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_dessert', title: 'Hjemmelaget Dessert 🍰', desc: 'Partneren baker din favoritt.', cost: 55, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_champagne_breakfast', title: 'Champagne-frokost 🥂', desc: 'Luksus morgen for dere begge.', cost: 120, category: 'Mat', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_weekend_brunch', title: 'Weekend Brunch-laging 🍳', desc: 'Lag stor brunch sammen!', cost: 95, category: 'Mat', payer: 'BEGGE', requiresBoth: true },

  // DATE & ROMANTIKK
  { id: 'item_date_night_luxury', title: 'Luksus Date Night ✨', desc: 'Begge må være med på denne!', cost: 150, category: 'Date', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_date_night', title: 'Date Night', desc: 'Barnevakt (eller hjemmedate) med full fokus.', cost: 50, category: 'Date', payer: 'BEGGE', requiresBoth: true, requiresBothConfirm: true },
  { id: 'item_walk_together', title: 'Gåtur sammen', desc: '30 min luftetur hånd i hånd.', cost: 15, category: 'Date', payer: 'BEGGE' },
  { id: 'item_board_games', title: 'Brettspillkveld', desc: 'Vi legger bort mobilen og spiller.', cost: 20, category: 'Date', payer: 'BEGGE' },
  { id: 'item_cinema', title: 'Kinotur', desc: 'Vi drar på kino (du spanderer billettene).', cost: 60, category: 'Date', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_mini_date', title: 'Minidate hjemme', desc: 'Levende lys og god musikk i stua.', cost: 25, category: 'Date', payer: 'BEGGE' },
  { id: 'item_photo_shoot', title: 'Par-Fotoshoot 📷', desc: 'Lag fine minner sammen!', cost: 180, category: 'Date', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_stargazing', title: 'Stjernekikking-date 🌟', desc: 'Ute eller på balkongen.', cost: 85, category: 'Date', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_coffee_date_out', title: 'Kaffe-date ute ☕', desc: 'Koselig tur til favorittcaféen.', cost: 65, category: 'Date', payer: 'BEGGE', requiresBoth: true },

  // HJELP & PRAKTISK
  { id: 'item_dishes', title: 'Ta oppvasken', desc: 'Du tar alt oppvasken i dag.', cost: 20, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_trash_out', title: 'Gå ut med søpla', desc: 'Du tar søpla, uten å klage.', cost: 10, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_diaper_free', title: '1 bleie-fritak', desc: 'Slipp unna én bæsjebleie (fremtidig).', cost: 15, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_kitchen_clean', title: 'Rydd kjøkkenet', desc: 'Shine kjøkkenet mens jeg slapper av.', cost: 20, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_laundry_fold', title: 'Brette klær', desc: 'Du bretter stativet som står fremme.', cost: 20, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_sleep_in', title: 'Sove lenge', desc: 'Du står opp, jeg sover til 10:00.', cost: 40, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_chore_pass', title: 'Slipp unna Oppvask 🧼', desc: 'Et "get out of jail" kort for kjedelig arbeid.', cost: 40, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_lazy_day', title: 'Ingen Forventninger-dag 😴', desc: 'Dagen din, null stress!', cost: 90, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_no_phone', title: 'Telefonfri Kveld 📵', desc: 'Bare dere to, ingen skjermer.', cost: 110, category: 'Hjelp', payer: 'BEGGE', requiresBoth: true },

  // OVERRASKELSER & GAVER
  { id: 'item_small_gift', title: 'Liten gave', desc: 'Noe smått jeg ønsker meg (maks 100kr).', cost: 30, category: 'Overraskelse', payer: 'BEGGE' },
  { id: 'item_surprise_gift', title: 'Liten Overraskelse 🎁', desc: 'Partneren din må kjøpe noe lite (under 100,-).', cost: 80, category: 'Overraskelse', payer: 'BEGGE' },
  { id: 'item_flowers', title: 'Blomster', desc: 'En fin bukett på døra eller bordet.', cost: 35, category: 'Overraskelse', payer: 'BEGGE' },
  { id: 'item_chocolate', title: 'Sjokoladeplate', desc: 'Min favorittsjokolade.', cost: 15, category: 'Overraskelse', payer: 'BEGGE' },
  { id: 'item_love_letter', title: 'Kjærlighetsbrev', desc: 'Et håndskrevet kort/brev fra deg.', cost: 20, category: 'Overraskelse', payer: 'BEGGE' },

  // SPA & VELVÆRE
  { id: 'item_massage_15', title: '15 min Massasje 💆‍♀️', desc: 'Valgfritt område!', cost: 60, category: 'Velvære', payer: 'BEGGE' },
  { id: 'item_spa_night', title: 'Hjemmespa-kveld 🧼', desc: 'Ansiktsmasker og hygge.', cost: 100, category: 'Velvære', payer: 'BEGGE', requiresBoth: true },

  // PARENT PREP (Baby)
  { id: 'item_baby_name_veto', title: 'Navn Veto-kort', desc: 'Jeg kan legge ned veto mot ett navneforslag.', cost: 50, category: 'Baby', payer: 'BEGGE' },
  { id: 'item_name_truce', title: 'Navne-fred 🍼', desc: 'Ingen krangling om favorittnavn i 24t.', cost: 200, category: 'Baby', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_pack_bag', title: 'Pakke Fødebag', desc: 'Vi pakker bagen sammen i kveld.', cost: 15, category: 'Baby', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_belly_oil', title: 'Smøre magen', desc: 'Olje/krem på magen med massasje.', cost: 10, category: 'Baby', payer: 'BEGGE' },
  { id: 'item_playlist', title: 'Føde-spilleliste', desc: 'Du lager en liste med sanger til fødselen.', cost: 20, category: 'Baby', payer: 'BEGGE' }
];

const SEED_AUCTION_REWARDS = [
  { id: 'auc_full_massage', title: '60 min Full Kroppsmassasje', desc: 'Den ultimate spaopplevelsen hjemme.', startPrice: 40, minIncrement: 5, category: 'Luksus' },
  { id: 'auc_remote_master', title: 'Master of Remote', desc: 'Full kontroll over TV-en en hel kveld.', startPrice: 20, minIncrement: 2, category: 'Makt' },
  { id: 'auc_weekend_off', title: 'Helg uten planer', desc: 'Vi sier nei til alt og bare er hjemme.', startPrice: 50, minIncrement: 10, category: 'Frihet' },
  { id: 'auc_yes_day', title: 'Ja-dag', desc: 'Du må si ja til (nesten) alt jeg foreslår.', startPrice: 80, minIncrement: 10, category: 'Makt' },
  { id: 'auc_fancy_dinner', title: '3-retters middag', desc: 'Du lager forrett, hovedrett og dessert.', startPrice: 60, minIncrement: 5, category: 'Mat' },
  { id: 'auc_free_pass', title: 'Fri-kort', desc: 'Slipp unna en valgfri kjedelig oppgave.', startPrice: 30, minIncrement: 5, category: 'Frihet' },
  { id: 'auc_breakfast_week', title: 'Frokost-uke', desc: 'Du lager frokost hver dag i en uke.', startPrice: 70, minIncrement: 10, category: 'Mat' },
  { id: 'auc_chauffeur', title: 'Privatsjåfør', desc: 'Du kjører og henter meg hvor som helst en kveld.', startPrice: 25, minIncrement: 5, category: 'Praktisk' },
  { id: 'auc_tech_free', title: 'Teknologifri kveld', desc: 'Ingen skjermer, bare oss i 4 timer.', startPrice: 40, minIncrement: 5, category: 'Kos' },
  { id: 'auc_baby_morning', title: '3 x Morgenskift', desc: 'Jeg tar de tre første morgenene med babyen.', startPrice: 90, minIncrement: 10, category: 'Baby' },
  { id: 'auc_chef_week', title: 'Personal Chef-uke', desc: 'Jeg lager middag hele uken.', startPrice: 100, minIncrement: 10, category: 'Mat' },
  { id: 'auc_clean_month', title: 'Månedlig Storrengjøring', desc: 'Jeg tar hovedrengjøringen én gang.', startPrice: 80, minIncrement: 10, category: 'Praktisk' },
  { id: 'auc_spa_package', title: 'Hjemme-spa Pakke', desc: 'Bad, massasje, ansiktsmaske - alt sammen.', startPrice: 120, minIncrement: 15, category: 'Luksus' },
  { id: 'auc_night_owl', title: 'Nattevakt-pass', desc: '3 netter hvor jeg tar alt med babyen.', startPrice: 150, minIncrement: 20, category: 'Baby' },
  { id: 'auc_adventure_day', title: 'Eventyrdag', desc: 'Jeg planlegger en hel dag med aktiviteter.', startPrice: 60, minIncrement: 10, category: 'Date' },
  { id: 'auc_morning_routine', title: 'Morgenrutine-hjelp', desc: 'Jeg ordner alt om morgenen i 5 dager.', startPrice: 55, minIncrement: 5, category: 'Praktisk' },
  { id: 'auc_gaming_marathon', title: 'Gaming Marathon', desc: '4 timer uten avbrytelser på favorittspillet.', startPrice: 35, minIncrement: 5, category: 'Fritid' },
  { id: 'auc_movie_marathon', title: 'Film-maraton', desc: 'Velg 3 filmer på rad, ingen protester.', startPrice: 40, minIncrement: 5, category: 'Kos' },
  { id: 'auc_laundry_month', title: 'Vaskehjelp-måned', desc: 'All vask og bretting i en måned.', startPrice: 110, minIncrement: 15, category: 'Praktisk' },
  { id: 'auc_romantic_evening', title: 'Romantisk Aften', desc: 'Lys, musikk, god mat - alt planlagt.', startPrice: 75, minIncrement: 10, category: 'Date' },
  { id: 'auc_sleep_weekend', title: 'Søvn-helg', desc: 'Du får sove så lenge du vil begge dager.', startPrice: 90, minIncrement: 10, category: 'Frihet' },
  { id: 'auc_delivery_week', title: 'Takeaway-uke', desc: 'Vi bestiller mat hver dag i en uke.', startPrice: 200, minIncrement: 20, category: 'Mat' },
  { id: 'auc_photo_album', title: 'Lag Fotoalbum', desc: 'Jeg setter sammen et album med minner.', startPrice: 50, minIncrement: 5, category: 'Overraskelse' },
  { id: 'auc_car_detail', title: 'Totalvask av Bil', desc: 'Full vask, støvsuging, og rens innvendig.', startPrice: 65, minIncrement: 10, category: 'Praktisk' },
  { id: 'auc_surprise_date', title: 'Hemmelig Date', desc: 'En helt planlagt date du ikke vet noe om.', startPrice: 85, minIncrement: 10, category: 'Date' }
];

function renderAuctionGame(container, cleanupStack) {
  const role = localStorage.getItem('who_am_i') || 'andrine';
  const audit = (...args) => console.log('[AUCTION_AUDIT]', ...args);

  // Track last save time to prevent overwriting fresh changes
  let lastSaveTime = 0;

  // 1. INIT STATE (Migration V1 -> V2 if needed)
  let state = storage.get('love_auction_v2', null);
  if (!state) {
    const v1 = storage.get('love_auction_v1', null);
    state = {
      version: 2,
      activeProfileId: role,
      lastModified: Date.now(), // Track when state was last changed
      profiles: {
        andrine: { coins: v1?.coins?.andrine || 50, weeklyEarned: 0, streak: 0 },
        partner: { coins: v1?.coins?.partner || 50, weeklyEarned: 0, streak: 0 }
      },
      ledger: v1?.ledger || [],
      shopItems: [...SEED_ITEMS],
      auctions: [],
      ownedRewards: []
    };
    storage.set('love_auction_v2', state, true);
  } else if (!state.lastModified) {
    // Initialize timestamp for existing state
    state.lastModified = Date.now();
    storage.set('love_auction_v2', state, true);
  }


  const AUCTION_API = `${window.API_BASE}/api/auction`;

  const normalizeServerState = (server) => ({
    version: 2,
    activeProfileId: role,
    lastModified: Date.now(),
    profiles: {
      andrine: server?.profiles?.andrine || { coins: 50, weeklyEarned: 0, streak: 0 },
      partner: server?.profiles?.partner || { coins: 50, weeklyEarned: 0, streak: 0 },
    },
    ledger: (server?.ledger || []).map(l => {
      let parsedMeta = {};
      if (typeof l.meta === 'string') {
        try { parsedMeta = JSON.parse(l.meta || '{}'); } catch { parsedMeta = { desc: String(l.meta || '') }; }
      } else {
        parsedMeta = l.meta || {};
      }
      return { ...l, meta: parsedMeta };
    }),
    shopItems: [...SEED_ITEMS],
    auctions: (server?.auctions || []).map(a => ({
      id: a.id,
      title: a.title,
      desc: a.description,
      category: a.category,
      startPrice: a.start_price,
      minIncrement: a.min_increment,
      highestBid: a.highest_bid,
      highestBidder: a.highest_bidder,
      endTs: a.end_time,
      settled: !!a.settled,
      updatedTs: a.created_at || a.end_time,
    })),
    ownedRewards: (server?.ownedRewards || []).map(r => ({
      id: r.id,
      title: r.title,
      source: r.source,
      payer: r.payer,
      status: r.status,
      confirmations: (() => { try { return JSON.parse(r.confirmations || '{}'); } catch { return {}; } })(),
      requiresBothConfirm: true,
      acquiredTs: r.acquired_at,
    })),
  });

  const auctionRequest = async (payload = null) => {
    const res = await fetch(AUCTION_API, payload ? {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    } : undefined);
    return res.json();
  };

  const refreshFromServer = async () => {
    const result = await auctionRequest();
    if (result?.success) {
      state = normalizeServerState(result);
      storage.set('love_auction_v2', state, true);
      audit('server:refresh', { andrineCoins: state.profiles.andrine.coins, partnerCoins: state.profiles.partner.coins, auctions: state.auctions.length });
      return true;
    }
    return false;
  };

  // 2. HELPER: Save & Render
  const saveAndRender = () => {
    lastSaveTime = Date.now(); // Track when we saved
    state.lastModified = lastSaveTime; // Timestamp the state

    audit('saveAndRender', {
      role,
      activeProfileId: state.activeProfileId,
      andrineCoins: state.profiles.andrine.coins,
      partnerCoins: state.profiles.partner.coins,
      ownedItems: state.ownedRewards.length,
      lastModified: state.lastModified
    });

    console.log('💾 Saving auction state:', {
      andrineCoins: state.profiles.andrine.coins,
      partnerCoins: state.profiles.partner.coins,
      ownedItems: state.ownedRewards.length,
      timestamp: new Date(state.lastModified).toLocaleTimeString()
    });

    storage.set('love_auction_v2', state, true);
    renderUI();
  };

  // 3. UI STATE
  let currentTab = 'earn'; // earn, shop, auction, inventory
  let shopFilter = 'Alle';
  let inventoryDetail = 'ready'; // ready, won, redeemed

  // 4. MAIN RENDER FUNCTION
  const renderUI = () => {
    // Lock wallet/actions to current identity on Sammen page
    state.activeProfileId = role;
    const activeUser = role;
    const profile = state.profiles[activeUser];

    container.innerHTML = `
      <div class="auction-page ios-scroll-lock">
        <!-- HEADER: Wallet & Switcher -->
        <div class="text-center mb-6 pt-2">
          <div class="flex justify-center mb-4">
             <div class="wallet-switcher">
               <button class="switch-btn ${activeUser === 'andrine' ? 'active-andrine' : 'active-partner'}" disabled>
                 ${activeUser === 'andrine' ? "Andrine dY'-" : "Partner dY'T"}
               </button>
             </div>
          </div>
          
          <div class="flex flex-col items-center animate-fade-in">
             <span class="text-tiny text-muted uppercase mb-1">Saldo</span>
             <div class="wallet-balance">
               🪙 ${profile.coins}
             </div>
             ${profile.weeklyEarned > 0 ? `<span class="wallet-weekly">+${profile.weeklyEarned} i uken</span>` : ''}
          </div>
        </div>

        <!-- NAVIGATION TABS -->
        <div class="auction-nav">
          <button class="nav-tab ${currentTab === 'earn' ? 'active' : ''}" data-tab="earn">Tjen 💰</button>
          <button class="nav-tab ${currentTab === 'shop' ? 'active' : ''}" data-tab="shop">Butikk 🛒</button>
          <button class="nav-tab ${currentTab === 'auction' ? 'active' : ''}" data-tab="auction">Auksjon 🔨</button>
          <button class="nav-tab ${currentTab === 'inventory' ? 'active' : ''}" data-tab="inventory">Meg 🎒</button>
        </div>

        <!-- CONTENT AREA -->
        <div class="auction-content pb-20">
          ${getTabContent(currentTab, activeUser, profile)}
        </div>
      </div>
    `;

    // ATTACH LISTENERS
    attachEventListeners();
  };

  const getTabContent = (tab, user, profile) => {
    if (tab === 'earn') return renderEarnTab(user, profile);
    if (tab === 'shop') return renderShopTab(user, profile);
    if (tab === 'auction') return renderAuctionTab(user, profile);
    if (tab === 'inventory') return renderInventoryTab(user, profile);
  };

  // --- TAB: EARN ---
  const renderEarnTab = (user, profile) => {
    const today = new Date().toDateString();
    const lastClaim = storage.get(`last_coin_claim_${user}`, null);
    const canClaim = lastClaim !== today;

    return `
      <div class="animate-fade-in">
        <h3 class="earn-section-title">Daglige Muligheter ✨</h3>
        
        <div class="card card-soft daily-claim-card">
          <div>
            <p class="font-bold text-gray-800">Daglig Bonus</p>
            <p class="text-xs text-muted">Kom tilbake hver dag!</p>
          </div>
          <button class="btn-daily ${!canClaim ? 'btn-disabled' : ''}" id="btn-daily-claim" ${!canClaim ? 'disabled' : ''}>
            ${canClaim ? 'Hent +10 🪙' : 'Hentet ✅'}
          </button>
        </div>

        <h3 class="earn-section-title mt-8">Innsats</h3>
        <div class="soft-task-list">
          ${renderSoftTask(user, 'hug', 'Klem / Omsorg', 'Gitt god klem eller trøst', 3)}
          ${renderSoftTask(user, 'letter', 'Skrevet Babybrev', 'Skrevet noen ord til babyen', 5)}
          ${renderSoftTask(user, 'tidy', 'Ryddet en ting', 'Ryddet noe uoppfordret', 4)}
        </div>
      </div>
    `;
  };

  const renderSoftTask = (user, id, title, desc, amount) => {
    const today = new Date().toDateString();
    const key = `task_${id}_${user}_${today}`;
    const done = storage.get(key, false);

    return `
      <div class="soft-task-card">
        <div>
           <p class="font-semibold text-sm">${title}</p>
           <p class="text-xs text-muted">${desc}</p>
        </div>
        <button class="btn btn-xs ${done ? 'btn-soft' : 'btn-primary'}" 
          onclick="window.handleSoftTask('${user}', '${id}', ${amount})" ${done ? 'disabled' : ''}>
          ${done ? 'Bra! 🌟' : `+${amount} 🪙`}
        </button>
      </div>
    `;
  };

  // --- TAB: SHOP ---
  const renderShopTab = (user, profile) => {
    const categories = ['Alle', ...new Set(state.shopItems.map(i => i.category))];
    const filteredItems = state.shopItems.filter(i => shopFilter === 'Alle' || i.category === shopFilter);

    return `
      <div class="animate-fade-in">
        <!-- FILTER CHIPS -->
        <div class="filter-chips">
          ${categories.map(c => `
            <button class="filter-chip ${shopFilter === c ? 'active' : ''}" onclick="window.setShopFilter('${c}')">${c}</button>
          `).join('')}
        </div>

        <div class="shop-grid">
           ${filteredItems.map(item => {
      const canAfford = profile.coins >= item.cost;
      return `
               <div class="auction-card shop-card">
                 <div class="mb-2">
                   <span class="shop-category">${escapeHtml(item.category)}</span>
                   <h4 class="shop-title">${escapeHtml(item.title)}</h4>
                 </div>
                 <p class="shop-desc">${escapeHtml(item.desc)}</p>
                 <div class="shop-footer">
                   <div class="shop-price-row">
                     <span class="heading-card">🪙 ${item.cost}</span>
                     ${item.requiresBoth ? '<span class="badge badge-soft">Begge Må</span>' : ''}
                   </div>
                   <button class="btn btn-sm btn-block ${canAfford ? 'btn-soft' : 'btn-soft btn-disabled'}" 
                     onclick="window.buyShopItem('${user}', '${item.id}')" ${!canAfford ? 'disabled' : ''}>
                     Kjøp
                   </button>
                 </div>
               </div>
             `;
    }).join('')}
        </div>
      </div>
    `;
  };

  // --- TAB: AUCTION ---
  const renderAuctionTab = (user, profile) => {
    const activeAuctions = state.auctions.filter(a => !a.settled && new Date(a.endTs) > new Date());

    if (activeAuctions.length === 0) {
      return `<div class="p-8 text-center text-muted">Ingen aktive auksjoner akkurat nå. <br>Nye kommer snart! 🔨</div>`;
    }

    return `
      <div class="animate-fade-in auction-list">
        ${activeAuctions.map(auc => {
      const timeLeft = Math.max(0, new Date(auc.endTs) - new Date());
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const mins = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const isLeader = auc.highestBidder === user;
      const minBid = (auc.highestBid || auc.startPrice) + auc.minIncrement;
    audit('bid:guards', { aucTitle: auc.title, highestBid: auc.highestBid || auc.startPrice, minBid, bidderCoins: state.profiles[user]?.coins || 0, highestBidder: auc.highestBidder, endTs: auc.endTs, settled: auc.settled });
      const canAfford = profile.coins >= minBid;

      return `
            <div class="auction-card">
               <div class="card-header mb-2 flex justify-between items-start">
                 <span class="game-chip badge-primary">Auksjon</span>
                 <span class="timer-badge ${hours < 1 ? 'badge-danger' : ''}">${hours}t ${mins}m</span>
               </div>
               
               <h3 class="heading-card mb-1">${escapeHtml(auc.title)}</h3>
               <p class="text-xs text-muted mb-4">${escapeHtml(auc.desc)}</p>
               
               <div class="bid-box">
                 <div>
                   <p class="text-xs text-muted uppercase">Høyeste bud</p>
                   <p class="bid-value">🪙 ${auc.highestBid || auc.startPrice}</p>
                 </div>
                 <div class="text-right">
                   <p class="text-xs text-muted">Leder</p>
                   ${auc.highestBidder ?
          `<span class="badge ${auc.highestBidder === 'andrine' ? 'badge-soft' : 'badge-primary'}">${auc.highestBidder === 'andrine' ? 'Andrine' : 'Partner'}</span>`
          : '<span class="text-xs text-muted">-</span>'}
                 </div>
               </div>

               ${isLeader ?
          `<button class="btn btn-soft btn-block btn-leader" disabled>Du leder! 🎉</button>`
          :
          `<div class="flex gap-2">
                    <button class="btn btn-primary flex-1 text-sm" 
                      onclick="window.placeBid('${user}', '${auc.id}', ${minBid})" ${!canAfford ? 'disabled' : ''}>
                      By ${minBid} 🪙
                    </button>
                    ${canAfford && profile.coins >= minBid + 5 ? `
                      <button class="btn btn-soft px-3" onclick="window.placeBid('${user}', '${auc.id}', ${minBid + 5})">+5</button>
                    ` : ''}
                  </div>`
        }
               ${!canAfford && !isLeader ? '<p class="text-xs text-center text-danger mt-2">Ikke nok coins</p>' : ''}
            </div>
          `;
    }).join('')}
      </div>
    `;
  };

  // --- TAB: INVENTORY ---
  const renderInventoryTab = (user, profile) => {
    // Show ALL owned items (both yours and partner's)
    const all = state.ownedRewards;
    const filtered = all.filter(r => {
      if (inventoryDetail === 'ready') return r.status === 'READY' || r.status === 'WON';
      if (inventoryDetail === 'redeemed') return r.status === 'REDEEMED';
      return true;
    });

    return `
      <div class="animate-fade-in">
        <!-- SUB TABS -->
        <div class="inventory-tabs">
          <button class="inventory-tab ${inventoryDetail === 'ready' ? 'active' : ''}" onclick="window.setInvTab('ready')">Klar ✨</button>
          <button class="inventory-tab ${inventoryDetail === 'redeemed' ? 'active' : ''}" onclick="window.setInvTab('redeemed')">Historikk 📜</button>
        </div>

        <div class="inventory-list">
          ${filtered.length === 0 ? '<p class="text-center text-muted py-8">Her var det tomt...</p>' : ''}
          ${filtered.map(item => {
      const isPending = item.waitingForPartnerConfirmation;
      const isOwner = item.payer === user || item.payer === 'BEGGE';
      const ownerName = item.payer === 'andrine' ? 'Andrine 💗' :
                        item.payer === 'partner' ? 'Yoel 💙' :
                        'Begge 💕';
      return `
               <div class="inventory-card ${!isOwner ? 'opacity-75' : ''}">
                 ${item.status === 'WON' ? '<div class="status-badge status-won">VUNNET</div>' : ''}
                 ${item.status === 'REDEEMED' ? '<div class="status-badge status-redeemed">BRUKT</div>' : ''}

                 <h4 class="shop-title">${escapeHtml(item.title)}</h4>
                 <p class="text-xs text-muted mb-1">Fra: ${item.source}</p>
                 <p class="text-xs font-bold mb-3" style="color: ${item.payer === 'andrine' ? '#FF8FAB' : item.payer === 'partner' ? '#89CFF0' : '#FFB6C1'}">Eier: ${ownerName}</p>
                 
                 ${item.status !== 'REDEEMED' ? `
                   ${!isOwner ? `
                     <p class="text-xs text-center text-muted">Dette tilhører ${ownerName}</p>
                   ` : item.requiresBothConfirm && !item.confirmations?.[user] ? `
                     <button class="btn btn-primary btn-block btn-sm" onclick="window.redeemItem('${user}', '${item.id}')">
                       Jeg bekrefter 🤝
                     </button>
                     ${item.confirmations && Object.values(item.confirmations).some(v => v) ? '<p class="text-xs text-center text-blue-500 mt-2">Venter på den andre...</p>' : ''}
                   ` : item.requiresBothConfirm && item.confirmations?.[user] ? `
                      <button class="btn btn-soft btn-block btn-sm" disabled>Venter på partner... ⏳</button>
                   ` : `
                     <button class="btn btn-primary btn-block btn-sm" onclick="window.redeemItem('${user}', '${item.id}')">
                       Bruk nå ✨
                     </button>
                   `}
                 ` : '<p class="text-xs text-center text-success font-bold">Innløst ☑️</p>'}
               </div>
             `;
    }).join('')}
        </div>

        <!-- HISTORY LEDGER -->
        <h3 class="ledger-section-title">Siste hendelser</h3>
        <div class="ledger-card">
           ${state.ledger.slice(0, 15).map(l => `
             <div class="ledger-item">
               <div>
                  <span class="font-bold ${l.profileId === 'andrine' ? 'text-pink-600' : 'text-blue-600'}">${l.profileId === 'andrine' ? 'A' : 'P'}:</span>
                  <span class="text-gray-600">${escapeHtml(l.meta?.desc || l.kind)}</span>
               </div>
               <span class="font-mono font-bold ${l.amount > 0 ? 'text-green-600' : 'text-red-500'}">
                 ${l.amount > 0 ? '+' : ''}${l.amount}
               </span>
             </div>
           `).join('')}
        </div>

        <div class="mt-8 mb-8 text-center animate-fade-in">
           <p class="text-xs text-muted mb-3 opacity-60">Data lagres lokalt i nettleseren.</p>
           <div class="flex gap-3 justify-center mb-4">
             <button class="btn-backup" onclick="window.exportAuctionJSON()">Lagre Backup 💾</button>
             <button class="btn-backup" onclick="window.importAuctionJSON()">Gjenopprett 📥</button>
           </div>
           <button class="btn btn-ghost btn-small" id="reset-auction" style="color: rgba(255,0,0,0.6);">
             🔄 Nullstill alt (reset coins & kjøp)
           </button>
        </div>
      </div>
    `;
  };

  // 5. ATTACH LISTENERS
  const attachEventListeners = () => {
    // Nav
    container.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentTab = e.target.dataset.tab;
        renderUI();
      });
    });

    // Daily Claim
    container.querySelector('#btn-daily-claim')?.addEventListener('click', async (e) => {
      const btn = e.target;
      if (btn.disabled) return;
      btn.disabled = true;

      const active = role;
      audit('dailyClaim:start', { role, active });
      const result = await auctionRequest({ type: 'daily_claim', role: active });
      if (!result?.success) {
        btn.disabled = false;
        return;
      }

      await refreshFromServer();
      renderUI();
      if (navigator.vibrate) navigator.vibrate(50);
    });

    // Reset Auction
    container.querySelector('#reset-auction')?.addEventListener('click', async () => {
      const confirmed = confirm('Er du SIKKER? Dette sletter alle coins, kjA,p og auksjonsoversikt. Kan ikke angres!');
      if (!confirmed) return;
      const result = await auctionRequest({ type: 'reset', role });
      if (!result?.success) return;
      await refreshFromServer();
      renderUI();
      alert('?o. Alt er nullstilt! Begge har 50 coins.');
    });
  };

  // 6. GLOBAL WINDOW EXPORTS (Simplified for onClick handlers string interpolation)
  window.setShopFilter = (cat) => { shopFilter = cat; renderUI(); };
  window.setInvTab = (tab) => { inventoryDetail = tab; renderUI(); };

  window.handleSoftTask = async (user, taskId, amount) => {
    if (user !== role) return;
    const result = await auctionRequest({ type: 'task', role: user, taskId, amount });
    if (!result?.success) return;
    await refreshFromServer();
    renderUI();
    if (navigator.vibrate) navigator.vibrate([30, 30]);
  };

  window.buyShopItem = async (user, itemId) => {
    if (user !== role) return;
    const item = state.shopItems.find(i => i.id === itemId);
    if (!item) return;

    const btn = document.querySelector(`button[onclick*="${itemId}"]`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'KjA,per... �?3';
    }

    const result = await auctionRequest({
      type: 'buy',
      role: user,
      itemId: item.id,
      title: item.title,
      cost: item.cost,
      payer: item.payer || 'BEGGE',
      requiresBothConfirm: !!item.requiresBothConfirm,
    });

    if (!result?.success) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'KjA,p';
      }
      return;
    }

    if (btn) {
      btn.textContent = '\\u2705 Kj\\u00F8pt!';
      btn.style.background = '#4ade80';
    }

    await refreshFromServer();
    setTimeout(() => renderUI(), 450);
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  };

  window.placeBid = async (user, aucId, amount) => {
    if (user !== role) return;
    const result = await auctionRequest({ type: 'bid', role: user, auctionId: aucId, amount });
    if (!result?.success) return;
    await refreshFromServer();
    renderUI();
    if (navigator.vibrate) navigator.vibrate(50);
  };

  window.redeemItem = async (user, itemId) => {
    if (user !== role) return;
    const result = await auctionRequest({ type: 'redeem', role: user, itemId });
    if (!result?.success) return;
    await refreshFromServer();
    renderUI();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  };

  // 7. INITIAL RENDER
  renderUI();
  refreshFromServer().then(() => renderUI());

  // 8. CLOCK & SYNC (Cleanup)
  const interval = setInterval(async () => {
    await refreshFromServer();
    renderUI();
  }, 15000);
  cleanupStack.push(() => clearInterval(interval));
}

// ════ HELPERS ════
function addLedger(state, kind, profileId, amount, meta) {
  state.ledger.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    ts: new Date().toISOString(),
    kind,
    profileId,
    amount,
    meta
  });
  if (state.ledger.length > 50) state.ledger.pop();
}

function tickAuctions(state) {
  const now = new Date();
  let changed = false;

  // 1. Settle expired
  state.auctions.forEach((auc, idx) => {
    if (!auc.settled && new Date(auc.endTs) < now) {
      auc.settled = true;
      changed = true;
      if (auc.highestBidder) {
        // Winner gets item
        state.ownedRewards.push({
          id: crypto.randomUUID(),
          title: auc.title,
          source: 'AUCTION',
          payer: auc.highestBidder, // or BEGGE if implied? Spec says "minted into inventory with status WON"
          status: 'WON',
          acquiredTs: now.toISOString()
        });
        addLedger(state, 'WIN', auc.highestBidder, 0, { desc: `Vant: ${auc.title}` });
      }
      // No refund needed as coins were escrowed on bid
    }
  });

  // 2. Refill if low
  const activeCount = state.auctions.filter(a => !a.settled).length;
  if (activeCount < 5) {
    const needed = 5 - activeCount;
    for (let i = 0; i < needed; i++) {

      // Get currently active titles to avoid duplicates
      const activeTitles = state.auctions.filter(a => !a.settled).map(a => a.title);

      // Filter candidates that are NOT currently active
      const candidates = SEED_AUCTION_REWARDS.filter(item => !activeTitles.includes(item.title));

      // Fallback to full list if we somehow run out (unlikely with 25 items and limit of 5)
      const pool = candidates.length > 0 ? candidates : SEED_AUCTION_REWARDS;

      const tmpl = pool[Math.floor(Math.random() * pool.length)];
      const durationHours = 24 + Math.floor(Math.random() * 48);
      const endTs = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString();

      state.auctions.push({
        id: 'auc_' + Date.now() + '_' + i,
        title: tmpl.title,
        desc: tmpl.desc,
        startPrice: tmpl.startPrice,
        minIncrement: tmpl.minIncrement || 5,
        category: tmpl.category,
        endTs,
        updatedTs: now.toISOString(),
        settled: false,
        highestBid: 0,
        highestBidder: null
      });
      changed = true;
    }
  }

  return changed;
}



window.exportAuctionJSON = () => {
  const state = storage.get('love_auction_v2', null);
  if (!state) return alert('Ingen data å eksportere.');

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "kjærlighets_kreditt_backup.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

window.importAuctionJSON = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = readerEvent => {
      try {
        const content = JSON.parse(readerEvent.target.result);
        if (content.version !== 2) throw new Error('Feil versjon');
        storage.set('love_auction_v2', content);
        alert('Importert! Last siden på nytt.');
        location.reload();
      } catch (err) {
        alert('Kunne ikke importere filen. Sjekk format.');
      }
    }
  }
  input.click();
};

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
}

let presenceInterval;
function startPresenceHeartbeat(role, container, cleanupStack) {
  if (presenceInterval) clearInterval(presenceInterval);

  const check = async () => {
    // Only run if game is still visible
    if (!document.getElementById('name-game-container')) {
      if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
      }
      return;
    }

    try {
      const response = await fetch(`${window.API_BASE}/api/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      // Update UI based on response
      const data = await response.json();
      const indicator = document.getElementById('presence-indicator');
      if (indicator && data.partnerOnline) {
        indicator.classList.add('online');
        indicator.querySelector('.status-dot').textContent = '🟢';
        indicator.querySelector('.status-text').textContent = `${role === 'andrine' ? 'Yoel' : 'Andrine'} er her!`;
      } else if (indicator) {
        indicator.classList.remove('online');
        indicator.querySelector('.status-dot').textContent = '⚪';
        indicator.querySelector('.status-text').textContent = 'Venter på partner...';
      }

      // Pull latest votes from cloud - but only if not already pulling
      // Prevents cascade: pull→hasChanged→autoRefresh→sync→pull→...
      if (!window._nameGamePullInProgress) {
        window._nameGamePullInProgress = true;
        try {
          await storage.pullFromCloud({ skipCelebration: true });
        } finally {
          window._nameGamePullInProgress = false;
        }
      }

      // Check if game state changed (partner voted or we can advance)
      const votes = storage.get('name_votes', {});
      const customNames = storage.get('custom_names', []);
      const allNames = [...DEFAULT_NAMES, ...customNames];
      const currentPlayer = localStorage.getItem('who_am_i') || 'andrine';

      // Find first incomplete name
      const nextName = allNames.find(name => {
        const v = votes[name] || {};
        return !v.andrine || !v.partner;
      });

      // If current displayed name is different from what it should be, re-render
      if (lastRenderedState.name !== nextName ||
          (lastRenderedState.waiting && nextName && votes[nextName]?.andrine && votes[nextName]?.partner)) {
        console.log('🔄 Partner voted! Auto-refreshing game...');
        renderNamesGame(container, cleanupStack);
      }
    } catch (err) {
      console.warn('Presence check failed', err);
    }
  };

  // Run immediately then interval
  check();
  presenceInterval = setInterval(check, 8000); // 8s — reduced to prevent subrequest overload
  cleanupStack.push(() => clearInterval(presenceInterval));
}

// ═══════════════════════════════════════════════════════════════
// 😈 RAMPETE KVELD
// ═══════════════════════════════════════════════════════════════

const NAUGHTY_DARES = {
  soft: [
    "Gi partneren din en 2-minutters nakkemassasje 💆",
    "Si tre ting du elsker med kroppen hans 💕",
    "Dans sakte til en sang dere begge liker 🎵",
    "Kyss i 30 sekunder – ingen rush 💋",
    "Gi hverandre en skikkelig klem – hold i 20 sekunder 🤗",
    "Skriv ett ord som beskriver kvelden du vil ha 🌙",
    "Hold øyekontakt i 60 sekunder uten å le 👀",
    "Gi fem myke kyss på forskjellige steder 💋",
    "Bytt på å gi 3 komplimenter hver ✨",
    "Skriv en mini-date-plan på 2 minutter 📝",
    "Legg telefonene bort i 20 minutter og kos 🕯️",
    "Gi en rolig håndmassasje i 3 minutter 🤲",
  ],
  naughty: [
    "Hvisk noe frekk i øret 😏",
    "Massasje fra topp til tå – 5 minutter 🔥",
    "Ta av ett plagg fra partneren din sakte 👀",
    "Fortell en fantasi du aldri har delt 😈",
    "Kysse-konkurranse: den som stopper taper 💋",
    "Blind taste test – ett kyss, øynene lukket 👁️",
    "La partneren bestemme neste trekk i 5 minutter 🫦",
    "Gi en langsom striptease-light med favorittsang 🎶",
    "Hvisk tre ting du vil gjøre senere i kveld 🔥",
    "Hands-off tease i 2 minutter – bare ord og blikk 😏",
    "Bytt roller: den stille tar styring i 10 min 👑",
    "Kysse-runde: hals, kinn, lepper, gjenta 💋",
  ],
  bold: [
    "Blindfold partneren og overrask dem 😈",
    "Slow control – ingen hastverk tillatt 🔥",
    "Ta kommando og bestem alt i 10 minutter 👑",
    "Tease & Pause – stopp akkurat i det gode øyeblikket 😏",
    "Kantkontroll i 8 minutter: tett på, så pause ⏱️",
    "Hands behind back + kun munn i 5 minutter 💋",
    "Dominant bytte: én leder 7 min, så bytte rolle 🔁",
    "Dirty talk only: ingen stillhet i 4 minutter 🫦",
    "Tempo-lek: ultrsakte i 3 min, så intens i 1 min 🔥",
    "Bruk timer: 60 sek tease / 20 sek pause x 6 ⌛",
    "Velg 3 regler partneren må følge i kveld 📜",
    "Stopp akkurat før klimaks to ganger, så fortsett 😈",
  ],
  extra: [
    "Wrist cuffs + blindfold = full overraskelse 😈🔥",
    "Sensory focus: kun berøring, ingen ord 🫦",
    "Rule Roulette – terningen bestemmer reglene 🎲",
    "Tease i 10 minutter – absolutt ingenting mer 😈",
    "Partneren din bestemmer alt – du har null valg 👑",
    "Edging-lek: stopp rett før, pust, start igjen ⏱️",
    "Dominant/soft switch halvveis i leken 🔄",
    "Blindfold + musikk + slow tease i 8 min 🎶",
    "Kun én får snakke i 5 min – den andre adlyder 🖤",
    "Power round: 12 min hvor leder styrer alt 🔥",
    "3-stegs game: tease, deny, reward 😏",
    "No hands challenge i 4 min – bruk kreativitet 💋",
    "Dress code challenge: ett plagg beholdes hele leken 👀",
    "Bygg opp i 15 min før noe 'main event' er lovt 🕯️",
    "Safeword + kontrollert rollespill i 10 min 🎭",
    "Etter ordre: fullfør 5 små kommandoer uten stopp 👑",
  ]
};

const NAUGHTY_PROPS = {
  control: ['Blindfold 🙈', 'Wrist Cuffs ⛓️', 'Teaser 🪶', 'Silk Scarf 🎀'],
  pleasure: ['Vibrator 💜', 'Massage Oil 💆', 'Lube ✨', 'Surprise Toy 🎁'],
};

const NAUGHTY_LEVEL_META = {
  soft:    { emoji: '😌', label: 'Soft & Sweet', color: '#E91E8C' },
  naughty: { emoji: '😏', label: 'Naughty',      color: '#C2185B' },
  bold:    { emoji: '🔥', label: 'Bold',          color: '#9B27AF' },
  extra:   { emoji: '😈', label: 'Extra Naughty', color: '#6A1B9A' },
};

function renderNaughtyGame(container, cleanupStack) {
  let selectedLevel = null;
  let activeProps = new Set();
  let lastDare = null;
  let lastDareText = null;

  function render() {
    const naughtyRole = localStorage.getItem('who_am_i') || 'andrine';
    const savedPlan = storage.get('naughty_plan_' + naughtyRole) || {};

    container.innerHTML = `
      <div class="naughty-game">

        <div class="naughty-hero">
          <div class="naughty-hero-title-row">
            <span>🔥</span>
            <h2 class="naughty-hero-title">Rampete Kveld</h2>
            <span>😈</span>
          </div>
          <p class="naughty-hero-sub">La oss gjøre kvelden litt mer interessant…</p>
        </div>

        <p class="naughty-section-label">KVELDENS STEMNING</p>
        <div class="naughty-level-grid">
          ${Object.entries(NAUGHTY_LEVEL_META).map(([id, m]) => `
            <button class="naughty-level-btn ${selectedLevel === id ? 'active' : ''}" data-level="${id}">
              <span class="naughty-level-emoji">${m.emoji}</span>
              <span class="naughty-level-text">${m.label}</span>
            </button>
          `).join('')}
          <button class="naughty-level-btn naughty-surprise ${selectedLevel === 'random' ? 'active' : ''}" data-level="random">
            <span class="naughty-level-emoji">🎲</span>
            <span class="naughty-level-text">Surprise Me</span>
          </button>
        </div>

        <p class="naughty-section-label" style="margin-top:24px;">PLAY KIT 😏</p>
        <div class="naughty-kit-block">
          <p class="naughty-kit-subtitle">😈 Control & Tease</p>
          <div class="naughty-pills">
            ${NAUGHTY_PROPS.control.map(p => `
              <button class="naughty-pill ${activeProps.has(p) ? 'active' : ''}" data-prop="${p}">${p}</button>
            `).join('')}
          </div>
          <p class="naughty-kit-subtitle" style="margin-top:12px;">🔥 Pleasure Boosters</p>
          <div class="naughty-pills">
            ${NAUGHTY_PROPS.pleasure.map(p => `
              <button class="naughty-pill ${activeProps.has(p) ? 'active' : ''}" data-prop="${p}">${p}</button>
            `).join('')}
          </div>
        </div>

        <div class="naughty-dare-wrap">
          <button class="naughty-dare-btn" id="naughty-dare-btn">
            <span class="naughty-dice" id="naughty-dice">🎲</span>
            Dare Us!
          </button>
        </div>

        <div class="naughty-result-card ${lastDare ? 'has-dare' : ''}" id="naughty-result">
          ${lastDare ? `
            <div class="naughty-result-badge">${NAUGHTY_LEVEL_META[lastDare.level]?.emoji} ${NAUGHTY_LEVEL_META[lastDare.level]?.label}</div>
            <p class="naughty-result-dare">${lastDare.dare}</p>
            <div class="naughty-result-prop">💥 ${lastDare.prop}</div>
          ` : `<p class="naughty-result-empty">Klar for litt rampete moro? 😏</p>`}
        </div>

        ${lastDare ? `
          <button class="naughty-save-btn" id="naughty-save">💾 Lagre Kveldplan</button>
        ` : ''}

        ${savedPlan.dare ? `
          <div class="naughty-saved">
            <p class="naughty-section-label">LAGRET PLAN 💾</p>
            <p class="naughty-saved-dare">${savedPlan.dare}</p>
            <p class="naughty-saved-meta">${savedPlan.levelLabel} · ${savedPlan.date}</p>
          </div>
        ` : ''}

      </div>
    `;

    // Level buttons
    container.querySelectorAll('.naughty-level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.haptic) window.haptic.light();
        let lvl = btn.dataset.level;
        if (lvl === 'random') {
          const all = Object.keys(NAUGHTY_LEVEL_META);
          lvl = all[Math.floor(Math.random() * all.length)];
          btn.dataset.level = lvl;
        }
        selectedLevel = lvl;
        render();
      });
    });

    // Props
    container.querySelectorAll('.naughty-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        if (window.haptic) window.haptic.light();
        const p = pill.dataset.prop;
        activeProps.has(p) ? activeProps.delete(p) : activeProps.add(p);
        render();
      });
    });

    // Dare
    container.querySelector('#naughty-dare-btn')?.addEventListener('click', () => {
      if (window.haptic) window.haptic.medium();
      const dice = container.querySelector('#naughty-dice');
      if (dice) {
        dice.style.animation = 'none';
        dice.offsetHeight; // reflow
        dice.style.animation = 'naughtyDiceSpin 0.6s cubic-bezier(0.36,0.07,0.19,0.97)';
      }
      const all = Object.keys(NAUGHTY_LEVEL_META);
      const lvl = selectedLevel || all[Math.floor(Math.random() * all.length)];
      const baseDares = NAUGHTY_DARES[lvl] || [];
      const filteredDares = baseDares.filter(d => d !== lastDareText);
      const dares = filteredDares.length > 0 ? filteredDares : baseDares;
      const dare = dares[Math.floor(Math.random() * dares.length)];
      const allProps = activeProps.size > 0
        ? [...activeProps]
        : [...NAUGHTY_PROPS.control, ...NAUGHTY_PROPS.pleasure];
      const prop = allProps[Math.floor(Math.random() * allProps.length)];
      lastDare = { dare, prop, level: lvl, levelLabel: NAUGHTY_LEVEL_META[lvl].label };
      lastDareText = dare;
      console.log('😈 Naughty dare roll:', { lvl, dare });
      render();
    });

    // Save
    container.querySelector('#naughty-save')?.addEventListener('click', () => {
      if (window.haptic) window.haptic.medium();
      storage.set('naughty_plan_' + naughtyRole, {
        ...lastDare,
        date: new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
      });
      render();
    });
  }

  render();
  cleanupStack.push(() => {});
}



















