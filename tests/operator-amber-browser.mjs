import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/built/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
mkdirSync('tests/amber-artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],results=[],contrast=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'America/New_York',serviceWorkers:'block'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
 await page.clock.install({time:new Date('2026-11-16T21:00:00-05:00')});
 await page.goto(pathToFileURL(resolve('bth-operator-v2.html')).href);
 const show=async(tab)=>page.evaluate(t=>switchTab(t,document.querySelectorAll('.nav-btn')[['today','train','nutrition','week','claude'].indexOf(t)]),tab);
 const check=async(label)=>{
  const bad=await page.evaluate(()=>[...document.querySelectorAll('.tab.active *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width&&r.height&&s.display!=='none'&&(r.right>innerWidth+1||r.left< -1);}).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,65),rect:e.getBoundingClientRect().toJSON()})));
  assert.deepEqual(bad,[],label+' overflow');results.push(label);
 };
 for(const width of [320,360,390,430]){
  await page.setViewportSize({width,height:844});
  for(const tab of ['today','train','nutrition','week','claude']){await show(tab);await check(width+' '+tab);if(width===390)await page.screenshot({path:'tests/amber-artifacts/'+tab+'.png'});}
  await show('today');await page.evaluate(()=>schedSetEditing(true));await check(width+' schedule editor');
  await show('train');for(const v of ['create','my']){await page.evaluate(v=>setTrainView(v),v);await check(width+' train '+v);}await page.evaluate(()=>setTrainView('program'));
  await show('week');for(const v of ['money','review','setup']){await page.evaluate(v=>twSetView(v),v);await check(width+' week '+v);}await page.evaluate(()=>twSetView('week'));
 }
 await page.setViewportSize({width:390,height:844});await show('today');
 await page.getByLabel('Sleep hours',{exact:true}).fill('7');await page.getByLabel('Energy out of seven',{exact:true}).fill('5');await page.clock.runFor(700);
 assert.equal(await page.evaluate(()=>getLog(activeLogKey).sleep),'7');assert.equal(await page.locator('#amber-sleep').textContent(),'7h');
 await page.getByLabel('Your task',{exact:true}).fill('QA owner task');await page.getByRole('button',{name:'ADD',exact:true}).click();
 await page.reload();assert.match(await page.locator('#tab-today').textContent(),/QA owner task/);
 await show('claude');await page.locator('#claude-note-input').fill('QA handoff');await page.getByRole('button',{name:'SAVE FOR CLAUDE',exact:true}).click();assert.match(await page.locator('#tab-claude').textContent(),/QA handoff/);
 await page.locator('#theme-toggle').click();assert.equal(await page.locator('body').getAttribute('class'),'');await page.reload();assert.equal(await page.locator('body').getAttribute('class'),'');await show('claude');await page.locator('#theme-toggle').click();assert.equal(await page.locator('body').getAttribute('class'),'operator-amber');
 // Composite solid background colors from the root to each text node. Gradients
 // use their lightest declared stop separately in the palette test.
 for(const tab of ['today','train','nutrition','week','claude']){await show(tab);contrast.push(...await page.evaluate(()=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),blend=(a,b)=>a.slice(0,3).map((v,i)=>v*(a[3]??1)+b[i]*(1-(a[3]??1))),lum=c=>c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  return [...document.querySelectorAll('.tab.active *,nav *')].filter(e=>e.getClientRects().length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>{let chain=[],p=e;while(p){chain.unshift(p);p=p.parentElement;}let bg=[8,13,17];for(const a of chain)bg=blend(rgb(getComputedStyle(a).backgroundColor),bg);const fg=blend(rgb(getComputedStyle(e).color),bg),ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);return {text:e.textContent.slice(0,60),cls:e.className,ratio:+ratio.toFixed(2),color:getComputedStyle(e).color,bg};}).filter(x=>x.ratio<4.5);
 }));}
 writeFileSync('tests/amber-artifacts/qa.json',JSON.stringify({checks:results.length,results,errors,contrastFailures:contrast},null,2));
 assert.deepEqual(errors,[]);assert.deepEqual(contrast,[],'text contrast');
 console.log('PASS '+results.length+' responsive layouts; input persistence; live metrics; saved notes; theme toggle/reload; no page errors; solid text contrast');
}finally{await browser.close();}
