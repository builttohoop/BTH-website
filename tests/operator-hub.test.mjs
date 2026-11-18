// BTH TASKS hub: tasks imported from a #hub= link. Real page script, fake clock and localStorage.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.TZ='America/New_York';
const html=readFileSync(new URL('../bth-operator-v2.html',import.meta.url),'utf8');
const mainSource=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
const source=mainSource.split("document.addEventListener('keydown'")[0];
function app(seed={}, instant='2026-11-20T10:00:00-05:00'){
  let now=+new Date(instant);
  const storage=new Map(Object.entries(seed).map(([k,v])=>[k,typeof v==='string'?v:JSON.stringify(v)]));
  class Clock extends Date { constructor(...a){super(...(a.length?a:[now]));} static now(){return now;} }
  const elements=new Map();
  const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',style:{},classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return[];}});return elements.get(id);};
  const c=vm.createContext({Date:Clock,console,atob,TextDecoder,localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),key:i=>[...storage.keys()][i],get length(){return storage.size;}},document:{getElementById:el,querySelectorAll:()=>[],querySelector:()=>null},setTimeout:()=>0,clearTimeout:()=>{},confirm:()=>true,window:{matchMedia:()=>({matches:false}),navigator:{}},Notification:class{static permission='granted';}});
  vm.runInContext(source,c);
  c.toast=msg=>{c.lastToast=msg;};c.renderToday=()=>{};c.renderMicroSummary=()=>{};
  return Object.assign(c,{storage});
}
const enc=obj=>'#hub='+Buffer.from(JSON.stringify(obj),'utf8').toString('base64url');
const task={id:'hub-20261120-talk-to-your-leads',title:'Revenue: talk to your leads',when:{start:'2026-11-20T14:30:00-05:00',end:'2026-11-20T15:15:00-05:00'},why:'0 leads in 35 days — the 76 you have are the asset.',steps:[{text:'Send the note',min:20},{text:'Rule #101',min:5}],doneWhen:'Note sent.',links:[{label:'Gmail drafts',url:'https://mail.google.com/mail/u/0/#drafts'},{label:'bad',url:'javascript:alert(1)'}],source:'claude'};

test('H1 an import adds the task, strips non-https links, and renders it with time and minutes',()=>{
  const c=app();assert.equal(c.importHubFromHash(enc(task)),1);
  const s=JSON.parse(c.storage.get('bth_hub_tasks_v1'));assert.equal(s.tasks.length,1);
  const t=s.tasks[0];assert.equal(t.title,task.title);assert.equal(t.steps.length,2);assert.equal(t.links.length,1);assert.equal(t.links[0].url,'https://mail.google.com/mail/u/0/#drafts');
  assert.match(c.lastToast,/^Added to BTH: Revenue/);
  const h=c.renderHubHtml();assert.match(h,/BTH TASKS/);assert.match(h,/Revenue: talk to your leads/);assert.match(h,/25 min/);assert.match(h,/TODAY/);assert.doesNotMatch(h,/javascript:/);
  assert.match(h,/Why:/,'the newest import opens its detail');assert.match(h,/1\. Send the note/);assert.match(h,/Done when:/);
});

test('H2 a second import of the same id is an update, not a duplicate, and keeps ticks',()=>{
  const c=app();c.importHubFromHash(enc(task));c.hubStep(task.id,0);
  c.importHubFromHash(enc({...task,why:'updated'}));
  const s=JSON.parse(c.storage.get('bth_hub_tasks_v1'));assert.equal(s.tasks.length,1);assert.equal(s.tasks[0].why,'updated');assert.equal(s.tasks[0].steps[0].done,true);
  assert.match(c.lastToast,/^Updated:/);
});

test('H3 broken, oversized, unknown or badly shaped links are rejected and store nothing',()=>{
  const c=app();
  assert.equal(c.importHubFromHash('#hub=%%%'),0);
  assert.equal(c.importHubFromHash('#hub=bm90IGpzb24'),0);assert.match(c.lastToast,/broken/);
  assert.equal(c.importHubFromHash('#hub='+'A'.repeat(9000)),0);assert.match(c.lastToast,/too long/);
  assert.equal(c.importHubFromHash(enc({...task,id:'Bad Id!'})),0);
  assert.equal(c.importHubFromHash(enc({...task,title:''})),0);
  assert.equal(c.importHubFromHash('#other'),0);assert.equal(c.importHubFromHash(''),0);
  assert.equal(c.storage.has('bth_hub_tasks_v1'),false);
});

