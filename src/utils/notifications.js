/**
 * Push Notifications for Bumpy
 */

function isIos() {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua);
}

function isStandalonePwa() {
  return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
}

function appNotificationsEnabled() {
  try {
    const raw = localStorage.getItem('bumpy:settings');
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return parsed?.notifications !== false;
  } catch {
    return true;
  }
}

export function getNotificationSupportStatus() {
  if (!('Notification' in window)) {
    return { supported: false, reason: 'Denne nettleseren støtter ikke varsler.' };
  }

  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'Service Worker mangler i denne nettleseren.' };
  }

  if (isIos() && !isStandalonePwa()) {
    return {
      supported: false,
      reason: 'På iPhone/iPad må appen installeres på hjemskjermen for varsler (Del → Legg til på Hjem-skjerm).'
    };
  }

  return { supported: true, reason: '' };
}

export async function requestNotificationPermission() {
  const support = getNotificationSupportStatus();
  if (!support.supported) {
    console.warn('Notifications not supported:', support.reason);
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function showNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.warn('🔔 Notification API not available in this browser/context');
    return;
  }

  console.log('🔔 showNotification called:', title, 'hidden:', document.hidden, 'permission:', Notification.permission);

  if (!appNotificationsEnabled()) {
    console.log('🔕 Notifications disabled in app settings');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('🔔 Notification permission not granted');
    return;
  }

  try {
    // If app is open, just vibrate
    if (!document.hidden) {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      console.log('🔔 App visible - vibrate only');
      return;
    }

    console.log('🔔 App minimized - attempting to show notification');

    // Try service worker notification first (more reliable on iOS)
    if ('serviceWorker' in navigator) {
      try {
        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;
        console.log('🔔 Service worker ready, showing notification');

        await registration.showNotification(title, {
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          vibrate: [200, 100, 200],
          tag: 'bumpy-' + Date.now(), // Unique tag so notifications don't replace each other
          renotify: true,
          requireInteraction: false,
          ...options
        });

        console.log('✅ Notification shown successfully via service worker');
        return;
      } catch (swErr) {
        console.warn('⚠️ Service worker notification failed, trying fallback:', swErr);
      }
    }

    // Fallback to regular notification API (for iOS when SW fails)
    console.log('🔔 Using fallback notification API');
    new Notification(title, {
      icon: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'bumpy-' + Date.now(),
      requireInteraction: false,
      ...options
    });
    console.log('✅ Fallback notification shown');

  } catch (err) {
    console.error('❌ Notification error:', err);
  }
}

export function notifyNewEntry(type = 'journal') {
  const messages = {
    journal: {
      title: '💕 Ny dagbokpost',
      body: 'Din partner har lagt til et nytt magebilde!'
    },
    mood: {
      title: '😊 Humøroppdatering',
      body: 'Din partner har delt hvordan de føler seg'
    },
    kick: {
      title: '🦶 Spark registrert!',
      body: 'Din partner føler babyen sparke'
    }
  };

  const msg = messages[type] || messages.journal;
  showNotification(msg.title, { body: msg.body });
}

export function notifyEntryDeleted() {
  showNotification('🗑️ Oppføring slettet', {
    body: 'En oppføring ble fjernet'
  });
}

export function notifyHeart() {
  showNotification('❤️ Hjerte mottatt!', {
    body: 'Din partner sendte deg et hjerte 💕',
    vibrate: [100, 50, 100, 50, 100]
  });
}

export function notifyKick() {
  showNotification('🦶 Baby sparker!', {
    body: 'Din partner registrerte babyspark',
    vibrate: [200, 100, 200]
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function syncPushSubscription(role) {
  const support = getNotificationSupportStatus();
  if (!support.supported) return false;
  if (!role || !['andrine', 'partner'].includes(role)) return false;
  if (Notification.permission !== 'granted') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const registration = await navigator.serviceWorker.ready;

  const keyResp = await fetch(`${window.API_BASE}/api/push/public-key`, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  }).catch(() => null);

  if (!keyResp?.ok) return false;
  const keyData = await keyResp.json().catch(() => ({}));
  const publicKey = keyData?.publicKey;
  if (!publicKey) return false;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const subJson = subscription.toJSON();
  const saveResp = await fetch(`${window.API_BASE}/api/push/subscribe`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, subscription: subJson }),
  }).catch(() => null);

  return !!saveResp?.ok;
}

export async function unsubscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return true;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe().catch(() => {});

  await fetch(`${window.API_BASE}/api/push/unsubscribe`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {});

  return true;
}
