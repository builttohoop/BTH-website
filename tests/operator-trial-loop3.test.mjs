// Trial loop 3: real page script, fake clock and localStorage.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.TZ='America/New_York';
const html=readFileSync(new URL('../bth-operator-v2.html',import.meta.url),'utf8');
const mainSource=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
const source=mainSource.split("document.addEventListener('keydown'")[0];
function app(seed={}, instant='2026-11-16T21:00:00-05:00'){
  let now=+new Date(instant), seq=0, timers=new Map();
  const storage=new Map(Object.entries(seed).map(([k,v])=>[k,typeof v==='string'&&k.startsWith('raw:')?v:JSON.stringify(v)]));
  class Clock extends Date { constructor(...a){super(...(a.length?a:[now]));} static now(){return now;} }
  const elements=new Map();
  const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',style:{},classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return[];}});return elements.get(id);};
  const c=vm.createContext({Date:Clock,console,localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),key:i=>[...storage.keys()][i],get length(){return storage.size;}},document:{getElementById:el,querySelectorAll:()=>[],querySelector:()=>null},setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id),confirm:()=>true,window:{matchMedia:()=>({matches:false}),navigator:{}},Notification:class{static permission='granted';constructor(){}}});
  vm.runInContext(source,c);c.window.Notification=c.Notification;
  c.document.addEventListener=()=>{};c.document.body={};c.window.addEventListener=()=>{};c.navigator={};c.location={protocol:'file:'};c.setInterval=()=>{};c.MutationObserver=class{observe(){}};
  c.toast=msg=>{c.lastToast=msg;};c.renderToday=()=>{};c.renderWeek=()=>{};c.renderNutrition=()=>{};c.renderMicroSummary=()=>{};c.twRefreshSum=()=>{};c.schedRerender=()=>{};
  return Object.assign(c,{storage,clock:s=>now=+new Date(s),el,originalToday:()=>{vm.runInContext('('+source.match(/function renderToday\(\)\{[\s\S]*?\n\}/)[0]+')()',c);return c.el('tab-today').innerHTML;}});
}

test('L3-O1 ADD ITEM focuses its stored row index, even when time sorting puts it first',()=>{
  const c=app({bth_schedule:[{id:'late',label:'Mobility',time:'22:00'}]});let focused=false,selected=false;
  c.document.querySelector=selector=>{assert.equal(selector,'#sched-card .sched-name[data-sched-index="1"]');return {focus(){focused=true;},select(){selected=true;}};};
  c.schedAdd();assert.ok(focused&&selected);c.schedEditing=true;
  const h=c.renderScheduleHtml();assert.match(h,/<input class="sched-name" data-sched-index="1"[^>]*value="New item"/);
  assert.ok(h.indexOf('value="New item"')<h.indexOf('value="Mobility"'));
  c.schedRename(1,'Dentist');assert.equal(c.getSchedule()[0].label,'Mobility');assert.equal(c.getSchedule()[1].label,'Dentist');
});

test('L3-O2 audit: editor offers weekdays only, with no single-date / one-off option (SKIPPED fix)',()=>{
  const c=app();c.schedEditing=true;const h=c.renderScheduleHtml();
  assert.match(h,/no days picked = every day/);assert.doesNotMatch(h,/type="date"|one.off|single.date/i);
  const item={id:'dentist',label:'Dentist (one-off)',time:'10:00',days:[2]};
  assert.equal(c.schedOnDay(item,2),true,'a label does not change recurrence');
});

test('L3-O3 carried age uses origin, survives repeated carries and DST, and never expires tasks',()=>{
  const c=app({},'2026-11-16T21:00:00-05:00');
  c.setTasks(c.activeLogKey,{tasks:['Old','Yesterday','New','Unknown'],completed:[false,false,false,false],origin:['2026-11-04','2026-11-15','2026-11-16',null]});
  let h=c.renderTasksHtml();assert.match(h,/carried 12 days/);assert.match(h,/carried 1 day</);assert.equal((h.match(/task-age/g)||[]).length,2);
  c.submitOperatorDay();h=c.renderTasksHtml();assert.match(h,/carried 13 days/);assert.equal(c.getTasks(c.activeLogKey).tasks.length,4);
  const dst=app({},'2027-03-15T21:00:00-04:00');dst.setTasks(dst.activeLogKey,{tasks:['DST'],completed:[false],origin:['2027-03-13']});assert.match(dst.renderTasksHtml(),/carried 2 days/);
});

