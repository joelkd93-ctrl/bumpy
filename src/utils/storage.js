/**
 * Local Storage wrapper - Source of truth for Bumpy
 */

const PREFIX = 'bumpy:';

// Track last sync to prevent race conditions
let lastPushSyncTime = 0;

// Use a function to get API_URL at runtime (not at import time)
function getApiUrl() {
  return (window.API_BASE || 'https://bumpyapi.joelkd93.workers.dev') + '/api';
}

import { celebrate } from './confetti.js';
import { notifyNewEntry, notifyEntryDeleted, notifyKick } from './notifications.js';

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
      console.log(`💾 Saved locally: ${key}`, skipSync ? '(skipped sync)' : '(will sync)');

      // Auto-sync non-transient data
      if (!skipSync && !key.startsWith('daily_')) {
        console.log('☁️ Triggering cloud sync for:', key);
        // Only sync what changed to avoid huge payloads
        const syncOptions = { only: [key] };
        this.syncWithCloud(syncOptions).then(success => {
          console.log(success ? '✅ Cloud sync succeeded' : '❌ Cloud sync failed');
        });
      }
      return true;
    } catch (err) {
      console.error('❌ LocalStorage save failed:', err);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key);
    // Don't sync for temp keys, daily keys, task records, or claim records
    const skipPatterns = ['_', 'daily_', 'last_', 'task_'];
    const shouldSkip = skipPatterns.some(pattern => key.startsWith(pattern));

    if (!shouldSkip) {
      this.syncWithCloud({ only: [key] });
    }
  },

  // Get all entries for a collection (e.g., journal entries)
  getCollection(prefix) {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(PREFIX + prefix + ':')) {
        try {
          const item = {
            id: key.replace(PREFIX + prefix + ':', ''),
            ...JSON.parse(localStorage.getItem(key))
          };
          items.push(item);
        } catch (err) {
          console.warn(`Failed to parse ${key}:`, err);
        }
      }
    }
    const sorted = items.sort((a, b) => new Date(b.date) - new Date(a.date));
    console.log(`📦 getCollection('${prefix}') returning ${sorted.length} items:`, sorted);
    return sorted;
  },

  // Add item to collection
  async addToCollection(prefix, data) {
    // Use numeric-only ID (backend expects this format)
    // Add small random offset to prevent collisions
    const id = String(Date.now() + Math.floor(Math.random() * 1000));
    const entryData = { ...data, date: data.date || new Date().toISOString() };

    // Save locally but skip auto-sync (we'll do manual sync below)
    this.set(`${prefix}:${id}`, entryData, true); // skipSync = true
    console.log(`💾 Saved to ${prefix}:${id}`, entryData);
    console.log(`📊 Total ${prefix} entries in storage:`, this.getCollection(prefix).length);

    // Set timestamp BEFORE syncing to block auto-pull during sync
    lastPushSyncTime = Date.now();
    console.log('⏳ Syncing to cloud...');
    // Only sync the collection that was modified
    await this.syncWithCloud({ only: [prefix] });
    console.log('✅ Cloud sync complete, safe to proceed');

    return id;
  },

  // Remove from collection
  async removeFromCollection(prefix, id) {
    // Remove from localStorage first
    localStorage.removeItem(PREFIX + prefix + ':' + id);
    console.log(`🗑️ Removed locally: ${prefix}:${id}`);

    // Delete from cloud
    try {
      const apiUrl = getApiUrl();
      const endpoint = prefix === 'journal' ? 'journal' :
                       prefix === 'mood_entries' ? 'mood' : null;

      if (endpoint) {
        console.log(`☁️ Deleting from cloud: ${endpoint}/${id}`);
        const response = await fetch(`${apiUrl}/${endpoint}/${id}`, {
          method: 'DELETE',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          console.log(`✅ Deleted from cloud: ${endpoint}/${id}`);
          this.updateSyncIndicator('success', 'Deleted');
          setTimeout(() => this.updateSyncIndicator('hide'), 2000);
        } else {
          console.warn(`⚠️ Cloud delete failed: ${response.status}`);
          this.updateSyncIndicator('error', 'Delete failed');
          setTimeout(() => this.updateSyncIndicator('hide'), 3000);
        }
      }
    } catch (err) {
      console.warn('☁️ Cloud delete failed:', err.message);
    }

    return true;
  },

  /**
   * Cloud Sync Logic
   */
  async syncWithCloud(options = {}) {
    const { only = null } = options;

    // Show syncing indicator
    this.updateSyncIndicator('syncing', 'Syncing...');

    try {
      // Determine what to sync based on 'only' option
      const shouldSync = (key) => !only || only.includes(key);

      const payload = {};

      // Only include data that needs syncing
      if (shouldSync('settings')) {
        payload.settings = this.get('settings');
      }

      if (shouldSync('journal')) {
        const journal = this.getCollection('journal');
        payload.journal = journal.map(entry => ({
          id: entry.id,
          week_number: entry.week,
          photo_blob: entry.photo,
          note: entry.note,
          entry_date: entry.date
        }));
      }

      if (shouldSync('mood_entries')) {
        const moods = this.getCollection('mood_entries');
        payload.moods = moods.map(entry => ({
          id: entry.id,
          mood_emoji: entry.mood,
          note: entry.note,
          date: entry.date
        }));
      }

      if (shouldSync('name_votes')) {
        const votesMap = this.get('name_votes', {});
        payload.nameVotes = Object.entries(votesMap).map(([name, votes]) => ({
          name,
          andrine_vote: votes.andrine,
          partner_vote: votes.partner,
          is_custom: false
        }));
      }

      if (shouldSync('kicks')) {
        const kicks = this.getCollection('kicks');
        payload.kicks = kicks.map(session => ({
          id: session.id,
          start_time: session.startTime,
          end_time: session.endTime,
          count: session.count || 0,
          duration_minutes: session.duration || 0
        }));
      }

      if (shouldSync('baby_predictions')) {
        payload.predictions = this.get('baby_predictions', { andrine: {}, partner: {} });
      }

      if (shouldSync('love_auction_v2')) {
        payload.auctionState = this.get('love_auction_v2', null);
      }

      const apiUrl = getApiUrl();

      console.log('☁️ Syncing to cloud...', {
        keys: Object.keys(payload),
        journalCount: payload.journal?.length || 0,
        moodsCount: payload.moods?.length || 0,
        hasAuction: !!payload.auctionState,
        api: apiUrl
      });

      const response = await fetch(`${apiUrl}/sync`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('☁️ Cloud sync response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ Cloud sync failed: ${response.status}`, errorText);
        return false;
      }

      const result = await response.json();
      console.log('☁️ Cloud sync result:', result);

      if (result.success) {
        console.log('✅ Cloud synchronization complete');
        lastPushSyncTime = Date.now(); // Track when we pushed to prevent immediate pull
        this.updateSyncIndicator('success', 'Synced');
        setTimeout(() => this.updateSyncIndicator('hide'), 2000);
        return true;
      }

      console.warn('⚠️ Cloud sync returned success=false');
      this.updateSyncIndicator('error', 'Sync failed');
      setTimeout(() => this.updateSyncIndicator('hide'), 3000);
      return false;
    } catch (err) {
      console.warn('☁️ Cloud sync failed (offline or server down)', err.message);
      this.updateSyncIndicator('error', 'Offline');
      setTimeout(() => this.updateSyncIndicator('hide'), 3000);
    }
    return false;
  },

  updateSyncIndicator(state, text) {
    const indicator = document.getElementById('sync-indicator');
    if (!indicator) return;

    const iconEl = indicator.querySelector('.sync-icon');
    const textEl = indicator.querySelector('.sync-text');

    indicator.className = 'sync-indicator';

    if (state === 'hide') {
      // Do nothing, indicator will fade out
    } else if (state === 'syncing') {
      indicator.classList.add('syncing');
      if (iconEl) iconEl.textContent = '☁️';
      if (textEl) textEl.textContent = text || 'Syncing...';
    } else if (state === 'success') {
      indicator.classList.add('success');
      if (iconEl) iconEl.textContent = '✅';
      if (textEl) textEl.textContent = text || 'Synced';
    } else if (state === 'error') {
      indicator.classList.add('error');
      if (iconEl) iconEl.textContent = '❌';
      if (textEl) textEl.textContent = text || 'Offline';
    }
  },

  async pullFromCloud(options = {}) {
    const { skipCelebration = false } = options;
    console.log('🔽 Starting pullFromCloud...');

    // Prevent pulling immediately after pushing to avoid race condition
    const timeSinceLastPush = Date.now() - lastPushSyncTime;
    if (timeSinceLastPush < 5000) {
      console.log(`⏭️ Skipping pull - just pushed ${timeSinceLastPush}ms ago`);
      return false;
    }

    try {
      const apiUrl = getApiUrl();
      console.log(`🔽 Pulling from: ${apiUrl}/sync`);

      // Add cache buster to prevent stale data
      const response = await fetch(`${apiUrl}/sync?t=${Date.now()}`, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`🔽 Pull response status: ${response.status}`);

      if (!response.ok) {
        console.warn(`☁️ Cloud pull failed with status ${response.status}`);
        return false;
      }

      const result = await response.json();
      console.log('🔽 Pull result:', result);

      if (result.success && result.data) {
        const { settings, journal, moods, together, nameVotes, predictions, kicks, auctionState } = result.data;
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

        // Sync Love Auction state - store in temp key for together.js to handle with timestamp checking
        // DON'T merge directly into love_auction_v2 to prevent race conditions!
        if (auctionState) {
          console.log('♻️ Received auction state from cloud, storing for timestamp-based merge');
          this.set('_auction_cloud_temp', auctionState, true);
          hasChanged = true;
        }

        if (journal !== undefined) {
          console.log(`🔽 Processing ${journal.length} journal entries from cloud`);
          // Get existing local journal entries
          const localJournal = this.getCollection('journal');
          const localIds = new Set(localJournal.map(e => e.id));
          const cloudIds = new Set(journal.map(e => e.id));
          console.log(`🔽 Local has ${localJournal.length} journal entries:`, Array.from(localIds));
          console.log(`🔽 Cloud has ${journal.length} journal entries:`, Array.from(cloudIds));

          // Add entries that don't exist locally
          let newEntriesCount = 0;
          journal.forEach(entry => {
            if (!localIds.has(entry.id)) {
              console.log(`🔽 Adding new entry from cloud: ${entry.id}`);
              this.set(`journal:${entry.id}`, {
                week: entry.week_number,
                photo: entry.photo_blob,
                note: entry.note,
                date: entry.entry_date || entry.created_at?.split(' ')[0] || new Date().toISOString().split('T')[0]
              }, true);
              hasChanged = true;
              newEntriesCount++;
            }
          });

          // Notify about new entries
          if (newEntriesCount > 0) {
            notifyNewEntry('journal');
          }

          // Remove local entries that no longer exist in cloud
          let deletedEntriesCount = 0;
          localJournal.forEach(local => {
            if (!cloudIds.has(local.id)) {
              console.log(`🔽 Removing deleted entry from local: ${local.id}`);
              localStorage.removeItem(PREFIX + `journal:${local.id}`);
              hasChanged = true;
              deletedEntriesCount++;
            }
          });

          // Notify about deletions
          if (deletedEntriesCount > 0) {
            notifyEntryDeleted();
          }
        }

        if (moods !== undefined) {
          // Get existing local mood entries
          const localMoods = this.getCollection('mood_entries');
          const localMoodIds = new Set(localMoods.map(e => e.id));
          const cloudMoodIds = new Set(moods.map(e => e.id));

          // Add entries that don't exist locally
          moods.forEach(entry => {
            if (!localMoodIds.has(entry.id)) {
              this.set(`feeling:${entry.date}`, {
                mood: entry.mood_emoji,
                note: entry.note,
                timestamp: entry.created_at
              }, true);
              this.set(`mood_entries:${entry.id}`, {
                mood: entry.mood_emoji,
                note: entry.note,
                date: entry.date
              }, true);
              hasChanged = true;
            }
          });

          // Remove local entries that no longer exist in cloud
          localMoods.forEach(local => {
            if (!cloudMoodIds.has(local.id)) {
              localStorage.removeItem(PREFIX + `feeling:${local.date}`);
              localStorage.removeItem(PREFIX + `mood_entries:${local.id}`);
              hasChanged = true;
            }
          });
        }

        // Handle kicks sync
        if (kicks !== undefined && Array.isArray(kicks)) {
          console.log(`🔽 Processing ${kicks.length} kick sessions from cloud`);
          const localKicks = this.getCollection('kicks');
          const localKickIds = new Set(localKicks.map(e => e.id));
          const cloudKickIds = new Set(kicks.map(e => e.id));

          // Add kick sessions that don't exist locally
          let newKicksCount = 0;
          kicks.forEach(session => {
            if (!localKickIds.has(session.id)) {
              console.log(`🦶 Adding kick session from cloud: ${session.id}`);
              this.set(`kicks:${session.id}`, {
                id: session.id,
                startTime: session.start_time || session.startTime,
                endTime: session.end_time || session.endTime,
                count: session.count || 0,
                duration: session.duration_minutes || session.duration || 0,
                date: session.start_time || session.startTime
              }, true);
              hasChanged = true;
              newKicksCount++;
            }
          });

          // Remove local kick sessions that no longer exist in cloud
          let deletedKicksCount = 0;
          localKicks.forEach(local => {
            if (!cloudKickIds.has(local.id)) {
              console.log(`🔽 Removing deleted kick session from local: ${local.id}`);
              localStorage.removeItem(PREFIX + `kicks:${local.id}`);
              hasChanged = true;
              deletedKicksCount++;
            }
          });

          if (newKicksCount > 0) {
            console.log(`✅ Synced ${newKicksCount} new kick sessions from cloud`);
          }
          if (deletedKicksCount > 0) {
            console.log(`🗑️ Removed ${deletedKicksCount} deleted kick sessions`);
          }
        }

        console.log(`🔽 hasChanged: ${hasChanged}`);

        if (hasChanged) {
          console.log('☁️ Pulled and updated data from cloud');
          // Storage layer should NOT control UI - let pages handle their own refresh
          return true;
        }
        console.log('🔽 No changes detected, skipping update');
        return false;
      }
    } catch (err) {
      console.error('☁️ Cloud pull failed with error:', err);
      console.error('Error stack:', err.stack);
    }
    console.log('🔽 pullFromCloud returning false');
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
