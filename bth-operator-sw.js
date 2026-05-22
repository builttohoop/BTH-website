/* BTH Operator — optional offline service worker.
   The app is fully functional without this file (foreground reminders + install still work).
   Drop this next to bth-operator-v2.html on your site to enable full offline use. */
const CACHE='bth-operator-v2';
const SHELL=['./','./bth-operator-v2.html'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    const cl=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return resp;
  }).catch(()=>caches.match('./bth-operator-v2.html'))));
});
