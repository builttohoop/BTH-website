/* BTH Operator — offline service worker.
   This worker is registered at site root, so it controls the whole built-to-hoop.com domain.
   Pages (HTML) use NETWORK-FIRST so the live marketing site is NEVER served stale — it always
   reflects the latest deploy when online, and only falls back to cache when offline.
   Static assets (fonts/scripts) use cache-first for speed + offline. The app is fully functional
   without this file (foreground reminders + install still work).
   API calls (any /api/ path, on any host) and no-store requests are never touched: the BTH TASKS
   sync GET to the Mail OS hub was being cached on first fetch and served forever, so the card said
   "Synced" over an empty list. Bumping CACHE deletes that stale copy on activate. */
const CACHE='bth-operator-v11-hub-nocache-20261122';
const SHELL=['./','./bth-operator-v2.html','./bth-operator-amber.css'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k.startsWith('bth-operator-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  // Live data goes straight to the network: never cache-first, never stored.
  if(e.request.cache==='no-store'||new URL(e.request.url).pathname.startsWith('/api/'))return;
  const isPage = e.request.mode==='navigate' || e.request.destination==='document';
  if(isPage){
    // Network-first for pages: always serve the live HTML; cache the fresh copy; fall back to cache only when offline.
    e.respondWith(fetch(e.request).then(resp=>{
      const cl=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return resp;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./bth-operator-v2.html'))));
    return;
  }
  // Static assets: cache-first for speed/offline.
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    if(!resp.ok&&resp.type!=='opaque')return resp; // never keep an error as the offline copy
    const cl=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return resp;
  })));
});
