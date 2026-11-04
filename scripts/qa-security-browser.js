async page => {
  const base = new URL(page.url()).origin;
  if (base !== 'https://guasha-shop.de' && !/^https:\/\/guashop-[a-z0-9]+-oxaxks-projects\.vercel\.app$/.test(base)) throw Error('Explicit GUA SHOP QA target required');
  const errors = []; let injection = false;
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !injection && !/Failed to load resource.*404/.test(m.text())) errors.push(m.text()); });
  await page.setViewportSize({width:1280,height:900});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(()=>{localStorage.setItem('cookie-consent','acknowledged');localStorage.removeItem('gua-shop-cart');});
  await page.reload({waitUntil:'networkidle'});
  const routes=[];
  for(const path of ['/','/shop','/shop/product/the-steel','/shop/product/the-jade','/how-to','/about','/contact','/legal/impressum','/legal/datenschutz','/legal/agb','/legal/widerruf','/legal/versand']) {
    const r=await page.goto(base+path,{waitUntil:'networkidle'}); await page.locator('main').waitFor();
    if(r.status()!==200 || !(r.headers()['content-security-policy']||'').includes("script-src 'self'"))throw Error(path+' response/CSP');
    const state=await page.evaluate(()=>({path:location.pathname,heading:document.querySelector('h1')?.textContent,overflow:document.body.scrollWidth-innerWidth,brokenImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src'))}));
    if(!state.heading||/nicht gefunden/i.test(state.heading)||state.overflow>2||state.brokenImages.length)throw Error(path+JSON.stringify(state));routes.push(state);
  }
  // Actual parser injection in intercepted QA HTML, with the unchanged server CSP.
  injection=true;
  await page.route(base+'/',async route=>{const r=await route.fetch();const html=await r.text();await route.fulfill({response:r,body:html.replace('</head>','<script>window.__guaUnsafe=1</'+'script><script src="data:application/javascript,window.__guaExternal%3D1"></'+'script></head>')});});
  await page.goto(base+'/',{waitUntil:'networkidle'}); await page.locator('main h1').waitFor();
  const csp=await page.evaluate(()=>({inlineBlocked:window.__guaUnsafe!==1,externalBlocked:window.__guaExternal!==1,allowedAppRuns:!!document.querySelector('main h1')}));
  if(!Object.values(csp).every(Boolean))throw Error('Injection '+JSON.stringify(csp));
  await page.unroute(base+'/'); injection=false;
  await page.goto(base+'/shop/product/the-steel',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Kantendetail',exact:true}).click();
  if(!await page.getByRole('button',{name:'Kantendetail vergrößern'}).isVisible())throw Error('Gallery');
  await page.getByRole('button',{name:/In den Warenkorb/i}).click();
  const dialog=page.getByRole('dialog',{name:'Warenkorb',exact:true});await dialog.waitFor();
  if(!(await dialog.innerText()).includes('8,98'))throw Error('One steel total');
  const mail=await dialog.getByRole('link',{name:'Bestellanfrage per E-Mail'}).getAttribute('href');
  if(!mail?.startsWith('mailto:info@guasha-shop.de?') || !decodeURIComponent(mail).includes('8,98'))throw Error('Inquiry link');
  await page.keyboard.press('Escape');if(await dialog.isVisible())throw Error('Escape close');
  await page.goto(base+'/shop/product/the-jade',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/In den Warenkorb/i}).click();await dialog.waitFor();
  if(!(await dialog.innerText()).includes('12,98')||!(await dialog.innerText()).includes('Kostenlos'))throw Error('Steel jade total/shipping');
  await page.keyboard.press('Escape');
  // Storage poisoning on this isolated profile only; no real orders/accounts.
  await page.evaluate(()=>localStorage.setItem('gua-shop-cart',JSON.stringify([{id:'evil',variantId:'evil',title:{bad:1},handle:'evil',price:-1,quantity:999999,image:'https://evil.invalid/track'}])));
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Warenkorb mit 0 Artikeln'}).click();await dialog.waitFor();
  if(!(await dialog.innerText()).includes('leer'))throw Error('Invalid persisted cart');await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});
  const mobile=[];
  for(const path of ['/','/shop','/shop/product/the-steel','/shop/product/the-jade']){await page.goto(base+path,{waitUntil:'networkidle'});const overflow=await page.evaluate(()=>document.body.scrollWidth-innerWidth);if(overflow>2)throw Error('Mobile '+path+': '+overflow);mobile.push({path,overflow});}
  if(errors.length)throw Error('Unexpected errors '+JSON.stringify(errors));
  await page.screenshot({path:'/Users/onur/Documents/Codex/2026-09-27/guastore/output/SECURITY_BROWSER_PROOF_20261006.png'});
  return {status:'pass',target:base,routes,csp,cart:'steel8.98, steel+jade12.98 free shipping, invalid storage, Escape PASS',gallery:'edge view PASS',mobile,unexpectedErrors:0,scope:'Isolated storage only; no mail sent, checkout/payment/provider mutations.'};
}
