// Trial loop 1 (TR-20261116-11) fixes O1-O3 for the Personal Operator.
// Same harness as operator-opday.test.mjs: the real page script in a vm with a fake clock and a fake localStorage.
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
  return Object.assign(c,{storage,boot:()=>vm.runInContext(mainSource.slice(source.length),c),clock:s=>now=+new Date(s),el,originalToday:()=>vm.runInContext('('+source.match(/function renderToday\(\)\{[\s\S]*?\n\}/)[0]+')()',c)});
}
const label=c=>c.findOperatorDay(c.OPERATOR_STATE.activeDayId).labelDate;
const FULL={posted:true,filmed:true,edited:true,engaged:true,planned:true,recovery:true};
const back=(c,n)=>{const d=new c.Date('2026-11-16T12:00:00');d.setDate(d.getDate()-n);return c.dateKey(d);};
function seedDays(c,n,log){for(let i=1;i<=n;i++){const day=c.ensureOperatorDay(back(c,i));day.submitted=true;c.setLog(day.id,{...log});}}

// ── O1 streaks and grades ────────────────────────────────────────────────
test('O1 100 consecutive full-BTH days with today empty: bthStreak is 100 (no 90 cap, today never breaks)',()=>{
  const c=app();seedDays(c,100,FULL);
  assert.equal(c.hasLogData(c.getLog(c.activeLogKey)),false);
  assert.equal(c.bthStreak(),100);
  c.setLog(c.activeLogKey,FULL);assert.equal(c.bthStreak(),101,'an in-progress day that qualifies adds');
});
test('O1 streak still breaks on a past empty day',()=>{const c=app();seedDays(c,5,FULL);c.setLog(c.ensureOperatorDay(back(c,3)).id,{});assert.equal(c.bthStreak(),2);});
test('O1 gym scheduled Mon/Wed/Fri and ticked on those days: gymStreak counts them',()=>{
  const c=app({bth_schedule:[{id:'gym',label:'Gym',time:'06:00',days:[1,3,5]}]});
  for(let i=1;i<=28;i++){const k=back(c,i),dow=new c.Date(k+'T12:00:00').getDay();const day=c.ensureOperatorDay(k);day.submitted=true;c.setLog(day.id,[1,3,5].includes(dow)?{gym:true}:{});}
  assert.equal(c.gymStreak(),12,'today (Mon, unticked, in progress) does not break it');
  c.setLog(c.activeLogKey,{gym:true});assert.equal(c.gymStreak(),13);
});
test('O1 bth_best_bth updates from Today without opening Review and never drops',()=>{
  const c=app();seedDays(c,100,FULL);assert.equal(c.load('bth_best_bth'),null);
  c.originalToday();assert.equal(c.load('bth_best_bth'),100);
  const d=app({bth_best_bth:500,bth_best_gym:7});d.originalToday();assert.equal(d.load('bth_best_bth'),500);assert.equal(d.load('bth_best_gym'),7);
});
test('O1 bests also update when a day closes',()=>{const c=app();seedDays(c,3,FULL);c.setLog(c.activeLogKey,FULL);c.submitOperatorDay();assert.equal(c.load('bth_best_bth'),4);});
test('O1 an {off:false} day scores null and counts as empty',()=>{
  const c=app();assert.equal(c.scoreDay({off:false}),null);assert.equal(c.scoreDay({off:false,gym:false,sleep:''}),null);assert.equal(c.scoreDay({gymDay:true}),null);
  assert.equal(c.scoreDay({sleep:'8'}),c.scoreDay({sleep:'8',off:false}));
  assert.equal(c.scoreDay({sleep:'8',energy:'7',gym:true,protein:'200',water:'8',...FULL}),100);
});
test('O1 scoreParts add up to scoreDay and the grade card shows the points',()=>{
  const c=app({},'2026-11-21T21:00:00-05:00');const log={sleep:'6',energy:'5',posted:true,gym:false,working:true,protein:'120',water:'4'};const p=c.scoreParts(log);
  assert.equal(Math.round(p.sleep+p.energy+p.bth+p.gym+p.protein+p.water),c.scoreDay(log));
  for(const k of ['2026-11-16','2026-11-17','2026-11-18']){const d=c.ensureOperatorDay(k);d.submitted=true;c.setLog(d.id,{...log});}
  // Loop 2 (ISS-0546): Tue Nov 17 is a rest day on the starter schedule, so it earns full gym points: (0+20+0)/3 = 7.
  assert.match(c.renderWeekReview(),/Avg points: Sleep 15\/20 · Energy 7\/10 · BTH 5\/30 · Gym 7\/20 · Protein 9\/15 · Water 3\/5/);
});
test('O1 isGymDay matches id gym or a Gym/Lift label',()=>{
  const c=app({bth_schedule:[{id:'c1',label:'Lift legs',time:'21:00',days:[2]}]});
  assert.equal(c.isGymDay(new c.Date('2026-11-17T12:00:00')),true);assert.equal(c.isGymDay(new c.Date('2026-11-16T12:00:00')),false);
  const d=app({bth_schedule:[{id:'c2',label:'Read',time:'21:00'}]});assert.equal(d.isGymDay(new d.Date('2026-11-17T12:00:00')),false);
});
test('O1 a closed day keeps its gym-day answer after the schedule changes',()=>{
  const c=app({bth_schedule:[{id:'gym',label:'Gym',time:'06:00',days:[1]}]});
  c.setLog(c.activeLogKey,{gym:true});const monday=c.activeLogKey;c.submitOperatorDay();
  assert.equal(c.getLog(monday).gymDay,true);
  c.save('bth_schedule',[{id:'gym',label:'Gym',time:'06:00',days:[3]}]);
  assert.equal(c.gymStreak(),1,'Monday still counts though Gym moved to Wednesday');
});
test('O1 new installs get Gym on Mon/Wed/Fri; existing users keep their schedule untouched',()=>{
  const fresh=app();assert.deepEqual([...fresh.getSchedule().find(i=>i.id==='gym').days],[1,3,5]);assert.ok(fresh.storage.has('bth_schedule'));
  const site=app({bth_lead_ref:'x',bth_anon_id:'y'});assert.deepEqual([...site.getSchedule().find(i=>i.id==='gym').days],[1,3,5],'marketing-site keys do not count as Operator data');
  const old=app({bth_operator_state_v3:{version:3,activeDayId:'a',order:['a'],days:{a:{id:'a',labelDate:'2026-11-16',log:{},tasks:null}},reminders:{fired:{}}}});
  assert.equal(old.storage.has('bth_schedule'),false);assert.equal(old.getSchedule().find(i=>i.id==='gym').days,undefined);assert.equal(old.isGymDay(new old.Date('2026-11-17T12:00:00')),true);
  const legacy=app({'bth_d_2026-11-9':{gym:true}});assert.equal(legacy.storage.has('bth_schedule'),false);
});
test('O1 Off works on a viewed past day and the Off box stays enabled there',()=>{
  const c=app();c.switchToYesterday();const y=c.activeLogKey;c.toggleOffDay();assert.equal(c.getLog(y).off,true);
  assert.equal(c.findOperatorDay(y).submitted,true);
  c.originalToday();const h=c.el('tab-today').innerHTML;assert.match(h,/<input type="checkbox" data-keep checked onchange="toggleOffDay\(\)">/);assert.match(h,/<input disabled/);
  assert.notEqual(c.OPERATOR_STATE.activeDayId,c.findOperatorDay(y).id);
});
test('O1 off-range setter marks past days off, keeps their data, and stops at the open day',()=>{
  const c=app();const kept=c.ensureOperatorDay('2026-11-11');kept.submitted=true;c.setLog(kept.id,{sleep:'7'});
  assert.equal(c.setOffRange('2026-11-10','2026-11-20'),7);
  for(const k of ['2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-14','2026-11-15','2026-11-16'])assert.equal(c.getLog(k).off,true,k);
  assert.equal(c.getLog('2026-11-11').sleep,'7');assert.equal(c.findOperatorDay('2026-11-17'),null);
  c.confirm=()=>false;assert.equal(c.setOffRange('2026-11-01','2026-11-02'),0);assert.equal(c.findOperatorDay('2026-11-01'),null);
});
test('O1 off days bridge a streak',()=>{const c=app();seedDays(c,6,FULL);c.setOffRange(back(c,4),back(c,3));assert.equal(c.bthStreak(),4);});

