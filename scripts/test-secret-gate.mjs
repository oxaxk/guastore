import assert from 'node:assert/strict';
import { secretSignatures, scanSources } from './secret-gate.mjs';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
for (const text of ['sk_'+'live_'+'a'.repeat(24), 'rk_'+'test_'+'a'.repeat(24), 'shpat_'+'a'.repeat(24), 'mongodb+srv'+ '://user:password@host/db', '-----BEGIN '+'PRIVATE KEY-----']) assert(secretSignatures(text));
assert(!secretSignatures('ordinary public content info@example.de'));
for (const prefix of ['github_'+'pat_', 'xox'+'b-', 'np'+'m_', 'vc'+'p_']) assert(secretSignatures(prefix + 'a'.repeat(40)));
const fixture = fs.mkdtempSync(path.join(os.tmpdir(),'gua-secret-gate-'));
try {
  fs.mkdirSync(path.join(fixture,'public'));
  for (const name of ['asset.bin','asset.map','large.jpg']) {
    fs.writeFileSync(path.join(fixture,'public',name),Buffer.concat([Buffer.alloc(name.startsWith('large') ? 2100000 : 8),Buffer.from('sk_'+'live_'+'a'.repeat(24))]));
  }
  assert.equal(scanSources(fixture).matches.length,3);
  fs.writeFileSync(path.join(fixture,'public','safe.webp'),Buffer.from([0,255,128,3]));
  assert.equal(scanSources(fixture).checked,4);
  fs.writeFileSync(path.join(fixture,'public','too-large.bin'),Buffer.alloc(32*1024*1024+1));
  assert.throws(()=>scanSources(fixture),/Unscannable/);
} finally { fs.rmSync(fixture,{recursive:true,force:true}); }
assert.equal(scanSources(process.cwd()).matches.length,0);
const run = spawnSync(process.execPath,['scripts/secret-gate.mjs'],{env:{PATH:process.env.PATH,VITE_PRIVATE_SECRET:'synthetic-not-a-real-secret'},encoding:'utf8'});
assert.notEqual(run.status,0); assert(!run.stderr.includes('synthetic-not-a-real-secret'));
const metadata = spawnSync(process.execPath,['scripts/secret-gate.mjs'],{env:{PATH:process.env.PATH,VITE_VERCEL_ENV:'production',VITE_VERCEL_URL:'guashop.vercel.app'},encoding:'utf8'});
assert.equal(metadata.status,0);
const fakeAdmin = spawnSync(process.execPath,['scripts/secret-gate.mjs'],{env:{PATH:process.env.PATH,VITE_SHOPIFY_STOREFRONT_TOKEN:'shpat_'+'a'.repeat(24)},encoding:'utf8'});
assert.notEqual(fakeAdmin.status,0); assert(!fakeAdmin.stderr.includes('a'.repeat(24)));
const unknownToken = spawnSync(process.execPath,['scripts/secret-gate.mjs'],{env:{PATH:process.env.PATH,VITE_SHOPIFY_STOREFRONT_TOKEN:'unknown-synthetic-format'},encoding:'utf8'});
assert.notEqual(unknownToken.status,0); assert(!unknownToken.stderr.includes('unknown-synthetic-format'));
console.log('SECRET_GATE_PASS signatures, clean-source, private-VITE-denial, no-secret-output');
