#!/usr/bin/env python3
"""Build the TV setup IPK, Homebrew repository files and USB bundle."""
from pathlib import Path
import argparse,gzip,hashlib,io,json,sys,tarfile,urllib.request,zipfile
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from build import ROOT,build
VERSION='0.4.0'
BASELINE_SHA='0202b7fda9ec257e5131f8a9d888f590127f82474c789ce0a705ba2a3cd787e5'
URL='https://github.com/helldragonpz/neondeck-webos/releases/download/v'+VERSION+'/'
def sha(data):return hashlib.sha256(data).hexdigest()
def tar_bytes(files,compressed=False):
 b=io.BytesIO()
 with tarfile.open(fileobj=b,mode='w',format=tarfile.GNU_FORMAT) as t:
  for name,data in sorted(files.items()):
   info=tarfile.TarInfo(name);info.size=len(data);info.mode=0o644;info.mtime=0;t.addfile(info,io.BytesIO(data))
 return gzip.compress(b.getvalue(),mtime=0) if compressed else b.getvalue()
def ipk(files,info):
 app=info['id'];data={'./usr/palm/applications/'+app+'/'+k:v for k,v in files.items()};data['./usr/palm/packages/'+app+'/packageinfo.json']=json.dumps({'id':app,'version':VERSION,'app':app}).encode()
 control=f"Package: {app}\nVersion: {VERSION}\nSection: misc\nPriority: optional\nArchitecture: all\nInstalled-Size: {sum(map(len,data.values()))//1024+1}\nMaintainer: NeonDeck contributors\nDescription: TV-only NeonDeck setup\nwebOS-Package-Format-Version: 2\nwebOS-Packager-Version: 2.0\n".encode()
 result=b'!<arch>\n'
 for name,blob in [('debian-binary',b'2.0\n'),('control.tar.gz',tar_bytes({'./control':control},True)),('data.tar.gz',tar_bytes(data,True))]:
  header=f'{name+"/":<16}{0:<12}{0:<6}{0:<6}{"100644":<8}{len(blob):<10}`\n'.encode();assert len(header)==60;result+=header+blob+(b'\n' if len(blob)%2 else b'')
 return result
def main():
 p=argparse.ArgumentParser();p.add_argument('--baseline-ipk');p.add_argument('--out',default=str(ROOT/'dist'));a=p.parse_args();out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
 if a.baseline_ipk:baseline=Path(a.baseline_ipk).read_bytes()
 else:
  with urllib.request.urlopen('https://github.com/lasharor/cleanyourtv-WebOS/releases/download/v1.6.32/com.cleanyourtv.manager_1.6.32_all.ipk',timeout=45) as r:baseline=r.read(8*1048576)
 if sha(baseline)!=BASELINE_SHA:raise RuntimeError('Reviewed baseline package checksum failed')
 build(ROOT/'build/index.html');files={'index.html':(ROOT/'build/index.html').read_bytes(),'theme/theme.json':(ROOT/'theme/theme.json').read_bytes()}
 for folder in ['service','installer']:
  for f in (ROOT/folder).iterdir():
   if f.is_file():files[folder+'/'+f.name]=f.read_bytes()
 files['manifest.json']=json.dumps({k:sha(v) for k,v in files.items()},sort_keys=True).encode();payload=tar_bytes(files)
 release=json.dumps({'version':VERSION,'payloadSha256':sha(payload)},sort_keys=True).encode()
 app={f.name:f.read_bytes() for f in (ROOT/'setup').iterdir() if f.is_file()};app.update({'payload.tar':payload,'release.json':release,'preflight.js':(ROOT/'installer/preflight.js').read_bytes(),'management_server.js':(ROOT/'service/management_server.js').read_bytes(),'baseline.ipk':baseline,'BASELINE-LICENSE':(ROOT/'upstream/LICENSE').read_bytes(),'LICENSE':(ROOT/'LICENSE').read_bytes()})
 info=json.loads(app['appinfo.json']);filename=info['id']+'_'+VERSION+'_all.ipk';package=ipk(app,info);(out/filename).write_bytes(package)
 manifest={'id':info['id'],'version':VERSION,'type':'web','title':'NeonDeck Setup','appDescription':'Install or update NeonDeck with the TV remote. Requires rooted Homebrew Channel, a compatible aarch64 TV and Node 16.20+. Includes the reviewed baseline manager.','iconUri':URL+'icon.png','sourceUrl':'https://github.com/helldragonpz/neondeck-webos','rootRequired':True,'ipkUrl':URL+filename,'ipkHash':{'sha256':sha(package)},'ipkSize':len(package)}
 (out/'org.neondeck.setup.manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(out/'apps.json').write_text(json.dumps({'name':'NeonDeck for webOS','paging':{'page':1,'count':1,'maxPage':1,'itemsTotal':1},'packages':[{'id':info['id'],'title':'NeonDeck Setup','category':'system','pool':'main','shortDescription':'Install and update NeonDeck with the TV remote','iconUri':URL+'icon.png','manifestUrl':URL+'org.neondeck.setup.manifest.json','manifest':manifest}]},indent=2)+'\n');(out/'icon.png').write_bytes(app['icon.png'])
 readme=(ROOT/'docs/TV-SETUP.md').read_text().replace('NeonDeck-0.2.0-USB.zip','NeonDeck-'+VERSION+'-USB.zip');(out/'TV-SETUP.md').write_text(readme)
 with zipfile.ZipFile(out/('NeonDeck-'+VERSION+'-USB.zip'),'w',zipfile.ZIP_DEFLATED) as z:
  for name,data in [('NeonDeck/payload.tar',payload),('NeonDeck/release.json',release),('NeonDeck/README.md',b'# NeonDeck USB bundle\n\nOpen docs/TV-SETUP.md for the illustrated guide. The NeonDeck Setup app must already be installed on the rooted TV.\n'),('NeonDeck/'+filename,package),('NeonDeck/LICENSE',app['LICENSE']),('NeonDeck/THIRD-PARTY.md',(ROOT/'THIRD-PARTY.md').read_bytes())]:z.writestr(name,data)
  for f in (ROOT/'docs').rglob('*'):
   if f.is_file():z.writestr('NeonDeck/docs/'+str(f.relative_to(ROOT/'docs')),f.read_bytes())
 (out/'SHA256SUMS').write_text(''.join(sha(f.read_bytes())+'  '+f.name+'\n' for f in sorted(out.iterdir()) if f.is_file() and f.name!='SHA256SUMS'))
 print('Built release',VERSION,'—',len(package),'byte setup package; source-only UI payload',len(payload),'bytes')
if __name__=='__main__':main()
