"""Create responsive copies of current film posters; URLs are the lookup keys.
Run manually after changing poster artwork. Requires ffmpeg; originals stay intact.
"""
import hashlib, json, subprocess, tempfile, urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

videos=json.load(urllib.request.urlopen('https://circusseventeen.com/api/videos'))['videos']
output=Path('public/gallery-previews')
output.mkdir(exist_ok=True)
def convert(video):
    url=video.get('thumbnail_url')
    if not url: return None
    data=urllib.request.urlopen(url).read()
    digest=hashlib.sha256(data).hexdigest()[:20]
    variants={}
    with tempfile.NamedTemporaryFile() as original:
        original.write(data); original.flush()
        for name,width in [('mobileSrc',800),('previewSrc',1600)]:
            target=output/f'{digest}-{width}.jpg'
            if not target.exists():
                subprocess.run(['ffmpeg','-v','error','-i',original.name,'-vf',f'scale=min({width}\\,iw):-2','-threads','2','-frames:v','1','-q:v','4','-y',str(target)],check=True)
            variants[name]='/gallery-previews/'+target.name
    return url,variants
with ThreadPoolExecutor(max_workers=3) as pool:
    mapping=dict(item for item in pool.map(convert,videos) if item)
Path('lib/projects/poster-previews.json').write_text(json.dumps(mapping,indent=2)+'\n')
print(f'Optimized {len(mapping)} film posters')
