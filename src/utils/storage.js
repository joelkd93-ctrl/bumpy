/**
 * Local Storage wrapper - Source of truth for Bumpy
 */

const PREFIX = 'bumpy:';
const API_URL = (window.API_BASE || 'http://localhost:8787') + '/api';

import { celebrate } from './confetti.js';

export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value, skipSync = false) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      // Auto-sync non-transient data
      if (!skipSync && !key.startsWith('daily_')) {
        this.syncWithCloud();
      }
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key);
    this.syncWithCloud();
  },

  // Get all entries for a collection (e.g., journal entries)
  getCollection(prefix) {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(PREFIX + prefix + ':')) {
        try {
          items.push({
            id: key.replace(PREFIX + prefix + ':', ''),
            ...JSON.parse(localStorage.getItem(key))
          });
        } catch { }
      }
    }
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Add item to collection
  addToCollection(prefix, data) {
    const id = Date.now().toString();
    const entryData = { ...data, date: data.date || new Date().toISOString() };
    this.set(`${prefix}:${id}`, entryData);
    console.log(`💾 Saved to ${prefix}:${id}`, entryData);
    return id;
  },

  // Remove from collection
  removeFromCollection(prefix, id) {
    this.remove(`${prefix}:${id}`);
  },

  /**
   * Cloud Sync Logic
   */
  async syncWithCloud() {
    try {
      const settings = this.get('settings');
      const journal = this.getCollection('journal');
      const moods = this.getCollection('mood_entries');
      const together = this.getCollection('weekly');

      // Convert name_votes map to array for sync
      const votesMap = this.get('name_votes', {});
      const nameVotes = Object.entries(votesMap).map(([name, votes]) => ({
        name,
        andrine_vote: votes.andrine,
        partner_vote: votes.partner,
        is_custom: false
      }));

      const predictions = this.get('baby_predictions', { andrine: {}, partner: {} });

      const payload = {
        settings,
        journal,
        moods,
        together,
        nameVotes,
        predictions
      };

      const response = await fetch(`${API_URL}/sync`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(`☁️ Cloud sync failed with status ${response.status}`);
        return false;
      }

      const result = await response.json();
      if (result.success) {
        console.log('☁️ Cloud synchronization complete');
        return true;
      }
    } catch (err) {
      console.warn('☁️ Cloud sync failed (offline or server down)', err.message);
    }
    return false;
  },

  async pullFromCloud() {
    try {
      // Add cache buster to prevent stale data
      const response = await fetch(`${API_URL}/sync?t=${Date.now()}`, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`☁️ Cloud pull failed with status ${response.status}`);
        return false;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const { settings, journal, moods, together, nameVotes, predictions } = result.data;
        let hasChanged = false;

        if (settings) {
          const current = this.get('settings') || {};
          const mappedSettings = {
            ...current,
            name: settings.name || current.name,
            partnerName: settings.partner_name || settings.partnerName || current.partnerName,
            dueDate: settings.due_date || settings.dueDate || current.dueDate,
            darkMode: settings.dark_mode || settings.darkMode || current.darkMode
          };

          // Check if anything actually changed
          if (JSON.stringify(current) !== JSON.stringify(mappedSettings)) {
            console.log('♻️ Syncing settings:', mappedSettings);
            this.set('settings', mappedSettings, true);
            hasChanged = true;
          }
        }

        // ... journal and moods handling ...

        if (nameVotes && Array.isArray(nameVotes)) {
          const currentVotes = this.get('name_votes', {});

          nameVotes.forEach(remote => {
            const local = currentVotes[remote.name] || {};

            // Merge Logic: Server wins if local is missing, otherwise merge
            if (remote.andrine_vote && remote.andrine_vote !== local.andrine) {
              console.log(`♻️ Syncing ${remote.name} Andrine: ${local.andrine} -> ${remote.andrine_vote}`);
              local.andrine = remote.andrine_vote;
              hasChanged = true;
            }
            if (remote.partner_vote && remote.partner_vote !== local.partner) {
              console.log(`♻️ Syncing ${remote.name} Partner: ${local.partner} -> ${remote.partner_vote}`);
              local.partner = remote.partner_vote;
              hasChanged = true;
            }

            currentVotes[remote.name] = local;
          });

          if (hasChanged) {
            this.set('name_votes', currentVotes, true); // Skip sync to avoid loop!
          }
        }

        if (predictions) {
          const current = this.get('baby_predictions', { andrine: {}, partner: {} });
          if (JSON.stringify(current) !== JSON.stringify(predictions)) {
            console.log('♻️ Syncing baby predictions');
            this.set('baby_predictions', predictions, true);
            hasChanged = true;
          }
        }

        if (journal) {
          // Get existing local journal entries
          const localJournal = this.getCollection('journal');
          const localIds = new Set(localJournal.map(e => e.id));

          // Only add entries that don't exist locally (don't overwrite)
          journal.forEach(entry => {
            if (!localIds.has(entry.id)) {
              this.set(`journal:${entry.id}`, {
                week: entry.week_number,
                photo: entry.photo_blob,
                note: entry.note,
                date: entry.created_at
              }, true); // Skip sync to avoid loop
              hasChanged = true;
            }
          });
        }

        if (moods) {
          // Get existing local mood entries
          const localMoods = this.getCollection('mood_entries');
          const localMoodIds = new Set(localMoods.map(e => e.id));

          // Only add entries that don't exist locally (don't overwrite)
          moods.forEach(entry => {
            if (!localMoodIds.has(entry.id)) {
              this.set(`feeling:${entry.date}`, {
                mood: entry.mood_emoji,
                note: entry.note,
                timestamp: entry.created_at
              }, true);
              // Also update collection if not exist
              this.set(`mood_entries:${entry.id}`, {
                mood: entry.mood_emoji,
                note: entry.note,
                date: entry.date
              }, true);
              hasChanged = true;
            }
          });
        }

        if (hasChanged) {
          console.log('☁️ Pulled and updated data from cloud');
          celebrate();

          // Trigger a refresh if in standalone mode (PWA)
          if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 PWA detected - refreshing to show synced data');
            setTimeout(() => {
              if (window.app?.refreshCurrentPage) {
                window.app.refreshCurrentPage();
              }
            }, 1000);
          }

          return true;
        }
        return false;
      }
    } catch (err) {
      console.warn('☁️ Cloud pull failed', err);
    }
    return false;
  }
};

// Initialize default settings
export function initializeDefaults() {
  if (!storage.get('settings')) {
    storage.set('settings', {
      name: 'Andrine',
      partnerName: '',
      dueDate: '2026-06-29',
      notifications: true,
      darkMode: 'auto'
    }, true); // Skip sync on first init
  }

  // Check if we should skip cloud pull (set by "Slett all data")
  const skipPull = localStorage.getItem('bumpy:skip_pull') === 'true';
  if (skipPull) {
    localStorage.removeItem('bumpy:skip_pull');
    console.log('⏭️ Skipping cloud pull after data reset');
    return;
  }

  // Initial pull from cloud if possible (non-blocking)
  storage.pullFromCloud().catch(err => {
    console.warn('☁️ Initial cloud pull failed, continuing with local data', err.message);
  });
}
