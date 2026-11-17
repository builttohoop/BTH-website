// Trial loop 2 (TR-20261117-02) fixes L2-O1 to L2-O5 for the Personal Operator.
// Same harness as operator-trial-loop1.test.mjs: the real page script in a vm with a fake clock and a fake localStorage.
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
const label=c=>c.findOperatorDay(c.OPERATOR_STATE.activeDayId).labelDate;
const FULL={posted:true,filmed:true,edited:true,engaged:true,planned:true,recovery:true};
const MWF=[{id:'gym',label:'Gym',time:'18:00',days:[1,3,5]}];

// ── L2-O1 gym row follows any gym item ─────────────────────────────────
test('L2-O1 starter Gym deleted and a "Lift" item added: the gym row renders and logs to d.gym (ISS-0548, ISS-0462)',()=>{
  const c=app({bth_schedule:[{id:'c1',label:'Lift',time:'18:00',days:[1]}]});
  const h=c.originalToday();
  assert.match(h,/Gym session<\/div>/,'Monday is a Lift day, so the row reads as the gym session');
  assert.match(h,/toggleField\('gym'\)/);
  c.toggleField('gym');assert.equal(c.getLog(c.activeLogKey).gym,true);
});
test('L2-O1 read and work rows match by name too',()=>{
  const c=app({bth_schedule:[{id:'x1',label:'Read 20 pages',time:'21:00',days:[1]},{id:'x2',label:'Work shift',time:'22:00',days:[1]}]});
  const h=c.originalToday();
  assert.match(h,/toggleField\('reading'\)/);assert.match(h,/toggleField\('working'\)/);assert.doesNotMatch(h,/toggleField\('gym'\)/);
});

// ── L2-O2 after the night submit ───────────────────────────────────────
function nightSubmit(){const c=app({bth_schedule:MWF},'2026-12-31T22:00:00-05:00');const closedId=c.activeLogKey;assert.equal(label(c),'2026-12-31');c.submitOperatorDay();assert.equal(label(c),'2027-01-01');return {c,closedId};}
test('L2-O2 submit Dec 31 at 22:00, VIEW YESTERDAY at 00:40 Jan 1 opens Dec 31 (ISS-0432, ISS-0549)',()=>{
  const {c,closedId}=nightSubmit();c.clock('2027-01-01T00:40:00-05:00');
  c.switchToYesterday();
  assert.equal(c.findOperatorDay(c.activeLogKey).id,closedId);
  assert.equal(c.findOperatorDay(c.activeLogKey).labelDate,'2026-12-31');
  const before=JSON.stringify(c.OPERATOR_STATE);c.db('sleep','9');c.toggleField('gym');c.flushFieldSaves();
  assert.equal(JSON.stringify(c.OPERATOR_STATE),before,'View Yesterday stays read-only');
  assert.match(c.originalToday(),/disabled/);
});
test('L2-O2 a read logged at 23:30 through LOG TO lands on Dec 31, not Jan 1 (ISS-0431, ISS-0558)',()=>{
  const {c,closedId}=nightSubmit();const nextId=c.OPERATOR_STATE.activeDayId;c.clock('2026-12-31T23:30:00-05:00');
  assert.equal(c.logToClosedDay(),true);
  c.toggleField('reading');c.db('sleep','7');c.flushFieldSaves();
  assert.equal(c.OPERATOR_STATE.days[closedId].log.reading,true);
  assert.equal(c.OPERATOR_STATE.days[closedId].log.sleep,'7');
  assert.equal(c.OPERATOR_STATE.days[nextId].log.reading,undefined);
  const h=c.originalToday();
  assert.match(h,/id="late-banner"/);assert.match(h,/Logging to/);
  assert.doesNotMatch(h,/<input[^>]*disabled/,'the closed day is editable in this window');
  assert.equal(c.OPERATOR_STATE.activeDayId,nextId,'the active day does not move');
  c.returnToToday();assert.equal(c.activeLogKey,nextId);
});
test('L2-O2 the Today header shows the tomorrow cue and LOG TO until 06:00, then the normal line (ISS-0565)',()=>{
  const {c}=nightSubmit();
  for(const t of ['2026-12-31T22:05:00-05:00','2027-01-01T00:40:00-05:00','2027-01-01T05:59:00-05:00']){
    c.clock(t);const h=c.originalToday();
    assert.match(h,/Tomorrow · opens 06:00/,t);assert.match(h,/id="log-closed"/,t);assert.doesNotMatch(h,/Operator day · ends/,t);
  }
  c.clock('2027-01-01T06:00:00-05:00');const h=c.originalToday();
  assert.doesNotMatch(h,/Tomorrow · opens/);assert.doesNotMatch(h,/id="log-closed"/);assert.match(h,/Operator day · ends 06:00/);
  assert.equal(c.logToClosedDay(),false);
});
test('L2-O2 the LOG TO window closes at the cutoff: a write after 06:00 does not reach the closed day',()=>{
  const {c,closedId}=nightSubmit();c.clock('2027-01-01T05:50:00-05:00');c.logToClosedDay();
  c.clock('2027-01-01T06:10:00-05:00');c.toggleField('gym');
  assert.equal(c.OPERATOR_STATE.days[closedId].log.gym,undefined);
});
test('L2-O2 undo still reopens the closed day, and a late log survives the undo',()=>{
  const {c,closedId}=nightSubmit();c.clock('2027-01-01T00:40:00-05:00');
  c.logToClosedDay();c.toggleField('reading');c.returnToToday();
  assert.equal(c.canUndoSubmit(),true);c.undoSubmit();
  assert.equal(label(c),'2026-12-31');assert.equal(c.activeLogKey,closedId);assert.equal(c.getLog(closedId).reading,true);
});

