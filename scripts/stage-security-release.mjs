import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { scanSources, secretSignatures } from './secret-gate.mjs';

const root = process.cwd();
const stage = path.resolve(process.argv[2] || '');
assert(path.dirname(stage) === '/private/tmp' && /^guashop-security-release\.[A-Za-z0-9]+$/.test(path.basename(stage)), 'Explicit owned staging directory required');
assert(!fs.lstatSync(stage).isSymbolicLink() && fs.lstatSync(stage).isDirectory() && fs.realpathSync(stage) === stage, 'Canonical non-symlink staging root required');
assert(fs.lstatSync(stage).uid === process.getuid() && (fs.lstatSync(stage).mode & 0o077) === 0, 'Private owner-only staging directory required');
assert.equal(scanSources(root).matches.length, 0);
const copied = [];
function guardTarget(relative) {
  let cursor = stage;
  for (const part of relative.split(path.sep)) {
    cursor = path.join(cursor,part);
    if (fs.existsSync(cursor)) assert(!fs.lstatSync(cursor).isSymbolicLink(), 'No target path component symlinks');
  }
}
const copy = (relative) => {
  const source = path.join(root, relative), target = path.join(stage, relative);
  assert(!path.basename(source).startsWith('.env'), 'No environment files or directories uploaded');
  const stat = fs.lstatSync(source); assert(!stat.isSymbolicLink(), 'No source symlinks');
  guardTarget(relative);
  if (stat.isDirectory()) { fs.mkdirSync(target,{recursive:true}); for (const name of fs.readdirSync(source)) copy(path.join(relative,name)); return; }
  assert(stat.isFile() && stat.size <= 32 * 1024 * 1024, 'Only bounded regular files uploaded');
  const data = fs.readFileSync(source);
  assert(!secretSignatures(data.toString('latin1')), 'Credential signature denied in staged file');
  fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,data);
  copied.push({file:relative,sha256:crypto.createHash('sha256').update(data).digest('hex')});
};
for (const directory of ['src','public']) copy(directory);
for (const name of fs.readdirSync(root)) if (/^(package(?:-lock)?\.json|index\.html|vite\.config\.ts|tsconfig(?:\.[a-z]+)?\.json|(?:postcss|tailwind|eslint)\.config\.[a-z]+|vercel\.json|\.vercelignore|components\.json)$/.test(name)) copy(name);
guardTarget('scripts'); fs.mkdirSync(path.join(stage,'scripts'),{recursive:true});
for(const name of ['secret-gate.mjs','build-release.mjs']) copy(path.join('scripts',name));
guardTarget('.vercel/project.json'); fs.mkdirSync(path.join(stage,'.vercel'),{recursive:true});
fs.writeFileSync(path.join(stage,'.vercel/project.json'),JSON.stringify({projectId:'prj_OPvqYcvhBAqqvL1eYdph6VZB7NLB',orgId:'team_2MeChlqiWfpvPy9qLs79SNag',projectName:'guashop'}));
fs.mkdirSync(path.join(root,'output/security'),{recursive:true});
fs.writeFileSync(path.join(root,'output/security/RELEASE_SOURCE_MANIFEST_20261006.json'),JSON.stringify({stage,files:copied.length,copied},null,2));
console.log(JSON.stringify({status:'pass',stage,files:copied.length,privateFilesExcluded:true,project:'guashop'}));
