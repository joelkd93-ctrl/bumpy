/**
 * Bumpy - A Loving Pregnancy Companion 💕
 * Made with love for Andrine
 */

// Set API base URL FIRST before any imports
window.API_BASE = "https://bumpyapi.joelkd93.workers.dev";

import './styles/main.css';
import './styles/polish.css';
import { storage, initializeDefaults } from './utils/storage.js';
import { notifyHeart, notifyKick } from './utils/notifications.js';
import { renderHome, initHome } from './pages/home.js';
import { renderJournal, initJournal } from './pages/journal.js';
import { renderTimeline, initTimeline } from './pages/timeline.js';
import { renderFeelings, initFeelings } from './pages/feelings.js';
import { renderTogether, initTogether } from './pages/together.js';
import { renderKicks, initKicks } from './pages/kicks.js';
import { renderSettings, initSettings } from './pages/settings.js';

// ═══════════════════════════════════════════════════════════════
// 📳 HAPTIC FEEDBACK
// ═══════════════════════════════════════════════════════════════

const haptic = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 5, 10]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 20, 50]);
    }
  }
};

// Export haptic for use in other modules
window.haptic = haptic;

// ═══════════════════════════════════════════════════════════════
// 👆 SWIPE GESTURE DETECTION
// ═══════════════════════════════════════════════════════════════

let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

function handleSwipe() {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);

  // Only process horizontal swipes (ignore vertical scrolling)
  if (absDeltaX < SWIPE_THRESHOLD || absDeltaY > absDeltaX) {
    return;
  }

  const currentIndex = TABS.findIndex(t => t.id === currentTab);

  if (deltaX > 0 && currentIndex > 0) {
    // Swipe right - go to previous tab
    haptic.light();
    navigate(TABS[currentIndex - 1].id);
  } else if (deltaX < 0 && currentIndex < TABS.length - 1) {
    // Swipe left - go to next tab
    haptic.light();
    navigate(TABS[currentIndex + 1].id);
  }
}

// ═══════════════════════════════════════════════════════════════
// 📱 TAB CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id: 'home', icon: '🏠', label: 'Hjem', render: renderHome, init: initHome },
  { id: 'timeline', icon: '💖', label: 'Reise', render: renderTimeline, init: initTimeline },
  { id: 'kicks', icon: '🦶', label: 'Spark', render: renderKicks, init: initKicks },
  { id: 'feelings', icon: '😊', label: 'Følelser', render: renderFeelings, init: initFeelings },
  { id: 'journal', icon: '📔', label: 'Dagbok', render: renderJournal, init: initJournal },
  { id: 'together', icon: '🥰', label: 'Sammen', render: renderTogether, init: initTogether },
  { id: 'settings', icon: '⚙️', label: 'Innstillinger', render: renderSettings, init: initSettings }
];

// ═══════════════════════════════════════════════════════════════
// 🎯 APP STATE
// ═══════════════════════════════════════════════════════════════

let currentTab = 'home';

// ═══════════════════════════════════════════════════════════════
// 🚀 INITIALIZE
// ═══════════════════════════════════════════════════════════════

