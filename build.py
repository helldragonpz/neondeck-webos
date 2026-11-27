#!/usr/bin/env python3
"""Build the overlay reproducibly from the included, licensed upstream frontend."""
from pathlib import Path
import hashlib,argparse,json
ROOT=Path(__file__).resolve().parent
BASE_SHA='7bfe584a43c4651e78408258eb3e45dc2074030982a3e1fce4edddb49dce4d34'
def build(output):
 source=(ROOT/'upstream/index.html').read_bytes()
 if hashlib.sha256(source).hexdigest()!=BASE_SHA:raise RuntimeError('Reviewed upstream frontend changed')
 text=source.decode();css=(ROOT/'frontend/custom-ui.css').read_text()+'\n'+(ROOT/'frontend/surfaces.css').read_text()+'\n'+(ROOT/'frontend/icon-styles.css').read_text()+'\n'+(ROOT/'frontend/holiday-icons.css').read_text();js='\n'.join((ROOT/'frontend'/n).read_text() for n in ['seasonal.js','icon-art.js','holiday-art.js','icon-styles.js','custom-ui.js','experience.js','palette.js','auto-theme.js','holiday-icons.js','surfaces.js'])
 text=text.replace('</head>','<style id="tanados-custom-ui">\n'+css+'\n</style></head>',1)
 js='window.NEONDECK_ICON_PACKS='+json.dumps(json.loads((ROOT/'frontend/icon-packs.json').read_text()),separators=(',',':')).replace('<','\\u003c')+';\n'+js
 text=text.replace('</body>','<script src="personal-key.js"></script><script>\n'+js+'\n</script></body>',1)
 output=Path(output);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(text)
 return hashlib.sha256(output.read_bytes()).hexdigest()
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--out',default=str(ROOT/'build/index.html'));a=p.parse_args();print('Built NeonDeck:',build(a.out))
