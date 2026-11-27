#!/usr/bin/env python3
"""Import a small, pinned MIT icon subset; the TV never contacts an icon CDN."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, re, urllib.request, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'phosphor': ('phosphor-icons/core', '2b75f3ad12b420c9504ef05df8d2564a28f8500e'),
    'pixel': ('halfmage/pixelarticons', 'c9ecc2da61afde85dbe539025e3d931c6152ad75'),
}
PHOSPHOR = {'ps4':'game-controller', 'ps5':'game-controller', 'tvbox':'television-simple', 'prime':'amazon-logo', 'disney':'castle-turret', 'youtube':'youtube-logo', 'jellyfin':'triangle', 'shop':'storefront', 'app':'squares-four'}
PIXEL = {'ps4':'gamepad', 'ps5':'gamepad', 'tvbox':'tv', 'prime':'play', 'disney':'castle', 'youtube':'youtube', 'shop':'store', 'app':'grid-2x2-2'}

def fetch(job):
    source, filename = job
    repo, revision = SOURCES[source]
    url = f'https://raw.githubusercontent.com/{repo}/{revision}/{filename}'
    with urllib.request.urlopen(url, timeout=25) as r:
        data = r.read(200000)
    text = data.decode('utf-8')
    if filename.endswith('.svg'):
        node = ET.fromstring(text)
        for element in node.iter():
            if element.tag.split('}')[-1] not in {'svg','path','g','rect','circle','ellipse','polygon','polyline','line'}:
                raise ValueError('Unexpected SVG element')
            for attr, value in element.attrib.items():
                if attr.lower().startswith('on') or attr in {'style','href','src'} or 'url(' in value.lower():
                    raise ValueError('Unexpected SVG attribute')
        # Separate compact SVG path numbers so geometry cannot resemble IP literals.
        def space_path(match):
            original = match.group(1)
            tokens = re.findall(r'[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', original)
            if ''.join(tokens) != re.sub(r'[\s,]', '', original):
                raise ValueError('Unexpected SVG path syntax')
            return 'd="'+' '.join(tokens)+'"'
        text = re.sub(r'\bd="([^"]*)"', space_path, text.strip())
    return job, text, hashlib.sha256(data).hexdigest()

def main():
    jobs = {('phosphor', 'LICENSE'), ('pixel', 'LICENSE')}
    for weight in ('fill','duotone'):
        jobs.update(('phosphor', f'assets/{weight}/{name}-{weight}.svg') for name in PHOSPHOR.values())
    jobs.update(('pixel', f'svg/{name}.svg') for name in PIXEL.values())
    with ThreadPoolExecutor(max_workers=6) as pool:
        fetched = list(pool.map(fetch, sorted(jobs)))
    assets = {job:text for job,text,_ in fetched}
    output = {'sources':{k:{'repository':repo,'commit':rev} for k,(repo,rev) in SOURCES.items()}, 'licenses':{k:assets[k,'LICENSE'] for k in SOURCES}, 'sha256':{source+'/'+filename:sha for (source,filename),_,sha in fetched}, 'icons':{}}
    for weight in ('fill','duotone'):
        output['icons'][weight] = {key:assets['phosphor',f'assets/{weight}/{name}-{weight}.svg'] for key,name in PHOSPHOR.items()}
    output['icons']['pixel'] = {key:assets['pixel',f'svg/{name}.svg'] for key,name in PIXEL.items()}
    (ROOT/'frontend/icon-packs.json').write_text(json.dumps(output, sort_keys=True, indent=2)+'\n')
    print('Vendored', len(jobs)-2, 'pinned SVG files and both MIT notices')

if __name__ == '__main__':
    main()
