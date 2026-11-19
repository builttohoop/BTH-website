import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.TZ='America/New_York';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const html=read('bth-operator-v2.html'),sw=read('bth-operator-sw.js');
const source=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
function app(seed={},search=''){
 const storage=new Map(Object.entries(seed).map(([k,v])=>[k,JSON.stringify(v)])),elements=new Map(),classes=new Set();
 class Clock extends Date{constructor(...a){super(...(a.length?a:['2026-11-16T21:00:00-05:00']));}static now(){return +new Clock();}}
 const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',style:{},classList:{add(){},remove(){},toggle(){}},querySelectorAll:()=>[],setAttribute(){}});return elements.get(id);};
 const body={classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)}};
 const c=vm.createContext({Date:Clock,console,URLSearchParams,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),key:i=>[...storage.keys()][i],get length(){return storage.size;}},document:{body,getElementById:el,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){}},window:{matchMedia:()=>({matches:false}),navigator:{},addEventListener(){}},navigator:{},location:{protocol:'file:',search},setTimeout:()=>1,clearTimeout(){},setInterval(){},confirm:()=>true,MutationObserver:class{observe(){}}});
 vm.runInContext(source,c);return Object.assign(c,{el,classes,storage});
}
test('A1 CSS exists and is linked exactly once',()=>{assert.ok(existsSync(new URL('../bth-operator-amber.css',import.meta.url)));assert.equal((html.match(/href="\.\/bth-operator-amber.css"/g)||[]).length,1);});
test('A1 every CSS selector is body scoped including conditional rules',()=>{const css=read('bth-operator-amber.css').replace(/\/\*[\s\S]*?\*\//g,'');const selectors=[...css.matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim()).filter(s=>!s.startsWith('@'));assert.ok(selectors.length>30);for(const rule of selectors)for(const s of rule.split(/,(?![^()]*\))/))assert.match(s.trim(),/^body\.operator-amber(?:\b|[:\s.#[])/,s);});
test('A1 shell caches stylesheet at new version',()=>{assert.match(sw,/bth-operator-v10-trial-loop3-20261117/);assert.match(sw,/const SHELL=.*bth-operator-amber.css/);});
test('A1 boot defaults Amber with both classic kill switches',()=>{assert.ok(app().classes.has('operator-amber'));assert.ok(!app({bth_theme:'classic'}).classes.has('operator-amber'));assert.ok(!app({},'?theme=classic').classes.has('operator-amber'));assert.ok(!app({bth_theme:'amber'},'?theme=classic').classes.has('operator-amber'));const raw=app();raw.storage.set('bth_theme','classic');raw.applyOperatorTheme();assert.ok(!raw.classes.has('operator-amber'));});
test('A7 local save copy is truthful',()=>{const c=app();c.renderClaude();assert.match(c.el('tab-claude').innerHTML,/SAVE FOR CLAUDE/);assert.doesNotMatch(html,/SEND TO CLAUDE/);assert.match(c.el('tab-claude').innerHTML,/Saved for your next Claude handoff/);});
test('A7 mail actions open drafts',()=>{const c=app();c.renderClaude();assert.equal((c.el('tab-claude').innerHTML.match(/OPEN EMAIL DRAFT/g)||[]).length,2);});
test('A6 This Week keeps its route',()=>{assert.match(html,/class="nav-label">This Week</);assert.match(html,/id="tab-week"/);const c=app();c.renderWeek();assert.match(c.el('tab-week').innerHTML,/This Week/);});
test('no storage clearing',()=>assert.doesNotMatch(html,/localStorage\s*\.\s*clear\s*\(/));
test('no prototype metrics',()=>{for(const fixture of ['57%','7.5h','80oz','8/10','1,840'])assert.ok(!html.includes(fixture),fixture);});
test('A3 Today momentum equals seeded Ty Week and missing sleep is a dash',()=>{const c=app();c.TW.goals=[];c.TW.minimums=[{id:'hours',label:'Hours',unit:'hrs',target:10}];c.twWeek(0,true).hours={0:{hours:4}};c.renderToday();const h=c.el('tab-today').innerHTML,pct=c.twWeekStats(c.twRead(0)).pct;assert.equal(pct,40);assert.match(h,new RegExp('id="amber-today-pct"[^>]*>'+pct+'%'));assert.match(c.twTodayCardHtml(),new RegExp('Week '+pct+'%'));assert.match(h,/id="amber-sleep">—</);});
test('A5 empty and zero goals never render NaN or Infinity',()=>{for(const value of [0,'']){const c=app({bth_goals:{protein:value,carbs:value,fat:value,cals:value,water:value}});c.setLog(c.activeLogKey,{protein:'120',cals:'800',water:'2'});c.renderNutrition();c.renderToday();assert.doesNotMatch(c.el('tab-nutrition').innerHTML+c.el('tab-today').innerHTML,/NaN|Infinity/);}});
test('A7 tools use human date rather than raw id',()=>{const c=app();c.renderClaude();assert.doesNotMatch(c.el('tab-claude').innerHTML+c.el('pwa-status').textContent,/op-\d/);assert.match(c.el('pwa-status').textContent,/Nov 16/);});


test('A8 palette contrast remains AA over the brightest panel and solid fallback',()=>{
 const rgb=h=>h.match(/\w\w/g).map(v=>parseInt(v,16));
 const luminance=h=>rgb(h).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((a,n,i)=>a+n*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const rows=[];
 for(const fg of ['fcf9f3','b4bab8','f7b43b'])for(const bg of ['080d11','161b20','1c2228','342a1d','3a2e1c']){const r=ratio(fg,bg);assert.ok(r>=4.5,`${fg} on ${bg}: ${r}`);rows.push(r);}
 for(const bg of ['f7b43b','f7842d'])assert.ok(ratio('130c04',bg)>=4.5);
 assert.ok(read('bth-operator-amber.css').includes('--muted:#b4bab8'));
 console.log('Palette: 17 text/background pairs pass; lowest ratio '+Math.min(...rows).toFixed(2)+':1');
});
test('A1 switching theme preserves data exports and an unsaved note',()=>{
 const c=app({bth_goals:{water:11,protein:180},bth_train_week:3,bth_train_day:2,bth_creator_exercises:[{name:'Owner exercise',sets:'2',reps:'6'}],bth_custom_workouts:[{name:'Owner workout',exercises:[]}],bth_schedule:[{id:'gym',label:'Owner schedule',time:'03:00',days:[1]}],bth_claude_notes:[{text:'Keep me',ts:'2026-11-16T20:00:00Z'}]});
 c.setLog(c.activeLogKey,{sleep:'6',energy:'4',water:'2',protein:'140'});c.setTasks(c.activeLogKey,{tasks:['Keep task'],completed:[false]});
 const exports=()=>{const all=[];c.downloadFile=(n,b)=>all.push([n,b]);c.exportCSV();c.downloadICS();c.downloadClaudeHandoff();return JSON.stringify(all);};
 const before=exports(),stored=[...c.storage];c.el('claude-note-input').value='Unfinished thought';c.toggleOperatorTheme();assert.equal(c.operatorAmber,false);assert.equal(c.el('claude-note-input').value,'Unfinished thought');assert.equal(exports(),before);for(const [k,v]of stored)assert.equal(c.storage.get(k),v,k);c.toggleOperatorTheme();assert.equal(c.operatorAmber,true);assert.equal(exports(),before);
});
test('A4 real program selection and locked view remain wired',()=>{const c=app();c.setTrainWeek(3);c.setTrainDay(2);assert.ok(c.el('tab-train').innerHTML.includes(c.esc(c.PHASE2.days[1].title)));assert.match(c.el('tab-train').innerHTML,/data-number="1"/);assert.equal(c.load('bth_train_week'),3);c.ACCESS.canViewWorkouts=()=>false;c.renderTrain();assert.match(c.el('tab-train').innerHTML,/LOCKED/);assert.doesNotMatch(c.el('tab-train').innerHTML,/data-number="1"/);});
test('A3 Amber yesterday disables tile editing and preserves records',()=>{const c=app();const before=JSON.stringify(c.OPERATOR_STATE);c.switchToYesterday();assert.equal(JSON.stringify(c.OPERATOR_STATE),before);const h=c.el('tab-today').innerHTML;assert.match(h,/<button disabled class="amber-metric"/);assert.doesNotMatch(h,/onclick="focusTodayMetric/);assert.match(h,/onclick="returnToToday\(\)"/);});
test('A7 local note save delete and escaping still work',()=>{const c=app();c.el('claude-note-input').value='<b>Owner note</b>';c.saveClaudeNote();assert.match(c.el('tab-claude').innerHTML,/&lt;b&gt;Owner note&lt;\/b&gt;/);assert.equal(c.load('bth_claude_notes').length,1);c.deleteClaudeNote(0);assert.equal(c.load('bth_claude_notes').length,0);});
test('A1 SW installs Amber and removes only obsolete Operator caches',async()=>{const handlers={},deleted=[],shells=[];const c=vm.createContext({self:{addEventListener:(n,fn)=>handlers[n]=fn,skipWaiting(){},clients:{claim:async()=>{}}},caches:{keys:async()=>['another-app-v1','bth-operator-v8-opday-20261116','bth-operator-v9-amber-20261116','bth-operator-v10-trial-loop3-20261117'],delete:async k=>deleted.push(k),open:async()=>({addAll:async s=>shells.push(...s)})}});vm.runInContext(sw,c);let work;handlers.install({waitUntil:p=>work=p});await work;assert.ok(shells.includes('./bth-operator-amber.css'));handlers.activate({waitUntil:p=>work=p});await work;assert.deepEqual(deleted,['bth-operator-v8-opday-20261116','bth-operator-v9-amber-20261116']);});