// ── O2 task carry-forward ────────────────────────────────────────────────
test('O2 duplicates collapse on carry: [A,A,B] submitted 10 times leaves exactly [A]',()=>{
  const c=app();c.setTasks(c.activeLogKey,{tasks:['A','A','B'],completed:[false,false,true]});
  for(let i=0;i<10;i++){c.submitOperatorDay();const d=new c.Date('2026-11-17T21:00:00');d.setDate(d.getDate()+i);c.clock(d.toISOString());}
  assert.equal(label(c),'2026-11-26');const t=c.getTasks(c.activeLogKey);
  assert.deepEqual([...t.tasks],['A']);assert.deepEqual([...t.completed],[false]);assert.deepEqual([...t.origin],['2026-11-16']);
});
test('O2 dedupe matches trimmed lower-case text and keeps the oldest origin',()=>{
  const c=app();c.setTasks(c.activeLogKey,{tasks:['Call Mo ',' call mo','x'],completed:[false,false,false],origin:['2026-11-14','2026-11-10',null]});
  c.submitOperatorDay();const t=c.getTasks(c.activeLogKey);assert.deepEqual([...t.tasks],['Call Mo ','x']);assert.deepEqual([...t.origin],['2026-11-10','2026-11-16']);
});
test('O2 removeTask(0) empties a one-task list and keeps parallel arrays aligned',()=>{
  const c=app();c.setTasks(c.activeLogKey,{tasks:['A'],completed:[false]});c.removeTask(0);assert.equal(c.getTasks(c.activeLogKey).tasks.length,0);
  c.setTasks(c.activeLogKey,{tasks:['a','b','c'],completed:[false,true,false],origin:['2026-11-01',null,'2026-11-02']});c.removeTask(1);
  const t=c.getTasks(c.activeLogKey);assert.deepEqual([...t.tasks],['a','c']);assert.deepEqual([...t.completed],[false,false]);assert.deepEqual([...t.origin],['2026-11-01','2026-11-02']);
});
test('O2 removeTask is refused on a viewed past day',()=>{const c=app();const y=c.ensureOperatorDay('2026-11-15');c.setTasks(y.id,{tasks:['keep'],completed:[false]});c.switchToYesterday();c.removeTask(0);assert.equal(c.getTasks('2026-11-15').tasks[0],'keep');});
test('O2 a row shows a delete control and CLEAR CARRIED clears only open carried tasks',()=>{
  const c=app();c.setTasks(c.activeLogKey,{tasks:['old open','old done','new'],completed:[false,true,false],origin:['2026-11-12','2026-11-12',null]});
  const h=c.renderTasksHtml();assert.equal((h.match(/onclick="removeTask\(\d\)"/g)||[]).length,3);assert.match(h,/CLEAR CARRIED \(1\)/);
  c.clearCarried();assert.deepEqual([...c.getTasks(c.activeLogKey).tasks],['old done','new']);assert.doesNotMatch(c.renderTasksHtml(),/CLEAR CARRIED/);
});
test('O2 adding a task that is already open is skipped',()=>{const c=app();c.el('new-task').value='Film';c.addOwnTask();c.el('new-task').value=' film ';c.addOwnTask();assert.deepEqual([...c.getTasks(c.activeLogKey).tasks],['Film']);assert.equal(c.lastToast,'Already on your list');});
test('O2 no age cap: an old carried task still carries (waits on ISS-0426)',()=>{const c=app();c.setTasks(c.activeLogKey,{tasks:['ancient'],completed:[false],origin:['2025-01-01']});c.submitOperatorDay();assert.deepEqual([...c.getTasks(c.activeLogKey).tasks],['ancient']);});

