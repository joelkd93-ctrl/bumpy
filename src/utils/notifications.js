/**
 * Push Notifications for Bumpy
 */

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
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

export function showNotification(title, options = {}) {
  console.log('🔔 showNotification called:', title, 'hidden:', document.hidden);

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

    console.log('🔔 App minimized - showing notification');

    // If app is closed/background, show notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          vibrate: [200, 100, 200],
          tag: 'bumpy-' + Date.now(), // Unique tag so notifications don't replace each other
          renotify: true,
          ...options
        }).then(() => {
          console.log('🔔 Notification shown successfully');
        }).catch(err => {
          console.error('🔔 Notification failed:', err);
        });
      }).catch(err => {
        console.error('🔔 Service worker not ready:', err);
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'bumpy-' + Date.now(),
        ...options
      });
      console.log('🔔 Fallback notification shown');
    }
  } catch (err) {
    console.error('🔔 Notification error:', err);
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
