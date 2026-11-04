import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { secretSignatures } from './secret-gate.mjs';
const base=new URL(process.argv[2]);
assert(base.origin==='https://guasha-shop.de'||/^https:\/\/guashop-[a-z0-9]+-oxaxks-projects\.vercel\.app$/.test(base.origin));
const get=path=>{
  const u=new URL(path,base);assert.equal(u.origin,base.origin);
  const cli=process.env.QA_VERCEL_CLI;
  const args=cli?[cli,'curl',u.pathname,'--deployment',base.origin,'--','--silent','--include','--max-time','20']:['--silent','--show-error','--include','--max-time','20',u.href];
  const r=spawnSync(cli?process.execPath:'curl',args,{encoding:'utf8',timeout:30000,maxBuffer:12*1024*1024,env:{...process.env,CI:'1',NO_UPDATE_NOTIFIER:'1'}});
  assert.equal(r.status,0,'Request '+u.pathname);
  const i=r.stdout.indexOf('\r\n\r\n');assert(i>0);
  const h=r.stdout.slice(0,i);return {status:Number(h.match(/^HTTP\/\S+ (\d+)/)[1]),headers:h.toLowerCase(),body:r.stdout.slice(i+4)};
};
const routes=['/','/shop','/shop/product/the-steel','/shop/product/the-jade','/how-to','/about','/contact','/legal/impressum','/legal/datenschutz','/legal/agb','/legal/widerruf','/legal/versand'];
const results=[];let assets=[];
for(const path of routes){const r=get(path);assert.equal(r.status,200,path);assert(r.headers.includes("script-src 'self'"));assert(!r.headers.includes("script-src 'self' 'unsafe-inline'"));assert(!r.headers.includes('unsafe-eval'));assert(r.headers.includes('x-content-type-options: nosniff'));if(base.hostname==='guasha-shop.de')assert(!r.headers.includes('x-robots-tag: noindex'));assert(!r.body.includes('Bald wieder online'));
 const scripts=[...r.body.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];assert(scripts.length>0);for(const m of scripts){assert(m[1].includes('src="/assets/'));assert.equal(m[2].trim(),'');}
 if(path==='/')assets=[...new Set([...r.body.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)].map(m=>m[1]))];results.push({path,status:200,cspEnforced:true});}
for(const path of assets){const r=get(path);assert.equal(r.status,200,path);assert(!secretSignatures(r.body),'Public asset credential signature');results.push({path,status:200,noCredentialSignatures:true});}
const report={status:'pass',target:base.origin,checks:results.length,results,scope:'Public GET and compiled assets only; no mail, payments or provider mutations.'};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2));console.log(JSON.stringify({status:'pass',target:base.origin,checks:results.length}));
