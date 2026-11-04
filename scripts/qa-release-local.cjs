// Local-only QA. Does not send inquiries or contact payment providers.
const { chromium } = require('C:/Users/nexus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const out = process.argv[2];
if (!out) throw Error('Output directory required');
const base = 'http://127.0.0.1:4173';
const routes = ['/', '/shop', '/shop/product/the-steel', '/shop/product/the-jade', '/how-to', '/about', '/blog', '/contact', '/konto', '/legal/impressum', '/legal/datenschutz', '/legal/agb', '/legal/widerruf', '/legal/versand', '/not-found'];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const results = [], errors = [];
  const context = await browser.newContext({reducedMotion:'reduce'});
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  for (const width of [375,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    for (const route of routes) {
      const res = await page.goto(base+route,{waitUntil:'networkidle'});
      await page.locator('main').waitFor({timeout:10000});
      await page.evaluate(async () => { for(let y=0; y<document.documentElement.scrollHeight; y+=Math.max(300,innerHeight-100)){scrollTo(0,y);await new Promise(r=>setTimeout(r,35));} scrollTo(0,0); });
      await page.waitForTimeout(300);
      const value = await page.evaluate(() => ({heading:document.querySelector('main h1, main h2')?.innerText, overflow:document.documentElement.scrollWidth-innerWidth, broken:[...document.images].filter(i=>i.getClientRects().length && (!i.complete || !i.naturalWidth)).map(i=>i.currentSrc || i.src)}));
      const key = (route==='/' ? 'home' : route.slice(1).replaceAll('/','-'));
      await page.screenshot({path:path.join(out,`${width}-${key}.png`),fullPage:true});
      results.push({width,route,status:res.status(),...value});
    }
  }
  await page.setViewportSize({width:375,height:812});
  await page.goto(base, {waitUntil:'domcontentloaded'});
  const initial=await page.evaluate(()=>document.documentElement.dataset.stone);
  await page.waitForTimeout(5000);
  const after=await page.evaluate(()=>document.documentElement.dataset.stone);
  assert.equal(initial,after,'selection changed automatically');
  const position=await page.evaluate(()=>({image:document.querySelector('.hero__image').getBoundingClientRect().top, text:document.querySelector('.hero__content').getBoundingClientRect().top}));
  assert(position.image < position.text,'mobile product is not first');
  const selection=[];
  for(const label of ['Xiu Jade','Rosenquarz','Edelstahl']) {
    const button=page.getByRole('button',{name:label,exact:true});
    if(await button.count()) {await button.click();await page.waitForTimeout(800);selection.push({label,stone:await page.evaluate(()=>document.documentElement.dataset.stone)});}
  }
  const download=await page.request.get(base+'/widerrufsformular.txt');
  const formText=await download.text();
  assert.equal(download.status(),200);assert.match(formText,/Muster-Widerrufsformular/);
  await page.goto(base+'/konto');assert.match(await page.locator('main').innerText(),/noch nicht verfügbar/);
  await page.goto(base+'/shop/product/the-steel',{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.removeItem('gua-shop-cart'));
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('button',{name:/In den Warenkorb/i}).first().click();
  const cart=page.getByRole('dialog',{name:'Warenkorb',exact:true});await cart.waitFor();
  const one=await cart.innerText();assert.match(one,/14,89/);assert.match(one,/1,99/);
  const inquiry=await cart.getByRole('link',{name:/Bestellanfrage per E-Mail/i}).getAttribute('href');assert.match(inquiry,/^mailto:/);
  await page.keyboard.press('Escape');assert.equal(await cart.isVisible(),false);
  await page.goto(base+'/shop/product/the-jade',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/In den Warenkorb/i}).first().click();await cart.waitFor();
  const two=await cart.innerText();assert.match(two,/22,80/);assert.match(two,/Kostenlos/i);
  await page.keyboard.press('Escape');
  await page.goto(base+'/shop/product/the-rose',{waitUntil:'networkidle'});
  const roseButtons=page.getByRole('button',{name:/ausverkauft/i});
  assert(await roseButtons.count()>0 && await roseButtons.first().isDisabled(),'Rose must remain unavailable');
  await page.goto(base+'/shop',{waitUntil:'networkidle'});
  const steelCardImage=await page.locator('.product-card').first().locator('img').getAttribute('src');
  assert.equal(steelCardImage,'/img/steel/the-steel-clean-v1.png');
  const cardButtons=await page.locator('.product-card__actions .btn').evaluateAll(nodes=>nodes.map(el=>({fontSize:parseFloat(getComputedStyle(el).fontSize),height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width})));
  assert(cardButtons.length>0 && cardButtons.every(b=>b.fontSize>=16 && b.height>=44 && b.width>=44),'mobile card controls too small');
  const footer=await page.locator('.footer').evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));
  await page.keyboard.press('Tab');
  const focused=await page.evaluate(()=>({tag:document.activeElement?.tagName,label:document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim()}));
  assert.notEqual(focused.tag,'BODY');
  const report={base,results,errors,selection,position,download:download.status(),cart:{single:'14,89 € inkl. 1,99 € Versand',mixed:'22,80 € inkl. kostenlosem Versand',escape:true,mailtoPreparedOnly:true,roseUnavailable:true},keyboardFocus:focused,steelCardImage,cardButtons,footer,scope:'Local Vite preview; scrolled full-page screenshots and displayed image completeness, simulated browser storage, no mail or payment sent. Reduced motion enabled.'};
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2));
  await browser.close();
  if(results.some(x=>x.status!==200||x.overflow>2||x.broken.length)||errors.length) process.exitCode=1;
})().catch(e=>{fs.writeFileSync(path.join(out,'failure.txt'),e.stack);console.error(e);process.exitCode=1;});