function initApp() {
  // Initialize storage defaults
  initializeDefaults();

  // Render app shell
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="sync-indicator" class="sync-indicator">
      <span class="sync-icon">☁️</span>
      <span class="sync-text">Synced</span>
    </div>

    <main class="app-content" id="content">
      <!-- Page content renders here -->
    </main>

    <nav class="nav-bar" id="nav-bar">
      ${TABS.map(tab => `
        <button class="nav-item ${tab.id === currentTab ? 'active' : ''}" data-tab="${tab.id}">
          <span class="nav-icon">${tab.icon}</span>
          <span class="nav-label">${tab.label}</span>
        </button>
      `).join('')}
    </nav>
  `;

  // Set up tab navigation
  const navBar = document.getElementById('nav-bar');
  navBar.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
      haptic.light();
      navigate(navItem.dataset.tab);
    }
  });

  // Set up swipe gestures on content area
  const content = document.getElementById('content');
  content.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  content.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });

  // Add haptic feedback to all buttons
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button, .btn, .card, .game-card, .mood-btn');
    if (button && !button.classList.contains('nav-item')) {
      haptic.light();
    }
  }, true);

  // Initial render
  navigate(currentTab);

  // Register service worker
  registerSW();

  // Handle daily content refresh
  setupDailyRefresh();

  // Log ready
  console.log('💕 Bumpy is ready');
}

// ═══════════════════════════════════════════════════════════════
// 🧭 NAVIGATION
// ═══════════════════════════════════════════════════════════════

let isNavigating = false;

async function navigate(tabId) {
  const tab = TABS.find(t => t.id === tabId);
  if (!tab || isNavigating) return;

  const previousTab = currentTab;
  const content = document.getElementById('content');
  const currentPage = content.querySelector('.page');

  // Determine transition direction
  const previousIndex = TABS.findIndex(t => t.id === previousTab);
  const newIndex = TABS.findIndex(t => t.id === tabId);
  const direction = newIndex > previousIndex ? 'forward' : 'backward';

  // Update current tab
  currentTab = tabId;

  // Update nav bar active state with smooth transition
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });

  // If there's a current page, animate it out
  if (currentPage && previousTab !== tabId) {
    isNavigating = true;

    // Add exit animation
    currentPage.style.animation = direction === 'forward'
      ? 'pageOutLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      : 'pageOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';

    // Wait for exit animation, then show new page
    setTimeout(async () => {
      await showNewPage(content, tab, direction);
      isNavigating = false;
    }, 300);
  } else {
    // First load or same page - no transition
    await showNewPage(content, tab, 'none');
  }

  // Scroll to top smoothly
  content.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showNewPage(content, tab, direction) {
  // Pull updates from cloud before rendering
  await storage.pullFromCloud();

  // Create new page with appropriate entrance animation
  const animationClass = direction === 'forward' ? 'pageInRight' :
                         direction === 'backward' ? 'pageInLeft' :
                         'pageIn';

  content.innerHTML = `<div class="page active" style="animation: ${animationClass} 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards">${tab.render()}</div>`;

  // Run page init if exists
  if (tab.init) {
    requestAnimationFrame(() => {
      tab.init();
    });
  }
}

// Refresh current page (for use after data changes)
function refreshCurrentPage() {
  navigate(currentTab);
  checkWeeklyCelebration();
}

// ═══════════════════════════════════════════════════════════════
// 📲 SERVICE WORKER
// ═══════════════════════════════════════════════════════════════

function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('✨ Offline mode enabled');

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('🆕 New version available');
            }
          });
        });
      } catch (err) {
        console.warn('Offline mode not available:', err);
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 💓 GLOBAL HEARTBEAT & KICK SYNC
// ═══════════════════════════════════════════════════════════════

let lastPartnerTapReceived = null;
let lastAndrineKickReceived = null;
let heartbeatPoller = null;
let isPartnerOnlineFlag = false;
let heartbeatTimeout = null;
const appStartTime = Date.now();

async function startGlobalHeartbeatPoller() {
  if (heartbeatPoller) return;

  console.log('💓 Global heartbeat poller started');

  heartbeatPoller = setInterval(async () => {
    const role = localStorage.getItem('who_am_i');
    if (!role) return;

    try {
      const response = await fetch(`${window.API_BASE}/api/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        console.warn('📡 Presence API error:', response.status);
        return;
      }

      const data = await response.json();

      // Update online status
      isPartnerOnlineFlag = !!data.online;

      // Handle Heartbeat (Partner Tap)
      if (data.partnerLastTap && data.partnerLastTap !== lastPartnerTapReceived) {
        // Is this a fresh tap or a very recent one (within last 30s) that we haven't seen?
        const tapTime = new Date(data.partnerLastTap).getTime();
        const isVeryRecent = (Date.now() - tapTime) < 30000;

        if (lastPartnerTapReceived !== null || isVeryRecent) {
          console.log('💓 Heartbeat received from partner');
          showGlobalHeartbeat();
          notifyHeart(); // Send notification
        }
        lastPartnerTapReceived = data.partnerLastTap;
      }

      // Handle Kick Notification (Yoel only)
      if (role === 'partner' && data.andrineLastKick && data.andrineLastKick !== lastAndrineKickReceived) {
        if (lastAndrineKickReceived !== null) {
          console.log('🦶 Andrine started a kick session!');
          showGlobalKickNotification();
          notifyKick(); // Send notification
        }
        lastAndrineKickReceived = data.andrineLastKick;
      }

      // Sync Active Session Data
      const prevSession = window.app.andrineActiveSession;
      const prevCount = prevSession ? prevSession.count : 0;
      const nextSession = data.andrineActiveSession;
      const nextCount = nextSession ? nextSession.count : 0;

      // Was session reset/cleared?
      const wasReset = prevSession && !nextSession;
      const startTimeChanged = prevSession && nextSession && prevSession.startTime !== nextSession.startTime;

      // Update global state
      window.app.andrineActiveSession = nextSession;

      // DETECT NEW KICK (Yoel only)
      if (role === 'partner' && nextCount > prevCount && !startTimeChanged) {
        console.log(`🦶 Kick ${nextCount} detected! Triggering effect...`);
        triggerKickPop();
      }

      const prevSessionStr = JSON.stringify(prevSession);
      const nextSessionStr = JSON.stringify(nextSession);

      if (prevSessionStr !== nextSessionStr) {
        console.log(`🔄 Presence Sync: ${role} | New Session Data:`, nextSession);

        // Refresh UI if we are on the kicks page and not the one counting
        if (window.app.getCurrentTab() === 'kicks' && role === 'partner') {
          console.log('🦶 Refreshing Yoel\'s kick view...');
          window.app.refreshCurrentPage();
        }
      }

      // If reset happened, clear lists too
      if (wasReset && role === 'partner') {
        console.log('🧹 Session cleared, pulling fresh data...');
        storage.pullFromCloud().then(() => {
          window.app.refreshCurrentPage();
        });
      }
    } catch (err) {
      // Quietly log network errors
      if (err.name !== 'TypeError') console.warn('💓 Poller network error:', err.message);
    }
  }, 2000);
}