test('L3-O4 CLEAR CARRIED leaves an explicit empty list through reload, without starter tasks',()=>{
  const c=app();c.setTasks(c.activeLogKey,{tasks:['Old'],completed:[false],origin:['2026-11-04']});c.clearCarried();
  assert.equal(c.getTasks(c.activeLogKey).tasks.length,0);
  for(const context of [c,app(Object.fromEntries([...c.storage].map(([k,v])=>[k,JSON.parse(v)])))]){
    const h=context.renderTasksHtml();assert.match(h,/No tasks yet/);assert.doesNotMatch(h,/Review weekly goal|30-min walk|Message one person|CLEAR CARRIED/);
  }
  const mixed=app();mixed.setTasks(mixed.activeLogKey,{tasks:['Old','Done','Today'],completed:[false,true,false],origin:['2026-11-04','2026-11-04','2026-11-16']});mixed.clearCarried();assert.deepEqual([...mixed.getTasks(mixed.activeLogKey).tasks],['Done','Today']);
});

test('L3-O5 every BTH tick refreshes streak text and best; zero explains the all-six rule',()=>{
  const c=app();assert.match(c.originalToday(),/BTH 0.*BTH needs all 6 boxes/);
  for(const [i,item] of [...c.BTH_ITEMS].entries()){
    c.toggleBTH(item.key);const text=c.el('today-streaks').textContent;
    assert.match(text,i===5?/BTH 1/:/BTH 0.*BTH needs all 6 boxes/);
  }
  assert.equal(c.load('bth_best_bth'),1);assert.doesNotMatch(c.el('today-streaks').textContent,/needs all/);
  c.toggleBTH(c.BTH_ITEMS[0].key);assert.match(c.el('today-streaks').textContent,/BTH 0.*BTH needs all 6 boxes/);assert.equal(c.load('bth_best_bth'),1);
  assert.equal(c.todayStreakText({cur:{bth:1,gym:2,read:3}}),'Streaks · BTH 1 · Gym 2 · Read 3');
});

test('L3-O6 reminder toasts and notifications use item-specific copy; move is reserved for training',()=>{
  for(const [label,action] of [['Lights out','wind down'],['Reading','read'],['Wake up','get up'],['Kid bedtime','wind down'],['Gym','move'],['Mobility','move'],['Plan next week',null],['Prep lunch',null]]){
    const c=app({bth_schedule:[{id:'custom',label,time:'21:00'}]});c.reminderTick();
    const expected=label+' — '+(action?'time to '+action:'time for this item')+'.';assert.equal(c.lastToast,expected);
    let body;c.notify=(_title,msg)=>{body=msg;return true;};c.reminderTick();assert.equal(body,expected);
  }
});

test('L3-O7 review has compact month/day segments and both themes reserve footer space for the toast',()=>{
  const c=app({},'2027-02-07T21:00:00-05:00'),h=c.renderWeekReview();
  assert.match(h,/class="tw-weeknav review-weeknav"/);assert.match(h,/aria-label="2027-02-01 to 2027-02-07"><span>Feb 1<\/span> – <span>Feb 7<\/span>/);
  assert.match(html,/\.review-range span\{[^}]*white-space:nowrap/);assert.match(html,/grid-template-columns:auto minmax\(0,1fr\) auto/);
  assert.match(html,/16px 104px;display:none/);
  const css=readFileSync(new URL('../bth-operator-amber.css',import.meta.url),'utf8');
  assert.match(css,/padding-bottom:calc\(var\(--amber-nav-space,88px\) \+ var\(--sb\) \+ 104px\)/);
  assert.match(css,/\.toast-el \{bottom:calc\(var\(--amber-nav-space,88px\) \+ var\(--sb\) \+ 16px\);background:#0d1216/);
});
