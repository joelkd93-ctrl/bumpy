/**
 * IndexedDB media store for journal photos
 * Keeps large blobs out of localStorage for long-term scalability.
 */

const DB_NAME = 'bumpy-media-v1';
const DB_VERSION = 1;
const STORE_PHOTOS = 'journal_photos';
const MIGRATION_FLAG_KEY = 'bumpy:journal_media_migrated_v1';
const LS_PREFIX = 'bumpy:';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        const store = db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });

  return dbPromise;
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = (header.match(/data:(.*?);base64/) || [])[1] || 'image/jpeg';
  const binary = atob(base64 || '');
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Blob read failed'));
    reader.readAsDataURL(blob);
  });
}

export async function putJournalPhoto(dataUrl, idHint = '') {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;

  const db = await openDB();
  const id = `jp_${idHint || Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const blob = dataUrlToBlob(dataUrl);

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    tx.objectStore(STORE_PHOTOS).put({ id, blob, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB put failed'));
  });

  return id;
}

export async function getJournalPhotoDataUrl(photoRef) {
  if (!photoRef) return null;
  const db = await openDB();

  const row = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readonly');
    const req = tx.objectStore(STORE_PHOTOS).get(photoRef);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('IndexedDB get failed'));
  });

  if (!row?.blob) return null;
  return blobToDataUrl(row.blob);
}

export async function deleteJournalPhoto(photoRef) {
  if (!photoRef) return;
  const db = await openDB();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    tx.objectStore(STORE_PHOTOS).delete(photoRef);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB delete failed'));
  });
}

/**
 * One-time migration:
 * move existing localStorage journal base64 photos into IndexedDB, preserving entries.
 */
export async function migrateJournalPhotosToIndexedDB() {
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === '1') return { migrated: 0, skipped: true };

    let migrated = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(`${LS_PREFIX}journal:`)) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      let entry;
      try {
        entry = JSON.parse(raw);
      } catch {
        continue;
      }

      if (!entry?.photo || !String(entry.photo).startsWith('data:image/')) continue;

      const id = key.replace(`${LS_PREFIX}journal:`, '');
      const photoRef = await putJournalPhoto(entry.photo, id);
      if (!photoRef) continue;

      entry.photoRef = photoRef;
      entry.photo = null;
      localStorage.setItem(key, JSON.stringify(entry));
      migrated++;
    }

    localStorage.setItem(MIGRATION_FLAG_KEY, '1');
    console.log(`🗂️ Journal photo migration complete. Migrated: ${migrated}`);
    return { migrated, skipped: false };
  } catch (err) {
    console.error('Journal photo migration failed:', err);
    return { migrated: 0, error: err?.message || String(err) };
  }
}
