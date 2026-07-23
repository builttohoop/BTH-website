/* BTH Operator — offline service worker.
   This worker is registered at site root, so it controls the whole built-to-hoop.com domain.
   Pages (HTML) use NETWORK-FIRST so the live marketing site is NEVER served stale — it always
   reflects the latest deploy when online, and only falls back to cache when offline.
   Static assets (fonts/scripts) use cache-first for speed + offline. The app is fully functional
   without this file (foreground reminders + install still work). */
const CACHE='bth-operator-v4-20260723';
const SHELL=['./','./bth-operator-v2.html'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
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
    const cl=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return resp;
  })));
});