// ── O3 day boundary and SUBMIT THE DAY ──────────────────────────────────
test('O3 two submits within 2 s produce one day',()=>{const c=app();const n=c.OPERATOR_STATE.order.length;c.submitOperatorDay();c.submitOperatorDay();assert.equal(c.OPERATOR_STATE.order.length,n+1);assert.equal(label(c),'2026-11-17');});
test('O3 the 2 s guard alone blocks a double tap even when the clock allows a submit',()=>{const c=app({},'2026-11-17T03:00:00-05:00');c.submitOperatorDay();assert.equal(label(c),'2026-11-17');c.clock('2026-11-17T06:00:01-05:00');c.submitLockUntil=Date.parse('2026-11-17T06:00:02-05:00');c.submitOperatorDay();assert.equal(label(c),'2026-11-17');});
test('O3 the open day is never more than opDate(now)+1',()=>{
  const c=app();const times=['2026-11-16T21:00:00-05:00','2026-11-16T23:59:00-05:00','2026-11-17T02:00:00-05:00','2026-11-17T05:59:00-05:00','2026-11-17T06:00:05-05:00','2026-11-17T06:00:06-05:00','2026-11-17T22:00:00-05:00','2026-11-18T01:00:00-05:00'];
  for(const t of times){c.clock(t);for(let i=0;i<3;i++){c.submitOperatorDay();c.submitLockUntil=0;}const limit=c.opDate(new c.Date());limit.setDate(limit.getDate()+1);assert.ok(label(c)<=c.dateKey(limit),t+' -> '+label(c));}
  assert.equal(label(c),'2026-11-18');
});
test('O3 cancel at the confirm keeps the day open',()=>{const c=app();c.confirm=()=>false;c.submitOperatorDay();assert.equal(label(c),'2026-11-16');assert.equal(c.OPERATOR_STATE.order.length,1);});
test('O3 at 03:00 the header says the operator day ends 06:00',()=>{
  const c=app({},'2026-11-17T03:00:00-05:00');c.originalToday();const h=c.el('tab-today').innerHTML;assert.match(h,/Monday, Nov 16/);assert.match(h,/Operator day · ends 06:00/);
  c.operatorAmber=false;c.originalToday();assert.match(c.el('tab-today').innerHTML,/ends 06:00/);
});
test('O3 after a submit the button gives way to an ahead note and UNDO',()=>{
  const c=app();c.originalToday();assert.match(c.el('tab-today').innerHTML,/SUBMIT THE DAY/);
  c.submitOperatorDay();c.originalToday();const h=c.el('tab-today').innerHTML;assert.doesNotMatch(h,/onclick="submitOperatorDay\(\)"/);assert.match(h,/already ahead of the clock/);assert.match(h,/UNDO SUBMIT/);
});
test('O3 undo reopens the closed day while the new day is still empty',()=>{
  const c=app();const first=c.activeLogKey;c.setLog(first,{sleep:'7'});c.setTasks(first,{tasks:['carry'],completed:[false]});c.submitOperatorDay();
  const second=c.activeLogKey;assert.notEqual(first,second);assert.equal(c.canUndoSubmit(),true);c.undoSubmit();
  assert.equal(c.OPERATOR_STATE.activeDayId,first);assert.equal(c.OPERATOR_STATE.days[second],undefined);assert.ok(!c.OPERATOR_STATE.order.includes(second));
  const d=c.findOperatorDay(first);assert.equal(d.submitted,false);assert.equal(d.submittedAt,null);assert.equal('gymDay' in d.log,false);assert.equal(d.log.sleep,'7');assert.deepEqual([...d.tasks.tasks],['carry']);
  c.submitOperatorDay();c.submitLockUntil=0;assert.equal(label(c),'2026-11-17');
});
test('O3 undo is gone once the new day has data, or once the cutoff passes',()=>{
  const c=app();c.submitOperatorDay();c.setLog(c.activeLogKey,{sleep:'6'});assert.equal(c.canUndoSubmit(),false);
  const e=app();e.setTasks(e.activeLogKey,{tasks:['t'],completed:[false]});e.submitOperatorDay();e.toggleTask(0);assert.equal(e.canUndoSubmit(),false);
  const f=app();f.submitOperatorDay();f.clock('2026-11-17T06:30:00-05:00');assert.equal(f.canUndoSubmit(),false);
  const g=app();g.submitOperatorDay();g.clock('2026-11-18T07:00:00-05:00');g.autoRollover();assert.equal(label(g),'2026-11-18');assert.equal(g.OPERATOR_STATE.lastSubmit,null);
});
test('O3 a cutoff change that would close the day asks first',()=>{
  const c=app({},'2026-11-17T05:00:00-05:00');assert.equal(label(c),'2026-11-16');
  c.confirm=()=>false;c.setOpCutoff('04:00');assert.equal(c.cutoffTime(),'06:00');assert.equal(label(c),'2026-11-16');
  let asked=0;c.confirm=()=>{asked++;return true;};c.setOpCutoff('05:30');assert.equal(asked,0,'no roll, no question');assert.equal(c.cutoffTime(),'05:30');
  c.setOpCutoff('04:00');assert.equal(asked,1);assert.equal(c.cutoffTime(),'04:00');assert.equal(label(c),'2026-11-17');
});

