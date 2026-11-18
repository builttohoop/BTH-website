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
  const c=vm.createContext({Date:Clock,console,atob,TextDecoder,localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),key:i=>[...storage.keys()][i],get length(){return storage.size;}},document:{getElementById:el,querySelectorAll:()=>[],querySelector:()=>null},setTimeout:()=>0,clearTimeout:()=>{},confirm:()=>true,window:{matchMedia:()=>({matches:false}),navigator:{}},Notification:class{static permission='granted';}});
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
