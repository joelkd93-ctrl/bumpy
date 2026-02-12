/**
 * Together Page - Couple Bonding Mini Games ð
 * No competition, no pressure - just connection
 */
import { storage } from '../utils/storage.js';
import { modal as modalManager } from '../utils/modal.js';

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð® GAME CONFIGURATION
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const GAMES = [
  {
    id: 'heartbeat',
    icon: 'ð',
    title: 'Hjerteslag',
    description: 'Trykk i takt sammen'
  },
  {
    id: 'weekly',
    icon: 'ð¬',
    title: 'Oss, Denne Uken',
    description: 'Del tankene deres'
  },
  {
    id: 'guess',
    icon: 'ð¤',
    title: 'Gjett HumÃ¸ret',
    description: 'Hvor godt kjenner du henne?'
  },
  {
    id: 'names',
    icon: 'ð¼',
    title: 'Navnelek',
    description: 'Finn favorittnavnene deres'
  },
  {
    id: 'missions',
    icon: 'ð',
    title: 'KjÃ¦rlighets-oppdrag',
    description: 'SmÃ¥ daglige utfordringer'
  },
  {
    id: 'predictions',
    icon: 'ð²',
    title: 'Gjettelek',
    description: 'Hva tror dere om fremtiden?'
  },
  {
    id: 'auction',
    icon: 'ð¸',
    title: 'Love Auction',
    description: 'Coins + smÃ¥ kjÃ¦rlighetskjÃ¸p'
  }
];

// Weekly questions - one per week
const WEEKLY_QUESTIONS = [
  "Hva gleder du deg mest til denne uken?",
  "Er det noe du vil jeg skal vite?",
  "Hva fikk deg til Ã¥ smile i dag?",
  "Hva er Ã©n ting du trenger akkurat nÃ¥?",
  "Hvordan kan jeg stÃ¸tte deg bedre?",
  "Hva er du takknemlig for i dag?",
  "Hva har du tenkt pÃ¥ i det siste?",
  "Hva er ditt hÃ¥p for babyen vÃ¥r?",
  "Hvilket Ã¸yeblikk denne uken fÃ¸ltes spesielt?",
  "Hva trenger du mer av akkurat nÃ¥?",
];

// Baby names to swipe through (users can add their own)
const DEFAULT_NAMES = [
  "Adam", "Aiden", "Albie", "Alexander", "Andrew", "Anton", "Archie", "Arlo",
  "Arthur", "Asher", "August", "Axel", "Benjamin", "Caleb", "Carter", "Charlie",
  "Christian", "ClÃ©ment", "Daniel", "David", "Eden", "Eliah", "Elias", "Elijah",
  "Elliot", "Emil", "Ethan", "Ezra", "Felix", "Filip", "Finley", "Finn",
  "Frans", "Freddie", "Gabriel", "George", "Grayson", "Henry", "Hugo", "Isaac",
  "Isak", "Isaiah", "Jack", "Jakob", "James", "Jeremiah", "Jonah", "Jonathan",
  "Joseph", "Joshua", "Jude", "Jules", "Julian", "Kasper", "Leo", "Leon",
  "Levi", "Liam", "Logan", "Louis", "Luca", "Lucas", "Lukas", "MaÃ«l", "Malte",
  "Marceau", "Markus", "Mason", "Matheo", "Mathis", "Matthew", "Max", "Michael",
  "Milo", "Nathan", "Nicolas", "NoÃ©", "Noah", "Nolan", "Oliver", "Oskar",
  "Owen", "Paul", "Peter", "RaphaÃ«l", "Reggie", "Reuben", "Rio", "Rowan",
  "Samuel", "Sacha", "SaÃ¼l", "Simon", "Sonny", "Teddy", "Theo", "Theodor",
  "Thomas", "Tiago", "Valentin", "Victor", "William", "Wyatt"
];

const MOODS = ['ð', 'ð¥°', 'ð', 'ð¤', 'ð´', 'ð¢', 'ð¤¢', 'ð¤', 'ð°', 'ðª'];

// Love Missions
const MISSIONS = {
  andrine: [
    "Fortell noe du er stolt av ved Yoel i dag. ð¨ð¾âð",
    "Send en ekstra varm melding til Yoel nÃ¥. ð",
    "Gi Yoel en god klem nÃ¥r du ser ham neste gang. ð¤",
    "Be Yoel velge kveldens film â uten diskusjon! ð¬",
    "Skriv ned Ã©n ting dere skal gjÃ¸re sammen etter fÃ¸dselen. ðï¸",
    "Del et morsomt minne fra da dere mÃ¸ttes fÃ¸rste gang. ð",
    "Fortell Yoel hva du gleder deg mest til nÃ¥r babyen kommer. ð¶",
    "Gi Yoel tre komplimenter â helt Ã¦rlige! ð",
    "Send Yoel et bilde av noe som minner deg om ham. ð¸",
    "Planlegg en enkel date-kveld hjemme med Yoel. ð¯ï¸",
    "Fortell Yoel om en egenskap du hÃ¥per babyen arver fra ham. ð§¬",
    "SpÃ¸r Yoel om hans drÃ¸mmedag â hva ville han gjort? ð­",
    "Skriv en kort kjÃ¦rlighetslapp og gjem den et sted han finner den. ð",
    "Be Yoel fortelle om favorittminnet deres sammen. ðï¸",
    "Lag en liste over 5 ting du setter pris pÃ¥ ved Yoel. ð"
  ],
  partner: [
    "Gi Andrine 10 minutter med fotmassasje i dag. ð¦¶",
    "Lag yndlingsmaten hennes eller hent noe hun craver skikkelig. ð¥",
    "Fortell henne hvor utrolig flink hun er som bÃ¦rer frem barnet deres. ð",
    "Ta alt det praktiske med rydding og matlaging i kveld. ð§¹",
    "KjÃ¸p med en liten overraskelse til henne pÃ¥ vei hjem. ð",
    "Ordne med ekstra puter og teppe slik at hun kan hvile skikkelig. ðï¸",
    "Les hÃ¸yt for babyen mens du holder pÃ¥ magen hennes. ð",
    "GjÃ¸r klart et varmt bad med lys og god musikk for henne. ð",
    "Ta deg av alle husarbeid i dag uten at hun trenger Ã¥ spÃ¸rre. ðª",
    "Send henne en melding midt pÃ¥ dagen som sier hvor glad du er i henne. ð±",
    "Planlegg en overraskelsesdate hjemme â med mat, lys og musikk. ð¯ï¸",
    "GjÃ¸r favorittdesserten hennes fra bunnen av. ð°",
    "Si tre ting du gleder deg til nÃ¥r babyen kommer. ð",
    "Ta initiativ til en kveld hvor dere bare snakker om fremtiden. ð¬",
    "Gi henne en skikkelig god massasje â rygg, skuldre og fÃ¸tter. ðââï¸",
    "Lag en spilleliste med sanger som minner dere om hverandre. ðµ",
    "Fortell henne om et Ã¸yeblikk hvor du var ekstra stolt av henne. ð",
    "Ordne med en helt vanlig kosekveld â ingen stress, bare dere to. ð"
  ]
};

