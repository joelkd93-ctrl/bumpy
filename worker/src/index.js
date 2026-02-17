// ═══════════════════════════════════════════════════════════════════════════
// 💕 BUMPY API v2 — Enhanced Cloudflare Worker with Turso
// Supports: sync, presence, kicks, predictions, auction, heartbeat
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@libsql/client/web';
import webpush from 'web-push';

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

function makeMediaUrl(request, key) {
  if (!key) return null;
  const base = new URL(request.url).origin;
  return `${base}/api/media/${encodeURIComponent(key)}`;
}

let schemaEnsured = false;
let schemaEnsureInFlight = null;

async function ensureSchema(env) {
  if (schemaEnsured) return;
  if (schemaEnsureInFlight) {
    await schemaEnsureInFlight;
    return;
  }

  schemaEnsureInFlight = (async () => {
    try {
      await handleInit(env);
      schemaEnsured = true;
      console.log('✅ Schema ensured on worker startup');
    } catch (err) {
      console.error('❌ Schema ensure failed:', err?.message || err);
      throw err;
    } finally {
      schemaEnsureInFlight = null;
    }
  })();

  await schemaEnsureInFlight;
}

function parseDataUrl(dataUrl) {
  const str = String(dataUrl || '');
  const match = /^data:([^;]+);base64,(.+)$/i.exec(str);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return { mime, bytes };
}