/**
 * Visual Effects
 */
function triggerKickPop() {
  console.log('🎉 triggerKickPop called - creating kick celebration');

  const emojis = ['🦶', '👶', '💕', '💙', '✨', '🤰', '🌟', '💖', '⭐', '🎈'];
  const count = 30;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const delay = i * 50; // Stagger the appearance

    // Use same technique that works
    el.style.position = 'fixed';
    el.style.left = (5 + Math.random() * 90) + '%';
    el.style.top = (70 + Math.random() * 20) + '%'; // Start from bottom
    el.style.fontSize = (emoji === '🦶' ? 70 + Math.random() * 30 : 40 + Math.random() * 30) + 'px';
    el.style.zIndex = '999999';
    el.style.pointerEvents = 'none';
    el.innerText = emoji;

    // Start invisible
    el.style.opacity = '0';
    el.style.transition = 'all 2.5s ease-out';

    document.body.appendChild(el);

    // Trigger animation with delay
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = `translateY(-${300 + Math.random() * 400}px) rotate(${-30 + Math.random() * 60}deg) scale(1.2)`;
    }, delay);

    // Fade out and remove
    setTimeout(() => {
      el.style.opacity = '0';
    }, 2000 + delay);

    setTimeout(() => el.remove(), 3000 + delay);
  }
}