const PREDICTION_QUESTIONS = [
  { id: 'birth_date', label: 'Hvilken dato kommer den lille?', type: 'date' },
  { id: 'birth_time', label: 'Klokkeslett for fÃ¸dsel?', type: 'time', placeholder: 'f.eks. 14:30' },
  { id: 'birth_weight', label: 'Estimert vekt (gram)?', type: 'number', placeholder: 'f.eks. 3500' },
  { id: 'birth_length', label: 'Estimert lengde (cm)?', type: 'number', placeholder: 'f.eks. 50' },
  { id: 'eye_color', label: 'Hvilken Ã¸yenfarge fÃ¥r han?', type: 'text', placeholder: 'f.eks. BlÃ¥/Brune' },
  { id: 'hair_color', label: 'Hvilken hÃ¥rfarge?', type: 'text', placeholder: 'f.eks. MÃ¸rk/Lys' },
  { id: 'hair_amount', label: 'Mye eller lite hÃ¥r?', type: 'text', placeholder: 'f.eks. Fyldig/Lite' },
  { id: 'who_looks_like', label: 'Hvem kommer han til Ã¥ ligne mest pÃ¥?', type: 'text', placeholder: 'Mamma eller Pappa?' },
  { id: 'first_word', label: 'Hva blir hans fÃ¸rste ord?', type: 'text', placeholder: 'f.eks. Mamma/Pappa' },
  { id: 'personality', label: 'Hvilken personlighet tror du han fÃ¥r?', type: 'text', placeholder: 'f.eks. Rolig/Aktiv' },
  { id: 'favorite_activity', label: 'Hva kommer han til Ã¥ elske Ã¥ gjÃ¸re?', type: 'text', placeholder: 'f.eks. Fotball/Musikk' },
  { id: 'zodiac_trait', label: 'Hvilken stjernetegn-egenskap passer best?', type: 'text', placeholder: 'f.eks. Modig/Omtenksom' }
];



// Helper to get mission of the day
function getMission(role) {
  const dayOfYear = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
  const roleMissions = MISSIONS[role] || MISSIONS.partner;
  return roleMissions[dayOfYear % roleMissions.length];
}

