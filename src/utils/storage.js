/**
 * Local Storage wrapper - Source of truth for Bumpy
 */

const PREFIX = 'bumpy:';

// Track last sync to prevent race conditions
let lastPushSyncTime = 0;
// Prevent overlapping pull loops
let pullInFlightPromise = null;

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

      // Auto-sync non-transient data (skip temp keys, daily keys, task records, claim records)
      const skipPatterns = ['_', 'daily_', 'last_', 'task_', 'current_'];
      const shouldSkipSync = skipSync || skipPatterns.some(pattern => key.startsWith(pattern));

      if (!shouldSkipSync) {
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

    // Track pending cloud deletes so sync can hard-delete them
    if (prefix === 'kicks') {
      const pending = JSON.parse(localStorage.getItem('bumpy:pending_kick_deletes') || '[]');
      if (!pending.includes(id)) {
        pending.push(id);
        localStorage.setItem('bumpy:pending_kick_deletes', JSON.stringify(pending));
      }
    }

    // Delete from cloud
    try {
      const apiUrl = getApiUrl();
      const endpoint = prefix === 'journal' ? 'journal' :
                       prefix === 'mood_entries' ? 'mood' :
                       prefix === 'kicks' ? 'kicks' : null;

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
    const { only = null, resetNameVotes = false, nameVotesEpoch = null } = options;

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

        // Epoch guards against stale clients reintroducing old votes after reset
        const localEpoch = Number(localStorage.getItem('bumpy:name_votes_epoch') || '0') || 0;
        payload.nameVotesEpoch = Number(nameVotesEpoch || localEpoch || Date.now());
        if (resetNameVotes) payload.resetNameVotes = true;
      }

      if (shouldSync('matched_names')) {
        payload.matchedNames = this.get('matched_names', []);
      }

      if (shouldSync('custom_names')) {
        payload.customNames = this.get('custom_names', []);
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
        // Include IDs that were deleted locally so cloud hard-deletes them
        const pendingDeletes = JSON.parse(localStorage.getItem('bumpy:pending_kick_deletes') || '[]');
        if (pendingDeletes.length > 0) {
          payload.deletedKickIds = pendingDeletes;
          console.log(`🗑️ Sending ${pendingDeletes.length} kick deletions to cloud:`, pendingDeletes);
        }
      }

      if (shouldSync('baby_predictions')) {
        payload.predictions = this.get('baby_predictions', { andrine: {}, partner: {} });
      }

      // Auction state moved to server-authoritative /api/auction actions

      const apiUrl = getApiUrl();

      console.log('☁️ Syncing to cloud...', {
        keys: Object.keys(payload),
        journalCount: payload.journal?.length || 0,
        moodsCount: payload.moods?.length || 0,
        hasAuction: false,
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
        lastPushSyncTime = Date.now();
        // Clear pending kick delete queue — cloud has processed them
        if (payload.deletedKickIds?.length > 0) {
          localStorage.removeItem('bumpy:pending_kick_deletes');
          console.log('🗑️ Cleared pending kick deletes queue');
        }
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

    if (pullInFlightPromise) {
      console.log('⏭️ Pull already in progress, reusing in-flight request');
      return pullInFlightPromise;
    }

    pullInFlightPromise = (async () => {
      console.log('🔽 Starting pullFromCloud...');

      // Check if pull should be skipped (e.g., after reset)
      if (localStorage.getItem('bumpy:skip_pull') === 'true') {
        console.log('⏭️ Skipping pull - reset flag set');
        localStorage.removeItem('bumpy:skip_pull'); // Clear flag
        return false;
      }

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
        const { settings, journal, moods, together, nameVotes, nameVotesEpoch, matchedNames, customNames, predictions, kicks } = result.data;
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
          const serverEpoch = Number(nameVotesEpoch || 0) || 0;
          const localEpoch = Number(localStorage.getItem('bumpy:name_votes_epoch') || '0') || 0;
          const currentVotes = this.get('name_votes', {});

          // If server epoch is newer (e.g. after reset), replace local state fully.
          if (serverEpoch > localEpoch) {
            const rebuiltVotes = {};
            nameVotes.forEach(remote => {
              if (!remote?.name) return;
              rebuiltVotes[remote.name] = {
                andrine: remote.andrine_vote || undefined,
                partner: remote.partner_vote || undefined,
              };
            });
            this.set('name_votes', rebuiltVotes, true);
            localStorage.setItem('bumpy:name_votes_epoch', String(serverEpoch));
            hasChanged = true;
          } else {
            // Same epoch: merge updates from server
            nameVotes.forEach(remote => {
              const local = currentVotes[remote.name] || {};

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
            if (serverEpoch > 0 && localEpoch !== serverEpoch) {
              localStorage.setItem('bumpy:name_votes_epoch', String(serverEpoch));
            }
          }
        }

        if (matchedNames !== undefined) {
          const current = this.get('matched_names', []);
          if (JSON.stringify(current) !== JSON.stringify(matchedNames)) {
            console.log('♻️ Syncing matched_names from cloud:', matchedNames);
            this.set('matched_names', matchedNames, true);
            hasChanged = true;
          }
        }

        if (customNames !== undefined) {
          const current = this.get('custom_names', []);
          if (JSON.stringify(current) !== JSON.stringify(customNames)) {
            console.log('♻️ Syncing custom_names from cloud:', customNames);
            this.set('custom_names', customNames, true);
            hasChanged = true;
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

              const baseEntry = {
                week: entry.week_number,
                photo: entry.photo_blob,
                note: entry.note,
                date: entry.entry_date || entry.created_at?.split(' ')[0] || new Date().toISOString().split('T')[0]
              };

              // Try normal save first
              let saved = this.set(`journal:${entry.id}`, baseEntry, true);

              // Fallback for quota exceeded: save without photo so note/date still syncs
              if (!saved && baseEntry.photo) {
                console.warn(`⚠️ Quota hit while syncing ${entry.id}. Retrying without photo blob.`);
                saved = this.set(`journal:${entry.id}`, {
                  ...baseEntry,
                  photo: null,
                  photoSyncSkipped: true
                }, true);
              }

              if (saved) {
                hasChanged = true;
                newEntriesCount++;
              } else {
                console.error(`❌ Could not save journal entry ${entry.id} locally (even without photo).`);
              }
            }
          });

          // Notify about new entries
          if (newEntriesCount > 0) {
            notifyNewEntry('journal');
          }

          // Remove local entries that no longer exist in cloud (with grace period)
          let deletedEntriesCount = 0;
          const GRACE_PERIOD_MS = 60 * 1000; // 1 minute grace period for new entries

          localJournal.forEach(local => {
            if (!cloudIds.has(local.id)) {
              // Check if entry is brand new (created locally within grace period)
              // We use the ID timestamp (first part of ID is usually timestamp)
              const entryTime = parseInt(local.id.substring(0, 13));
              const age = Date.now() - entryTime;
              
              if (!isNaN(entryTime) && age < GRACE_PERIOD_MS) {
                console.log(`🛡️ Protecting new local entry from sync deletion: ${local.id} (Age: ${age}ms)`);
                return; // Skip deletion
              }

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
          // Don't restore kicks we've explicitly deleted locally
          const pendingDeletes = new Set(JSON.parse(localStorage.getItem('bumpy:pending_kick_deletes') || '[]'));

          // Add kick sessions that don't exist locally (and aren't pending deletion)
          let newKicksCount = 0;
          kicks.forEach(session => {
            if (!localKickIds.has(session.id) && !pendingDeletes.has(session.id)) {
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
            } else if (pendingDeletes.has(session.id)) {
              console.log(`⏭️ Skipping pull of deleted kick: ${session.id}`);
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
    })();

    try {
      return await pullInFlightPromise;
    } finally {
      pullInFlightPromise = null;
    }
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
