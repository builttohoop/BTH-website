// The Operator service worker must never answer a live-data request from its cache.
// Regression: the BTH TASKS sync GET (Mail OS /api/hub/tasks) was cached on first fetch and served
// forever, so the card read "Synced" over an empty list while the server held Ty's task.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const sw=readFileSync(new URL('../bth-operator-sw.js',import.meta.url),'utf8');
function worker(){
  const handlers={},puts=[];
  const ctx=vm.createContext({URL,Response,
    self:{addEventListener:(n,fn)=>handlers[n]=fn,skipWaiting(){},clients:{claim:async()=>{}}},
    caches:{keys:async()=>[],delete:async()=>{},match:async()=>new Response('STALE'),open:async()=>({put:async(r)=>puts.push(r.url),addAll:async()=>{}})},
    fetch:async()=>new Response('LIVE')});
  vm.runInContext(sw,ctx);
  return {puts,fetchEvent(req){let responded=null;handlers.fetch({request:req,respondWith:p=>responded=p});return responded;}};
}
const req=(url,extra={})=>({method:'GET',mode:'cors',destination:'',cache:'default',url,...extra});
test('hub sync GET is left to the network (no-store)',()=>{
  const w=worker();
  assert.equal(w.fetchEvent(req('https://bth-mail-os.tyrell-38b.workers.dev/api/hub/tasks',{cache:'no-store'})),null);
});
test('any /api/ path is left to the network even without no-store',()=>{
  const w=worker();
  assert.equal(w.fetchEvent(req('https://bth-mail-os.tyrell-38b.workers.dev/api/hub/tasks')),null);
  assert.equal(w.fetchEvent(req('https://built-to-hoop.com/api/anything')),null);
});
test('static assets still go cache-first',async()=>{
  const w=worker();
  const p=w.fetchEvent(req('https://built-to-hoop.com/bth-operator-amber.css',{destination:'style'}));
  assert.ok(p,'static asset is handled');
  assert.equal(await (await p).text(),'STALE');
});
test('an error response is never stored as the offline copy',async()=>{
  const handlers={},puts=[];
  const ctx=vm.createContext({URL,Response,
    self:{addEventListener:(n,fn)=>handlers[n]=fn,skipWaiting(){},clients:{claim:async()=>{}}},
    caches:{keys:async()=>[],delete:async()=>{},match:async()=>undefined,open:async()=>({put:async(r)=>puts.push(r),addAll:async()=>{}})},
    fetch:async()=>new Response('nope',{status:500})});
  vm.runInContext(sw,ctx);
  let p;handlers.fetch({request:req('https://built-to-hoop.com/x.js',{destination:'script'}),respondWith:x=>p=x});
  assert.equal((await p).status,500);
  await new Promise(r=>setTimeout(r,10));
  assert.equal(puts.length,0);
});
