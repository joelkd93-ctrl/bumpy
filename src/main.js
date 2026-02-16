/**
 * Bumpy - A Loving Pregnancy Companion 💕
 * Made with love for Andrine
 */

// Set API base URL FIRST before any imports
window.API_BASE = "https://bumpyapi.joelkd93.workers.dev";

import './styles/main.css?v=20260212d1';
import './styles/polish.css?v=20260212d1';
import './styles/motion.css?v=20260212d1';
import './styles/premium-polish.css?v=20260212d1';
import './styles/modal-system.css?v=20260212d1'; // Native app modal system
// import './styles/performance-fix.css?v=20260212d1'; // disabled: was overriding viewport/modal mechanics
import { storage, initializeDefaults } from './utils/storage.js';
import { modal } from './utils/modal.js';
import { notifyHeart, notifyKick } from './utils/notifications.js';
import { renderHome, initHome } from './pages/home.js';
import { renderJournal, initJournal } from './pages/journal.js';
import { renderTimeline, initTimeline } from './pages/timeline.js';
import { renderFeelings, initFeelings } from './pages/feelings.js';
import { renderTogether, initTogether } from './pages/together.js';
import { renderKicks, initKicks } from './pages/kicks.js';
import { renderSettings, initSettings } from './pages/settings.js';
import { getPregnancyProgress } from './utils/pregnancy.js';

// Keep a stable visual viewport unit for iOS standalone/PWA modal geometry
function setVV() {
  const vv = window.visualViewport;
  const h = vv ? vv.height : window.innerHeight;
  document.documentElement.style.setProperty('--vvh', `${h}px`);
}

setVV();
window.addEventListener('resize', setVV);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setVV);
  window.visualViewport.addEventListener('scroll', setVV);
}

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

// Swipe sensitivity settings (less sensitive = better UX)
const SWIPE_THRESHOLD = 120; // Minimum horizontal distance (increased from 50px)
const MAX_VERTICAL_MOVEMENT = 80; // Max vertical allowed before rejecting
const MIN_HORIZONTAL_RATIO = 2.5; // Horizontal must be 2.5x vertical

