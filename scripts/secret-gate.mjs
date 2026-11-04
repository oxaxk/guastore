import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Only strong credential signatures; no secret values or raw matching text logged.
export function secretSignatures(text) {
  return [
    /\b(?:sk|rk)_(?:live|test)_[a-zA-Z0-9]{12,}/,
    /\b(?:shpat|shpca|shppa)_[a-zA-Z0-9]{16,}/,
    /\bgh[pousr]_[a-zA-Z0-9]{30,}/,
    /\bgithub_pat_[a-zA-Z0-9_]{30,}/,
    /\bxox[baprs]-[a-zA-Z0-9-]{20,}/,
    /\bnpm_[a-zA-Z0-9]{30,}/,
    /\b(?:vcp|vca)_[a-zA-Z0-9_]{24,}/,
    /mongodb(?:\+srv)?:\/\/[^\s"'<>]+:[^\s"'<>]+@/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bAKIA[A-Z0-9]{16}\b/,
  ].some(pattern => pattern.test(text));
}

export function scanSources(root) {
  const matches = []; let checked = 0;
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (dir === root && (['node_modules','.git','.vercel','dist','output','tmp','.playwright-cli','.codex-finalizer','__pycache__'].includes(entry.name) || entry.name.startsWith('.env'))) continue;
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw Error('Source symlinks are not allowed');
      if (entry.name.startsWith('.env')) throw Error('Nested environment source denied');
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.isFile() || fs.statSync(full).size > 32 * 1024 * 1024) throw Error('Unscannable source file denied: ' + path.relative(root,full));
      checked++;
      // Latin-1 preserves ASCII credential markers in binary metadata and maps.
      if (secretSignatures(fs.readFileSync(full).toString('latin1'))) matches.push(path.relative(root,full));
    }
  };
  walk(root); return { checked, matches };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const report = scanSources(process.cwd());
  for (const name of Object.keys(process.env)) {
    const publicMetadata = /^VITE_VERCEL_(?:ENV|TARGET_ENV|URL|BRANCH_URL|PROJECT_PRODUCTION_URL|GIT_(?:PROVIDER|COMMIT_(?:SHA|REF|MESSAGE|AUTHOR_LOGIN|AUTHOR_NAME)|REPO_(?:SLUG|OWNER|ID)))$/.test(name);
    if (name.startsWith('VITE_') && process.env[name] && ((!publicMetadata && name !== 'VITE_SHOPIFY_DOMAIN') || secretSignatures(process.env[name]))) throw Error('Unapproved public configuration variable: ' + name);
  }
  if (report.matches.length) throw Error('Credential signatures in source paths: ' + report.matches.join(', '));
  console.log(JSON.stringify({ status:'pass', gate:'source-secret-signatures', checked:report.checked, matches:0 }));
}