function extFromMime(mime) {
  if (!mime) return 'bin';
  if (mime.includes('jpeg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('quicktime')) return 'mov';
  if (mime.includes('webm')) return 'webm';
  return 'bin';
}

async function uploadMediaToR2(env, request, { id, dataUrl, folder = 'journal' }) {
  if (!dataUrl || !env.MEDIA) return { key: null, url: null, mime: null, size: 0 };

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throw new Error('Invalid data URL for media upload');

  const { mime, bytes } = parsed;
  const ext = extFromMime(mime);
  const key = `${folder}/${id}.${ext}`;

  await env.MEDIA.put(key, bytes, {
    httpMetadata: {
      contentType: mime,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  return {
    key,
    url: makeMediaUrl(request, key),
    mime,
    size: bytes.byteLength,
  };
}

async function uploadJournalPhotoToR2(env, request, id, photoBlob) {
  const res = await uploadMediaToR2(env, request, { id, dataUrl: photoBlob, folder: 'journal' });
  return { photoKey: res.key, photoUrl: res.url };
}

function getVapidConfig(env) {
  const publicKey = env.VAPID_PUBLIC_KEY || '';
  const privateKey = env.VAPID_PRIVATE_KEY || '';
  const subject = env.VAPID_SUBJECT || 'mailto:admin@bumpy.app';
  return { publicKey, privateKey, subject };
}

async function sendPushToRole(env, role, payload) {
  const { publicKey, privateKey, subject } = getVapidConfig(env);
  if (!publicKey || !privateKey) {
    console.warn('Push skipped: missing VAPID keys');
    return { sent: 0, failed: 0, skipped: 1, errors: [] };
  }

  const client = getClient(env);
  const rows = await client.execute({
    sql: 'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE role = ? AND enabled = 1',
    args: [role],
  }).catch(() => ({ rows: [] }));

  const subscriptions = rows.rows || [];
  if (!subscriptions.length) return { sent: 0, failed: 0, skipped: 0, errors: [] };

  webpush.setVapidDetails(subject, publicKey, privateKey);

  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const row of subscriptions) {
    const sub = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };

    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      sent++;
    } catch (err) {
      failed++;
      const status = Number(err?.statusCode || err?.status || 0);
      const msg = String(err?.body || err?.message || err || 'push failed');
      if (errors.length < 5) errors.push({ status, message: msg.slice(0, 240) });

      // Remove bad subscriptions on any permanent client-side error
      if (status >= 400 && status < 500) {
        await client.execute({ sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?', args: [row.endpoint] }).catch(() => {});
      }
      console.warn('Push send failed:', status || msg);
    }
  }

  return { sent, failed, skipped: 0, errors };
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

    // App state storage (for complex objects like auction state)
    `CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // App settings
    `CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT 'Andrine',
      partner_name TEXT,
      due_date TEXT DEFAULT '2026-06-29',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Baby name voting
    `CREATE TABLE IF NOT EXISTS name_votes (
      name TEXT PRIMARY KEY,
      andrine_vote TEXT,
      partner_vote TEXT,
      is_custom INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Matched names (names both partners love)
    `CREATE TABLE IF NOT EXISTS matched_names (
      name TEXT PRIMARY KEY,
      matched_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Custom names (user-added names)
    `CREATE TABLE IF NOT EXISTS custom_names (
      name TEXT PRIMARY KEY,
      added_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Weekly Q&A game state
    `CREATE TABLE IF NOT EXISTS weekly_questions (
      id TEXT PRIMARY KEY,
      week_number INTEGER,
      question TEXT,
      andrine_answer TEXT,
      partner_answer TEXT,
      both_answered INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Heartbeat game history
    `CREATE TABLE IF NOT EXISTS heartbeat_sessions (
      id TEXT PRIMARY KEY,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      sync_result TEXT,
      duration_seconds INTEGER DEFAULT 0,
      high_score INTEGER DEFAULT 0
    )`,

    // Optional love notes stream
    `CREATE TABLE IF NOT EXISTS love_notes (
      id TEXT PRIMARY KEY,
      role TEXT,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Web push subscriptions (per role/device)
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      enabled INTEGER DEFAULT 1
    )`,

    // Add columns to journal_entries if not exists (for existing databases)
    `ALTER TABLE journal_entries ADD COLUMN entry_date TEXT`,
    `ALTER TABLE journal_entries ADD COLUMN photo_key TEXT`,
    `ALTER TABLE journal_entries ADD COLUMN photo_url TEXT`,
    `ALTER TABLE journal_entries ADD COLUMN media_type TEXT`,
    `ALTER TABLE journal_entries ADD COLUMN media_key TEXT`,
    `ALTER TABLE journal_entries ADD COLUMN media_url TEXT`,
    `ALTER TABLE journal_entries ADD COLUMN media_thumb_url TEXT`,
    `ALTER TABLE journal_entries ADD COLUMN media_duration INTEGER`,

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

  // CLEANUP: Remove any references to journal_entries_old
  try {
    // Drop any triggers referencing old table
    const triggers = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='trigger' AND sql LIKE '%journal_entries_old%'
    `);
    for (const trigger of (triggers.rows || [])) {
      await client.execute(`DROP TRIGGER IF EXISTS ${trigger.name}`);
      console.log(`🧹 Dropped trigger: ${trigger.name}`);
    }

    // Drop any views referencing old table
    const views = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='view' AND sql LIKE '%journal_entries_old%'
    `);
    for (const view of (views.rows || [])) {
      await client.execute(`DROP VIEW IF EXISTS ${view.name}`);
      console.log(`🧹 Dropped view: ${view.name}`);
    }

    // Drop the old table itself
    await client.execute(`DROP TABLE IF EXISTS journal_entries_old`);
    console.log('🧹 Cleaned up old migration artifacts');
  } catch (e) {
    console.warn('⚠️ Cleanup warning:', e.message);
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

async function handleSyncGet(env, request) {
  const client = getClient(env);

  const [
    settings,
    journalMeta,
    moods,
    together,
    heartbeats,
    nameVotes,
    matchedNamesResult,
    customNamesResult,
    loveNotes,
    predictions,
    kicks,
    auctionStateRow,
    nameVotesEpochRow,
    clientStateRows,
  ] = await Promise.all([
    client.execute('SELECT * FROM user_settings WHERE id = 1'),
    client.execute(`SELECT id, week_number, note, entry_date, created_at, photo_key, photo_url,
                           media_type, media_key, media_url, media_thumb_url, media_duration
                    FROM journal_entries
                    ORDER BY COALESCE(entry_date, created_at) DESC
                    LIMIT 50`),
    client.execute('SELECT * FROM mood_entries ORDER BY date DESC LIMIT 100'),
    client.execute('SELECT * FROM weekly_questions').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM heartbeat_sessions ORDER BY timestamp DESC LIMIT 10').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM name_votes').catch(() => ({ rows: [] })),
    client.execute('SELECT name FROM matched_names ORDER BY matched_at DESC').catch(() => ({ rows: [] })),
    client.execute('SELECT name FROM custom_names ORDER BY added_at DESC').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM love_notes').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM predictions').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM kick_sessions ORDER BY start_time DESC LIMIT 20').catch(() => ({ rows: [] })),
    client.execute("SELECT value FROM app_state WHERE key = 'love_auction_v2'").catch(() => ({ rows: [] })),
    client.execute("SELECT value FROM app_state WHERE key = 'name_votes_epoch'").catch(() => ({ rows: [] })),
    client.execute("SELECT key, value FROM app_state WHERE key LIKE 'client:%'").catch(() => ({ rows: [] })),
  ]);

  const journalRows = (journalMeta.rows || []).map((row) => ({
    id: row.id,
    week_number: row.week_number,
    photo_blob: null,
    photo_key: row.photo_key || null,
    photo_url: row.photo_url || makeMediaUrl(request, row.photo_key),
    media_type: row.media_type || null,
    media_key: row.media_key || null,
    media_url: row.media_url || makeMediaUrl(request, row.media_key),
    media_thumb_url: row.media_thumb_url || null,
    media_duration: row.media_duration || null,
    note: row.note,
    entry_date: row.entry_date,
    created_at: row.created_at,
  }));

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
  console.log(`🔽 GET /api/sync returning ${journalRows.length || 0} journal entries`);
  console.log(`🔽 Journal IDs:`, journalRows.map(r => r.id));

  // Extract matched names and custom names as arrays of strings
  const matchedNames = (matchedNamesResult.rows || []).map(row => row.name);
  const customNames = (customNamesResult.rows || []).map(row => row.name);

  const clientState = {};
  for (const row of (clientStateRows.rows || [])) {
    const key = String(row.key || '');
    const localKey = key.startsWith('client:') ? key.slice(7) : key;
    if (!localKey) continue;
    try {
      clientState[localKey] = JSON.parse(row.value);
    } catch {
      clientState[localKey] = row.value;
    }
  }

  return json({
    success: true,
    data: {
      settings: settings.rows?.[0] || null,
      journal: journalRows || [],
      moods: moods.rows || [],
      together: together.rows || [],
      heartbeats: heartbeats.rows || [],
      nameVotes: nameVotes.rows || [],
      matchedNames,
      customNames,
      nameVotesEpoch: Number(nameVotesEpochRow.rows?.[0]?.value || 0) || 0,
      loveNotes: loveNotes.rows || [],
      predictions: predictionsMap,
      kicks: kicks.rows || [],
      auctionState: auctionState,
      clientState,
    },
  });
}

async function handleSyncPost(env, request) {
  const client = getClient(env);
  const body = await request.json().catch(() => null);
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });

  const { settings, journal, moods, together, nameVotes, matchedNames, customNames, nameVotesEpoch, resetNameVotes, predictions, kicks, deletedKickIds, auctionState, clientState } = body;

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

  // 2) Name votes (merge-safe with epoch guard + explicit reset)
  if (Array.isArray(nameVotes)) {
    const incomingEpoch = Number(nameVotesEpoch || 0) || 0;
    const serverEpochRow = await client.execute("SELECT value FROM app_state WHERE key = 'name_votes_epoch'").catch(() => ({ rows: [] }));
    const serverEpoch = Number(serverEpochRow.rows?.[0]?.value || 0) || 0;

    // Explicit reset path (used by "Start på nytt")
    if (resetNameVotes === true) {
      const nextEpoch = incomingEpoch > 0 ? incomingEpoch : Date.now();
      await client.execute(`DELETE FROM name_votes`);
      await client.execute({
        sql: `INSERT OR REPLACE INTO app_state (key, value, updated_at)
              VALUES ('name_votes_epoch', ?, CURRENT_TIMESTAMP)`,
        args: [String(nextEpoch)],
      });
    } else if (incomingEpoch > 0 && incomingEpoch < serverEpoch) {
      // Stale client write after reset: ignore to prevent resurrecting old votes
      console.log('⏭️ Ignoring stale nameVotes payload', { incomingEpoch, serverEpoch });
    } else {
      // Normal voting path: merge/upsert only (no table wipe)
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

      if (incomingEpoch > 0) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO app_state (key, value, updated_at)
                VALUES ('name_votes_epoch', ?, CURRENT_TIMESTAMP)`,
          args: [String(incomingEpoch)],
        });
      }
    }
  }

  // 2b) Matched names
  if (matchedNames !== undefined) {
    await client.execute('DELETE FROM matched_names');
    if (Array.isArray(matchedNames)) {
      for (const name of matchedNames) {
        await client.execute({
          sql: `INSERT INTO matched_names (name, matched_at) VALUES (?, CURRENT_TIMESTAMP)`,
          args: [name],
        });
      }
    }
  }

  // 2c) Custom names
  if (customNames !== undefined) {
    await client.execute('DELETE FROM custom_names');
    if (Array.isArray(customNames)) {
      for (const name of customNames) {
        await client.execute({
          sql: `INSERT INTO custom_names (name, added_at) VALUES (?, CURRENT_TIMESTAMP)`,
          args: [name],
        });
      }
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

  // Delete kick sessions explicitly marked for deletion by client
  if (Array.isArray(deletedKickIds) && deletedKickIds.length > 0) {
    console.log(`🗑️ Deleting ${deletedKickIds.length} kick sessions:`, deletedKickIds);
    for (const id of deletedKickIds) {
      if (!id) continue;
      try {
        await client.execute({
          sql: 'DELETE FROM kick_sessions WHERE id = ?',
          args: [id]
        });
        console.log(`✅ Deleted kick session: ${id}`);
      } catch (err) {
        console.error(`❌ Failed to delete kick session ${id}:`, err.message);
      }
    }
  }

  // 8) Lightweight client state (weekly_*, mood_guess_today, mission_completed_*)
  if (clientState && typeof clientState === 'object') {
    for (const [k, v] of Object.entries(clientState)) {
      if (!k) continue;
      await client.execute({
        sql: `INSERT OR REPLACE INTO app_state (key, value, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)`,
        args: [`client:${k}`, JSON.stringify(v ?? null)],
      });
    }
  }

  // 9) Auction State (store as JSON blob)
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

async function handleUpsertJournal(env, request) {
  const client = getClient(env);
  const body = await request.json().catch(() => null);
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });

  const { id, week_number, photo_blob, media, note, entry_date } = body;
  if (!id) return json({ success: false, error: 'Missing id' }, { status: 400 });

  try {
    let photoKey = null;
    let photoUrl = null;
    let mediaType = null;
    let mediaKey = null;
    let mediaUrl = null;
    let mediaThumbUrl = null;
    let mediaDuration = null;

    const current = await client.execute({
      sql: 'SELECT photo_key, photo_url, media_type, media_key, media_url, media_thumb_url, media_duration FROM journal_entries WHERE id = ?',
      args: [id],
    }).catch(() => ({ rows: [] }));

    if (photo_blob) {
      const uploaded = await uploadJournalPhotoToR2(env, request, id, photo_blob);
      photoKey = uploaded.photoKey;
      photoUrl = uploaded.photoUrl;
      mediaType = 'image';
      mediaKey = uploaded.photoKey;
      mediaUrl = uploaded.photoUrl;
    } else if (media?.data_url) {
      const uploaded = await uploadMediaToR2(env, request, { id, dataUrl: media.data_url, folder: 'journal' });
      mediaType = media.type || (uploaded.mime?.startsWith('video/') ? 'video' : 'image');
      mediaKey = uploaded.key;
      mediaUrl = uploaded.url;
      mediaThumbUrl = media.thumb_url || null;
      mediaDuration = Number(media.duration || 0) || null;

      if (mediaType === 'image') {
        photoKey = uploaded.key;
        photoUrl = uploaded.url;
      }
    } else {
      photoKey = current.rows?.[0]?.photo_key || null;
      photoUrl = current.rows?.[0]?.photo_url || (photoKey ? makeMediaUrl(request, photoKey) : null);
      mediaType = current.rows?.[0]?.media_type || null;
      mediaKey = current.rows?.[0]?.media_key || null;
      mediaUrl = current.rows?.[0]?.media_url || (mediaKey ? makeMediaUrl(request, mediaKey) : null);
      mediaThumbUrl = current.rows?.[0]?.media_thumb_url || null;
      mediaDuration = current.rows?.[0]?.media_duration || null;
    }

    await client.execute({
      sql: `INSERT OR REPLACE INTO journal_entries (id, week_number, photo_blob, photo_key, photo_url, media_type, media_key, media_url, media_thumb_url, media_duration, note, entry_date)
            VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        Number(week_number || 0),
        photoKey,
        photoUrl,
        mediaType,
        mediaKey,
        mediaUrl,
        mediaThumbUrl,
        mediaDuration,
        note || '',
        entry_date || new Date().toISOString().split('T')[0],
      ],
    });

    return json({ success: true, id, photo_key: photoKey, photo_url: photoUrl, media_type: mediaType, media_key: mediaKey, media_url: mediaUrl, media_thumb_url: mediaThumbUrl, media_duration: mediaDuration });
  } catch (err) {
    console.error('Upsert journal error:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}

async function handleDeleteJournal(env, id) {
  if (!id) {
    return json({ success: false, error: 'Missing ID' }, { status: 400 });
  }

  const client = getClient(env);

  try {
    const current = await client.execute({
      sql: 'SELECT photo_key, media_key FROM journal_entries WHERE id = ?',
      args: [id]
    }).catch(() => ({ rows: [] }));

    const photoKey = current.rows?.[0]?.photo_key || null;
    const mediaKey = current.rows?.[0]?.media_key || null;

    if (env.MEDIA) {
      if (photoKey) await env.MEDIA.delete(photoKey).catch(() => {});
      if (mediaKey && mediaKey !== photoKey) await env.MEDIA.delete(mediaKey).catch(() => {});
    }

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

async function handleUpsertMood(env, request) {
  const client = getClient(env);
  const body = await request.json().catch(() => null);
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });

  const { id, date, mood_emoji, note } = body;
  if (!id) return json({ success: false, error: 'Missing id' }, { status: 400 });

  try {
    await client.execute({
      sql: `INSERT OR REPLACE INTO mood_entries (id, date, mood_emoji, note)
            VALUES (?, ?, ?, ?)`,
      args: [
        id,
        date || new Date().toISOString(),
        mood_emoji || '😊',
        note || '',
      ],
    });

    return json({ success: true, id });
  } catch (err) {
    console.error('Upsert mood error:', err);
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

async function handleMediaUpload(env, request) {
  if (!env.MEDIA) {
    return json({ success: false, error: 'MEDIA bucket not configured' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });

  const { id, data_url, type, folder } = body;
  if (!id || !data_url) {
    return json({ success: false, error: 'Missing id or data_url' }, { status: 400 });
  }

  try {
    const uploaded = await uploadMediaToR2(env, request, {
      id,
      dataUrl: data_url,
      folder: folder || 'journal',
    });

    const kind = type || (uploaded.mime?.startsWith('video/') ? 'video' : 'image');

    return json({
      success: true,
      media: {
        type: kind,
        key: uploaded.key,
        url: uploaded.url,
        mime: uploaded.mime,
        size: uploaded.size,
      },
    });
  } catch (err) {
    console.error('Media upload error:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}

async function handleMediaMigration(env, request) {
  if (!env.MEDIA) {
    return json({ success: false, error: 'MEDIA bucket not configured' }, { status: 503 });
  }

  const client = getClient(env);
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(25, Number(url.searchParams.get('limit') || 10)));

  try {
    const rows = await client.execute({
      sql: `SELECT id, photo_blob FROM journal_entries
            WHERE photo_blob IS NOT NULL AND LENGTH(photo_blob) > 0
              AND (photo_key IS NULL OR photo_key = '')
            LIMIT ?`,
      args: [limit],
    });

    let migrated = 0;
    for (const row of (rows.rows || [])) {
      try {
        const uploaded = await uploadMediaToR2(env, request, {
          id: row.id,
          dataUrl: row.photo_blob,
          folder: 'journal',
        });

        await client.execute({
          sql: `UPDATE journal_entries
                SET photo_blob = NULL,
                    photo_key = ?,
                    photo_url = ?,
                    media_type = COALESCE(media_type, 'image'),
                    media_key = COALESCE(media_key, ?),
                    media_url = COALESCE(media_url, ?)
                WHERE id = ?`,
          args: [uploaded.key, uploaded.url, uploaded.key, uploaded.url, row.id],
        });

        migrated += 1;
      } catch (err) {
        console.warn('Migration row failed:', row.id, err?.message || err);
      }
    }

    return json({ success: true, migrated, requested: limit });
  } catch (err) {
    console.error('Media migration failed:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}

async function handleDeleteKick(env, id) {
  if (!id) {
    return json({ success: false, error: 'Missing ID' }, { status: 400 });
  }

  const client = getClient(env);

  try {
    await client.execute({
      sql: 'DELETE FROM kick_sessions WHERE id = ?',
      args: [id]
    });

    console.log(`🗑️ Deleted kick session: ${id}`);
    return json({ success: true, message: 'Kick session deleted' });
  } catch (err) {
    console.error('Delete kick error:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 👥 PRESENCE & HEARTBEAT
// ─────────────────────────────────────────────────────────────────────────────

async function handlePushPublicKey(env) {
  const { publicKey } = getVapidConfig(env);
  return json({ success: !!publicKey, publicKey: publicKey || null });
}

async function handlePushSubscribe(env, request) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });

  const { role, subscription } = body;
  if (!role || !['andrine', 'partner'].includes(role)) {
    return json({ success: false, error: 'Invalid role' }, { status: 400 });
  }

  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return json({ success: false, error: 'Invalid subscription' }, { status: 400 });
  }

  const client = getClient(env);
  await client.execute({
    sql: `INSERT OR REPLACE INTO push_subscriptions (endpoint, role, p256dh, auth, user_agent, enabled, updated_at)
          VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    args: [endpoint, role, p256dh, auth, request.headers.get('user-agent') || null],
  });

  return json({ success: true });
}

async function handlePushUnsubscribe(env, request) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });

  const endpoint = body?.endpoint;
  if (!endpoint) return json({ success: false, error: 'Missing endpoint' }, { status: 400 });

  const client = getClient(env);
  await client.execute({ sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?', args: [endpoint] });
  return json({ success: true });
}

async function handlePushTest(env, request) {
  const body = await request.json().catch(() => ({}));
  const role = body?.role;
  if (!role || !['andrine', 'partner'].includes(role)) {
    return json({ success: false, error: 'Invalid role' }, { status: 400 });
  }

  const result = await sendPushToRole(env, role, {
    title: '💕 Bumpy',
    body: 'Testvarsel fra Bumpy',
    icon: '/icons/icon-192.png',
    tag: `test-${Date.now()}`,
    url: '/',
    vibrate: [120, 60, 120],
  });

  return json({ success: true, result });
}

async function handleReset(env) {
  const client = getClient(env);

  const wipeSql = [
    'DELETE FROM journal_entries',
    'DELETE FROM mood_entries',
    'DELETE FROM kick_sessions',
    'DELETE FROM active_kick_session',
    'DELETE FROM predictions',
    'DELETE FROM name_votes',
    'DELETE FROM matched_names',
    'DELETE FROM custom_names',
    'DELETE FROM auctions',
    'DELETE FROM owned_rewards',
    'DELETE FROM ledger',
    'DELETE FROM app_state',
  ];

  for (const sql of wipeSql) {
    try {
      await client.execute(sql);
    } catch (err) {
      console.warn('Reset warning:', sql, err.message);
    }
  }

  try {
    await client.execute('DELETE FROM auction_profiles');
    await client.execute(`INSERT OR REPLACE INTO auction_profiles (role, coins, weekly_earned, streak, last_daily_claim) VALUES ('andrine', 50, 0, 0, NULL)`);
    await client.execute(`INSERT OR REPLACE INTO auction_profiles (role, coins, weekly_earned, streak, last_daily_claim) VALUES ('partner', 50, 0, 0, NULL)`);
  } catch (err) {
    console.warn('Reset warning: auction_profiles', err.message);
  }

  try {
    await client.execute('DELETE FROM presence');
    await client.execute('INSERT INTO presence (id, updated_at) VALUES (1, CURRENT_TIMESTAMP)');
  } catch (err) {
    console.warn('Reset warning: presence', err.message);
  }

  try {
    await client.execute(`INSERT OR REPLACE INTO user_settings (id, name, partner_name, due_date, updated_at)
      VALUES (1, 'Andrine', NULL, '2026-06-29', CURRENT_TIMESTAMP)`);
  } catch (err) {
    console.warn('Reset warning: user_settings', err.message);
  }

  return json({ success: true, message: 'Cloud data reset' });
}

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

  // Send real push on heart tap
  if (tap) {
    const targetRole = role === 'andrine' ? 'partner' : 'andrine';
    sendPushToRole(env, targetRole, {
      title: '💕 Bumpy',
      body: 'Deler litt kjærlighet med deg 💚',
      icon: '/icons/icon-192.png',
      tag: `heart-${Date.now()}`,
      url: '/',
      vibrate: [100, 50, 100],
    }).catch(() => {});
  }

  // Handle kick session start
  if (kickStart && role === 'andrine') {
    await client.execute({
      sql: `UPDATE presence SET andrine_kick = ? WHERE id = 1`,
      args: [now],
    });

    sendPushToRole(env, 'partner', {
      title: '🦶 Baby sparker!',
      body: 'Andrine registrerte et spark nå.',
      icon: '/icons/icon-192.png',
      tag: `kick-${Date.now()}`,
      url: '/?tab=kicks',
      vibrate: [180, 80, 180],
    }).catch(() => {});
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

const AUCTION_SEED_ITEMS = [
  { title: '60 min Full Kroppsmassasje', description: 'Den ultimate spaopplevelsen hjemme.', category: 'Luksus', start: 40, inc: 5 },
  { title: 'Master of Remote', description: 'Full kontroll over TV-en en hel kveld.', category: 'Makt', start: 20, inc: 2 },
  { title: 'Helg uten planer', description: 'Vi sier nei til alt og bare er hjemme.', category: 'Frihet', start: 50, inc: 10 },
  { title: '3-retters middag', description: 'Du lager forrett, hovedrett og dessert.', category: 'Mat', start: 60, inc: 5 },
  { title: 'Privatsjåfør', description: 'Du kjører og henter meg hvor som helst en kveld.', category: 'Praktisk', start: 25, inc: 5 },
  { title: 'Hjemme-spa Pakke', description: 'Bad, massasje, ansiktsmaske - alt sammen.', category: 'Luksus', start: 120, inc: 15 },
];

const AUCTION_TASK_REWARDS = {
  hug: 3,
  letter: 5,
  tidy: 4,
};

const AUCTION_SHOP_RULES = {
  item_back_massage: { title: '15 min Ryggmassasje', cost: 15, payer: 'BEGGE', requiresBothConfirm: false },
  item_foot_massage: { title: 'Fotmassasje', cost: 15, payer: 'BEGGE', requiresBothConfirm: false },
  item_head_scratch: { title: 'Hodebunnskos', cost: 10, payer: 'BEGGE', requiresBothConfirm: false },
  item_scratch_back: { title: 'Kile på ryggen', cost: 10, payer: 'BEGGE', requiresBothConfirm: false },
  item_movie_pick: { title: 'Velg Filmkveld', cost: 30, payer: 'BEGGE', requiresBothConfirm: false },
  item_series_ep: { title: 'Én episode til', cost: 10, payer: 'BEGGE', requiresBothConfirm: false },
  item_back_scratch_20: { title: '20 min Rygge-kløing', cost: 35, payer: 'BEGGE', requiresBothConfirm: false },
  item_game_night: { title: 'Spillkveld av Ditt Valg', cost: 45, payer: 'BEGGE', requiresBothConfirm: false },
  item_music_choice: { title: 'Velg Musikk i Bilen', cost: 25, payer: 'BEGGE', requiresBothConfirm: false },
  item_breakfast_bed: { title: 'Frokost på senga', cost: 50, payer: 'BEGGE', requiresBothConfirm: false },
  item_dinner_chef: { title: 'Du lager middag', cost: 20, payer: 'BEGGE', requiresBothConfirm: false },
  item_water_fetch: { title: 'Hente vann', cost: 5, payer: 'BEGGE', requiresBothConfirm: false },
  item_snack_run: { title: 'Snack Levering', cost: 15, payer: 'BEGGE', requiresBothConfirm: false },
  item_coffee_bed: { title: 'Kaffe på senga', cost: 10, payer: 'BEGGE', requiresBothConfirm: false },
  item_pizza_night: { title: 'Pizza-kveld', cost: 30, payer: 'BEGGE', requiresBothConfirm: true },
  item_takeout: { title: 'Takeaway etter Eget Valg', cost: 70, payer: 'BEGGE', requiresBothConfirm: false },
  item_dessert: { title: 'Hjemmelaget Dessert', cost: 55, payer: 'BEGGE', requiresBothConfirm: false },
  item_champagne_breakfast: { title: 'Champagne-frokost', cost: 120, payer: 'BEGGE', requiresBothConfirm: false },
  item_weekend_brunch: { title: 'Weekend Brunch-laging', cost: 95, payer: 'BEGGE', requiresBothConfirm: false },
  item_date_night_luxury: { title: 'Luksus Date Night', cost: 150, payer: 'BEGGE', requiresBothConfirm: false },
  item_date_night: { title: 'Date Night', cost: 50, payer: 'BEGGE', requiresBothConfirm: true },
  item_walk_together: { title: 'Gåtur sammen', cost: 15, payer: 'BEGGE', requiresBothConfirm: false },
  item_board_games: { title: 'Brettspillkveld', cost: 20, payer: 'BEGGE', requiresBothConfirm: false },
  item_cinema: { title: 'Kinotur', cost: 60, payer: 'BEGGE', requiresBothConfirm: false },
  item_mini_date: { title: 'Minidate hjemme', cost: 25, payer: 'BEGGE', requiresBothConfirm: false },
  item_photo_shoot: { title: 'Par-Fotoshoot', cost: 180, payer: 'BEGGE', requiresBothConfirm: false },
  item_stargazing: { title: 'Stjernekikking-date', cost: 85, payer: 'BEGGE', requiresBothConfirm: false },
  item_coffee_date_out: { title: 'Kaffe-date ute', cost: 65, payer: 'BEGGE', requiresBothConfirm: false },
  item_dishes: { title: 'Ta oppvasken', cost: 20, payer: 'BEGGE', requiresBothConfirm: false },
  item_trash_out: { title: 'Gå ut med søpla', cost: 10, payer: 'BEGGE', requiresBothConfirm: false },
  item_diaper_free: { title: '1 bleie-fritak', cost: 15, payer: 'BEGGE', requiresBothConfirm: false },
  item_kitchen_clean: { title: 'Rydd kjøkkenet', cost: 20, payer: 'BEGGE', requiresBothConfirm: false },
  item_laundry_fold: { title: 'Brette klær', cost: 20, payer: 'BEGGE', requiresBothConfirm: false },
  item_sleep_in: { title: 'Sove lenge', cost: 40, payer: 'BEGGE', requiresBothConfirm: false },
  item_chore_pass: { title: 'Slipp unna Oppvask', cost: 40, payer: 'BEGGE', requiresBothConfirm: false },
  item_lazy_day: { title: 'Ingen Forventninger-dag', cost: 90, payer: 'BEGGE', requiresBothConfirm: false },
  item_no_phone: { title: 'Telefonfri Kveld', cost: 110, payer: 'BEGGE', requiresBothConfirm: false },
  item_small_gift: { title: 'Liten gave', cost: 30, payer: 'BEGGE', requiresBothConfirm: false },
  item_surprise_gift: { title: 'Liten Overraskelse', cost: 80, payer: 'BEGGE', requiresBothConfirm: false },
  item_flowers: { title: 'Blomster', cost: 35, payer: 'BEGGE', requiresBothConfirm: false },
  item_chocolate: { title: 'Sjokoladeplate', cost: 15, payer: 'BEGGE', requiresBothConfirm: false },
  item_love_letter: { title: 'Kjærlighetsbrev', cost: 20, payer: 'BEGGE', requiresBothConfirm: false },
  item_massage_15: { title: '15 min Massasje', cost: 60, payer: 'BEGGE', requiresBothConfirm: false },
  item_spa_night: { title: 'Hjemmespa-kveld', cost: 100, payer: 'BEGGE', requiresBothConfirm: false },
  item_baby_name_veto: { title: 'Navn Veto-kort', cost: 50, payer: 'BEGGE', requiresBothConfirm: false },
  item_name_truce: { title: 'Navne-fred', cost: 200, payer: 'BEGGE', requiresBothConfirm: false },
  item_pack_bag: { title: 'Pakke Fødebag', cost: 15, payer: 'BEGGE', requiresBothConfirm: false },
  item_belly_oil: { title: 'Smøre magen', cost: 10, payer: 'BEGGE', requiresBothConfirm: false },
  item_playlist: { title: 'Føde-spilleliste', cost: 20, payer: 'BEGGE', requiresBothConfirm: false },
};

async function ensureAuctionBootstrap(client) {
  await client.execute(`INSERT OR IGNORE INTO auction_profiles (role, coins, weekly_earned, streak) VALUES ('andrine', 50, 0, 0)`);
  await client.execute(`INSERT OR IGNORE INTO auction_profiles (role, coins, weekly_earned, streak) VALUES ('partner', 50, 0, 0)`);
}

async function settleAndSeedAuctions(client) {
  await client.execute(`UPDATE auctions SET settled = 1 WHERE settled = 0 AND datetime(end_time) <= datetime('now')`);

  const activeResult = await client.execute(`SELECT id, title FROM auctions WHERE settled = 0 ORDER BY end_time ASC`);
  const active = activeResult.rows || [];
  if (active.length >= 5) return;

  const activeTitles = new Set(active.map(a => a.title));
  const candidates = AUCTION_SEED_ITEMS.filter(i => !activeTitles.has(i.title));
  const pool = candidates.length ? candidates : AUCTION_SEED_ITEMS;
  const needed = 5 - active.length;

  for (let i = 0; i < needed; i++) {
    const t = pool[Math.floor(Math.random() * pool.length)];
    const id = `auc_${Date.now()}_${Math.floor(Math.random() * 10000)}_${i}`;
    const hours = 24 + Math.floor(Math.random() * 48);
    await client.execute({
      sql: `INSERT INTO auctions (id, title, description, category, start_price, min_increment, highest_bid, highest_bidder, end_time, settled, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, NULL, datetime('now', ?), 0, CURRENT_TIMESTAMP)`,
      args: [id, t.title, t.description, t.category, t.start, t.inc, `+${hours} hours`],
    });
  }
}

async function handleAuction(env, request) {
  const client = getClient(env);
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  // GET: Fetch auction state
  if (request.method === 'GET') {
    await ensureAuctionBootstrap(client);
    await settleAndSeedAuctions(client);

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
    if (role !== 'andrine' && role !== 'partner') {
      return json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

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
      if (!auctionId || !Number.isFinite(amount) || amount <= 0) {
        return json({ success: false, error: 'Invalid bid payload' }, { status: 400 });
      }

        const auctionResult = await client.execute({
          sql: `SELECT * FROM auctions WHERE id = ?`,
          args: [auctionId],
        });
        const auction = auctionResult.rows?.[0];
        if (!auction) {
          return json({ success: false, error: 'Auction not found' }, { status: 404 });
        }
        if (auction.settled) {
          return json({ success: false, error: 'Auction settled' }, { status: 400 });
        }
        if (new Date(auction.end_time).getTime() <= Date.now()) {
          return json({ success: false, error: 'Auction ended' }, { status: 400 });
        }
        if (auction.highest_bidder === role) {
          return json({ success: false, error: 'Already leading' }, { status: 400 });
        }

        const minBid = (auction.highest_bid || auction.start_price) + auction.min_increment;
        if (amount < minBid) {
          return json({ success: false, error: 'Bid too low', minBid }, { status: 400 });
        }

        const profileResult = await client.execute({
          sql: `SELECT coins FROM auction_profiles WHERE role = ?`,
          args: [role],
        });
        const userCoins = profileResult.rows?.[0]?.coins || 0;
        if (amount > userCoins) {
          return json({ success: false, error: 'Not enough coins' }, { status: 400 });
        }

        if (auction.highest_bidder) {
          await client.execute({
            sql: `UPDATE auction_profiles SET coins = coins + ? WHERE role = ?`,
            args: [auction.highest_bid, auction.highest_bidder],
          });
        }

        await client.execute({
          sql: `UPDATE auction_profiles SET coins = coins - ? WHERE role = ?`,
          args: [amount, role],
        });

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

      const bonus = 10;

      await client.execute({
        sql: `UPDATE auction_profiles SET coins = coins + ?, streak = ?, last_daily_claim = ? WHERE role = ?`,
        args: [bonus, newStreak, today, role],
      });

      const ledgerId = `ledger_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await client.execute({
        sql: `INSERT INTO ledger (id, kind, profile_id, amount, meta, created_at)
              VALUES (?, 'DAILY_CLAIM', ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [ledgerId, role, bonus, JSON.stringify({ desc: 'Daglig bonus' })],
      });

      return json({ success: true, bonus, streak: newStreak });
    }

    if (type === 'task') {
      const { taskId } = body;
      const amount = AUCTION_TASK_REWARDS[taskId];
      if (!taskId || !Number.isFinite(amount)) return json({ success: false, error: 'Invalid task payload' }, { status: 400 });

      const today = new Date().toISOString().split('T')[0];
      const claimKey = `auction_task_${role}_${today}_${taskId}`;

      const claimResult = await client.execute({ sql: `SELECT value FROM app_state WHERE key = ?`, args: [claimKey] });
      if (claimResult.rows?.[0]?.value) {
        return json({ success: false, error: 'Task already claimed' }, { status: 400 });
      }

      await client.execute({ sql: `INSERT OR REPLACE INTO app_state (key, value, updated_at) VALUES (?, '1', CURRENT_TIMESTAMP)`, args: [claimKey] });
      await client.execute({ sql: `UPDATE auction_profiles SET coins = coins + ?, weekly_earned = weekly_earned + ? WHERE role = ?`, args: [amount, amount, role] });

      const ledgerId = `ledger_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await client.execute({
        sql: `INSERT INTO ledger (id, kind, profile_id, amount, meta, created_at)
              VALUES (?, 'TASK', ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [ledgerId, role, amount, JSON.stringify({ desc: taskId })],
      });
      return json({ success: true, amount });
    }

    if (type === 'buy') {
      const { itemId } = body;
      const item = AUCTION_SHOP_RULES[itemId];
      if (!itemId || !item) return json({ success: false, error: 'Unknown shop item' }, { status: 400 });

      const title = item.title;
      const cost = item.cost;
      const payer = item.payer;
      const requiresBothConfirm = !!item.requiresBothConfirm;
      const splitPay = payer === 'BEGGE' && requiresBothConfirm;

      if (splitPay) {
        const other = role === 'andrine' ? 'partner' : 'andrine';
        const cost1 = role === 'andrine' ? Math.floor(cost / 2) : Math.ceil(cost / 2);
        const cost2 = cost - cost1;

        const balances = await client.execute(`SELECT role, coins FROM auction_profiles WHERE role IN ('andrine','partner')`);
        const map = Object.fromEntries((balances.rows || []).map(r => [r.role, r.coins]));
        if ((map[role] || 0) < cost1 || (map[other] || 0) < cost2) {
          return json({ success: false, error: 'Not enough coins for split' }, { status: 400 });
        }

        await client.execute({ sql: `UPDATE auction_profiles SET coins = coins - ? WHERE role = ?`, args: [cost1, role] });
        await client.execute({ sql: `UPDATE auction_profiles SET coins = coins - ? WHERE role = ?`, args: [cost2, other] });

        const l1 = `ledger_${Date.now()}_a`;
        const l2 = `ledger_${Date.now()}_b`;
        await client.execute({ sql: `INSERT INTO ledger (id, kind, profile_id, amount, meta, created_at) VALUES (?, 'BUY_SPLIT', ?, ?, ?, CURRENT_TIMESTAMP)`, args: [l1, role, -cost1, JSON.stringify({ desc: `Spleis: ${title}` })] });
        await client.execute({ sql: `INSERT INTO ledger (id, kind, profile_id, amount, meta, created_at) VALUES (?, 'BUY_SPLIT', ?, ?, ?, CURRENT_TIMESTAMP)`, args: [l2, other, -cost2, JSON.stringify({ desc: `Spleis: ${title}` })] });
      } else {
        const r = await client.execute({ sql: `SELECT coins FROM auction_profiles WHERE role = ?`, args: [role] });
        const coins = r.rows?.[0]?.coins || 0;
        if (coins < cost) {
          return json({ success: false, error: 'Not enough coins' }, { status: 400 });
        }
        await client.execute({ sql: `UPDATE auction_profiles SET coins = coins - ? WHERE role = ?`, args: [cost, role] });
        const l = `ledger_${Date.now()}_buy`;
        await client.execute({ sql: `INSERT INTO ledger (id, kind, profile_id, amount, meta, created_at) VALUES (?, 'BUY', ?, ?, ?, CURRENT_TIMESTAMP)`, args: [l, role, -cost, JSON.stringify({ desc: `Kjøp: ${title}` })] });
      }

      const rewardId = `reward_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const confirmations = requiresBothConfirm ? JSON.stringify({ [role]: true }) : JSON.stringify({});
      const rewardPayer = splitPay ? 'BEGGE' : role;
      await client.execute({
        sql: `INSERT INTO owned_rewards (id, title, source, payer, status, confirmations, acquired_at)
              VALUES (?, ?, 'SHOP', ?, 'READY', ?, CURRENT_TIMESTAMP)`,
        args: [rewardId, title, rewardPayer, confirmations],
      });

      return json({ success: true, id: rewardId });
    }

    if (type === 'redeem') {
      const { itemId } = body;
      if (!itemId) return json({ success: false, error: 'Missing itemId' }, { status: 400 });

      const r = await client.execute({ sql: `SELECT * FROM owned_rewards WHERE id = ?`, args: [itemId] });
      const item = r.rows?.[0];
      if (!item) return json({ success: false, error: 'Reward not found' }, { status: 404 });
      if (item.status === 'REDEEMED') return json({ success: true, already: true });

      let confirmations = {};
      try { confirmations = item.confirmations ? JSON.parse(item.confirmations) : {}; } catch { confirmations = {}; }
      confirmations[role] = true;

      const both = confirmations.andrine && confirmations.partner;
      if (both) {
        await client.execute({ sql: `UPDATE owned_rewards SET status = 'REDEEMED', confirmations = ? WHERE id = ?`, args: [JSON.stringify(confirmations), itemId] });
        const l = `ledger_${Date.now()}_redeem`;
        await client.execute({ sql: `INSERT INTO ledger (id, kind, profile_id, amount, meta, created_at) VALUES (?, 'REDEEM', ?, 0, ?, CURRENT_TIMESTAMP)`, args: [l, item.payer || role, JSON.stringify({ desc: `Brukt: ${item.title}` })] });
      } else {
        await client.execute({ sql: `UPDATE owned_rewards SET confirmations = ? WHERE id = ?`, args: [JSON.stringify(confirmations), itemId] });
      }

      return json({ success: true, redeemed: !!both, confirmations });
    }

    if (type === 'reset') {
      await client.execute(`DELETE FROM auctions`);
      await client.execute(`DELETE FROM owned_rewards`);
      await client.execute(`DELETE FROM ledger`);
      await client.execute(`DELETE FROM app_state WHERE key LIKE 'auction_task_%'`);
      await client.execute(`UPDATE auction_profiles SET coins = 50, weekly_earned = 0, streak = 0, last_daily_claim = NULL`);
      await settleAndSeedAuctions(client);
      return json({ success: true });
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

      // Ensure schema/migrations for all app endpoints (prevents cold-start column mismatch 500s)
      await ensureSchema(env);

      // Sync endpoints
      if (url.pathname === '/api/sync' && request.method === 'GET') {
        return withCors(await handleSyncGet(env, request), env, request);
      }
      if (url.pathname === '/api/sync' && request.method === 'POST') {
        return withCors(await handleSyncPost(env, request), env, request);
      }

      // Journal endpoints
      if (url.pathname === '/api/journal' && request.method === 'POST') {
        return withCors(await handleUpsertJournal(env, request), env, request);
      }
      if (url.pathname.startsWith('/api/journal/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        return withCors(await handleDeleteJournal(env, id), env, request);
      }
      if (url.pathname === '/api/mood' && request.method === 'POST') {
        return withCors(await handleUpsertMood(env, request), env, request);
      }
      if (url.pathname.startsWith('/api/mood/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        return withCors(await handleDeleteMood(env, id), env, request);
      }
      if (url.pathname.startsWith('/api/kicks/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        return withCors(await handleDeleteKick(env, id), env, request);
      }

      // Reset all cloud data
      if (url.pathname === '/api/reset' && request.method === 'POST') {
        return withCors(await handleReset(env), env, request);
      }

      // Presence
      if (url.pathname === '/api/presence' && request.method === 'POST') {
        return withCors(await handlePresence(env, request), env, request);
      }

      // Web Push
      if (url.pathname === '/api/push/public-key' && request.method === 'GET') {
        return withCors(await handlePushPublicKey(env), env, request);
      }
      if (url.pathname === '/api/push/subscribe' && request.method === 'POST') {
        return withCors(await handlePushSubscribe(env, request), env, request);
      }
      if (url.pathname === '/api/push/unsubscribe' && request.method === 'POST') {
        return withCors(await handlePushUnsubscribe(env, request), env, request);
      }
      if (url.pathname === '/api/push/test' && request.method === 'POST') {
        return withCors(await handlePushTest(env, request), env, request);
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

      // Media upload/proxy from R2 (Phase B)
      if (url.pathname === '/api/media/upload' && request.method === 'POST') {
        return withCors(await handleMediaUpload(env, request), env, request);
      }
      if (url.pathname === '/api/media/migrate' && request.method === 'POST') {
        return withCors(await handleMediaMigration(env, request), env, request);
      }

      if (url.pathname.startsWith('/api/media/') && request.method === 'GET') {
        const key = decodeURIComponent(url.pathname.replace('/api/media/', ''));
        if (!key || !env.MEDIA) {
          return withCors(json({ success: false, error: 'Media not available' }, { status: 404 }), env, request);
        }

        const object = await env.MEDIA.get(key);
        if (!object) {
          return withCors(json({ success: false, error: 'Media not found' }, { status: 404 }), env, request);
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        return withCors(new Response(object.body, { headers }), env, request);
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

