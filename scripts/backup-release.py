"""Make a secret-free allowlisted source/build archive and verify a fresh restore."""
from pathlib import Path
import hashlib, json, sys, zipfile

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]).resolve()
restore = Path(sys.argv[2]).resolve()
if destination.exists() or restore.exists():
    raise SystemExit('Destination and restore directory must not already exist')
names = ['src', 'public', 'api', 'server', 'scripts', 'dist']
files = [p for name in names for p in (root / name).rglob('*') if p.is_file()]
for name in ['package.json','package-lock.json','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vercel.json','index.html','postcss.config.js','tailwind.config.ts','eslint.config.js','components.json']:
    p = root / name
    if p.is_file(): files.append(p)
def allowed(p):
    parts = p.relative_to(root).parts
    return not any(x in {'.git','node_modules','__pycache__','.vercel'} or x.startswith('.env') for x in parts) and p.suffix.lower() not in {'.pem','.key','.p12','.pfx','.sqlite','.db'}
files = sorted(p for p in files if allowed(p))
digest = lambda data: hashlib.sha256(data).hexdigest()
manifest = {p.relative_to(root).as_posix():digest(p.read_bytes()) for p in files}
destination.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(destination,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in files: archive.write(p,p.relative_to(root).as_posix())
    archive.writestr('RELEASE-MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
restore.mkdir(parents=True)
with zipfile.ZipFile(destination) as archive:
    for info in archive.infolist():
        target=(restore/info.filename).resolve()
        if not target.is_relative_to(restore): raise ValueError('unsafe archive path')
    archive.extractall(restore)
    restored=json.loads((restore/'RELEASE-MANIFEST.json').read_text(encoding='utf-8'))
    bad=[name for name,sha in restored.items() if digest((restore/name).read_bytes()) != sha]
    if bad or restored != manifest: raise SystemExit('Restore verification failed')
print(json.dumps({'archive':str(destination),'archive_sha256':digest(destination.read_bytes()),'files':len(files),'restore':str(restore),'restored_hashes_match':True,'manifest_sha256':digest((restore/'RELEASE-MANIFEST.json').read_bytes())}))