test('H4 the day task state is byte-identical after an import',()=>{
  const c=app();c.setTasks(c.activeLogKey,{tasks:['Mine'],completed:[false],origin:['2026-11-20']});
  const before=c.storage.get('bth_operator_state_v3');c.importHubFromHash(enc(task));
  assert.equal(c.storage.get('bth_operator_state_v3'),before);
});

test('H5 titles and steps are escaped; done tasks collapse into a count; clear removes them',()=>{
  const c=app();c.importHubFromHash(enc({...task,title:'<img src=x onerror=alert(1)>',steps:[{text:'<b>x</b>',min:1}]}));
  let h=c.renderHubHtml();assert.doesNotMatch(h,/<img|<b>x/);assert.match(h,/&lt;img/);
  c.hubDone(task.id);h=c.renderHubHtml();assert.match(h,/All BTH tasks done/);assert.match(h,/1 done/);
  c.hubClearDone();assert.match(c.renderHubHtml(),/No BTH tasks yet/);
});

test('H6 an array link adds several tasks; an overdue task is tagged; the card shows add + paste even when empty',()=>{
  const c=app({},'2026-11-21T10:00:00-05:00');const empty=c.renderHubHtml();
  assert.match(empty,/id="hub-card"/);assert.match(empty,/\+ ADD TASK/);assert.match(empty,/PASTE LINK/);assert.match(empty,/No BTH tasks yet/);
  assert.equal(c.importHubFromHash(enc([task,{...task,id:'hub-20261125-film',title:'Film',when:{start:'2026-11-25T15:00:00-05:00'}}])),2);
  const h=c.renderHubHtml();assert.match(h,/OVERDUE/);assert.ok(h.indexOf('Revenue')<h.indexOf('Film'),'sorted by start');
});

test('H7 non-ASCII text survives the round trip',()=>{
  const c=app();c.importHubFromHash(enc({...task,title:'BTH · Revenue — leads'}));
  assert.equal(JSON.parse(c.storage.get('bth_hub_tasks_v1')).tasks[0].title,'BTH · Revenue — leads');
});

test('H8 + ADD TASK saves a typed task with time, timed steps and end; it opens and renders',()=>{
  const c=app();c.hubOpenForm('add');assert.match(c.renderHubHtml(),/id="hub-title"/);
  Object.assign(c.hubDraft,{title:'Film 3 clips',date:'2026-11-23',time:'15:00',why:'Camera-first week',steps:'Set up the phone 5 min\nFilm the drill - 20 min\nPick the best take',doneWhen:'3 clips saved'});
  const t=c.hubAddSave();assert.ok(t);
  const s=JSON.parse(c.storage.get('bth_hub_tasks_v1'));assert.equal(s.tasks.length,1);const k=s.tasks[0];
  assert.match(k.id,/^hub-20261123-film-3-clips-[a-z0-9]{1,4}$/);assert.equal(k.when.start,'2026-11-23T15:00:00');assert.equal(k.when.end,'2026-11-23T15:25:00');
  assert.deepEqual(k.steps.map(x=>[x.text,x.min]),[['Set up the phone',5],['Film the drill',20],['Pick the best take',0]]);
  assert.equal(k.source,'app');assert.equal(c.hubForm,null);
  const h=c.renderHubHtml();assert.match(h,/Film 3 clips/);assert.match(h,/25 min/);assert.match(h,/Camera-first week/);assert.doesNotMatch(h,/id="hub-title"/);
});

test('H9 + ADD TASK needs a name; the day task state stays byte-identical',()=>{
  const c=app();c.setTasks(c.activeLogKey,{tasks:['Mine'],completed:[false],origin:['2026-11-20']});const before=c.storage.get('bth_operator_state_v3');
  c.hubOpenForm('add');c.hubDraft.title='  ';assert.equal(c.hubAddSave(),null);assert.match(c.lastToast,/name/);assert.equal(c.storage.has('bth_hub_tasks_v1'),false);
  c.hubDraft.title='<script>x</script>';c.hubAddSave();assert.doesNotMatch(c.renderHubHtml(),/<script>x/);
  c.hubOpenForm('add');Object.assign(c.hubDraft,{title:'No time',date:'2026-11-20',time:''});const t=c.hubAddSave();
  assert.equal(t.when.start,'2026-11-20T00:00:00');assert.equal(t.when.end,'2026-11-20T23:59:00');
  const row=c.renderHubHtml();assert.match(row,/Fri, Nov 20 · <span[^>]*>TODAY/,'date only, no clock time, and not overdue mid-day');
  assert.equal(c.storage.get('bth_operator_state_v3'),before);
});