// ── Old saved data loads unchanged ───────────────────────────────────────
// The shape below is what bth-operator-v2.html @ e0f0668 wrote: no origin[], no gymDay, no lastSubmit,
// no saved schedule, bests capped at 90, plus the pre-v3 dated keys that migration reads.
const OLD={
  bth_operator_state_v3:{version:3,activeDayId:'op-1',order:['op-0','op-1'],reminders:{fired:{'2026-11-16:gym:06:00':true}},days:{
    'op-0':{id:'op-0',labelDate:'2026-11-15',createdAt:'2026-11-15T11:00:00.000Z',submitted:true,submittedAt:'2026-11-16T10:00:00.000Z',auto:false,log:{sleep:'8',posted:true,off:false},tasks:{tasks:['Edit clip','Edit clip','Call Mo'],completed:[false,false,true],setAt:'2026-11-15T11:00:00.000Z'}},
    'op-1':{id:'op-1',labelDate:'2026-11-16',createdAt:'2026-11-16T10:00:00.000Z',submitted:false,submittedAt:null,log:{energy:'5'},tasks:{tasks:['Edit clip','Edit clip'],completed:[false,false],setAt:'2026-11-16T10:00:00.000Z'}}}},
  bth_tyweek_v1:{version:1,seeded:true,goals:[{id:'g',label:'Keep',days:[1]}],minimums:[],weeks:{'2026-11-16':{checks:{},money:[{amt:20}],hours:{}}}},
  bth_best_bth:90,bth_best_gym:90,bth_best_read:3,bth_opday_cutoff:'06:00',bth_goals:{protein:180},
  'bth_d_2026-11-8':{gym:true},'bth_t_2026-11-8':{tasks:['old'],completed:[true]},
};
test('old-shape saved state loads unchanged: every key, every existing day field, bests never lowered',()=>{
  const c=app(OLD);const before=new Map(c.storage);
  c.boot();c.originalToday();c.renderWeekReview();
  for(const [k,v] of before){if(k==='bth_operator_state_v3')continue;assert.equal(c.storage.get(k),v,k);}
  assert.equal(c.storage.has('bth_schedule'),false,'no schedule is written for an existing user');
  const saved=JSON.parse(c.storage.get('bth_operator_state_v3'));
  assert.equal(saved.activeDayId,'op-1');
  for(const id of ['op-0','op-1'])assert.deepEqual(saved.days[id],OLD.bth_operator_state_v3.days[id],id);
  assert.deepEqual(saved.reminders,OLD.bth_operator_state_v3.reminders);
  assert.equal(c.getLog('2026-11-08').gym,true);assert.equal(c.getTasks('2026-11-08').tasks[0],'old');
  assert.equal(c.load('bth_best_bth'),90);assert.equal(c.load('bth_best_gym'),90);
  assert.equal(c.scoreDay(c.getLog('2026-11-15')),c.scoreDay({sleep:'8',posted:true}));
  assert.equal(c.getSchedule().find(i=>i.id==='gym').days,undefined);
});
test('old-shape state rolled forward after days away: old fields kept, only additive fields added',()=>{
  const c=app(OLD,'2026-11-19T21:00:00-05:00');c.boot();
  const saved=JSON.parse(c.storage.get('bth_operator_state_v3'));assert.equal(label(c),'2026-11-19');
  assert.deepEqual(saved.days['op-0'],OLD.bth_operator_state_v3.days['op-0']);
  const was=OLD.bth_operator_state_v3.days['op-1'],now=saved.days['op-1'];
  for(const k of Object.keys(was))if(!['submitted','submittedAt','auto','log'].includes(k))assert.deepEqual(now[k],was[k],k);
  assert.equal(now.log.energy,'5');assert.deepEqual(Object.keys(now.log).sort(),['energy','gymDay']);
  const t=c.getTasks(c.activeLogKey);assert.deepEqual([...t.tasks],['Edit clip']);assert.deepEqual([...t.origin],['2026-11-16']);
  c.submitLockUntil=0;c.originalToday();assert.match(c.el('tab-today').innerHTML,/Edit clip/);
});