// ðª Coin Helper
// ðª Coin Helper
async function awardCoins(role, amount, reason) {
  // Pull latest v2 state
  let state = storage.get('love_auction_v2', null);

  if (!state) {
    console.warn('â ï¸ No auction state found, cannot award coins');
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
  await storage.syncWithCloud();
  console.log(`ðª Awarded ${amount} coins to ${role} for ${reason}`);
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð RENDER
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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
      <div class="page-header-hero page-header-together" style="margin-bottom:var(--space-5);">
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
          <button class="game-modal-close" id="close-modal">â</button>
          <div id="game-content"></div>
        </div>
      </div>
    </div>
  `;
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð¯ INIT & EVENT HANDLERS
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð¯ INIT & EVENT HANDLERS
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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
          <h2 class="heading-love mb-6">Hvem er du? ð</h2>
          <div class="identity-buttons">
            <button class="btn btn-soft identity-btn mb-4" data-id="andrine">
              <span>ð©</span>
              Jeg er Andrine
            </button>
            <button class="btn btn-soft identity-btn" data-id="partner">
              <span>ð¨ð¾</span>
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
      <span>Logget inn som ${currentIdentity === 'andrine' ? 'Andrine ð©' : 'Yoel ð¨ð¾'}</span>
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
    console.log('ð Game closed, cleanup completed');
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
    }

    // Single authority: modal manager controls visibility + scroll lock
    modalManager.open(modal);
  }
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð GAME 1: HEARTBEAT SYNC
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

let heartbeatPollInterval = null;
let lastPartnerTapReceived = null;

function renderHeartbeatGame(container, cleanupStack) {
  const role = localStorage.getItem('who_am_i') || 'andrine';

  container.innerHTML = `
    <div class="text-center" style="display: flex; flex-direction: column; min-height: 100%; padding-top: 20px;">
      <div style="flex: 0 0 auto;">
        <h2 class="heading-section mb-2">Hjerteslag ð</h2>
        <p class="text-warm mb-4">Trykk for Ã¥ sende et dunk til ${role === 'andrine' ? 'Yoel ð¨ð¾' : 'Andrine ð©'}.</p>
      </div>

      <div class="heartbeat-area" style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 200px;">
        <span id="heart-icon" class="heart-pulse reveal-emoji-big">ð</span>
      </div>

      <div style="flex: 0 0 auto; margin-bottom: 16px;">
        <div id="heart-status" class="text-muted mb-4 text-sm">Ser etter partner...</div>
        <button class="btn btn-primary btn-block" id="tap-heart" style="min-height: 100px;">
          Send hjertebank ð
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
        ? `${role === 'andrine' ? 'Yoel' : 'Andrine'} er pÃ¥logget ð¢`
        : 'Partner er ikke pÃ¥logget âª';
    }
  }, 2000);

  cleanupStack.push(() => clearInterval(statusInterval));

  tapBtn?.addEventListener('click', async () => {
    pulse();
    window.app.triggerHeartbeat();

    try {
      await fetch(`${window.API_BASE}/api/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, tap: true })
      });
    } catch (err) {
      console.error('Send tap error:', err);
    }
  });
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð¬ GAME 2: US, THIS WEEK
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function renderWeeklyGame(container) {
  const weekNum = getWeekNumber();
  const question = WEEKLY_QUESTIONS[weekNum % WEEKLY_QUESTIONS.length];
  const storageKey = `weekly_${weekNum}`;
  const answers = storage.get(storageKey, { andrine: null, partner: null });

  const bothAnswered = answers.andrine && answers.partner;

  container.innerHTML = `
    <div class="text-center">
      <h2 class="heading-section mb-2">Oss, Denne Uken ð¬</h2>
      <p class="text-warm mb-8">"${question}"</p>
      
      ${bothAnswered ? `
        <div class="answers-reveal fade-in">
          <div class="card card-soft mb-6 text-left">
            <p class="text-tiny mb-2" style="color: var(--pink-600);">Andrine</p>
            <p class="heading-card">"${answers.andrine}"</p>
          </div>
          <div class="card card-glass text-left">
            <p class="text-tiny mb-2" style="color: var(--pink-600);">Yoel</p>
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
          <div class="locked-emoji">ð</div>
          <p class="text-tiny opacity-70 mb-2">Svarene avslÃ¸res kun nÃ¥r begge har svart</p>
          <div class="flex justify-center gap-4">
            <span class="badge ${answers.andrine ? 'badge-success' : 'badge-soft'}">${answers.andrine ? 'â Andrine klar' : 'Andrine tenker...'}</span>
            <span class="badge ${answers.partner ? 'badge-success' : 'badge-soft'}">${answers.partner ? 'â Yoel klar' : 'Yoel tenker...'}</span>
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

        // Award coins if both answered
        if (answers.andrine && answers.partner) {
          // Check if already awarded for this week
          const awardKey = `weekly_coins_${weekNum}`;
          if (!storage.get(awardKey, false)) {
            awardCoins(identity === 'andrine' ? 'partner' : 'andrine', 20, 'Ukens SpÃ¸rsmÃ¥l'); // Award the OTHER person usually? Or both?
            // Actually let's award BOTH.
            awardCoins('andrine', 20, 'Ukens SpÃ¸rsmÃ¥l');
            awardCoins('partner', 20, 'Ukens SpÃ¸rsmÃ¥l');
            storage.set(awardKey, true);
          }
        }

        renderWeeklyGame(container);
      }
    });
  }
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð¤ GAME 3: GUESS WHAT I'M THINKING
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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
          <h2 class="heading-section mb-4">Venter pÃ¥ Andrine... â³</h2>
          <p class="text-muted">Hun velger humÃ¸ret sitt nÃ¥.</p>
        </div>
      `;
      // Auto-refresh checker could go here, or just let them wait/refresh
      return;
    }

    container.innerHTML = `
      <div class="text-center">
        <h2 class="heading-section mb-2">Gjett HumÃ¸ret ð¤</h2>
        <p class="text-warm mb-6">Andrine: Velg hvordan du fÃ¸ler deg akkurat nÃ¥.<br>Gi sÃ¥ telefonen til partneren din.</p>
        
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
          <h2 class="heading-section mb-4">Venter pÃ¥ Yoel... â³</h2>
          <p class="text-muted">Han gjetter humÃ¸ret ditt nÃ¥.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="text-center">
        <h2 class="heading-section mb-2">Partners Tur ð¤</h2>
        <p class="text-warm mb-6">Hvordan tror du Andrine fÃ¸ler seg akkurat nÃ¥?</p>
        
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

  container.innerHTML = `
    <div class="text-center">
      <div class="reveal-animation">
        <div class="reveal-emoji-big">${gameState.mood}</div>
        <p class="heading-love mb-6">${correct ? 'Du klarte det! ð' : 'Nesten â hun fÃ¸ler seg sett â¨'}</p>
      </div>
      
      <div class="guess-comparison mb-8">
        <div class="guess-item">
          <p class="text-muted text-tiny mb-2">Andrine fÃ¸lte</p>
          <span class="history-emoji">${gameState.mood}</span>
        </div>
        <div class="guess-item">
          <p class="text-muted text-tiny mb-2">Du gjettet</p>
          <span class="history-emoji">${gameState.guess}</span>
        </div>
      </div>
      
      <button class="btn btn-soft btn-block" onclick="this.textContent='Ses i morgen! â¨'">
        Spill Igjen I Morgen
      </button>
    </div>
  `;
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð¼ GAME 4: NAME VIBES
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

// State tracking to prevent flickering
let lastRenderedState = { name: null, waiting: null, finished: null };

function renderNamesGame(container, cleanupStack) {
  const votes = storage.get('name_votes', {});
  const customNames = storage.get('custom_names', []);
  const allNames = [...DEFAULT_NAMES, ...customNames];

  // Use global identity
  const currentPlayer = localStorage.getItem('who_am_i') || 'andrine';
  const partnerRole = currentPlayer === 'andrine' ? 'partner' : 'andrine';

  // Find the first name that is NOT fully completed (both voted)
  const currentName = allNames.find(name => {
    const v = votes[name] || {};
    return !v.andrine || !v.partner;
  });

  const isFinished = !currentName;
  const hasVoted = currentName && votes[currentName] && votes[currentName][currentPlayer];

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
        <h2 class="heading-section">Navnelek ð¼</h2>
        <button class="btn-text text-small underline" id="view-results">Se Resultater ð</button>
      </div>
      
      ${!isFinished ? `
        ${hasVoted ? `
          <!-- WAITING STATE -->
          <div class="waiting-card fade-in">
            <div class="spinner mb-4">â³</div>
            <h3 class="heading-love mb-4">Venter pÃ¥ ${partnerRole === 'andrine' ? 'Andrine' : 'Yoel'}...</h3>
            <p class="text-muted mb-6">Du har stemt pÃ¥ <strong>${currentName}</strong>.</p>
            <p class="text-warm">Gi beskjed til partneren din!</p>
            
            <button class="btn btn-soft btn-block mt-8" id="check-sync">
              Sjekk igjen ð
            </button>
          </div>
        ` : `
          <!-- VOTING STATE -->
          <div class="name-card mb-8 fade-in" id="name-card">
            <span class="name-text">${currentName}</span>
          </div>
          
          <div class="swipe-buttons">
            <button class="swipe-btn nope" data-vote="nope" data-name="${currentName}">
              <span>â</span>
              <small>Nei</small>
            </button>
            <button class="swipe-btn maybe" data-vote="maybe" data-name="${currentName}">
              <span>ð</span>
              <small>Kanskje</small>
            </button>
            <button class="swipe-btn love" data-vote="love" data-name="${currentName}">
              <span>ð</span>
              <small>Elsker</small>
            </button>
          </div>
        `}
      ` : `
        <!-- FINISHED STATE -->
        <div class="finished-card fade-in">
          <p class="heading-love mb-4">Dere er ferdige! ð</p>
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
        <span class="status-dot">âª</span>
        <span class="status-text">Venter pÃ¥ partner...</span>
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

      // Check for match IMMEDIATELY to celebrate
      if (votes[name].andrine === 'love' && votes[name].partner === 'love') {
        // Find existing matches to avoid duplicates
        const matches = storage.get('matched_names', []);
        if (!matches.includes(name)) {
          matches.push(name);
          storage.set('matched_names', matches);
          if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
          // Could show a modal here, but for now we just proceed
        }
      }

      // Render next state (Wait or Next Name)
      const namesTimeout = setTimeout(() => {
        if (modalCleanupStack.includes(namesTimeout)) {
          // No need to clear if we are already here, but good to know
        }
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
    if (btn) btn.textContent = 'Synkroniserer... ð';

    await storage.syncWithCloud();
    await storage.pullFromCloud();

    renderNamesGame(container);
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
      renderNamesGame(container);
    }
  });

  // Start Presence Heartbeat
  const currentIdentity = localStorage.getItem('who_am_i') || 'andrine';
  startPresenceHeartbeat(currentIdentity, container, cleanupStack);
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
        <button class="btn-text btn-back-arrow" id="back-to-game">â</button>
        <h2 class="heading-section">Resultater ð</h2>
      </div>

      <div class="stats-section mb-10">
        <h3 class="heading-love mb-4">Vi Elsker! ð</h3>
        ${matches.length ? `
          <div class="tag-cloud">
            ${matches.map(n => `<span class="tag match">${n}</span>`).join('')}
          </div>
        ` : `<p class="text-muted text-center">Ingen fulltreffere ennÃ¥...</p>`}
      </div>

      <div class="stats-section mb-10">
        <h3 class="heading-love mb-4 text-primary">Kanskje-listen ð¤</h3>
        <p class="text-muted mb-4 text-small">Navn vi begge liker litt</p>
        ${maybes.length ? `
          <div class="tag-cloud">
            ${maybes.map(n => `<span class="tag maybe">${n}</span>`).join('')}
          </div>
        ` : `<p class="text-muted text-center">Ingenting her ennÃ¥.</p>`}
      </div>

      <div class="stats-section">
        <h3 class="heading-love mb-4 text-primary">Mine Favoritter ð¤</h3>
        <p class="text-muted mb-4 text-small">Navn jeg elsker (men vi ikke har matchet pÃ¥)</p>
        ${myLoves.length ? `
          <div class="tag-cloud">
            ${myLoves.map(n => `<span class="tag mine">${n}</span>`).join('')}
          </div>
        ` : `<p class="text-muted text-center">Du har ikke favorittmarkert noen andre navn.</p>`}
      </div>
    </div>
  `;

  document.getElementById('back-to-game')?.addEventListener('click', () => {
    renderNamesGame(container, cleanupStack);
  });
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð GAME 5: LOVE MISSIONS
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function renderMissions(container) {
  const role = localStorage.getItem('who_am_i') || 'andrine';
  const mission = getMission(role);
  const today = new Date().toDateString();
  const completed = storage.get(`mission_completed_${today}`, false);

  container.innerHTML = `
    <div class="text-center">
      <h2 class="heading-love mb-4">Dagens Oppdrag ð</h2>
      <p class="text-muted mb-8">En liten ting du kan gjÃ¸re for ${role === 'andrine' ? 'Yoel ð¨ð¾âð' : 'Andrine ð©'} i dag.</p>
      
      <div class="card card-soft mb-8">
        <div class="game-chip mb-4">MÃ¥l for dagen</div>
        <p class="heading-card mb-4 mission-text">"${mission}"</p>
        ${completed ? '<span class="text-love font-bold">â FullfÃ¸rt med kjÃ¦rlighet!</span>' : ''}
      </div>

      ${!completed ? `
        <button class="btn btn-primary btn-block" id="complete-mission">
          Jeg har gjort det! â¨
        </button>
      ` : `
        <div class="animate-heartbeat reveal-emoji-big">â¤ï¸</div>
        <p class="text-warm italic">Godt jobba! Din omtanke betyr alt. â¤ï¸</p>
      `}
    </div>
  `;

  document.getElementById('complete-mission')?.addEventListener('click', () => {
    storage.set(`mission_completed_${today}`, true);
    awardCoins(role, 15, 'Dagens Oppdrag');
    renderMissions(container);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  });
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð² GAME 6: BABY PREDICTIONS
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function renderPredictionsGame(container) {
  const role = localStorage.getItem('who_am_i') || 'andrine';
  const predictions = storage.get('baby_predictions', { andrine: {}, partner: {} });
  const myPredictions = predictions[role] || {};

  container.innerHTML = `
    <div class="text-center">
      <h2 class="heading-section mb-2">Gjettelek ð²</h2>
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
          Lagre i Hvelvet ð
        </button>
        <button class="btn btn-soft btn-block" id="view-vault">
          Se alle gjetninger ð
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

    container.innerHTML = `
      <div class="text-center fade-in">
        <div class="reveal-emoji-big">ð</div>
        <h2 class="heading-love mb-4">Lagret!</h2>
        <p class="text-warm mb-6">Dine gjetninger er trygt lagret. Vi sjekker dem nÃ¥r den lille kommer!</p>
        <button class="btn btn-soft btn-block" id="back-to-together">Ferdig</button>
      </div>
    `;

    document.getElementById('back-to-together')?.addEventListener('click', () => {
      document.getElementById('close-modal')?.click();
    });
  });

  document.getElementById('view-vault')?.addEventListener('click', () => {
    renderVault(container);
  });
}

