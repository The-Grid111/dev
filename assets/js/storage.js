// Local-first autosave + revision slots (no backend required)

const DB = 'grid_local_v1';
const STORE = 'revisions';
let db;

export function initLocalState() {
  // Tiny UX flags in localStorage
  if (!localStorage.getItem('first_seen_at')) {
    localStorage.setItem('first_seen_at', Date.now().toString());
  }

  // IndexedDB for big stuff
  const req = indexedDB.open(DB, 1);
  req.onupgradeneeded = () => {
    const d = req.result;
    if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, {keyPath:'id', autoIncrement:true});
  };
  req.onsuccess = () => { db = req.result; };
  req.onerror = () => console.warn('IndexedDB error', req.error);

  // Example autosave every 10s (replace with your real Save object)
  setInterval(() => {
    const fakeSave = {
      at: Date.now(),
      theme: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
      note: 'autosave heartbeat'
    };
    addRevision(fakeSave).then(trimRevisions);
  }, 10000);
}

function addRevision(payload){
  return new Promise((resolve,reject)=>{
    if (!db) return resolve();
    const tx = db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).add({payload, ts:Date.now()});
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
}

function trimRevisions(limit=10){
  return new Promise((resolve,reject)=>{
    if (!db) return resolve();
    const tx = db.transaction(STORE,'readwrite');
    const store = tx.objectStore(STORE);
    const items = [];
    store.openCursor().onsuccess = (e)=>{
      const cur = e.target.result;
      if (cur){ items.push({key:cur.key, val:cur.value}); cur.continue(); }
      else {
        const toDelete = items.slice(0, Math.max(0, items.length - limit));
        toDelete.forEach(row => store.delete(row.key));
      }
    };
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
}
