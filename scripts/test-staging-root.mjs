import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const destination = fs.mkdtempSync('/private/tmp/guashop-test-destination.');
const parent = fs.mkdtempSync('/private/tmp/guashop-security-release.');
fs.rmdirSync(parent);
fs.symlinkSync(destination,parent);
try {
  const result = spawnSync(process.execPath,['scripts/stage-security-release.mjs',parent],{encoding:'utf8'});
  assert.notEqual(result.status,0); assert.equal(fs.readdirSync(destination).length,0);
  console.log('STAGING_ROOT_PASS symlink/nested target rejected, no outside writes');
} finally { fs.unlinkSync(parent); fs.rmdirSync(destination); }
const fixture = fs.mkdtempSync('/private/tmp/guashop-test-source.');
const stage = fs.mkdtempSync('/private/tmp/guashop-security-release.');
try {
  fs.mkdirSync(fixture+'/src/.env',{recursive:true});
  fs.writeFileSync(fixture+'/src/.env/private.js','fixture data, not a credential');
  const run=spawnSync(process.execPath,[process.cwd()+'/scripts/stage-security-release.mjs',stage],{cwd:fixture,encoding:'utf8'});
  assert.notEqual(run.status,0);assert(!fs.existsSync(stage+'/src/.env'));
  console.log('STAGING_ENV_DIRECTORY_PASS nested env excluded before copy');
} finally { fs.rmSync(fixture,{recursive:true});fs.rmSync(stage,{recursive:true}); }