// ── L2-O3 grade fairness ───────────────────────────────────────────────
const DONE={sleep:'8',energy:'7',water:'8',working:true,...FULL};
test('L2-O3 a rest-day workday with everything else done grades A-range, with or without protein (ISS-0546, ISS-0566)',()=>{
  const c=app({bth_schedule:MWF});
  assert.equal(c.scoreDay({...DONE,protein:'200'},'2026-11-17'),100);
  assert.equal(c.scoreDay(DONE,'2026-11-17'),100);
  assert.equal(c.scoreParts(DONE,'2026-11-17').gym,20);
});
test('L2-O3 a gym day without the gym is penalized; a frozen gymDay wins over the schedule',()=>{
  const c=app({bth_schedule:MWF});
  assert.equal(c.scoreParts({...DONE,protein:'200'},'2026-11-16').gym,0,'a workday on a gym day without the gym earns 0 of 20');
  assert.ok(c.scoreDay({...DONE,protein:'200'},'2026-11-16')<100);
  assert.equal(c.scoreParts({...DONE,working:false},'2026-11-16').gym,10,'a non-work gym day without the gym earns 10 of 20');
  assert.equal(c.scoreDay({...DONE,protein:'200',gymDay:false},'2026-11-16'),100,'frozen at close: not a gym day');
  assert.ok(c.scoreDay({...DONE,protein:'200',gymDay:true},'2026-11-17')<100,'frozen at close: a gym day');
});
test('L2-O3 a week with no protein entries is not penalized and shows Protein — (ISS-0547, ISS-0460)',()=>{
  const c=app({bth_schedule:MWF},'2026-11-21T21:00:00-05:00');
  for(const k of ['2026-11-16','2026-11-17','2026-11-18']){const d=c.ensureOperatorDay(k);d.submitted=true;c.setLog(d.id,{...DONE,gym:true});}
  const r=c.renderWeekReview();
  assert.match(r,/Protein —\/15/);
  assert.match(r,/grade-letter[^>]*>A\+?</);
  assert.match(r,/100\/100 AVG/);
});

