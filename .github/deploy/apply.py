#!/usr/bin/env python3
"""Apply deploy/requests/*.json: download a staged Flutter web zip from Drive and publish it."""
from __future__ import annotations

import hashlib, json, os, re, shutil, subprocess, sys, tempfile, time, urllib.error, urllib.request, zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path('.').resolve()
REQ_DIR = ROOT / 'deploy' / 'requests'
NEXT_DIR = ROOT / 'deploy' / 'next'
RESULT = ROOT / 'deploy' / 'last-result.json'
KEEP_TOP = {'.git', '.github', '.nojekyll', 'deploy'}
# Top-level names that belong to a Flutter web build (current or past). Stale ones get removed.
FLUTTER_TOP = {
    '.last_build_id', 'assets', 'canvaskit', 'favicon.png', 'flutter.js',
    'flutter_bootstrap.js', 'flutter_service_worker.js', 'icons', 'index.html',
    'main.dart.js', 'main.dart.mjs', 'main.dart.wasm', 'main.dart.js.map',
    'manifest.json', 'version.json', '404.html',
}
BASE_HREF_RE = re.compile(r'<base\s+href=["\']/collider-app/["\']\s*/?>', re.I)


def out(name: str, value: str) -> None:
    path = os.environ.get('GITHUB_OUTPUT')
    if path:
        with open(path, 'a', encoding='utf-8') as f:
            f.write(f'{name}={value}\n')


def download(url: str, dest: Path, expected_size: int, expected_sha: str) -> None:
    last_err = None
    for attempt in range(1, 6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'collider-app-deploy/1.0'})
            with urllib.request.urlopen(req, timeout=300) as r, open(dest, 'wb') as f:
                shutil.copyfileobj(r, f)
            size = dest.stat().st_size
            h = hashlib.sha256()
            with open(dest, 'rb') as f:
                for chunk in iter(lambda: f.read(1024 * 1024), b''):
                    h.update(chunk)
            sha = h.hexdigest()
            if expected_size and size != expected_size:
                raise RuntimeError(f'size {size} != expected {expected_size}')
            if expected_sha and sha.lower() != expected_sha.lower():
                raise RuntimeError(f'sha256 {sha} != expected {expected_sha}')
            return
        except Exception as e:
            last_err = e
            time.sleep(min(2 ** attempt, 30))
    raise RuntimeError(f'download failed after retries: {last_err}')


def drive_url(drive_id: str | None, url: str | None) -> str:
    if url:
        return url
    if not drive_id:
        raise RuntimeError('request needs drive_id or url')
    return f'https://drive.usercontent.google.com/download?id={drive_id}&export=download&confirm=t'


def load_requests() -> list[tuple[Path, dict]]:
    if not REQ_DIR.is_dir():
        return []
    items = []
    for p in sorted(REQ_DIR.glob('*.json')):
        items.append((p, json.loads(p.read_text(encoding='utf-8'))))
    return items


def clear_stale_flutter(new_top: set[str]) -> list[str]:
    removed = []
    for child in list(ROOT.iterdir()):
        name = child.name
        if name in KEEP_TOP:
            continue
        # remove if it is a known Flutter path not in the new build, or a prior Flutter path
        if name in FLUTTER_TOP and name not in new_top:
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
            removed.append(name)
    return removed


def install_build(extracted: Path) -> tuple[list[str], list[str]]:
    new_top = {p.name for p in extracted.iterdir()}
    # refuse if base href is wrong
    index = extracted / 'index.html'
    if not index.is_file():
        raise RuntimeError('zip missing index.html')
    html = index.read_text(encoding='utf-8', errors='replace')
    if not BASE_HREF_RE.search(html):
        raise RuntimeError('index.html base href is not /collider-app/')
    removed = clear_stale_flutter(new_top)
    written = []
    for src in extracted.iterdir():
        if src.name in KEEP_TOP:
            continue
        dest = ROOT / src.name
        if dest.exists():
            if dest.is_dir():
                shutil.rmtree(dest)
            else:
                dest.unlink()
        if src.is_dir():
            shutil.copytree(src, dest)
        else:
            shutil.copy2(src, dest)
        written.append(src.name)
    # 404.html = index.html
    shutil.copy2(ROOT / 'index.html', ROOT / '404.html')
    written.append('404.html')
    # ensure .nojekyll
    (ROOT / '.nojekyll').touch()
    return written, removed


def apply_one(req: dict) -> dict:
    rid = req.get('id') or 'unknown'
    label = req.get('label') or rid
    drive_id = req.get('drive_id')
    url = req.get('url')
    size = int(req.get('size') or 0)
    sha = (req.get('sha256') or '').strip().lower()
    if not sha or not size:
        raise RuntimeError('request needs size and sha256')
    with tempfile.TemporaryDirectory(prefix='collider-deploy-') as td:
        td = Path(td)
        zpath = td / 'build.zip'
        download(drive_url(drive_id, url), zpath, size, sha)
        extract = td / 'out'
        extract.mkdir()
        with zipfile.ZipFile(zpath) as zf:
            # refuse path traversal / nested folder wrappers
            names = zf.namelist()
            if not names:
                raise RuntimeError('zip is empty')
            for n in names:
                if n.startswith('/') or '..' in n.split('/'):
                    raise RuntimeError(f'unsafe zip path: {n}')
            # require files at zip root (index.html present at root)
            if 'index.html' not in names:
                raise RuntimeError('zip must contain index.html at the zip root')
            zf.extractall(extract)
            if 'index.html' not in {p.name for p in extract.iterdir()}:
                raise RuntimeError('zip contents are not at the zip root (missing index.html)')
        written, removed = install_build(extract)
    return {
        'id': rid,
        'status': 'applied',
        'label': label,
        'written': sorted(set(written)),
        'removed': sorted(set(removed)),
        'sha256': sha,
        'size': size,
    }


def main() -> int:
    reqs = load_requests()
    results = []
    changed = False
    rejected = False
    messages = []
    for path, req in reqs:
        try:
            r = apply_one(req)
            results.append(r)
            changed = True
            messages.append(f"{r['id']}: {r.get('label')}")
            # remove request (+ optional sidecar)
            path.unlink(missing_ok=True)
            sidecar = NEXT_DIR / f"{req.get('id')}.json"
            if sidecar.is_file():
                sidecar.unlink()
            # also git-rm if tracked
            subprocess.run(['git', 'rm', '-f', '--ignore-unmatch', str(path.relative_to(ROOT))],
                           check=False, capture_output=True)
        except Exception as e:
            rejected = True
            results.append({'id': req.get('id'), 'status': 'rejected', 'error': str(e)})
            # leave the request file so a human can inspect; still record result
    RESULT.parent.mkdir(parents=True, exist_ok=True)
    RESULT.write_text(json.dumps({
        'at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'run': os.environ.get('GITHUB_RUN_ID'),
        'results': results,
    }, indent=1) + '\n', encoding='utf-8')
    if changed:
        msg = 'Collider app deploy: ' + '; '.join(messages)
        out('changed', 'true')
        out('message', msg)
    else:
        out('changed', 'false')
    out('rejected', 'true' if rejected else 'false')
    print(json.dumps(results, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
