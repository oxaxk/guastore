import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { secretSignatures } from './secret-gate.mjs';
const r=spawnSync('git',['log','-p','--all','--','.',':!package-lock.json',':!dist',':!node_modules'],{encoding:'utf8',maxBuffer:32*1024*1024});
assert.equal(r.status,0,'Bounded history scan must succeed');
assert(!secretSignatures(r.stdout),'Strong credential signature in Git history: investigate privately before release');
console.log('SECRET_HISTORY_PASS all local commits, bounded diff scan, strong credential signatures');