test('H10 PASTE LINK imports from a full pasted link and rejects text without one',()=>{
  const c=app();c.hubOpenForm('paste');assert.match(c.renderHubHtml(),/id="hub-paste"/);
  c.hubDraft.paste='Open in Operator: https://built-to-hoop.com/bth-operator-v2.html'+enc(task)+' ';
  assert.equal(c.hubPasteSave(),1);assert.equal(JSON.parse(c.storage.get('bth_hub_tasks_v1')).tasks.length,1);assert.equal(c.hubForm,null);
  c.hubOpenForm('paste');c.hubDraft.paste='hello';assert.equal(c.hubPasteSave(),0);assert.match(c.lastToast,/not an Operator task link/);
});

// Sync: a fake server that behaves like Mail OS /api/hub/tasks (done/removed sticky, ticks kept).
function server({key='k'.repeat(32),status=200}={}){
  const rows=new Map(),removed=new Set(),calls=[];
  const fetch=async(url,opts={})=>{
    const method=opts.method||'GET',path=url.replace('https://bth-mail-os.tyrell-38b.workers.dev/api/hub/tasks','');
    calls.push({method,path,headers:opts.headers,body:opts.body?JSON.parse(opts.body):undefined,url});
    const res=(code,body)=>({ok:code>=200&&code<300,status:code,json:async()=>body});
    if(status!==200)return res(status,{ok:false});
    if(opts.headers['x-bth-hub-token']!==key)return res(401,{ok:false});
    const body=opts.body?JSON.parse(opts.body):null;
    if(method==='GET')return res(200,{ok:true,tasks:[...rows.values()],removed:[...removed]});
    if(method==='PUT'){for(const t of body.tasks){if(removed.has(t.id))continue;const old=rows.get(t.id);rows.set(t.id,old?{...t,status:old.status,steps:t.steps.map(st=>({...st,done:st.done||!!(old.steps.find(o=>o.text===st.text)||{}).done}))}:{...t});}return res(200,{ok:true});}
    if(method==='POST'){if(body.status==='removed'){rows.delete(body.id);removed.add(body.id);return res(200,{ok:true});}const r=rows.get(body.id);if(!r)return res(404,{ok:false});if(body.status)r.status=body.status;(body.steps||[]).forEach((d,i)=>{if(r.steps[i])r.steps[i].done=d;});return res(200,{ok:true});}
  };
  return {rows,removed,calls,fetch,key};
}
const settle=()=>new Promise(r=>setTimeout(r,0));
function synced(seed={},srv=server()){const c=app({bth_hub_sync_v1:{key:srv.key},...seed});c.fetch=srv.fetch;return c;}

test('H11 with no sync key nothing is fetched, and the card says sync is off',async()=>{
  const srv=server(),c=app();c.fetch=srv.fetch;
  assert.equal(await c.hubSync(),false);c.importHubFromHash(enc(task));c.hubStep(task.id,0);await settle();
  assert.equal(srv.calls.length,0);assert.match(c.renderHubHtml(),/Sync off/);assert.match(c.renderHubHtml(),/turn on sync/);
});

test('H12 a task the server has (Claude scheduled it) shows up on sync; the key travels only as a header',async()=>{
  const srv=server();srv.rows.set(task.id,{...task,status:'open',addedAt:'2026-11-18T12:00:00.000Z'});
  const c=synced({},srv);assert.equal(await c.hubSync(),true);
  const s=JSON.parse(c.storage.get('bth_hub_tasks_v1'));assert.equal(s.tasks.length,1);assert.equal(s.tasks[0].title,task.title);assert.equal(s.tasks[0].links.length,1,'non-https link stripped on the way in');
  assert.equal(s.tasks[0].addedAt,'2026-11-18T12:00:00.000Z');
  for(const call of srv.calls){assert.doesNotMatch(call.url,/k{32}/);assert.equal(call.headers['x-bth-hub-token'],srv.key);}
  assert.match(c.renderHubHtml(),/Synced/);
  assert.equal(await c.hubSync(),false,'a second sync changes nothing');
});