function handleSwipe() {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);

  // Strict swipe detection to prevent accidental page switches
  // 1. Must move at least 120px horizontally
  if (absDeltaX < SWIPE_THRESHOLD) {
    return;
  }

  // 2. Vertical movement must be less than 80px (otherwise it's scrolling)
  if (absDeltaY > MAX_VERTICAL_MOVEMENT) {
    return;
  }

  // 3. Horizontal movement must be at least 2.5x the vertical (clear horizontal intent)
  if (absDeltaX < absDeltaY * MIN_HORIZONTAL_RATIO) {
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
  { id: 'home',     icon: '<img src="/icons/nav/nav-hjem.png" class="nav-icon-img" alt="Hjem">', label: 'Hjem', render: renderHome, init: initHome },
  { id: 'timeline', icon: '<img src="/icons/nav/nav-reise.png" class="nav-icon-img" alt="Reise">', label: 'Reise', render: renderTimeline, init: initTimeline },
  { id: 'kicks',    icon: '<img src="/icons/nav/nav-spark.png" class="nav-icon-img" alt="Spark">', label: 'Spark', render: renderKicks, init: initKicks },
  { id: 'feelings', icon: '<img src="/icons/nav/nav-folelser.png" class="nav-icon-img" alt="Følelser">', label: 'Følelser', render: renderFeelings, init: initFeelings },
  { id: 'journal',  icon: '<img src="/icons/nav/nav-dagbok.png" class="nav-icon-img" alt="Dagbok">', label: 'Dagbok', render: renderJournal, init: initJournal },
  { id: 'together', icon: '<img src="/icons/nav/nav-sammen.png" class="nav-icon-img" alt="Sammen">', label: 'Sammen', render: renderTogether, init: initTogether },
  { id: 'settings', icon: '<img src="/icons/nav/nav-innstilling.png" class="nav-icon-img" alt="Innstillinger">', label: 'Innstillinger', render: renderSettings, init: initSettings }
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
  app.classList.add('app-shell');
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
          <span class="nav-dot"></span>
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

function navigate(tabId) {
  const tab = TABS.find(t => t.id === tabId);
  if (!tab) return;

  // Force reset navigation lock if stuck
  if (isNavigating) {
    console.warn('Navigation was locked, forcing reset');
    isNavigating = false;
  }

  const content = document.getElementById('content');
  if (!content) return;

  // Update current tab
  currentTab = tabId;

  // Update nav bar active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });

  // Simple immediate page switch with error handling
  try {
    isNavigating = true;
    showNewPage(content, tab);
  } catch (err) {
    console.error('Navigation error:', err);
  } finally {
    isNavigating = false;
  }

  // Scroll to top
  try {
    content.scrollTo({ top: 0, behavior: 'auto' });
  } catch (err) {
    console.warn('Scroll error:', err);
  }
}

function showNewPage(content, tab) {
  // Render page immediately
  content.innerHTML = `<div class="page active">${tab.render()}</div>`;

  // Run page init if exists
  if (tab.init) {
    requestAnimationFrame(() => {
      tab.init();
    });
  }

  // DON'T pull from cloud on every page switch - causes race condition
  // The auto-pull every 15 seconds will handle syncing
}

// Helper: Apply stagger entrance animations to lists
function applyStaggerAnimation() {
  const selectors = [
    '.journal-entry',
    '.mood-card',
    '.weekly-card',
    '.timeline-item',
    '.name-item',
    '.list-item'
  ];

  selectors.forEach(selector => {
    const items = document.querySelectorAll(selector);
    items.forEach((item, index) => {
      item.classList.add('animate-in', 'stagger-item');
      item.style.animationDelay = `${index * 40}ms`;
    });
  });
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

        const swApiBase = (window.API_BASE || '').replace(/\/$/, '');
        if (swApiBase) {
          const sendApiBase = (worker) => worker?.postMessage({ type: 'SET_API_BASE', apiBase: swApiBase });
          sendApiBase(reg.active);
          sendApiBase(reg.waiting);
          sendApiBase(reg.installing);
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SET_API_BASE', apiBase: swApiBase });
          }
        }

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

        // Register periodic background sync for checking updates even when app is closed
        // NOTE: This works on Chrome/Edge but NOT on Safari/iOS
        // Safari will rely on the setInterval polling when app is open
        if ('periodicSync' in reg) {
          try {
            await reg.periodicSync.register('bumpy-sync', {
              minInterval: 15 * 1000 // 15 seconds (browser may enforce longer intervals)
            });
            console.log('✅ Periodic background sync registered (Chrome/Edge)');
          } catch (err) {
            console.warn('⚠️ Periodic background sync not available:', err);
          }
        } else {
          console.log('ℹ️ Periodic background sync not supported (likely Safari/iOS)');
        }
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

  const pollHeartbeat = async () => {
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
        const tapTime = new Date(data.partnerLastTap).getTime();
        const now = Date.now();
        const timeSinceAppStart = now - appStartTime;

        // Only show if this is NOT the first poll (ignore hearts that existed before app opened)
        // OR if the heart is very fresh (within last 5 seconds)
        const isVeryFresh = (now - tapTime) < 5000;
        const shouldShow = (lastPartnerTapReceived !== null) || (isVeryFresh && timeSinceAppStart > 3000);

        // Update the last received BEFORE showing (prevents duplicates)
        lastPartnerTapReceived = data.partnerLastTap;

        if (shouldShow) {
          console.log('💓 Heartbeat received from partner at', new Date(data.partnerLastTap).toLocaleTimeString());
          console.log('💓 App hidden:', document.hidden, 'Permission:', Notification.permission);
          showGlobalHeartbeat();

          // Call notification asynchronously but don't wait for it
          notifyHeart().catch(err => {
            console.error('💓 Heart notification failed:', err);
          });
        }
      }

      // Handle Kick Notification (Yoel only)
      if (role === 'partner' && data.andrineLastKick && data.andrineLastKick !== lastAndrineKickReceived) {
        const kickTime = new Date(data.andrineLastKick).getTime();
        const now = Date.now();
        const timeSinceAppStart = now - appStartTime;

        // Show if this is NOT the first poll (ignore old kicks) OR if kick is very fresh
        const isVeryFresh = (now - kickTime) < 5000;
        const shouldShow = (lastAndrineKickReceived !== null) || (isVeryFresh && timeSinceAppStart > 3000);

        // Update last received BEFORE showing (prevents duplicates)
        lastAndrineKickReceived = data.andrineLastKick;

        if (shouldShow) {
          console.log('🦶 Andrine started a kick session at', new Date(data.andrineLastKick).toLocaleTimeString());
          console.log('🦶 App hidden:', document.hidden, 'Permission:', Notification.permission);
          showGlobalKickNotification();

          // Call notification asynchronously but don't wait for it
          notifyKick().catch(err => {
            console.error('🦶 Kick notification failed:', err);
          });
        }
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

      // If reset happened, persist the just-finished session locally for partner view
      if (wasReset && role === 'partner') {
        if (prevSession && typeof prevSession.count === 'number' && prevSession.count > 0) {
          const endTimeIso = new Date().toISOString();
          const startMs = new Date(prevSession.startTime).getTime();
          const endMs = new Date(endTimeIso).getTime();
          const duration = Math.max(0, Math.round((endMs - startMs) / 60000));
          const id = String(Date.now() + Math.floor(Math.random() * 1000));

          storage.set(`kicks:${id}`, {
            startTime: prevSession.startTime,
            count: prevSession.count,
            endTime: endTimeIso,
            duration,
            date: prevSession.startTime
          }, true);

          console.log('🦶 Mirrored finished kick session locally for partner:', { id, count: prevSession.count, duration });
        }

        console.log('🧹 Session cleared, pulling fresh data...');
        // Add delay to ensure Andrine's sync completes first
        setTimeout(() => {
          storage.pullFromCloud().then(() => {
            console.log('✅ Fresh kick data pulled after session end');
            window.app.refreshCurrentPage();
          });
        }, 2000); // 2 second delay for sync propagation
      }
    } catch (err) {
      // Quietly log network errors
      if (err.name !== 'TypeError') console.warn('💓 Poller network error:', err.message);
    }
  };

  // Run immediately on startup
  pollHeartbeat().catch(err => console.warn('💓 Initial poll failed:', err));

  // Then poll every 2 seconds
  heartbeatPoller = setInterval(pollHeartbeat, 2000);
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

  // Remove any existing overlay first to prevent stacking
  const existingOverlay = document.querySelector('.global-heartbeat-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
    if (heartbeatTimeout) {
      clearTimeout(heartbeatTimeout);
      heartbeatTimeout = null;
    }
  }

  const overlay = document.createElement('div');
  overlay.className = 'global-heartbeat-overlay';
  overlay.innerHTML = `
    <div class="global-heartbeat-content">
      <span class="global-heart-icon">❤️</span>
      <div class="global-heartbeat-label"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Click to dismiss
  overlay.addEventListener('click', () => {
    overlay.classList.remove('active');
    if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
    setTimeout(() => overlay.remove(), 300);
  });

  const label = overlay.querySelector('.global-heartbeat-label');
  label.innerHTML = `Hjertet mitt slår for deg 💓<br><small style="opacity: 0.8; font-size: 0.7em;">Hilsen ${partnerName} ${partnerEmoji}</small>`;

  // Trigger animation
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // Auto-hide and remove
  heartbeatTimeout = setTimeout(() => {
    overlay.classList.remove('active');
    heartbeatTimeout = null;
    // Remove from DOM after animation completes
    setTimeout(() => overlay.remove(), 500);
  }, 3500);
}

function showGlobalKickNotification() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

  // Remove any existing overlay first to prevent stacking
  const existingOverlay = document.querySelector('.global-kick-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement('div');
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

  // Click to dismiss
  overlay.addEventListener('click', () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  });

  // Trigger animation
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // Auto-hide and remove
  setTimeout(() => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 500);
  }, 5000);
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

function checkWeeklyCelebration() {
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

// Helper to check if game modal is open
function isGameModalOpen() {
  const gameModal = document.getElementById('game-modal');
  return gameModal && gameModal.style.display === 'flex';
}

// Auto-sync when page becomes visible (user switches back to app)
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    console.log('👀 App visible - pulling updates...');
    const hasUpdates = await storage.pullFromCloud();
    if (hasUpdates && window.app?.refreshCurrentPage && !isGameModalOpen()) {
      window.app.refreshCurrentPage();
    } else if (hasUpdates && isGameModalOpen()) {
      console.log('🎮 Game modal open - skipping refresh');
    }
  }
});

// Auto-sync with basic failure backoff (to avoid hammering API when unstable)
let autoPullBackoffMs = 0;

const autoPull = async () => {
  if (autoPullBackoffMs > 0) {
    console.log(`⏸️ Auto-pull backoff active (${autoPullBackoffMs}ms left)`);
    autoPullBackoffMs = Math.max(0, autoPullBackoffMs - 60000);
    return;
  }

  console.log('⏰ Auto-pull', document.hidden ? '[minimized]' : '[visible]');
  const hasUpdates = await storage.pullFromCloud();

  // If pull failed, storage returns false too; apply gentle backoff only when API seems flaky
  if (hasUpdates === false) {
    autoPullBackoffMs = 30000; // 30s cooldown after failure
  }

  // Only refresh UI if app is visible AND modal is not open
  if (hasUpdates && !document.hidden && window.app?.refreshCurrentPage && !isGameModalOpen()) {
    console.log('📱 Auto-refresh triggered');
    window.app.refreshCurrentPage();
  } else if (hasUpdates && isGameModalOpen()) {
    console.log('🎮 Game modal open - skipping auto-refresh');
  }
};

// Run immediately on startup (after a short delay to let service worker initialize)
setTimeout(() => {
  console.log('🚀 Running initial sync...');
  autoPull().catch(err => console.warn('Initial sync failed:', err));
}, 2000);

// Then poll every 60 seconds (lighter load on worker)
setInterval(autoPull, 60000);

// Listen for messages from service worker (periodic sync updates)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async (event) => {
    console.log('📬 Message from service worker:', event.data);

    if (event.data.type === 'sync-update') {
      console.log('🔄 Service worker detected updates, pulling from cloud');
      const hasUpdates = await storage.pullFromCloud();

      // Refresh UI if app is visible and has updates AND modal not open
      if (hasUpdates && !document.hidden && window.app?.refreshCurrentPage && !isGameModalOpen()) {
        window.app.refreshCurrentPage();
      } else if (hasUpdates && isGameModalOpen()) {
        console.log('🎮 Game modal open - skipping SW refresh');
      }
    }
  });
}

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