function showGlobalHeartbeat() {
  const role = localStorage.getItem('who_am_i');
  const partnerName = role === 'andrine' ? 'Yoel' : 'Andrine';
  const partnerEmoji = partnerName === 'Yoel' ? '👨🏾' : '👩';

  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

  let overlay = document.querySelector('.global-heartbeat-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'global-heartbeat-overlay';
    overlay.innerHTML = `
      <div class="global-heartbeat-content">
        <span class="global-heart-icon">❤️</span>
        <div class="global-heartbeat-label"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const label = overlay.querySelector('.global-heartbeat-label');
  label.innerHTML = `Hjertet mitt slår for deg 💓<br><small style="opacity: 0.8; font-size: 0.7em;">Hilsen ${partnerName} ${partnerEmoji}</small>`;

  // Reset timeout and force reflow
  if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
  overlay.classList.remove('active');
  overlay.offsetHeight; // Force reflow

  overlay.classList.add('active');
  heartbeatTimeout = setTimeout(() => {
    overlay.classList.remove('active');
    heartbeatTimeout = null;
  }, 3500);
}

function showGlobalKickNotification() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

  let overlay = document.querySelector('.global-kick-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'global-kick-overlay';
    overlay.innerHTML = `
      <div class="global-kick-content">
        <span class="global-kick-icon">👶🦶</span>
        <div class="global-kick-label">
          Andrine har begynt å telle spark! 💕<br>
          <small style="opacity: 0.8; font-size: 0.75em;">Klar for små dult?</small>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  overlay.classList.add('active');
  setTimeout(() => overlay.classList.remove('active'), 5000);
}

// Expose app methods
window.app = {
  navigate,
  refreshCurrentPage,
  checkWeeklyCelebration,
  getCurrentTab: () => currentTab,
  triggerHeartbeat: showGlobalHeartbeat,
  isPartnerOnline: () => isPartnerOnlineFlag,
  andrineActiveSession: null
};

// ═══════════════════════════════════════════════════════════════
// 🌐 GLOBAL API & CONFIG
// ═══════════════════════════════════════════════════════════════

// API_BASE is set at top of file before imports

// ═══════════════════════════════════════════════════════════════
// 🎉 WEEKLY CELEBRATION & NIGHT MODE
// ═══════════════════════════════════════════════════════════════

function initNightMode() {
  const hour = new Date().getHours();
  if (hour >= 21 || hour < 7) document.body.classList.add('night-mode');
}

async function checkWeeklyCelebration() {
  const { getPregnancyProgress } = await import('./utils/pregnancy.js');
  const settings = storage.get('settings', { dueDate: '2026-06-29' });
  const progress = getPregnancyProgress(settings.dueDate);
  const currentWeek = progress.weeksPregnant;
  const lastCelebrated = storage.get('last_celebrated_week', 0);
  const forceCelebrate = localStorage.getItem('bumpy:force_celebrate') === 'true';

  if ((currentWeek !== lastCelebrated && currentWeek >= 20) || forceCelebrate) {
    setTimeout(() => triggerCelebration(currentWeek), 500);
    storage.set('last_celebrated_week', currentWeek);
    if (forceCelebrate) localStorage.removeItem('bumpy:force_celebrate');
  }
}

function triggerCelebration(week) {
  let overlay = document.querySelector('.celebration-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
      <div class="celebration-content">
        <h1 class="celebration-title">Ny uke! 🎉</h1>
        <p class="celebration-week">Dere er nå i uke <span id="celeb-week-num">${week}</span></p>
        <button class="btn btn-primary" id="close-celebration">HURRA! 💖</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('close-celebration').addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  } else {
    overlay.querySelector('#celeb-week-num').textContent = week;
  }
  overlay.offsetHeight;
  setTimeout(() => overlay.classList.add('active'), 10);
  // HUGE celebration - 60 emojis!
  for (let i = 0; i < 60; i++) setTimeout(() => spawnFloatingEmoji(), i * 60);
}

function spawnFloatingEmoji() {
  const el = document.createElement('div');
  const emojis = ['❤️', '💖', '💗', '💓', '✨', '🎈', '🥳', '🎉', '🌟', '⭐', '🍼', '🧸', '👶', '💕', '🎊'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  el.style.position = 'fixed';
  el.style.left = (Math.random() * 100) + '%';
  el.style.bottom = '-100px';
  el.style.fontSize = (30 + Math.random() * 60) + 'px';
  el.style.zIndex = '999999';
  el.style.pointerEvents = 'none';
  el.innerText = emoji;
  el.style.opacity = '0';
  el.style.transition = 'all 4s ease-out';

  document.body.appendChild(el);

  // Animate up
  setTimeout(() => {
    el.style.opacity = '1';
    el.style.transform = `translateY(-${600 + Math.random() * 400}px) rotate(${-180 + Math.random() * 360}deg)`;
  }, 50);

  setTimeout(() => {
    el.style.opacity = '0';
  }, 3000);

  setTimeout(() => el.remove(), 4500);
}

// Auto-sync when page becomes visible (user switches back to app)
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    console.log('👀 App visible - pulling updates...');
    const hasUpdates = await storage.pullFromCloud();
    if (hasUpdates && window.app?.refreshCurrentPage) {
      window.app.refreshCurrentPage();
    }
  }
});

// Auto-sync every 30 seconds when app is active
setInterval(async () => {
  if (!document.hidden) {
    console.log('⏰ Auto-pull (30s)');
    const hasUpdates = await storage.pullFromCloud();
    if (hasUpdates && window.app?.refreshCurrentPage) {
      window.app.refreshCurrentPage();
    }
  }
}, 30000);

// Start app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
    startGlobalHeartbeatPoller();
    initNightMode();
    checkWeeklyCelebration();
  });
} else {
  initApp();
  startGlobalHeartbeatPoller();
  initNightMode();
  checkWeeklyCelebration();
}

// ═══════════════════════════════════════════════════════════════
// 🌅 DAILY CONTENT REFRESH
// ═══════════════════════════════════════════════════════════════

function setupDailyRefresh() {
  let lastDay = new Date().getDate();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const currentDay = new Date().getDate();

      if (currentDay !== lastDay) {
        console.log('🌅 New day detected! Refreshing app content...');
        lastDay = currentDay;

        // Refresh only if we are on a page that benefits from daily updates
        if (['home', 'together', 'timeline'].includes(currentTab)) {
          refreshCurrentPage();
        }
      }
    }
  });
}