test('H13 ticks, done, remove and new local tasks go up to the server',async()=>{
  const srv=server();srv.rows.set(task.id,{...task,status:'open'});
  const c=synced({},srv);await c.hubSync();
  c.hubStep(task.id,1);await settle();assert.equal(srv.rows.get(task.id).steps[1].done,true);
  c.hubDone(task.id);await settle();assert.equal(srv.rows.get(task.id).status,'done');
  c.hubOpenForm('add');Object.assign(c.hubDraft,{title:'Film 3 clips',date:'2026-11-23',time:'15:00'});const t=c.hubAddSave();await settle();
  assert.ok(srv.rows.has(t.id),'a typed task is pushed');
  c.hubRemove(t.id);await settle();assert.ok(srv.removed.has(t.id));
  c.hubClearDone();await settle();assert.ok(srv.removed.has(task.id));
});

test('H14 merge: server removal drops the local copy; local ticks and done survive; local-only tasks are sent up',async()=>{
  const srv=server(),c=synced({},srv);
  c.importHubFromHash(enc(task));await settle();
  const other={...task,id:'hub-20261125-film',title:'Film'};
  srv.rows.set(other.id,{...other,status:'open'});
  // the phone ticks a step while offline: server has the task without the tick
  const s=JSON.parse(c.storage.get('bth_hub_tasks_v1'));s.tasks[0].steps[0].done=true;s.tasks[0].status='done';c.storage.set('bth_hub_tasks_v1',JSON.stringify(s));
  await c.hubSync();let l=JSON.parse(c.storage.get('bth_hub_tasks_v1')).tasks;
  assert.equal(l.length,2);const mine=l.find(x=>x.id===task.id);assert.equal(mine.steps[0].done,true);assert.equal(mine.status,'done');
  srv.rows.delete(other.id);srv.removed.add(other.id);
  await c.hubSync();l=JSON.parse(c.storage.get('bth_hub_tasks_v1')).tasks;assert.deepEqual(l.map(x=>x.id),[task.id]);
  const localOnly={...task,id:'hub-20261126-local',title:'Local'};const s2=JSON.parse(c.storage.get('bth_hub_tasks_v1'));s2.tasks.push({...localOnly,status:'open',addedAt:'x',steps:[]});c.storage.set('bth_hub_tasks_v1',JSON.stringify(s2));
  await c.hubSync();await settle();assert.ok(srv.rows.has(localOnly.id));
});

test('H15 a wrong key or a dead server never touches local tasks; the card says why; forget turns sync off',async()=>{
  const bad=server({key:'z'.repeat(32)}),c=app({bth_hub_sync_v1:{key:'k'.repeat(32)}});c.fetch=bad.fetch;
  c.importHubFromHash(enc(task));const before=c.storage.get('bth_hub_tasks_v1');
  await c.hubSync();assert.equal(c.storage.get('bth_hub_tasks_v1'),before);assert.match(c.renderHubHtml(),/Sync key not accepted/);
  const down=server({status:503});c.fetch=down.fetch;await c.hubSync();assert.match(c.renderHubHtml(),/Sync failed/);
  c.fetch=async()=>{throw new Error('offline');};await c.hubSync();assert.equal(c.storage.get('bth_hub_tasks_v1'),before);
  c.hubOpenForm('sync');const h=c.renderHubHtml();assert.match(h,/type="password"/);assert.match(h,/FORGET KEY/);
  c.hubForgetSync();assert.equal(c.storage.has('bth_hub_sync_v1'),false);assert.match(c.renderHubHtml(),/Sync off/);
});

test('H16 SAVE KEY rejects junk, stores a real key and syncs',async()=>{
  const srv=server();srv.rows.set(task.id,{...task,status:'open'});const c=app();c.fetch=srv.fetch;
  c.hubOpenForm('sync');c.hubDraft.key='short';assert.equal(c.hubSaveSync(),false);assert.equal(c.storage.has('bth_hub_sync_v1'),false);
  c.hubOpenForm('sync');c.hubDraft.key='  '+srv.key+' ';assert.equal(c.hubSaveSync(),true);await settle();await settle();
  assert.equal(JSON.parse(c.storage.get('bth_hub_sync_v1')).key,srv.key);assert.equal(JSON.parse(c.storage.get('bth_hub_tasks_v1')).tasks.length,1);
});
