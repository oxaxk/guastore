import { spawnSync } from 'node:child_process';

// Vercel adds public platform telemetry/metadata VITE_ variables automatically.
// This static inquiry site does not consume them; keep them out of its bundle.
const env = { ...process.env };
for (const name of Object.keys(env)) if (name.startsWith('VITE_VERCEL_')) delete env[name];
for (const args of [['scripts/secret-gate.mjs'], ['node_modules/vite/bin/vite.js', 'build']]) {
  const r = spawnSync(process.execPath, args, { env, stdio:'inherit', timeout:120000 });
  if (r.status !== 0 || r.error) process.exit(r.status || 1);
}
