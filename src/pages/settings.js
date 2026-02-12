/**
 * Settings Page ⚙️
 * Gentle customization options
 */
import { storage } from '../utils/storage.js';
import { requestNotificationPermission } from '../utils/notifications.js';

export function renderSettings() {
  const settings = storage.get('settings') || {
    name: 'Andrine',
    partnerName: '',
    dueDate: '2026-06-29',
    notifications: true
  };

  const dueDateFormatted = new Date(settings.dueDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <div class="page-settings">
      <div class="page-header-hero page-header-settings">
        <h1 class="page-header-hero-title">Innstillinger ⚙️</h1>
        <p class="page-header-hero-sub">Tilpass opplevelsen din</p>
      </div>
      
      <!-- Profile Section -->
      <p class="text-tiny mb-2">PROFIL</p>
      <div class="settings-list mb-6">
        <label class="settings-item">
          <span class="settings-label">Ditt Navn</span>
          <input 
            type="text" 
            id="setting-name" 
            class="settings-input" 
            value="${settings.name}"
            placeholder="Ditt navn"
          />
        </label>
        <label class="settings-item">
          <span class="settings-label">Partners Navn</span>
          <input 
            type="text" 
            id="setting-partner" 
            class="settings-input" 
            value="${settings.partnerName || ''}"
            placeholder="Partners navn"
          />
        </label>
        <label class="settings-item">
          <span class="settings-label">Termindato</span>
          <input 
            type="date" 
            id="setting-due-date" 
            class="settings-input"
            value="${settings.dueDate}"
          />
        </label>
      </div>
      
      <!-- Notifications Section -->
      <p class="text-tiny mb-2">VARSLER</p>
      <div class="settings-list mb-6">
        <div class="settings-item" id="enable-notifications">
          <span class="settings-label">Push-varsler</span>
          <span class="settings-icon" id="notification-status">${Notification.permission === 'granted' ? '✅ Aktivert' : '🔔 Aktiver'}</span>
        </div>
      </div>

      <!-- Data Section -->
      <p class="text-tiny mb-2">DATA</p>
      <div class="settings-list mb-6">
        <div class="settings-item" id="force-sync">
          <span class="settings-label">Tving Synkronisering</span>
          <span class="settings-icon">🔄</span>
        </div>
        <div class="settings-item" id="export-data">
          <span class="settings-label">Eksporter Sikkerhetskopi</span>
          <span class="settings-icon">📤</span>
        </div>
        <div class="settings-item settings-item-danger" id="clear-data">
          <span class="settings-label">Slett All Data</span>
          <span class="settings-icon">🗑️</span>
        </div>
      </div>
      
      <!-- About Section -->
      <p class="text-tiny mb-2">OM</p>
      <div class="settings-list mb-6">
        <div class="settings-item settings-item-static">
          <span class="settings-label">Versjon</span>
          <span class="settings-value">1.0.0</span>
        </div>
        <div class="settings-item settings-item-static">
          <span class="settings-label">Laget med</span>
          <span class="settings-value">💕</span>
        </div>
      </div>
      
      <!-- Save Button -->
      <button class="btn btn-primary btn-block" id="save-settings">
        Lagre Endringer
      </button>
      
      <!-- Footer Message -->
      <div class="settings-footer">
        <p>Laget med kjærlighet for ${settings.name}</p>
        <p class="text-muted">Du kommer til å bli en fantastisk mamma 💕</p>
      </div>
      
    </div>
  `;
}

export function initSettings() {
  const nameInput = document.getElementById('setting-name');
  const partnerInput = document.getElementById('setting-partner');
  const dueDateInput = document.getElementById('setting-due-date');
  const saveBtn = document.getElementById('save-settings');
  const notificationsBtn = document.getElementById('enable-notifications');
  const forceSyncBtn = document.getElementById('force-sync');
  const exportBtn = document.getElementById('export-data');
  const clearBtn = document.getElementById('clear-data');

  // Save settings
  saveBtn?.addEventListener('click', () => {
    const currentSettings = storage.get('settings') || {};

    storage.set('settings', {
      ...currentSettings,
      name: nameInput?.value?.trim() || 'Andrine',
      partnerName: partnerInput?.value?.trim() || '',
      dueDate: dueDateInput?.value || '2026-06-29'
    });

    // Success feedback
    saveBtn.textContent = 'Lagret! 💕';
    saveBtn.classList.add('btn-success');

    setTimeout(() => {
      saveBtn.textContent = 'Lagre Endringer';
      saveBtn.classList.remove('btn-success');

      // Navigate to home to see changes
      window.app?.navigate('home');
    }, 1500);
  });

  // Enable notifications
  notificationsBtn?.addEventListener('click', async () => {
    const icon = notificationsBtn.querySelector('.settings-icon');

    // If already granted, just show status
    if (Notification.permission === 'granted') {
      icon.textContent = '✅ Aktivert';
      if (window.haptic) window.haptic.light();
      return;
    }

    // If denied, can't do anything
    if (Notification.permission === 'denied') {
      icon.textContent = '❌ Blokkert';
      alert('Varsler er blokkert. Gå til nettleserinnstillinger for å aktivere.');
      setTimeout(() => {
        icon.textContent = '🔔 Aktiver';
      }, 3000);
      return;
    }

    // Request permission
    try {
      const originalText = icon.textContent;
      icon.textContent = '⏳ Ber om tillatelse...';
      const granted = await requestNotificationPermission();

      if (granted) {
        icon.textContent = '✅ Aktivert';
        if (window.haptic) window.haptic.medium();
        // Show test notification
        setTimeout(() => {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification('Varsler aktivert! 💕', {
                body: 'Du vil nå motta varsler fra Bumpy',
                icon: '/icons/icon-192.png',
                vibrate: [200, 100, 200]
              });
            });
          }
        }, 500);
      } else {
        icon.textContent = '❌ Avvist';
        setTimeout(() => {
          icon.textContent = originalText;
        }, 3000);
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      icon.textContent = '🔔 Aktiver';
    }
  });

  // Force sync
  forceSyncBtn?.addEventListener('click', async () => {
    const label = forceSyncBtn.querySelector('.settings-label');
    const icon = forceSyncBtn.querySelector('.settings-icon');
    const originalText = label.textContent;
    const originalIcon = icon.textContent;

    try {
      label.textContent = 'Synkroniserer...';
      icon.textContent = '⏳';

      console.log('🔄 Manual sync triggered');

      // Push local data to cloud
      await storage.syncWithCloud();

      // Pull cloud data to local
      await storage.pullFromCloud();

      label.textContent = 'Synkronisert! ✓';
      icon.textContent = '✅';

      console.log('✅ Manual sync complete');

      setTimeout(() => {
        label.textContent = originalText;
        icon.textContent = originalIcon;

        // Refresh page to show synced data
        if (window.app?.refreshCurrentPage) {
          window.app.refreshCurrentPage();
        }
      }, 2000);
    } catch (err) {
      console.error('❌ Manual sync failed:', err);
      label.textContent = 'Sync feilet';
      icon.textContent = '❌';

      setTimeout(() => {
        label.textContent = originalText;
        icon.textContent = originalIcon;
      }, 3000);
    }
  });

  // Export data
  exportBtn?.addEventListener('click', () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('bumpy:')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bumpy-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Feedback
    const originalText = exportBtn.querySelector('.settings-label').textContent;
    exportBtn.querySelector('.settings-label').textContent = 'Exported! ✓';
    setTimeout(() => {
      exportBtn.querySelector('.settings-label').textContent = originalText;
    }, 2000);
  });

  // Clear data with confirmation
  clearBtn?.addEventListener('click', async () => {
    const confirmed = confirm(
      '⚠️ Er du sikker?\n\n' +
      'Dette sletter permanent:\n' +
      '• Alle dagbok-innlegg og bilder\n' +
      '• Humør-historikk\n' +
      '• Babynavn-favoritter\n' +
      '• Alt annet\n\n' +
      'Dette kan ikke angres.'
    );

    if (confirmed) {
      // 1. Wipe cloud data first
      try {
        const API_URL = (window.API_BASE || 'http://localhost:8787') + '/api';
        await fetch(`${API_URL}/reset`, { method: 'POST' });
        console.log('☁️ Cloud data cleared');
      } catch (err) {
        console.warn('Could not clear cloud data:', err);
      }

      // 2. Remove ALL bumpy keys from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('bumpy:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // 3. Set skip_pull flag to prevent re-download on reload
      localStorage.setItem('bumpy:skip_pull', 'true');

      // 4. Reinitialize with defaults
      storage.set('settings', {
        name: 'Andrine',
        partnerName: '',
        dueDate: '2026-06-29',
        notifications: true
      }, true); // skipSync = true

      // 5. Full reload for a clean state
      location.reload();
    }
  });
}
