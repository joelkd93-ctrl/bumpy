/**
 * 💕 BUMPY STORAGE — Improved Data Layer
 * Local-first with real-time cloud sync via Turso
 */

const PREFIX = 'bumpy:';
const API_URL = (window.API_BASE || 'https://bumpyapi.joelkd93.workers.dev') + '/api';

// Debounce timer for sync
let syncTimer = null;
const SYNC_DELAY = 2000; // 2 seconds debounce

// ═══════════════════════════════════════════════════════════════════════════
// 📦 CORE STORAGE
// ═══════════════════════════════════════════════════════════════════════════

export const storage = {
  /**
   * Get item from local storage
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  /**
   * Set item in local storage with optional cloud sync
   */
  set(key, value, options = {}) {
    const { skipSync = false, immediate = false } = options;
    
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      
      // Auto-sync non-transient data
      if (!skipSync && !key.startsWith('daily_') && !key.startsWith('temp_')) {
        if (immediate) {
          this.syncToCloud();
        } else {
          this.debouncedSync();
        }
      }
      
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  /**
   * Remove item from local storage
   */
  remove(key) {
    localStorage.removeItem(PREFIX + key);
    this.debouncedSync();
  },

  /**
   * Get all items matching a prefix
   */
  getCollection(prefix) {
    const items = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX + prefix + ':')) {
        try {
          items.push({
            id: key.replace(PREFIX + prefix + ':', ''),
            ...JSON.parse(localStorage.getItem(key))
          });
        } catch { /* skip invalid */ }
      }
    }
    
    return items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  },

  /**
   * Add item to a collection
   */
  addToCollection(prefix, data) {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const entry = { 
      ...data, 
      date: data.date || new Date().toISOString() 
    };
    
    this.set(`${prefix}:${id}`, entry);
    
    // Also sync specific collection to cloud
    this.syncCollection(prefix, id, entry);
    
    return id;
  },

  /**
   * Remove item from collection
   */
  removeFromCollection(prefix, id) {
    this.remove(`${prefix}:${id}`);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ☁️ CLOUD SYNC
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Debounced sync to prevent excessive API calls
   */
  debouncedSync() {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => this.syncToCloud(), SYNC_DELAY);
  },

  /**
   * Sync all data to cloud
   */
  async syncToCloud() {
    try {
      const payload = {
        settings: this.get('settings'),
        journal: this.getCollection('journal'),
        moods: this.getCollection('mood_entries'),
        nameVotes: this.getNameVotesArray(),
        predictions: this.get('baby_predictions', { andrine: {}, partner: {} })
      };

      const response = await fetch(`${API_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('☁️ Synced to cloud');
        return true;
      }
    } catch (err) {
      console.warn('☁️ Sync failed (offline?):', err.message);
    }
    return false;
  },

  /**
   * Sync specific collection item immediately
   */
  async syncCollection(prefix, id, data) {
    const endpoints = {
      journal: '/journal',
      mood_entries: '/moods',
      kicks: '/kicks',
    };

    const endpoint = endpoints[prefix];
    if (!endpoint) return;

    try {
      await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
    } catch (err) {
      console.warn(`☁️ Collection sync failed for ${prefix}:`, err.message);
    }
  },

  /**
   * Pull all data from cloud
   */
  async pullFromCloud() {
    try {
      const response = await fetch(`${API_URL}/sync?t=${Date.now()}`);
      
      if (!response.ok) throw new Error('Pull failed');
      
      const result = await response.json();
      
      if (!result.success || !result.data) return false;

      const { settings, journal, moods, nameVotes, predictions } = result.data;
      let hasChanges = false;

      // Merge settings
      if (settings) {
        const current = this.get('settings') || {};
        const merged = {
          name: settings.name || current.name || 'Andrine',
          partnerName: settings.partner_name || current.partnerName || 'Yoel',
          dueDate: settings.due_date || current.dueDate || '2026-06-29',
          darkMode: settings.dark_mode || current.darkMode || 'auto',
          notifications: settings.notifications ?? current.notifications ?? true,
        };
        
        if (JSON.stringify(current) !== JSON.stringify(merged)) {
          this.set('settings', merged, { skipSync: true });
          hasChanges = true;
        }
      }

      // Merge journal
      if (journal?.length) {
        for (const entry of journal) {
          const existing = this.get(`journal:${entry.id}`);
          if (!existing) {
            this.set(`journal:${entry.id}`, {
              week: entry.week_number,
              photo: entry.photo_url,
              note: entry.note,
              date: entry.created_at
            }, { skipSync: true });
            hasChanges = true;
          }
        }
      }

      // Merge moods
      if (moods?.length) {
        for (const entry of moods) {
          const existing = this.get(`mood_entries:${entry.id}`);
          if (!existing) {
            this.set(`mood_entries:${entry.id}`, {
              mood: entry.mood_emoji,
              note: entry.note,
              date: entry.date
            }, { skipSync: true });
            
            this.set(`feeling:${entry.date}`, {
              mood: entry.mood_emoji,
              note: entry.note,
              timestamp: entry.created_at
            }, { skipSync: true });
            
            hasChanges = true;
          }
        }
      }

      // Merge name votes
      if (nameVotes?.length) {
        const currentVotes = this.get('name_votes', {});
        
        for (const vote of nameVotes) {
          const local = currentVotes[vote.name] || {};
          
          if (vote.andrine_vote && vote.andrine_vote !== local.andrine) {
            local.andrine = vote.andrine_vote;
            hasChanges = true;
          }
          if (vote.partner_vote && vote.partner_vote !== local.partner) {
            local.partner = vote.partner_vote;
            hasChanges = true;
          }
          
          currentVotes[vote.name] = local;
        }
        
        if (hasChanges) {
          this.set('name_votes', currentVotes, { skipSync: true });
        }
      }

      // Merge predictions
      if (predictions) {
        const current = this.get('baby_predictions', { andrine: {}, partner: {} });
        if (JSON.stringify(current) !== JSON.stringify(predictions)) {
          this.set('baby_predictions', predictions, { skipSync: true });
          hasChanges = true;
        }
      }

      if (hasChanges) {
        console.log('☁️ Pulled updates from cloud');
      }
      
      return hasChanges;

    } catch (err) {
      console.warn('☁️ Pull failed:', err.message);
      return false;
    }
  },

  /**
   * Convert name_votes object to array for API
   */
  getNameVotesArray() {
    const votesMap = this.get('name_votes', {});
    return Object.entries(votesMap).map(([name, votes]) => ({
      name,
      andrine_vote: votes.andrine,
      partner_vote: votes.partner,
      is_custom: votes.isCustom || false
    }));
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🦶 KICK SESSION API
// ═══════════════════════════════════════════════════════════════════════════

export const kicksAPI = {
  async startSession() {
    const session = {
      startTime: new Date().toISOString(),
      count: 0
    };
    
    storage.set('current_kick_session', session);
    
    try {
      await fetch(`${API_URL}/kicks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
    } catch (err) {
      console.warn('Could not sync kick start');
    }
    
    return session;
  },

  async addKick() {
    const session = storage.get('current_kick_session');
    if (!session) return null;
    
    session.count++;
    storage.set('current_kick_session', session);
    
    try {
      const res = await fetch(`${API_URL}/kicks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'increment' })
      });
      const data = await res.json();
      
      // Sync count from server (source of truth)
      if (data.count !== undefined) {
        session.count = data.count;
        storage.set('current_kick_session', session, { skipSync: true });
      }
    } catch (err) {
      console.warn('Could not sync kick');
    }
    
    return session;
  },

  async finishSession() {
    const session = storage.get('current_kick_session');
    if (!session) return null;
    
    const endTime = new Date();
    const duration = Math.round((endTime - new Date(session.startTime)) / 60000);
    
    const finalSession = {
      ...session,
      endTime: endTime.toISOString(),
      duration
    };
    
    storage.addToCollection('kicks', finalSession);
    storage.remove('current_kick_session');
    
    try {
      await fetch(`${API_URL}/kicks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finish', session: finalSession })
      });
    } catch (err) {
      console.warn('Could not sync kick finish');
    }
    
    return finalSession;
  },

  async getHistory() {
    // Local first
    const local = storage.getCollection('kicks');
    
    try {
      const res = await fetch(`${API_URL}/kicks`);
      const data = await res.json();
      if (data.kicks) {
        return data.kicks;
      }
    } catch (err) {
      console.warn('Could not fetch kick history');
    }
    
    return local;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 👥 PRESENCE API
// ═══════════════════════════════════════════════════════════════════════════

export const presenceAPI = {
  async ping(role, options = {}) {
    const { kickStart, kickSession } = options;
    
    try {
      const res = await fetch(`${API_URL}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, kickStart, kickSession })
      });
      
      return await res.json();
    } catch (err) {
      console.warn('Presence ping failed');
      return { online: false };
    }
  },

  async sendHeartbeat(role) {
    try {
      await fetch(`${API_URL}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      return true;
    } catch {
      return false;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

export async function initializeStorage() {
  // Set defaults if first run
  if (!storage.get('settings')) {
    storage.set('settings', {
      name: 'Andrine',
      partnerName: 'Yoel',
      dueDate: '2026-06-29',
      notifications: true,
      darkMode: 'auto'
    }, { skipSync: true });
  }

  // Check for skip pull flag (after data reset)
  const skipPull = localStorage.getItem('bumpy:skip_pull') === 'true';
  if (skipPull) {
    localStorage.removeItem('bumpy:skip_pull');
    console.log('⏭️ Skipping cloud pull after reset');
    return;
  }

  // Try to pull from cloud
  const hasUpdates = await storage.pullFromCloud();
  
  if (hasUpdates && window.app?.refreshCurrentPage) {
    window.app.refreshCurrentPage();
  }
}

// For backwards compatibility
export function initializeDefaults() {
  initializeStorage();
}
