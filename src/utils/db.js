// idb.js
const DB_NAME = 'stories-db';
const STORE_NAME = 'stories';
const DB_VERSION = 1;

// buka / buat database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// simpan banyak story
// idb.js
export async function saveStories(stories) {
  // Validasi input
  if (!stories || !Array.isArray(stories) || stories.length === 0) {
    console.warn('saveStories: Input tidak valid', stories);
    return;
  }

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  stories.forEach((story) => {
    if (story && story.id) { // pastikan story valid
      store.put(story);
    }
  });
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ambil semua story dari IndexedDB
// export async function getStories() {
//   const db = await openDB();
//   const tx = db.transaction(STORE_NAME, 'readonly');
//   const store = tx.objectStore(STORE_NAME);
//   return store.getAll();  
// }

export async function getStories() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}


// hapus semua story (opsional, buat refresh)
export async function clearStories() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  return tx.complete;
}