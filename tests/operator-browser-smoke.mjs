// Uses an existing Playwright installation; never downloads browsers or packages.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=createServer((req,res)=>{
  if(!['/bth-operator-v2.html','/bth-operator-sw.js'].includes(req.url)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',req.url.endsWith('.js')?'application/javascript':'text/html');
  res.end(readFileSync(resolve('.'+req.url)));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:375,height:812},timezoneId:'America/New_York',serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
  await page.clock.install({time:new Date('2026-11-17T03:00:00-05:00')});
  await page.goto(`http://127.0.0.1:${server.address().port}/bth-operator-v2.html`);
  assert.match(await page.locator('#tab-today .page-sub').textContent(),/Monday, Nov 16/);
  await page.locator('input[oninput*="sleep"]').fill('7');
  await page.locator('input[oninput*="energy"]').fill('5');
  await page.clock.runFor(700);
  assert.equal(await page.evaluate(()=>getLog(activeLogKey).sleep),'7');
  assert.equal(await page.evaluate(()=>getLog(activeLogKey).energy),'5');
  await page.getByRole('textbox',{name:'Your task',exact:true}).fill('Owner task');
  await page.getByRole('button',{name:'ADD',exact:true}).click();
  assert.match(await page.locator('#tab-today').textContent(),/Owner task/);
  await page.getByRole('button',{name:'SUBMIT THE DAY',exact:true}).click();
  assert.match(await page.locator('#tab-today .page-sub').textContent(),/Tuesday, Nov 17/);
  await page.getByText('View Yesterday',{exact:true}).click();
  assert.equal(await page.locator('#tab-today input:not(:disabled)').count(),0);
  assert.equal(await page.locator('#tab-today button:not(:disabled)').count(),0);
  await page.getByText('← Active Day',{exact:true}).click();
  await page.getByLabel('Off (sick / vacation)').check();
  await page.evaluate(()=>{twView='review';renderWeek();});
  assert.match(await page.locator('#tab-week').textContent(),/OFF/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const before=await page.evaluate(()=>OPERATOR_STATE.order.length);
  await page.clock.setSystemTime(new Date('2026-11-20T21:00:00-05:00'));
  await page.reload();
  assert.match(await page.locator('#tab-today .page-sub').textContent(),/Friday, Nov 20/);
  assert.equal(await page.evaluate(()=>OPERATOR_STATE.order.length),before+1);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'tests/operator-mobile-smoke.png',fullPage:true});
  console.log('PASS: mobile UI, fast typing, tasks, submit, read-only yesterday, off/review, reload rollover, zero page errors, no horizontal overflow');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
