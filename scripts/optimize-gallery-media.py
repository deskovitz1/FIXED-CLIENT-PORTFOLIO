"""Generate lightweight gallery media; requires ffmpeg. Originals remain untouched.
Run after adding assets: npx tsx scripts/generate-project-stills.ts &&
python3 scripts/optimize-gallery-media.py && npx tsx scripts/generate-project-stills.ts
"""
import hashlib, json, subprocess
from pathlib import Path
from urllib.parse import unquote
from concurrent.futures import ThreadPoolExecutor

manifest = json.loads(Path('lib/projects/stills-manifest.json').read_text())
items = {item['src']: item for project in manifest.values() for group in ('preview', 'gallery', 'postcards') for item in project.get(group, [])}
output = Path('public/gallery-previews')
output.mkdir(exist_ok=True)

def convert(pair):
    src, item = pair
    original = Path('public' + unquote(src))
    if not original.is_file(): return src, {}
    # Content-addressed URLs prevent stale previews after replacing an original.
    digest = hashlib.sha256(original.read_bytes()).hexdigest()[:20]
    video = item.get('kind') == 'video'
    result = {}
    for field, width in [('mobileSrc', 480), ('previewSrc', 960 if video else 1280)]:
        filename = f'{digest}-{width}.{"mp4" if video else "jpg"}'
        target = output / filename
        if not target.exists():
            command = ['ffmpeg', '-v', 'error', '-i', str(original), '-vf', f'scale=min({width}\\,iw):-2', '-threads', '2']
            command += ['-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart'] if video else ['-frames:v', '1', '-q:v', '4']
            subprocess.run(command + ['-y', str(target)], check=True)
        result[field] = '/gallery-previews/' + filename
    return src, result

with ThreadPoolExecutor(max_workers=3) as pool:
    previews = dict(pool.map(convert, items.items()))
Path('lib/projects/media-previews.json').write_text(json.dumps(previews, indent=2) + '\n')
print(f'Optimized {len(previews)} gallery assets; originals preserved.')
