// ═══════════════════════════════════════════════════════════════════════════
// 💕 BUMPY API — Cloudflare Worker with Turso
// Real-time sync, presence, and data persistence
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@libsql/client/web';

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// ─────────────────────────────────────────────────────────────────────────────
// 🚀 MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Initialize Turso client
    const db = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });

    try {
      // Route requests
      if (path === '/api/init') {
        return await handleInit(db);
      }
      
      if (path === '/api/sync' && request.method === 'POST') {
        return await handleSyncPush(db, request);
      }
      
      if (path === '/api/sync' && request.method === 'GET') {
        return await handleSyncPull(db, request);
      }
      
      if (path === '/api/presence') {
        return await handlePresence(db, request, env);
      }
      
      if (path === '/api/kicks') {
        return await handleKicks(db, request);
      }
      
      if (path === '/api/journal') {
        return await handleJournal(db, request);
      }
      
      if (path === '/api/moods') {
        return await handleMoods(db, request);
      }
      
      if (path === '/api/names') {
        return await handleNames(db, request);
      }
      
      if (path === '/api/predictions') {
        return await handlePredictions(db, request);
      }
      
      if (path === '/api/heartbeat') {
        return await handleHeartbeat(db, request, env);
      }
      
      if (path === '/api/settings') {
        return await handleSettings(db, request);
      }

      return jsonResponse({ error: 'Not found' }, 404);

    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 📦 DATABASE INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

async function handleInit(db) {
  const migrations = [
    // Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT 'Andrine',
      partner_name TEXT DEFAULT 'Yoel',
      due_date TEXT DEFAULT '2026-06-29',
      dark_mode TEXT DEFAULT 'auto',
      notifications INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Journal entries
    `CREATE TABLE IF NOT EXISTS journal (
      id TEXT PRIMARY KEY,
      week_number INTEGER NOT NULL,
      photo_url TEXT,
      photo_thumb TEXT,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Mood entries
    `CREATE TABLE IF NOT EXISTS moods (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      mood_emoji TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Kick sessions
    `CREATE TABLE IF NOT EXISTS kicks (
      id TEXT PRIMARY KEY,
      start_time TEXT NOT NULL,
      end_time TEXT,
      count INTEGER DEFAULT 0,
      duration_minutes INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Active kick session (real-time)
    `CREATE TABLE IF NOT EXISTS active_kick_session (
      id INTEGER PRIMARY KEY DEFAULT 1,
      start_time TEXT,
      count INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Name votes
    `CREATE TABLE IF NOT EXISTS name_votes (
      name TEXT PRIMARY KEY,
      andrine_vote TEXT,
      partner_vote TEXT,
      is_custom INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Baby predictions
    `CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role, question_id)
    )`,
    
    // Presence tracking
    `CREATE TABLE IF NOT EXISTS presence (
      role TEXT PRIMARY KEY,
      last_seen TEXT DEFAULT CURRENT_TIMESTAMP,
      last_heartbeat_sent TEXT,
      last_kick_start TEXT
    )`,
    
    // Love auction state
    `CREATE TABLE IF NOT EXISTS auction_profiles (
      role TEXT PRIMARY KEY,
      coins INTEGER DEFAULT 50,
      weekly_earned INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_daily_claim TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS auctions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      start_price INTEGER DEFAULT 10,
      min_increment INTEGER DEFAULT 5,
      highest_bid INTEGER DEFAULT 0,
      highest_bidder TEXT,
      end_time TEXT NOT NULL,
      settled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS owned_rewards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT,
      payer TEXT,
      status TEXT DEFAULT 'WON',
      confirmations TEXT,
      acquired_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS ledger (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      profile_id TEXT,
      amount INTEGER,
      meta TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Weekly questions/answers
    `CREATE TABLE IF NOT EXISTS weekly_answers (
      id TEXT PRIMARY KEY,
      week_number INTEGER NOT NULL,
      role TEXT NOT NULL,
      question TEXT,
      answer TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(week_number, role)
    )`,
    
    // Indexes for performance
    `CREATE INDEX IF NOT EXISTS idx_journal_week ON journal(week_number)`,
    `CREATE INDEX IF NOT EXISTS idx_moods_date ON moods(date)`,
    `CREATE INDEX IF NOT EXISTS idx_kicks_start ON kicks(start_time)`,
    `CREATE INDEX IF NOT EXISTS idx_ledger_created ON ledger(created_at)`,
  ];

  for (const sql of migrations) {
    await db.execute(sql);
  }

  // Initialize default settings if not exist
  await db.execute(`INSERT OR IGNORE INTO settings (id) VALUES (1)`);
  
  // Initialize presence
  await db.execute(`INSERT OR IGNORE INTO presence (role) VALUES ('andrine')`);
  await db.execute(`INSERT OR IGNORE INTO presence (role) VALUES ('partner')`);
  
  // Initialize auction profiles
  await db.execute(`INSERT OR IGNORE INTO auction_profiles (role, coins) VALUES ('andrine', 50)`);
  await db.execute(`INSERT OR IGNORE INTO auction_profiles (role, coins) VALUES ('partner', 50)`);

  return jsonResponse({ success: true, message: 'Database initialized' });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔄 SYNC HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

async function handleSyncPush(db, request) {
  const data = await request.json();
  const { settings, journal, moods, nameVotes, predictions } = data;

  // Sync settings
  if (settings) {
    await db.execute({
      sql: `UPDATE settings SET 
        name = COALESCE(?, name),
        partner_name = COALESCE(?, partner_name),
        due_date = COALESCE(?, due_date),
        dark_mode = COALESCE(?, dark_mode),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = 1`,
      args: [settings.name, settings.partnerName, settings.dueDate, settings.darkMode]
    });
  }

  // Sync journal entries
  if (journal && Array.isArray(journal)) {
    for (const entry of journal) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO journal (id, week_number, photo_url, note, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [entry.id, entry.week_number, entry.photo_blob, entry.note, entry.entry_date]
      });
    }
  }

  // Sync moods
  if (moods && Array.isArray(moods)) {
    for (const entry of moods) {
      const dateKey = entry.date?.split('T')[0] || new Date().toISOString().split('T')[0];
      await db.execute({
        sql: `INSERT OR REPLACE INTO moods (id, date, mood_emoji, note, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [entry.id, dateKey, entry.mood_emoji, entry.note, entry.date]
      });
    }
  }

  // Sync name votes
  if (nameVotes && Array.isArray(nameVotes)) {
    for (const vote of nameVotes) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO name_votes (name, andrine_vote, partner_vote, is_custom, updated_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [vote.name, vote.andrine_vote, vote.partner_vote, vote.is_custom ? 1 : 0]
      });
    }
  }

  // Sync predictions
  if (predictions) {
    for (const [role, answers] of Object.entries(predictions)) {
      for (const [questionId, answer] of Object.entries(answers)) {
        const id = `${role}_${questionId}`;
        await db.execute({
          sql: `INSERT OR REPLACE INTO predictions (id, role, question_id, answer, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          args: [id, role, questionId, answer]
        });
      }
    }
  }

  return jsonResponse({ success: true });
}

async function handleSyncPull(db, request) {
  // Fetch all data
  const [settingsResult, journalResult, moodsResult, nameVotesResult, predictionsResult] = await Promise.all([
    db.execute('SELECT * FROM settings WHERE id = 1'),
    db.execute('SELECT * FROM journal ORDER BY created_at DESC'),
    db.execute('SELECT * FROM moods ORDER BY date DESC'),
    db.execute('SELECT * FROM name_votes'),
    db.execute('SELECT * FROM predictions'),
  ]);

  const settings = settingsResult.rows[0] || {};
  
  // Transform predictions into { andrine: {}, partner: {} } format
  const predictions = { andrine: {}, partner: {} };
  for (const row of predictionsResult.rows) {
    if (!predictions[row.role]) predictions[row.role] = {};
    predictions[row.role][row.question_id] = row.answer;
  }

  return jsonResponse({
    success: true,
    data: {
      settings,
      journal: journalResult.rows,
      moods: moodsResult.rows,
      nameVotes: nameVotesResult.rows,
      predictions,
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 👥 PRESENCE & REAL-TIME
// ─────────────────────────────────────────────────────────────────────────────

async function handlePresence(db, request, env) {
  const data = await request.json();
  const { role, kickStart, kickSession } = data;

  if (!role) {
    return jsonResponse({ error: 'Role required' }, 400);
  }

  const partnerRole = role === 'andrine' ? 'partner' : 'andrine';

  // Update this user's presence
  await db.execute({
    sql: `UPDATE presence SET last_seen = CURRENT_TIMESTAMP WHERE role = ?`,
    args: [role]
  });

  // If starting a kick session
  if (kickStart) {
    await db.execute({
      sql: `UPDATE presence SET last_kick_start = CURRENT_TIMESTAMP WHERE role = ?`,
      args: [role]
    });
  }

  // Update active kick session
  if (kickSession !== undefined) {
    if (kickSession === null) {
      // Clear session
      await db.execute(`DELETE FROM active_kick_session WHERE id = 1`);
    } else {
      await db.execute({
        sql: `INSERT OR REPLACE INTO active_kick_session (id, start_time, count, updated_at)
              VALUES (1, ?, ?, CURRENT_TIMESTAMP)`,
        args: [kickSession.startTime, kickSession.count]
      });
    }
  }

  // Fetch partner's status
  const [partnerResult, activeKickResult, partnerPresence] = await Promise.all([
    db.execute({
      sql: `SELECT last_seen, last_heartbeat_sent, last_kick_start FROM presence WHERE role = ?`,
      args: [partnerRole]
    }),
    db.execute(`SELECT * FROM active_kick_session WHERE id = 1`),
    db.execute({
      sql: `SELECT * FROM presence WHERE role = ?`,
      args: [partnerRole]
    })
  ]);

  const partner = partnerResult.rows[0];
  const isOnline = partner && 
    (Date.now() - new Date(partner.last_seen).getTime()) < 30000; // 30 second threshold

  const activeSession = activeKickResult.rows[0];

  return jsonResponse({
    success: true,
    online: isOnline,
    partnerLastTap: partner?.last_heartbeat_sent,
    andrineLastKick: role === 'partner' ? partnerPresence.rows[0]?.last_kick_start : null,
    andrineActiveSession: activeSession ? {
      startTime: activeSession.start_time,
      count: activeSession.count
    } : null
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 💓 HEARTBEAT (Partner Tap)
// ─────────────────────────────────────────────────────────────────────────────

async function handleHeartbeat(db, request, env) {
  const data = await request.json();
  const { role } = data;

  if (!role) {
    return jsonResponse({ error: 'Role required' }, 400);
  }

  await db.execute({
    sql: `UPDATE presence SET last_heartbeat_sent = CURRENT_TIMESTAMP WHERE role = ?`,
    args: [role]
  });

  return jsonResponse({ success: true, sentAt: new Date().toISOString() });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🦶 KICK SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

async function handleKicks(db, request) {
  if (request.method === 'GET') {
    const result = await db.execute(
      'SELECT * FROM kicks ORDER BY start_time DESC LIMIT 20'
    );
    return jsonResponse({ success: true, kicks: result.rows });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const { action, session } = data;

    if (action === 'start') {
      const id = `kick_${Date.now()}`;
      await db.execute({
        sql: `INSERT INTO kicks (id, start_time, count) VALUES (?, ?, 0)`,
        args: [id, new Date().toISOString()]
      });
      
      // Also set active session
      await db.execute({
        sql: `INSERT OR REPLACE INTO active_kick_session (id, start_time, count, updated_at)
              VALUES (1, ?, 0, CURRENT_TIMESTAMP)`,
        args: [new Date().toISOString()]
      });
      
      return jsonResponse({ success: true, id });
    }

    if (action === 'increment') {
      await db.execute(`UPDATE active_kick_session SET count = count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = 1`);
      const result = await db.execute(`SELECT count FROM active_kick_session WHERE id = 1`);
      return jsonResponse({ success: true, count: result.rows[0]?.count || 0 });
    }

    if (action === 'finish' && session) {
      const id = `kick_${Date.now()}`;
      await db.execute({
        sql: `INSERT INTO kicks (id, start_time, end_time, count, duration_minutes)
              VALUES (?, ?, ?, ?, ?)`,
        args: [id, session.startTime, session.endTime, session.count, session.duration]
      });
      
      // Clear active session
      await db.execute(`DELETE FROM active_kick_session WHERE id = 1`);
      
      return jsonResponse({ success: true, id });
    }
  }

  return jsonResponse({ error: 'Invalid request' }, 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// 📔 JOURNAL
// ─────────────────────────────────────────────────────────────────────────────

async function handleJournal(db, request) {
  if (request.method === 'GET') {
    const result = await db.execute(
      'SELECT * FROM journal ORDER BY created_at DESC'
    );
    return jsonResponse({ success: true, entries: result.rows });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const id = `journal_${Date.now()}`;
    
    await db.execute({
      sql: `INSERT INTO journal (id, week_number, photo_url, note, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [id, data.week, data.photo, data.note]
    });
    
    return jsonResponse({ success: true, id });
  }

  if (request.method === 'DELETE') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    await db.execute({
      sql: `DELETE FROM journal WHERE id = ?`,
      args: [id]
    });
    
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Invalid request' }, 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// 😊 MOODS
// ─────────────────────────────────────────────────────────────────────────────

async function handleMoods(db, request) {
  if (request.method === 'GET') {
    const result = await db.execute(
      'SELECT * FROM moods ORDER BY date DESC LIMIT 30'
    );
    return jsonResponse({ success: true, moods: result.rows });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const id = `mood_${Date.now()}`;
    const date = data.date || new Date().toISOString().split('T')[0];
    
    await db.execute({
      sql: `INSERT OR REPLACE INTO moods (id, date, mood_emoji, note, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [id, date, data.mood, data.note]
    });
    
    return jsonResponse({ success: true, id });
  }

  return jsonResponse({ error: 'Invalid request' }, 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🍼 NAME VOTES
// ─────────────────────────────────────────────────────────────────────────────

async function handleNames(db, request) {
  if (request.method === 'GET') {
    const result = await db.execute('SELECT * FROM name_votes');
    return jsonResponse({ success: true, votes: result.rows });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const { name, role, vote, isCustom } = data;
    
    const column = role === 'andrine' ? 'andrine_vote' : 'partner_vote';
    
    await db.execute({
      sql: `INSERT INTO name_votes (name, ${column}, is_custom, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(name) DO UPDATE SET ${column} = ?, updated_at = CURRENT_TIMESTAMP`,
      args: [name, vote, isCustom ? 1 : 0, vote]
    });
    
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Invalid request' }, 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🎲 PREDICTIONS
// ─────────────────────────────────────────────────────────────────────────────

async function handlePredictions(db, request) {
  if (request.method === 'GET') {
    const result = await db.execute('SELECT * FROM predictions');
    
    const predictions = { andrine: {}, partner: {} };
    for (const row of result.rows) {
      if (!predictions[row.role]) predictions[row.role] = {};
      predictions[row.role][row.question_id] = row.answer;
    }
    
    return jsonResponse({ success: true, predictions });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const { role, questionId, answer } = data;
    const id = `${role}_${questionId}`;
    
    await db.execute({
      sql: `INSERT OR REPLACE INTO predictions (id, role, question_id, answer, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [id, role, questionId, answer]
    });
    
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Invalid request' }, 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️ SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

async function handleSettings(db, request) {
  if (request.method === 'GET') {
    const result = await db.execute('SELECT * FROM settings WHERE id = 1');
    return jsonResponse({ success: true, settings: result.rows[0] || {} });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    
    await db.execute({
      sql: `UPDATE settings SET 
        name = COALESCE(?, name),
        partner_name = COALESCE(?, partner_name),
        due_date = COALESCE(?, due_date),
        dark_mode = COALESCE(?, dark_mode),
        notifications = COALESCE(?, notifications),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = 1`,
      args: [data.name, data.partnerName, data.dueDate, data.darkMode, data.notifications]
    });
    
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Invalid request' }, 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🛠️ HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}
