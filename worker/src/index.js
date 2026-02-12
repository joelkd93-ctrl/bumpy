// ═══════════════════════════════════════════════════════════════════════════
// 💕 BUMPY API v2 — Enhanced Cloudflare Worker with Turso
// Supports: sync, presence, kicks, predictions, auction, heartbeat
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@libsql/client/web';

// ─────────────────────────────────────────────────────────────────────────────
// 🛠️ HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

function corsHeaders(env, request) {
  const origin = request.headers.get('Origin') || '*';
  const allowedRaw = (env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowOrigin =
    allowedRaw.includes('*') || allowedRaw.includes(origin)
      ? origin
      : allowedRaw[0] || '*';

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-allow-credentials': 'true',
    'access-control-max-age': '86400',
  };
}

function withCors(resp, env, request) {
  const headers = new Headers(resp.headers);
  const cors = corsHeaders(env, request);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(resp.body, { status: resp.status, headers });
}

function getClient(env) {
  if (!env.TURSO_DATABASE_URL) throw new Error('Missing TURSO_DATABASE_URL');
  if (!env.TURSO_AUTH_TOKEN) throw new Error('Missing TURSO_AUTH_TOKEN');
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 📦 DATABASE INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

async function handleInit(env) {
  const client = getClient(env);
  
  const migrations = [
    // Presence/heartbeat tracking table
    `CREATE TABLE IF NOT EXISTS presence (
      id INTEGER PRIMARY KEY DEFAULT 1,
      andrine_last_seen TEXT,
      partner_last_seen TEXT,
      andrine_tap TEXT,
      partner_tap TEXT,
      andrine_kick TEXT,
      andrine_active_session TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Kick sessions table
    `CREATE TABLE IF NOT EXISTS kick_sessions (
      id TEXT PRIMARY KEY,
      start_time TEXT NOT NULL,
      end_time TEXT,
      count INTEGER DEFAULT 0,
      duration_minutes INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Active kick session (real-time tracking)
    `CREATE TABLE IF NOT EXISTS active_kick_session (
      id INTEGER PRIMARY KEY DEFAULT 1,
      start_time TEXT,
      count INTEGER DEFAULT 0,
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
    
    // Love auction profiles
    `CREATE TABLE IF NOT EXISTS auction_profiles (
      role TEXT PRIMARY KEY,
      coins INTEGER DEFAULT 50,
      weekly_earned INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_daily_claim TEXT
    )`,
    
    // Active auctions
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
    
    // Owned rewards from auctions
    `CREATE TABLE IF NOT EXISTS owned_rewards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT,
      payer TEXT,
      status TEXT DEFAULT 'WON',
      confirmations TEXT,
      acquired_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Transaction ledger
    `CREATE TABLE IF NOT EXISTS ledger (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      profile_id TEXT,
      amount INTEGER,
      meta TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Journal and mood entries tables
    `CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      week_number INTEGER,
      photo_blob TEXT,
      note TEXT,
      entry_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS mood_entries (
      id TEXT PRIMARY KEY,
      date TEXT,
      mood_emoji TEXT,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Add entry_date column to journal_entries if not exists (for existing databases)
    `ALTER TABLE journal_entries ADD COLUMN entry_date TEXT`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_kick_sessions_time ON kick_sessions(start_time DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_predictions_role ON predictions(role)`,
    `CREATE INDEX IF NOT EXISTS idx_ledger_time ON ledger(created_at DESC)`,
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
    } catch (e) {
      console.warn('Migration warning:', e.message);
    }
  }

  // FIX: Ensure journal_entries table exists (handle broken migration state)
  try {
    // Check if journal_entries exists
    const tableCheck = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='journal_entries'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ journal_entries table exists');
    } else {
      // Check if old table exists (partial migration)
      const oldTableCheck = await client.execute(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='journal_entries_old'
      `);

      if (oldTableCheck.rows.length > 0) {
        // Old table exists, complete the migration
        console.log('🔧 Completing partial migration...');
        await client.execute(`
          CREATE TABLE journal_entries (
            id TEXT PRIMARY KEY,
            week_number INTEGER,
            photo_blob TEXT,
            note TEXT,
            entry_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await client.execute(`
          INSERT INTO journal_entries (id, week_number, photo_blob, note, entry_date, created_at)
          SELECT id, week_number, photo_blob, note, entry_date, created_at FROM journal_entries_old
        `);
        await client.execute(`DROP TABLE journal_entries_old`);
        console.log('✅ Migration completed');
      } else {
        // Neither table exists, create fresh
        console.log('🆕 Creating fresh journal_entries table...');
        await client.execute(`
          CREATE TABLE journal_entries (
            id TEXT PRIMARY KEY,
            week_number INTEGER,
            photo_blob TEXT,
            note TEXT,
            entry_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Fresh table created');
      }
    }
  } catch (e) {
    console.warn('⚠️ Table setup error:', e.message);
  }

  // Initialize auction profiles
  await client.execute(`INSERT OR IGNORE INTO auction_profiles (role, coins) VALUES ('andrine', 50)`);
  await client.execute(`INSERT OR IGNORE INTO auction_profiles (role, coins) VALUES ('partner', 50)`);

  return json({ success: true, message: 'Database initialized/updated' });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔄 SYNC HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

async function handleSyncGet(env) {
  const client = getClient(env);

  const [
    settings,
    journal,
    moods,
    together,
    heartbeats,
    nameVotes,
    loveNotes,
    predictions,
    kicks,
    auctionStateRow,
  ] = await Promise.all([
    client.execute('SELECT * FROM user_settings WHERE id = 1'),
    client.execute('SELECT id, week_number, photo_blob, note, entry_date, created_at FROM journal_entries ORDER BY COALESCE(entry_date, created_at) DESC'),
    client.execute('SELECT * FROM mood_entries ORDER BY date DESC'),
    client.execute('SELECT * FROM weekly_questions'),
    client.execute('SELECT * FROM heartbeat_sessions ORDER BY timestamp DESC LIMIT 10'),
    client.execute('SELECT * FROM name_votes'),
    client.execute('SELECT * FROM love_notes').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM predictions').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM kick_sessions ORDER BY start_time DESC LIMIT 20').catch(() => ({ rows: [] })),
    client.execute("SELECT value FROM app_state WHERE key = 'love_auction_v2'").catch(() => ({ rows: [] })),
  ]);

  // Transform predictions to { andrine: {}, partner: {} } format
  const predictionsMap = { andrine: {}, partner: {} };
  for (const row of (predictions.rows || [])) {
    if (!predictionsMap[row.role]) predictionsMap[row.role] = {};
    predictionsMap[row.role][row.question_id] = row.answer;
  }

  // Parse auction state from JSON
  let auctionState = null;
  if (auctionStateRow.rows?.[0]?.value) {
    try {
      auctionState = JSON.parse(auctionStateRow.rows[0].value);
    } catch (err) {
      console.error('Failed to parse auction state:', err);
    }
  }

  // Debug: Count total rows and check schema
  const countResult = await client.execute('SELECT COUNT(*) as total FROM journal_entries');
  const schemaResult = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='journal_entries'");
  console.log(`🔽 Database has ${countResult.rows[0]?.total || 0} total journal_entries rows`);
  console.log(`🔽 Table schema:`, schemaResult.rows[0]?.sql);
  console.log(`🔽 GET /api/sync returning ${journal.rows?.length || 0} journal entries`);
  console.log(`🔽 Journal IDs:`, journal.rows?.map(r => r.id));

  return json({
    success: true,
    data: {
      settings: settings.rows?.[0] || null,
      journal: journal.rows || [],
      moods: moods.rows || [],
      together: together.rows || [],
      heartbeats: heartbeats.rows || [],
      nameVotes: nameVotes.rows || [],
      loveNotes: loveNotes.rows || [],
      predictions: predictionsMap,
      kicks: kicks.rows || [],
      auctionState: auctionState,
    },
  });
}

async function handleSyncPost(env, request) {
  const client = getClient(env);
  const body = await request.json().catch(() => null);
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });

  const { settings, journal, moods, together, nameVotes, predictions, kicks, auctionState } = body;

  // 1) Settings
  if (settings) {
    const dueDate = settings.dueDate || settings.due_date || '2026-06-29';
    await client.execute({
      sql: `INSERT OR REPLACE INTO user_settings (id, name, partner_name, due_date, updated_at)
            VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        settings.name || 'Andrine',
        settings.partnerName || settings.partner_name || null,
        dueDate,
      ],
    });
  }

  // 2) Name votes (merge-safe upsert)
  if (Array.isArray(nameVotes)) {
    for (const vote of nameVotes) {
      if (!vote || !vote.name) continue;
      await client.execute({
        sql: `INSERT INTO name_votes (name, andrine_vote, partner_vote, is_custom, updated_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(name) DO UPDATE SET
                andrine_vote = COALESCE(excluded.andrine_vote, name_votes.andrine_vote),
                partner_vote = COALESCE(excluded.partner_vote, name_votes.partner_vote),
                is_custom = COALESCE(excluded.is_custom, name_votes.is_custom),
                updated_at = excluded.updated_at`,
        args: [
          vote.name,
          vote.andrine_vote || null,
          vote.partner_vote || null,
          vote.is_custom ? 1 : 0,
        ],
      });
    }
  }

  // 3) Journal
  if (Array.isArray(journal)) {
    console.log(`💾 Syncing ${journal.length} journal entries`);
    for (const entry of journal) {
      if (!entry || !entry.id) {
        console.warn(`⚠️ Skipping invalid entry:`, entry);
        continue;
      }
      console.log(`💾 Inserting journal entry ${entry.id}`);
      try {
        const insertResult = await client.execute({
          sql: `INSERT OR REPLACE INTO journal_entries (id, week_number, photo_blob, note, entry_date)
                VALUES (?, ?, ?, ?, ?)`,
          args: [
            entry.id,
            entry.week || entry.week_number || 0,
            entry.photo || entry.photo_blob || null,
            entry.note || '',
            entry.date || entry.entry_date || new Date().toISOString().split('T')[0],
          ],
        });
        console.log(`✅ INSERT result for ${entry.id}:`, insertResult);

        // Verify the insert
        const verify = await client.execute({
          sql: 'SELECT * FROM journal_entries WHERE id = ?',
          args: [entry.id]
        });
        console.log(`🔍 Verification for ${entry.id}:`, verify.rows.length > 0 ? 'FOUND' : 'NOT FOUND');
      } catch (err) {
        console.error(`❌ Failed to insert ${entry.id}:`, err.message);
      }
    }
  }

  // 4) Moods
  if (Array.isArray(moods)) {
    for (const entry of moods) {
      if (!entry || !entry.id) continue;
      await client.execute({
        sql: `INSERT OR REPLACE INTO mood_entries (id, date, mood_emoji, note)
              VALUES (?, ?, ?, ?)`,
        args: [
          entry.id,
          entry.date || new Date().toISOString(),
          entry.mood || entry.mood_emoji || '😊',
          entry.note || '',
        ],
      });
    }
  }

  // 5) Weekly questions
  if (Array.isArray(together)) {
    for (const entry of together) {
      if (!entry || !entry.id) continue;
      await client.execute({
        sql: `INSERT OR REPLACE INTO weekly_questions (id, week_number, question, andrine_answer, partner_answer, both_answered)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          entry.id,
          entry.week_number || 0,
          entry.question || '',
          entry.andrine_answer || null,
          entry.partner_answer || null,
          entry.both_answered ? 1 : 0,
        ],
      });
    }
  }

  // 6) Predictions
  if (predictions) {
    for (const [role, answers] of Object.entries(predictions)) {
      if (typeof answers !== 'object') continue;
      for (const [questionId, answer] of Object.entries(answers)) {
        const id = `${role}_${questionId}`;
        await client.execute({
          sql: `INSERT OR REPLACE INTO predictions (id, role, question_id, answer, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          args: [id, role, questionId, answer],
        });
      }
    }
  }

  // 7) Kick Sessions
  if (Array.isArray(kicks)) {
    console.log(`💾 Syncing ${kicks.length} kick sessions`);
    for (const session of kicks) {
      if (!session || !session.id) {
        console.warn(`⚠️ Skipping invalid kick session:`, session);
        continue;
      }
      console.log(`💾 Inserting kick session ${session.id}`);
      try {
        await client.execute({
          sql: `INSERT OR REPLACE INTO kick_sessions (id, start_time, end_time, count, duration_minutes)
                VALUES (?, ?, ?, ?, ?)`,
          args: [
            session.id,
            session.startTime || session.start_time,
            session.endTime || session.end_time || null,
            session.count || 0,
            session.duration || session.duration_minutes || null,
          ],
        });
        console.log(`✅ Kick session ${session.id} saved`);
      } catch (err) {
        console.error(`❌ Failed to insert kick session ${session.id}:`, err.message);
      }
    }
  }

  // 8) Auction State (store as JSON blob)
  if (auctionState) {
    console.log(`💾 Syncing auction state`);
    await client.execute({
      sql: `INSERT OR REPLACE INTO app_state (key, value, updated_at)
            VALUES ('love_auction_v2', ?, CURRENT_TIMESTAMP)`,
      args: [JSON.stringify(auctionState)],
    });
  }

  return json({ success: true, message: 'Sync complete' });
}

async function handleDeleteJournal(env, id) {
  if (!id) {
    return json({ success: false, error: 'Missing ID' }, { status: 400 });
  }

  const client = getClient(env);

  try {
    await client.execute({
      sql: 'DELETE FROM journal_entries WHERE id = ?',
      args: [id]
    });

    console.log(`🗑️ Deleted journal entry: ${id}`);
    return json({ success: true, message: 'Journal entry deleted' });
  } catch (err) {
    console.error('Delete journal error:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}

async function handleDeleteMood(env, id) {
  if (!id) {
    return json({ success: false, error: 'Missing ID' }, { status: 400 });
  }

  const client = getClient(env);

  try {
    await client.execute({
      sql: 'DELETE FROM mood_entries WHERE id = ?',
      args: [id]
    });

    console.log(`🗑️ Deleted mood entry: ${id}`);
    return json({ success: true, message: 'Mood entry deleted' });
  } catch (err) {
    console.error('Delete mood error:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 👥 PRESENCE & HEARTBEAT
// ─────────────────────────────────────────────────────────────────────────────

async function ensurePresenceRow(client) {
  await client.execute('INSERT OR IGNORE INTO presence (id) VALUES (1)');
}

async function handlePresence(env, request) {
  const client = getClient(env);
  await ensurePresenceRow(client);

  const body = await request.json().catch(() => null);
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });

  const { role, tap, kickStart, kickSession } = body;

  if (!role || (role !== 'andrine' && role !== 'partner')) {
    return json({ success: false, error: 'Invalid role' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const field = role === 'andrine' ? 'andrine_last_seen' : 'partner_last_seen';
  const tapField = role === 'andrine' ? 'andrine_tap' : 'partner_tap';

  // Update presence
  if (tap) {
    await client.execute({
      sql: `UPDATE presence SET ${field} = ?, ${tapField} = ?, updated_at = ? WHERE id = 1`,
      args: [now, now, now],
    });
  } else {
    await client.execute({
      sql: `UPDATE presence SET ${field} = ?, updated_at = ? WHERE id = 1`,
      args: [now, now],
    });
  }

  // Handle kick session start
  if (kickStart && role === 'andrine') {
    await client.execute({
      sql: `UPDATE presence SET andrine_kick = ? WHERE id = 1`,
      args: [now],
    });
  }

  // Handle active kick session updates
  if (kickSession !== undefined) {
    if (kickSession === null) {
      // Clear active session
      await client.execute(`DELETE FROM active_kick_session WHERE id = 1`);
      await client.execute(`UPDATE presence SET andrine_active_session = NULL WHERE id = 1`);
    } else {
      // Update active session
      await client.execute({
        sql: `INSERT OR REPLACE INTO active_kick_session (id, start_time, count, updated_at)
              VALUES (1, ?, ?, CURRENT_TIMESTAMP)`,
        args: [kickSession.startTime, kickSession.count],
      });
      await client.execute({
        sql: `UPDATE presence SET andrine_active_session = ? WHERE id = 1`,
        args: [JSON.stringify(kickSession)],
      });
    }
  }

  // Fetch current state
  const [presenceResult, activeKickResult] = await Promise.all([
    client.execute('SELECT * FROM presence WHERE id = 1'),
    client.execute('SELECT * FROM active_kick_session WHERE id = 1').catch(() => ({ rows: [] })),
  ]);

  const row = presenceResult.rows?.[0] || {};
  const activeKick = activeKickResult.rows?.[0] || null;

  // Check partner online status
  let partnerOnline = false;
  let partnerLastTap = null;

  const partnerField = role === 'andrine' ? 'partner_last_seen' : 'andrine_last_seen';
  const partnerTapField = role === 'andrine' ? 'partner_tap' : 'andrine_tap';

  const lastSeen = row[partnerField];
  if (lastSeen) {
    const diffSeconds = (Date.now() - new Date(lastSeen).getTime()) / 1000;
    if (diffSeconds < 60) partnerOnline = true;
  }
  partnerLastTap = row[partnerTapField] || null;

  // For partner, get Andrine's active kick session
  let andrineActiveSession = null;
  if (role === 'partner' && activeKick) {
    andrineActiveSession = {
      startTime: activeKick.start_time,
      count: activeKick.count,
    };
  }

  return json({
    success: true,
    online: partnerOnline,
    partnerOnline,
    partnerLastTap,
    andrineLastKick: row.andrine_kick || null,
    andrineActiveSession,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🦶 KICK SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

async function handleKicks(env, request) {
  const client = getClient(env);
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const result = await client.execute(
      'SELECT * FROM kick_sessions ORDER BY start_time DESC LIMIT 20'
    ).catch(() => ({ rows: [] }));
    return json({ success: true, kicks: result.rows || [] });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body) return json({ success: false, error: 'Invalid JSON' }, { status: 400 });

    const { action, session } = body;

    if (action === 'start') {
      const id = `kick_${Date.now()}`;
      const now = new Date().toISOString();
      
      await client.execute({
        sql: `INSERT INTO kick_sessions (id, start_time, count) VALUES (?, ?, 0)`,
        args: [id, now],
      });
      
      await client.execute({
        sql: `INSERT OR REPLACE INTO active_kick_session (id, start_time, count, updated_at)
              VALUES (1, ?, 0, CURRENT_TIMESTAMP)`,
        args: [now],
      });
      
      return json({ success: true, id, startTime: now });
    }

    if (action === 'increment') {
      await client.execute(
        `UPDATE active_kick_session SET count = count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = 1`
      );
      const result = await client.execute(`SELECT count FROM active_kick_session WHERE id = 1`);
      return json({ success: true, count: result.rows?.[0]?.count || 0 });
    }

    if (action === 'finish' && session) {
      const id = `kick_${Date.now()}`;
      await client.execute({
        sql: `INSERT INTO kick_sessions (id, start_time, end_time, count, duration_minutes)
              VALUES (?, ?, ?, ?, ?)`,
        args: [id, session.startTime, session.endTime, session.count, session.duration],
      });
      
      await client.execute(`DELETE FROM active_kick_session WHERE id = 1`);
      
      return json({ success: true, id });
    }

    return json({ success: false, error: 'Invalid action' }, { status: 400 });
  }

  return json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🎲 PREDICTIONS
// ─────────────────────────────────────────────────────────────────────────────

async function handlePredictions(env, request) {
  const client = getClient(env);

  if (request.method === 'GET') {
    const result = await client.execute('SELECT * FROM predictions').catch(() => ({ rows: [] }));
    
    const predictions = { andrine: {}, partner: {} };
    for (const row of (result.rows || [])) {
      if (!predictions[row.role]) predictions[row.role] = {};
      predictions[row.role][row.question_id] = row.answer;
    }
    
    return json({ success: true, predictions });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body) return json({ success: false, error: 'Invalid JSON' }, { status: 400 });

    const { role, questionId, answer } = body;
    const id = `${role}_${questionId}`;
    
    await client.execute({
      sql: `INSERT OR REPLACE INTO predictions (id, role, question_id, answer, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [id, role, questionId, answer],
    });
    
    return json({ success: true });
  }

  return json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

// ─────────────────────────────────────────────────────────────────────────────
// 💰 AUCTION SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

async function handleAuction(env, request) {
  const client = getClient(env);
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  // GET: Fetch auction state
  if (request.method === 'GET') {
    const [profiles, auctions, rewards, ledger] = await Promise.all([
      client.execute('SELECT * FROM auction_profiles'),
      client.execute('SELECT * FROM auctions WHERE settled = 0 ORDER BY end_time ASC'),
      client.execute('SELECT * FROM owned_rewards ORDER BY acquired_at DESC'),
      client.execute('SELECT * FROM ledger ORDER BY created_at DESC LIMIT 50'),
    ].map(p => p.catch(() => ({ rows: [] }))));

    const profilesMap = {};
    for (const row of (profiles.rows || [])) {
      profilesMap[row.role] = {
        coins: row.coins,
        weeklyEarned: row.weekly_earned,
        streak: row.streak,
        lastDailyClaim: row.last_daily_claim,
      };
    }

    return json({
      success: true,
      profiles: profilesMap,
      auctions: auctions.rows || [],
      ownedRewards: rewards.rows || [],
      ledger: ledger.rows || [],
    });
  }

  // POST: Actions
  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body) return json({ success: false, error: 'Invalid JSON' }, { status: 400 });

    const { role, type } = body;

    // Award coins
    if (type === 'earn') {
      const { amount, reason } = body;
      await client.execute({
        sql: `UPDATE auction_profiles SET coins = coins + ?, weekly_earned = weekly_earned + ? WHERE role = ?`,
        args: [amount, amount, role],
      });
      
      const ledgerId = `ledger_${Date.now()}`;
      await client.execute({
        sql: `INSERT INTO ledger (id, kind, profile_id, amount, meta, created_at)
              VALUES (?, 'EARN', ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [ledgerId, role, amount, JSON.stringify({ desc: reason })],
      });
      
      return json({ success: true });
    }

    // Place bid
    if (type === 'bid') {
      const { auctionId, amount } = body;
      
      // Get current auction
      const auctionResult = await client.execute({
        sql: `SELECT * FROM auctions WHERE id = ?`,
        args: [auctionId],
      });
      const auction = auctionResult.rows?.[0];
      if (!auction) return json({ success: false, error: 'Auction not found' }, { status: 404 });

      // Get user coins
      const profileResult = await client.execute({
        sql: `SELECT coins FROM auction_profiles WHERE role = ?`,
        args: [role],
      });
      const userCoins = profileResult.rows?.[0]?.coins || 0;
      
      if (amount > userCoins) {
        return json({ success: false, error: 'Not enough coins' }, { status: 400 });
      }

      // Refund previous bidder
      if (auction.highest_bidder) {
        await client.execute({
          sql: `UPDATE auction_profiles SET coins = coins + ? WHERE role = ?`,
          args: [auction.highest_bid, auction.highest_bidder],
        });
      }

      // Deduct from new bidder
      await client.execute({
        sql: `UPDATE auction_profiles SET coins = coins - ? WHERE role = ?`,
        args: [amount, role],
      });

      // Update auction
      await client.execute({
        sql: `UPDATE auctions SET highest_bid = ?, highest_bidder = ? WHERE id = ?`,
        args: [amount, role, auctionId],
      });

      return json({ success: true });
    }

    // Daily claim
    if (type === 'daily_claim') {
      const today = new Date().toISOString().split('T')[0];
      
      const profileResult = await client.execute({
        sql: `SELECT last_daily_claim, streak FROM auction_profiles WHERE role = ?`,
        args: [role],
      });
      const profile = profileResult.rows?.[0];
      
      if (profile?.last_daily_claim === today) {
        return json({ success: false, error: 'Already claimed today' }, { status: 400 });
      }

      // Calculate streak
      let newStreak = 1;
      if (profile?.last_daily_claim) {
        const lastDate = new Date(profile.last_daily_claim);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
          newStreak = (profile.streak || 0) + 1;
        }
      }

      const bonus = Math.min(10 + newStreak * 2, 30); // 10-30 coins based on streak

      await client.execute({
        sql: `UPDATE auction_profiles SET coins = coins + ?, streak = ?, last_daily_claim = ? WHERE role = ?`,
        args: [bonus, newStreak, today, role],
      });

      return json({ success: true, bonus, streak: newStreak });
    }

    return json({ success: false, error: 'Invalid action type' }, { status: 400 });
  }

  return json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

// ─────────────────────────────────────────────────────────────────────────────
// 💓 HEARTBEAT GAME
// ─────────────────────────────────────────────────────────────────────────────

async function handleHeartbeat(env, request) {
  const client = getClient(env);

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body) return json({ success: false, error: 'Invalid JSON' }, { status: 400 });

    const { role, result, duration, score } = body;

    // Just a tap (for presence)
    if (!result) {
      await ensurePresenceRow(client);
      const now = new Date().toISOString();
      const tapField = role === 'andrine' ? 'andrine_tap' : 'partner_tap';
      
      await client.execute({
        sql: `UPDATE presence SET ${tapField} = ?, updated_at = ? WHERE id = 1`,
        args: [now, now],
      });
      
      return json({ success: true, sentAt: now });
    }

    // Save session result
    const id = `hb_${Date.now()}`;
    await client.execute({
      sql: `INSERT INTO heartbeat_sessions (id, timestamp, sync_result, duration_seconds, high_score)
            VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?)`,
      args: [id, result, duration || 0, score || 0],
    });

    return json({ success: true, id });
  }

  if (request.method === 'GET') {
    const result = await client.execute(
      'SELECT * FROM heartbeat_sessions ORDER BY timestamp DESC LIMIT 10'
    ).catch(() => ({ rows: [] }));
    return json({ success: true, sessions: result.rows || [] });
  }

  return json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

// ─────────────────────────────────────────────────────────────────────────────
// 💌 LOVE NOTES
// ─────────────────────────────────────────────────────────────────────────────

async function handleLoveNotes(env, request) {
  const client = getClient(env);

  if (request.method === 'GET') {
    const result = await client.execute(
      'SELECT * FROM love_notes ORDER BY created_at DESC'
    ).catch(() => ({ rows: [] }));
    return json({ success: true, notes: result.rows || [] });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body) return json({ success: false, error: 'Invalid JSON' }, { status: 400 });

    const { action, id, message, fromPartner } = body;

    // Mark as read
    if (action === 'read' && id) {
      await client.execute({
        sql: `UPDATE love_notes SET shown = 1 WHERE id = ?`,
        args: [id],
      });
      return json({ success: true });
    }

    // Create new note
    if (action === 'create' && message) {
      const noteId = `note_${Date.now()}`;
      await client.execute({
        sql: `INSERT INTO love_notes (id, from_partner, message, shown) VALUES (?, ?, ?, 0)`,
        args: [noteId, fromPartner ? 1 : 0, message],
      });
      return json({ success: true, id: noteId });
    }

    return json({ success: false, error: 'Invalid action' }, { status: 400 });
  }

  return json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🚀 MAIN ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }), env, request);
    }

    try {
      // Health check
      if (url.pathname === '/' || url.pathname === '/api/health') {
        return withCors(json({ 
          status: 'ok', 
          version: '2.0',
          ts: new Date().toISOString() 
        }), env, request);
      }

      // Initialize DB
      if (url.pathname === '/api/init') {
        return withCors(await handleInit(env), env, request);
      }

      // Sync endpoints
      if (url.pathname === '/api/sync' && request.method === 'GET') {
        return withCors(await handleSyncGet(env), env, request);
      }
      if (url.pathname === '/api/sync' && request.method === 'POST') {
        return withCors(await handleSyncPost(env, request), env, request);
      }

      // Delete endpoints
      if (url.pathname.startsWith('/api/journal/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        return withCors(await handleDeleteJournal(env, id), env, request);
      }
      if (url.pathname.startsWith('/api/mood/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        return withCors(await handleDeleteMood(env, id), env, request);
      }

      // Presence
      if (url.pathname === '/api/presence' && request.method === 'POST') {
        return withCors(await handlePresence(env, request), env, request);
      }

      // Kicks
      if (url.pathname === '/api/kicks') {
        return withCors(await handleKicks(env, request), env, request);
      }

      // Predictions
      if (url.pathname === '/api/predictions') {
        return withCors(await handlePredictions(env, request), env, request);
      }

      // Auction
      if (url.pathname === '/api/auction') {
        return withCors(await handleAuction(env, request), env, request);
      }

      // Heartbeat
      if (url.pathname === '/api/heartbeat') {
        return withCors(await handleHeartbeat(env, request), env, request);
      }

      // Love notes
      if (url.pathname === '/api/notes') {
        return withCors(await handleLoveNotes(env, request), env, request);
      }

      return withCors(json({ success: false, error: 'Not found' }, { status: 404 }), env, request);
    } catch (err) {
      console.error('API Error:', err);
      return withCors(
        json({ success: false, error: err?.message || String(err) }, { status: 500 }),
        env,
        request
      );
    }
  },
};