// ── L2-O4 unopened days and gaps ───────────────────────────────────────
test('L2-O4 skip 3 days, change the schedule, return: the skipped days keep the old schedule (ISS-0434, ISS-0555)',()=>{
  const c=app({bth_schedule:[{id:'gym',label:'Gym',time:'18:00',days:[1]}]});
  c.setLog(c.activeLogKey,{gym:true});
  c.clock('2026-11-20T21:00:00-05:00');assert.equal(c.autoRollover(),true);assert.equal(label(c),'2026-11-20');
  for(const k of ['2026-11-17','2026-11-18','2026-11-19'])assert.deepEqual(JSON.parse(c.storage.get('bth_d_'+k)),{gymDay:false,stub:true},k);
  assert.equal(c.OPERATOR_STATE.order.length,2,'stubs use the date-key log; no operator day is added');
  c.save('bth_schedule',[{id:'gym',label:'Gym',time:'18:00',days:[0,1,2,3,4,5,6]}]);
  assert.equal(c.gymStreak(),1,'Tue-Thu were not gym days then, so Monday still counts');
  assert.equal(c.scoreDay(c.getLog('2026-11-18'),'2026-11-18'),null,'a stub has no score');
  assert.equal(c.hasLogData(c.getLog('2026-11-18')),false);
});
test('L2-O4 a stub never overwrites an existing date-key log',()=>{
  const c=app({'bth_d_2026-11-18':{sleep:'7'}});
  c.clock('2026-11-20T21:00:00-05:00');c.autoRollover();
  assert.deepEqual(JSON.parse(c.storage.get('bth_d_2026-11-18')),{sleep:'7'});
});
test('L2-O4 the week pipeline shows missed and off differently (ISS-0570)',()=>{
  const c=app({bth_schedule:MWF},'2026-11-21T21:00:00-05:00');
  const mon=c.ensureOperatorDay('2026-11-16');mon.submitted=true;c.setLog(mon.id,{sleep:'7'});
  const tue=c.ensureOperatorDay('2026-11-17');tue.submitted=true;c.setLog(tue.id,{off:true});
  const r=c.renderWeekReview();
  assert.match(r,/class="pip-dot off" role="img" aria-label="Tue: off"/);
  assert.match(r,/class="pip-dot missed" role="img" aria-label="Wed: missed"/);
  assert.match(r,/class="pip-dot " role="img" aria-label="Mon: logged"/);
  assert.match(r,/>Wed<\/div><div style="flex:1;"><span[^>]*>Missed</);
  assert.equal(c.dayState('2026-11-17'),'off');assert.equal(c.dayState('2026-11-18'),'missed');assert.equal(c.dayState('2026-11-22'),'');
  assert.match(html,/\.pip-dot\.missed\{[^}]*dashed/);
});

test('L2-O4 days before the app was first used are not marked missed',()=>{
  const c=app({},'2026-11-18T21:00:00-05:00');
  const r=c.renderWeekReview();
  assert.doesNotMatch(r,/pip-dot missed/);assert.doesNotMatch(r,/>Missed</);
  assert.equal(c.dayState('2026-11-16'),'');
});

// ── L2-O5 streak number on Today ───────────────────────────────────────
test('L2-O5 Today shows the streak numbers on the active day only (ISS-0556)',()=>{
  const c=app({bth_schedule:MWF});
  for(let i=1;i<=3;i++){const d=new c.Date('2026-11-16T12:00:00');d.setDate(d.getDate()-i);const day=c.ensureOperatorDay(c.dateKey(d));day.submitted=true;c.setLog(day.id,{...FULL,reading:true});}
  assert.match(c.originalToday(),/id="today-streaks">Streaks · BTH 3 · Gym \d+ · Read 3</);
  c.switchToYesterday();assert.doesNotMatch(c.originalToday(),/today-streaks/);
});