function renderVault(container) {
  const predictions = storage.get('baby_predictions', { andrine: {}, partner: {} });

  container.innerHTML = `
    <div class="text-center">
      <h2 class="heading-love mb-2">Babyhvelvet ðâ¨</h2>
      <p class="text-muted mb-8 text-small">VÃ¥re gjetninger om den lille</p>
      
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

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð¸ GAME 7: LOVE AUCTION
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ð¸ GAME 7: LOVE AUCTION V2
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const SEED_ITEMS = [
  // KOS & RELAX (Cheap/Medium)
  { id: 'item_back_massage', title: '15 min Ryggmassasje', desc: 'Du gir en god og avslappende massasje.', cost: 15, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_foot_massage', title: 'Fotmassasje', desc: '10 minutter med full fokus pÃ¥ slitne fÃ¸tter.', cost: 15, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_head_scratch', title: 'Hodebunnskos', desc: '5 minutter med ren nytelse.', cost: 10, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_scratch_back', title: 'Kile pÃ¥ ryggen', desc: 'Lett kiling/klÃ¸ing til man sovner.', cost: 10, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_movie_pick', title: 'Velg Filmkveld ð¬', desc: 'Du bestemmer kveldens film (ingen veto).', cost: 30, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_series_ep', title: 'Ãn episode til', desc: 'Vi ser en episode til, selv om det er sent.', cost: 10, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_back_scratch_20', title: '20 min Rygge-klÃ¸ing ð', desc: 'Perfekt for kos.', cost: 35, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_game_night', title: 'Spillkveld av Ditt Valg ð®', desc: 'Brett- eller videospill!', cost: 45, category: 'Kos', payer: 'BEGGE' },
  { id: 'item_music_choice', title: 'Velg Musikk i Bilen ðµ', desc: 'Full kontroll pÃ¥ spillelisten!', cost: 25, category: 'Kos', payer: 'BEGGE' },

  // MAT & CRAVINGS
  { id: 'item_breakfast_bed', title: 'Frokost pÃ¥ senga', desc: 'Luksusstart pÃ¥ dagen servert av partner.', cost: 50, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_dinner_chef', title: 'Du lager middag', desc: 'Partneren slipper Ã¥ lÃ¸fte en finger.', cost: 20, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_water_fetch', title: 'Hente vann', desc: 'Hent iskaldt vann til meg (nÃ¥r som helst).', cost: 5, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_snack_run', title: 'Snack Levering', desc: 'GÃ¥ og hent cravings fra butikken/skapet.', cost: 15, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_coffee_bed', title: 'Kaffe pÃ¥ senga', desc: 'Nylaget kaffe servert fÃ¸r man stÃ¥r opp.', cost: 10, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_pizza_night', title: 'Pizza-kveld', desc: 'Vi bestiller pizza (spleisepott).', cost: 30, category: 'Mat', payer: 'BEGGE', requiresBoth: true, requiresBothConfirm: true },
  { id: 'item_takeout', title: 'Takeaway etter Eget Valg ð', desc: 'Bestill akkurat det du vil ha!', cost: 70, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_dessert', title: 'Hjemmelaget Dessert ð°', desc: 'Partneren baker din favoritt.', cost: 55, category: 'Mat', payer: 'BEGGE' },
  { id: 'item_champagne_breakfast', title: 'Champagne-frokost ð¥', desc: 'Luksus morgen for dere begge.', cost: 120, category: 'Mat', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_weekend_brunch', title: 'Weekend Brunch-laging ð³', desc: 'Lag stor brunch sammen!', cost: 95, category: 'Mat', payer: 'BEGGE', requiresBoth: true },

  // DATE & ROMANTIKK
  { id: 'item_date_night_luxury', title: 'Luksus Date Night â¨', desc: 'Begge mÃ¥ vÃ¦re med pÃ¥ denne!', cost: 150, category: 'Date', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_date_night', title: 'Date Night', desc: 'Barnevakt (eller hjemmedate) med full fokus.', cost: 50, category: 'Date', payer: 'BEGGE', requiresBoth: true, requiresBothConfirm: true },
  { id: 'item_walk_together', title: 'GÃ¥tur sammen', desc: '30 min luftetur hÃ¥nd i hÃ¥nd.', cost: 15, category: 'Date', payer: 'BEGGE' },
  { id: 'item_board_games', title: 'Brettspillkveld', desc: 'Vi legger bort mobilen og spiller.', cost: 20, category: 'Date', payer: 'BEGGE' },
  { id: 'item_cinema', title: 'Kinotur', desc: 'Vi drar pÃ¥ kino (du spanderer billettene).', cost: 60, category: 'Date', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_mini_date', title: 'Minidate hjemme', desc: 'Levende lys og god musikk i stua.', cost: 25, category: 'Date', payer: 'BEGGE' },
  { id: 'item_photo_shoot', title: 'Par-Fotoshoot ð·', desc: 'Lag fine minner sammen!', cost: 180, category: 'Date', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_stargazing', title: 'Stjernekikking-date ð', desc: 'Ute eller pÃ¥ balkongen.', cost: 85, category: 'Date', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_coffee_date_out', title: 'Kaffe-date ute â', desc: 'Koselig tur til favorittcafÃ©en.', cost: 65, category: 'Date', payer: 'BEGGE', requiresBoth: true },

  // HJELP & PRAKTISK
  { id: 'item_dishes', title: 'Ta oppvasken', desc: 'Du tar alt oppvasken i dag.', cost: 20, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_trash_out', title: 'GÃ¥ ut med sÃ¸pla', desc: 'Du tar sÃ¸pla, uten Ã¥ klage.', cost: 10, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_diaper_free', title: '1 bleie-fritak', desc: 'Slipp unna Ã©n bÃ¦sjebleie (fremtidig).', cost: 15, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_kitchen_clean', title: 'Rydd kjÃ¸kkenet', desc: 'Shine kjÃ¸kkenet mens jeg slapper av.', cost: 20, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_laundry_fold', title: 'Brette klÃ¦r', desc: 'Du bretter stativet som stÃ¥r fremme.', cost: 20, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_sleep_in', title: 'Sove lenge', desc: 'Du stÃ¥r opp, jeg sover til 10:00.', cost: 40, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_chore_pass', title: 'Slipp unna Oppvask ð§¼', desc: 'Et "get out of jail" kort for kjedelig arbeid.', cost: 40, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_lazy_day', title: 'Ingen Forventninger-dag ð´', desc: 'Dagen din, null stress!', cost: 90, category: 'Hjelp', payer: 'BEGGE' },
  { id: 'item_no_phone', title: 'Telefonfri Kveld ðµ', desc: 'Bare dere to, ingen skjermer.', cost: 110, category: 'Hjelp', payer: 'BEGGE', requiresBoth: true },

  // OVERRASKELSER & GAVER
  { id: 'item_small_gift', title: 'Liten gave', desc: 'Noe smÃ¥tt jeg Ã¸nsker meg (maks 100kr).', cost: 30, category: 'Overraskelse', payer: 'BEGGE' },
  { id: 'item_surprise_gift', title: 'Liten Overraskelse ð', desc: 'Partneren din mÃ¥ kjÃ¸pe noe lite (under 100,-).', cost: 80, category: 'Overraskelse', payer: 'BEGGE' },
  { id: 'item_flowers', title: 'Blomster', desc: 'En fin bukett pÃ¥ dÃ¸ra eller bordet.', cost: 35, category: 'Overraskelse', payer: 'BEGGE' },
  { id: 'item_chocolate', title: 'Sjokoladeplate', desc: 'Min favorittsjokolade.', cost: 15, category: 'Overraskelse', payer: 'BEGGE' },
  { id: 'item_love_letter', title: 'KjÃ¦rlighetsbrev', desc: 'Et hÃ¥ndskrevet kort/brev fra deg.', cost: 20, category: 'Overraskelse', payer: 'BEGGE' },

  // SPA & VELVÃRE
  { id: 'item_massage_15', title: '15 min Massasje ðââï¸', desc: 'Valgfritt omrÃ¥de!', cost: 60, category: 'VelvÃ¦re', payer: 'BEGGE' },
  { id: 'item_spa_night', title: 'Hjemmespa-kveld ð§¼', desc: 'Ansiktsmasker og hygge.', cost: 100, category: 'VelvÃ¦re', payer: 'BEGGE', requiresBoth: true },

  // PARENT PREP (Baby)
  { id: 'item_baby_name_veto', title: 'Navn Veto-kort', desc: 'Jeg kan legge ned veto mot ett navneforslag.', cost: 50, category: 'Baby', payer: 'BEGGE' },
  { id: 'item_name_truce', title: 'Navne-fred ð¼', desc: 'Ingen krangling om favorittnavn i 24t.', cost: 200, category: 'Baby', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_pack_bag', title: 'Pakke FÃ¸debag', desc: 'Vi pakker bagen sammen i kveld.', cost: 15, category: 'Baby', payer: 'BEGGE', requiresBoth: true },
  { id: 'item_belly_oil', title: 'SmÃ¸re magen', desc: 'Olje/krem pÃ¥ magen med massasje.', cost: 10, category: 'Baby', payer: 'BEGGE' },
  { id: 'item_playlist', title: 'FÃ¸de-spilleliste', desc: 'Du lager en liste med sanger til fÃ¸dselen.', cost: 20, category: 'Baby', payer: 'BEGGE' }
];

const SEED_AUCTION_REWARDS = [
  { id: 'auc_full_massage', title: '60 min Full Kroppsmassasje', desc: 'Den ultimate spaopplevelsen hjemme.', startPrice: 40, minIncrement: 5, category: 'Luksus' },
  { id: 'auc_remote_master', title: 'Master of Remote', desc: 'Full kontroll over TV-en en hel kveld.', startPrice: 20, minIncrement: 2, category: 'Makt' },
  { id: 'auc_weekend_off', title: 'Helg uten planer', desc: 'Vi sier nei til alt og bare er hjemme.', startPrice: 50, minIncrement: 10, category: 'Frihet' },
  { id: 'auc_yes_day', title: 'Ja-dag', desc: 'Du mÃ¥ si ja til (nesten) alt jeg foreslÃ¥r.', startPrice: 80, minIncrement: 10, category: 'Makt' },
  { id: 'auc_fancy_dinner', title: '3-retters middag', desc: 'Du lager forrett, hovedrett og dessert.', startPrice: 60, minIncrement: 5, category: 'Mat' },
  { id: 'auc_free_pass', title: 'Fri-kort', desc: 'Slipp unna en valgfri kjedelig oppgave.', startPrice: 30, minIncrement: 5, category: 'Frihet' },
  { id: 'auc_breakfast_week', title: 'Frokost-uke', desc: 'Du lager frokost hver dag i en uke.', startPrice: 70, minIncrement: 10, category: 'Mat' },
  { id: 'auc_chauffeur', title: 'PrivatsjÃ¥fÃ¸r', desc: 'Du kjÃ¸rer og henter meg hvor som helst en kveld.', startPrice: 25, minIncrement: 5, category: 'Praktisk' },
  { id: 'auc_tech_free', title: 'Teknologifri kveld', desc: 'Ingen skjermer, bare oss i 4 timer.', startPrice: 40, minIncrement: 5, category: 'Kos' },
  { id: 'auc_baby_morning', title: '3 x Morgenskift', desc: 'Jeg tar de tre fÃ¸rste morgenene med babyen.', startPrice: 90, minIncrement: 10, category: 'Baby' },
  { id: 'auc_chef_week', title: 'Personal Chef-uke', desc: 'Jeg lager middag hele uken.', startPrice: 100, minIncrement: 10, category: 'Mat' },
  { id: 'auc_clean_month', title: 'MÃ¥nedlig StorrengjÃ¸ring', desc: 'Jeg tar hovedrengjÃ¸ringen Ã©n gang.', startPrice: 80, minIncrement: 10, category: 'Praktisk' },
  { id: 'auc_spa_package', title: 'Hjemme-spa Pakke', desc: 'Bad, massasje, ansiktsmaske - alt sammen.', startPrice: 120, minIncrement: 15, category: 'Luksus' },
  { id: 'auc_night_owl', title: 'Nattevakt-pass', desc: '3 netter hvor jeg tar alt med babyen.', startPrice: 150, minIncrement: 20, category: 'Baby' },
  { id: 'auc_adventure_day', title: 'Eventyrdag', desc: 'Jeg planlegger en hel dag med aktiviteter.', startPrice: 60, minIncrement: 10, category: 'Date' },
  { id: 'auc_morning_routine', title: 'Morgenrutine-hjelp', desc: 'Jeg ordner alt om morgenen i 5 dager.', startPrice: 55, minIncrement: 5, category: 'Praktisk' },
  { id: 'auc_gaming_marathon', title: 'Gaming Marathon', desc: '4 timer uten avbrytelser pÃ¥ favorittspillet.', startPrice: 35, minIncrement: 5, category: 'Fritid' },
  { id: 'auc_movie_marathon', title: 'Film-maraton', desc: 'Velg 3 filmer pÃ¥ rad, ingen protester.', startPrice: 40, minIncrement: 5, category: 'Kos' },
  { id: 'auc_laundry_month', title: 'Vaskehjelp-mÃ¥ned', desc: 'All vask og bretting i en mÃ¥ned.', startPrice: 110, minIncrement: 15, category: 'Praktisk' },
  { id: 'auc_romantic_evening', title: 'Romantisk Aften', desc: 'Lys, musikk, god mat - alt planlagt.', startPrice: 75, minIncrement: 10, category: 'Date' },
  { id: 'auc_sleep_weekend', title: 'SÃ¸vn-helg', desc: 'Du fÃ¥r sove sÃ¥ lenge du vil begge dager.', startPrice: 90, minIncrement: 10, category: 'Frihet' },
  { id: 'auc_delivery_week', title: 'Takeaway-uke', desc: 'Vi bestiller mat hver dag i en uke.', startPrice: 200, minIncrement: 20, category: 'Mat' },
  { id: 'auc_photo_album', title: 'Lag Fotoalbum', desc: 'Jeg setter sammen et album med minner.', startPrice: 50, minIncrement: 5, category: 'Overraskelse' },
  { id: 'auc_car_detail', title: 'Totalvask av Bil', desc: 'Full vask, stÃ¸vsuging, og rens innvendig.', startPrice: 65, minIncrement: 10, category: 'Praktisk' },
  { id: 'auc_surprise_date', title: 'Hemmelig Date', desc: 'En helt planlagt date du ikke vet noe om.', startPrice: 85, minIncrement: 10, category: 'Date' }
];

function renderAuctionGame(container, cleanupStack) {
  const role = localStorage.getItem('who_am_i') || 'andrine';

  // 1. INIT STATE (Migration V1 -> V2 if needed)
  let state = storage.get('love_auction_v2', null);
  if (!state) {
    const v1 = storage.get('love_auction_v1', null);
    state = {
      version: 2,
      activeProfileId: role,
      profiles: {
        andrine: { coins: v1?.coins?.andrine || 50, weeklyEarned: 0, streak: 0 },
        partner: { coins: v1?.coins?.partner || 50, weeklyEarned: 0, streak: 0 }
      },
      ledger: v1?.ledger || [],
      shopItems: [...SEED_ITEMS],
      auctions: [],
      ownedRewards: []
    };
    storage.set('love_auction_v2', state);
  }

  // Ensure active auctions exist
  tickAuctions(state);
  storage.set('love_auction_v2', state); // Save any tick updates

  // 2. HELPER: Save & Render
  const saveAndRender = () => {
    storage.set('love_auction_v2', state);
    storage.syncWithCloud(); // Fire & Forget
    renderUI();
  };

  // 3. UI STATE
  let currentTab = 'earn'; // earn, shop, auction, inventory
  let shopFilter = 'Alle';
  let inventoryDetail = 'ready'; // ready, won, redeemed

  // 4. MAIN RENDER FUNCTION
  const renderUI = () => {
    // Determine active wallet
    const activeUser = state.activeProfileId; // 'andrine' or 'partner'
    const profile = state.profiles[activeUser];
    const isMe = role === activeUser;

    container.innerHTML = `
      <div class="auction-page ios-scroll-lock">
        <!-- HEADER: Wallet & Switcher -->
        <div class="text-center mb-6 pt-2">
          <div class="flex justify-center mb-4">
             <div class="wallet-switcher">
               <button class="switch-btn ${activeUser === 'andrine' ? 'active-andrine' : ''}" id="switch-andrine">
                 Andrine ð
               </button>
               <button class="switch-btn ${activeUser === 'partner' ? 'active-partner' : ''}" id="switch-partner">
                 Partner ð
               </button>
             </div>
          </div>
          
          <div class="flex flex-col items-center animate-fade-in">
             <span class="text-tiny text-muted uppercase mb-1">Saldo</span>
             <div class="wallet-balance">
               ðª ${profile.coins}
             </div>
             ${profile.weeklyEarned > 0 ? `<span class="wallet-weekly">+${profile.weeklyEarned} i uken</span>` : ''}
          </div>
        </div>

        <!-- NAVIGATION TABS -->
        <div class="auction-nav">
          <button class="nav-tab ${currentTab === 'earn' ? 'active' : ''}" data-tab="earn">Tjen ð°</button>
          <button class="nav-tab ${currentTab === 'shop' ? 'active' : ''}" data-tab="shop">Butikk ð</button>
          <button class="nav-tab ${currentTab === 'auction' ? 'active' : ''}" data-tab="auction">Auksjon ð¨</button>
          <button class="nav-tab ${currentTab === 'inventory' ? 'active' : ''}" data-tab="inventory">Meg ð</button>
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
        <h3 class="earn-section-title">Daglige Muligheter â¨</h3>
        
        <div class="card card-soft daily-claim-card">
          <div>
            <p class="font-bold text-gray-800">Daglig Bonus</p>
            <p class="text-xs text-muted">Kom tilbake hver dag!</p>
          </div>
          <button class="btn-daily ${!canClaim ? 'btn-disabled' : ''}" id="btn-daily-claim" ${!canClaim ? 'disabled' : ''}>
            ${canClaim ? 'Hent +10 ðª' : 'Hentet â'}
          </button>
        </div>

        <h3 class="earn-section-title mt-8">Innsats</h3>
        <div class="soft-task-list">
          ${renderSoftTask(user, 'hug', 'Klem / Omsorg', 'Gitt god klem eller trÃ¸st', 3)}
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
          ${done ? 'Bra! ð' : `+${amount} ðª`}
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
                   <span class="shop-category">${item.category}</span>
                   <h4 class="shop-title">${item.title}</h4>
                 </div>
                 <p class="shop-desc">${item.desc}</p>
                 <div class="shop-footer">
                   <div class="shop-price-row">
                     <span class="heading-card">ðª ${item.cost}</span>
                     ${item.requiresBoth ? '<span class="badge badge-soft">Begge MÃ¥</span>' : ''}
                   </div>
                   <button class="btn btn-sm btn-block ${canAfford ? 'btn-soft' : 'btn-soft btn-disabled'}" 
                     onclick="window.buyShopItem('${user}', '${item.id}')" ${!canAfford ? 'disabled' : ''}>
                     KjÃ¸p
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
      return `<div class="p-8 text-center text-muted">Ingen aktive auksjoner akkurat nÃ¥. <br>Nye kommer snart! ð¨</div>`;
    }

    return `
      <div class="animate-fade-in auction-list">
        ${activeAuctions.map(auc => {
      const timeLeft = Math.max(0, new Date(auc.endTs) - new Date());
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const mins = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const isLeader = auc.highestBidder === user;
      const minBid = (auc.highestBid || auc.startPrice) + auc.minIncrement;
      const canAfford = profile.coins >= minBid;

      return `
            <div class="auction-card">
               <div class="card-header mb-2 flex justify-between items-start">
                 <span class="game-chip badge-primary">Auksjon</span>
                 <span class="timer-badge ${hours < 1 ? 'badge-danger' : ''}">${hours}t ${mins}m</span>
               </div>
               
               <h3 class="heading-card mb-1">${auc.title}</h3>
               <p class="text-xs text-muted mb-4">${auc.desc}</p>
               
               <div class="bid-box">
                 <div>
                   <p class="text-xs text-muted uppercase">HÃ¸yeste bud</p>
                   <p class="bid-value">ðª ${auc.highestBid || auc.startPrice}</p>
                 </div>
                 <div class="text-right">
                   <p class="text-xs text-muted">Leder</p>
                   ${auc.highestBidder ?
          `<span class="badge ${auc.highestBidder === 'andrine' ? 'badge-soft' : 'badge-primary'}">${auc.highestBidder === 'andrine' ? 'Andrine' : 'Partner'}</span>`
          : '<span class="text-xs text-muted">-</span>'}
                 </div>
               </div>

               ${isLeader ?
          `<button class="btn btn-soft btn-block btn-leader" disabled>Du leder! ð</button>`
          :
          `<div class="flex gap-2">
                    <button class="btn btn-primary flex-1 text-sm" 
                      onclick="window.placeBid('${user}', '${auc.id}', ${minBid})" ${!canAfford ? 'disabled' : ''}>
                      By ${minBid} ðª
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
    // Inventory Items logic
    const all = state.ownedRewards.filter(r => r.payer === user || r.payer === 'BEGGE');
    const filtered = all.filter(r => {
      if (inventoryDetail === 'ready') return r.status === 'READY' || r.status === 'WON';
      if (inventoryDetail === 'redeemed') return r.status === 'REDEEMED';
      return true;
    });

    return `
      <div class="animate-fade-in">
        <!-- SUB TABS -->
        <div class="inventory-tabs">
          <button class="inventory-tab ${inventoryDetail === 'ready' ? 'active' : ''}" onclick="window.setInvTab('ready')">Klar â¨</button>
          <button class="inventory-tab ${inventoryDetail === 'redeemed' ? 'active' : ''}" onclick="window.setInvTab('redeemed')">Historikk ð</button>
        </div>

        <div class="inventory-list">
          ${filtered.length === 0 ? '<p class="text-center text-muted py-8">Her var det tomt...</p>' : ''}
          ${filtered.map(item => {
      const isPending = item.waitingForPartnerConfirmation;
      return `
               <div class="inventory-card">
                 ${item.status === 'WON' ? '<div class="status-badge status-won">VUNNET</div>' : ''}
                 ${item.status === 'REDEEMED' ? '<div class="status-badge status-redeemed">BRUKT</div>' : ''}
                 
                 <h4 class="shop-title">${item.title}</h4>
                 <p class="text-xs text-muted mb-3">Fra: ${item.source}</p>
                 
                 ${item.status !== 'REDEEMED' ? `
                   ${item.requiresBothConfirm && !item.confirmations?.[user] ? `
                     <button class="btn btn-primary btn-block btn-sm" onclick="window.redeemItem('${user}', '${item.id}')">
                       Jeg bekrefter ð¤
                     </button>
                     ${item.confirmations && Object.values(item.confirmations).some(v => v) ? '<p class="text-xs text-center text-blue-500 mt-2">Venter pÃ¥ den andre...</p>' : ''}
                   ` : item.requiresBothConfirm && item.confirmations?.[user] ? `
                      <button class="btn btn-soft btn-block btn-sm" disabled>Venter pÃ¥ partner... â³</button>
                   ` : `
                     <button class="btn btn-primary btn-block btn-sm" onclick="window.redeemItem('${user}', '${item.id}')">
                       Bruk nÃ¥ â¨
                     </button>
                   `}
                 ` : '<p class="text-xs text-center text-success font-bold">InnlÃ¸st âï¸</p>'}
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
                  <span class="text-gray-600">${l.meta?.desc || l.kind}</span>
               </div>
               <span class="font-mono font-bold ${l.amount > 0 ? 'text-green-600' : 'text-red-500'}">
                 ${l.amount > 0 ? '+' : ''}${l.amount}
               </span>
             </div>
           `).join('')}
        </div>

        <div class="mt-8 mb-8 text-center animate-fade-in">
           <p class="text-xs text-muted mb-3 opacity-60">Data lagres lokalt i nettleseren.</p>
           <div class="flex gap-3 justify-center">
             <button class="btn-backup" onclick="window.exportAuctionJSON()">Lagre Backup ð¾</button>
             <button class="btn-backup" onclick="window.importAuctionJSON()">Gjenopprett ð¥</button>
           </div>
        </div>
      </div>
    `;
  };

  // 5. ATTACH LISTENERS
  const attachEventListeners = () => {
    // Switcher
    container.querySelector('#switch-andrine')?.addEventListener('click', () => {
      state.activeProfileId = 'andrine';
      saveAndRender();
    });
    container.querySelector('#switch-partner')?.addEventListener('click', () => {
      state.activeProfileId = 'partner';
      saveAndRender();
    });

    // Nav
    container.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentTab = e.target.dataset.tab;
        renderUI();
      });
    });

    // Daily Claim
    container.querySelector('#btn-daily-claim')?.addEventListener('click', () => {
      const active = state.activeProfileId;
      addLedger(state, 'DAILY_CLAIM', active, 10, { desc: 'Daglig bonus' });
      state.profiles[active].coins += 10;
      storage.set(`last_coin_claim_${active}`, new Date().toDateString());
      saveAndRender();
      if (navigator.vibrate) navigator.vibrate(50);
    });
  };

  // 6. GLOBAL WINDOW EXPORTS (Simplified for onClick handlers string interpolation)
  window.setShopFilter = (cat) => { shopFilter = cat; renderUI(); };
  window.setInvTab = (tab) => { inventoryDetail = tab; renderUI(); };

  window.handleSoftTask = (user, taskId, amount) => {
    const today = new Date().toDateString();
    const key = `task_${taskId}_${user}_${today}`;
    if (storage.get(key, false)) return;

    storage.set(key, true);
    state.profiles[user].coins += amount;
    addLedger(state, 'TASK', user, amount, { desc: taskId });
    saveAndRender();
    if (navigator.vibrate) navigator.vibrate([30, 30]);
  };

  window.buyShopItem = (user, itemId) => {
    const item = state.shopItems.find(i => i.id === itemId);
    if (!item || state.profiles[user].coins < item.cost) return;

    if (item.requiresBothConfirm) {
      // Logic for split pay is tricky with instant buy. Simpler: One buys, other confirms later?
      // User requested: "BEGGE items: if requiresBothConfirm: needs both confirmations... once both confirmed -> status REDEEMED"
      // User also said: "Payer types: BEGGE (split 50/50)".
      // Implementation:
      // 1. Check if both have coins? Complex UI.
      // Simpler: User A buys "Share". It goes to inventory as "Waiting for Partner". Cost is deducted from A? Or split?
      // Let's do: Cost is deducted immediately from Buyer? Or Ledger holds it?
      // User Spec: "BEGGE items ... if requiresBothConfirm: needs both confirmations to REDEEM".
      // Impl: Buy -> Inventory (Status READY, confirmations: {buyer: true}).
      // If Payer=Begge, Cost is split when buying?
      // Let's simplify: Buyer pays FULL cost if they click buy?
      // Re-read spec: "BEGGE (split 50/50; if odd cost, partner pays +1)"
      // So when buying a BEGGE item:
      // Valid only if BOTH have coins.
      const half = Math.ceil(item.cost / 2); // Partner pays more on odd
      const p1 = user;
      const p2 = user === 'andrine' ? 'partner' : 'andrine';

      if (item.payer === 'BEGGE') {
        if (state.profiles[p1].coins < Math.floor(item.cost / 2) || state.profiles[p2].coins < Math.floor(item.cost / 2)) {
          alert('Begge mÃ¥ ha nok coins til Ã¥ spleise!');
          return;
        }
        // Deduct
        const cost1 = user === 'andrine' ? Math.floor(item.cost / 2) : Math.ceil(item.cost / 2);
        const cost2 = item.cost - cost1;
        state.profiles[p1].coins -= cost1;
        state.profiles[p2].coins -= cost2;
        addLedger(state, 'BUY_SPLIT', p1, -cost1, { desc: `Spleis: ${item.title}` });
        addLedger(state, 'BUY_SPLIT', p2, -cost2, { desc: `Spleis: ${item.title}` });
      } else {
        // Single payer
        state.profiles[user].coins -= item.cost;
        addLedger(state, 'BUY', user, -item.cost, { desc: `KjÃ¸p: ${item.title}` });
      }
    } else {
      // Normal Buy
      state.profiles[user].coins -= item.cost;
      addLedger(state, 'BUY', user, -item.cost, { desc: `KjÃ¸p: ${item.title}` });
    }

    // Add to inventory
    state.ownedRewards.push({
      id: crypto.randomUUID(),
      title: item.title,
      source: 'SHOP',
      payer: item.payer,
      requiresBothConfirm: item.requiresBothConfirm || false,
      status: 'READY',
      acquiredTs: new Date().toISOString(),
      confirmations: {}
    });

    saveAndRender();
    if (navigator.vibrate) navigator.vibrate(50);
  };

  window.placeBid = (user, aucId, amount) => {
    const aucIdx = state.auctions.findIndex(a => a.id === aucId);
    if (aucIdx < 0) return;
    const auc = state.auctions[aucIdx];

    // Refund previous leader
    if (auc.highestBidder) {
      state.profiles[auc.highestBidder].coins += auc.highestBid;
      // Note: Ledger for refund is nice but maybe noisy? Spec said "If outbid, refund previous bidder escrow immediately."
      // addLedger(state, 'REFUND', auc.highestBidder, auc.highestBid, { desc: `Overbydd: ${auc.title}` }); 
    }

    // Deduct new bid
    state.profiles[user].coins -= amount;
    // addLedger(state, 'BID_ESCROW', user, -amount, { desc: `Bud: ${auc.title}` });

    // Update Auction
    state.auctions[aucIdx].highestBid = amount;
    state.auctions[aucIdx].highestBidder = user;
    state.auctions[aucIdx].updatedTs = new Date().toISOString();

    saveAndRender();
    if (navigator.vibrate) navigator.vibrate(50);
  };

  window.redeemItem = (user, itemId) => {
    const itemIdx = state.ownedRewards.findIndex(i => i.id === itemId);
    if (itemIdx < 0) return;
    const item = state.ownedRewards[itemIdx];

    if (item.requiresBothConfirm) {
      if (!item.confirmations) item.confirmations = {};
      item.confirmations[user] = true;
      // Check if both
      if (item.confirmations.andrine && item.confirmations.partner) {
        item.status = 'REDEEMED';
        addLedger(state, 'REDEEM', 'BEGGE', 0, { desc: `Brukt: ${item.title}` });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else {
        saveAndRender();
        return;
      }
    } else {
      item.status = 'REDEEMED';
      addLedger(state, 'REDEEM', user, 0, { desc: `Brukt: ${item.title}` });
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
    saveAndRender();
  };

  // 7. INITIAL RENDER
  renderUI();

  // 8. CLOCK (Cleanup)
  const interval = setInterval(() => {
    renderUI(); // Update timers
    tickAuctions(state); // Check settlements
  }, 10000); // 10s is enough for minute updates
  cleanupStack.push(() => clearInterval(interval));
}

// ââââ HELPERS ââââ
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
  if (!state) return alert('Ingen data Ã¥ eksportere.');

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "kjÃ¦rlighets_kreditt_backup.json");
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
        alert('Importert! Last siden pÃ¥ nytt.');
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
        indicator.querySelector('.status-dot').textContent = 'ð¢';
        indicator.querySelector('.status-text').textContent = `${role === 'andrine' ? 'Yoel' : 'Andrine'} er her!`;
      } else if (indicator) {
        indicator.classList.remove('online');
        indicator.querySelector('.status-dot').textContent = 'âª';
        indicator.querySelector('.status-text').textContent = 'Venter pÃ¥ partner...';
      }
    } catch (err) {
      console.warn('Presence check failed', err);
    }
  };

  // Run immediately then interval
  check();
  presenceInterval = setInterval(check, 5000);
  cleanupStack.push(() => clearInterval(presenceInterval));
}