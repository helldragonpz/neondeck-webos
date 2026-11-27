#!/usr/bin/env python3
"""Install the overlay on an already rooted, compatible TV. No rooting or firmware flashing."""
from pathlib import Path
import argparse,hashlib,io,json,re,subprocess,tarfile,tempfile,urllib.request
from build import ROOT,BASE_SHA,build
FFMPEG_URL='https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz'
FFMPEG_SHA='6bb182d0d75d23028db82e9e4f723ca69b853d055698486e6984ddb2c06fb8ce'
def validate(profile):
    if profile.get('busy'):raise RuntimeError('Wait for the current wallpaper download or app operation to finish')
    if profile.get('uid')!=0:raise RuntimeError('Root SSH is required')
    version=tuple(int(x) for x in profile['node'].split('.')[:2])
    if version<(16,20):raise RuntimeError('This release requires Node 16.20 or later')
    if profile.get('kernelArch')!='aarch64':raise RuntimeError('This release requires an aarch64 kernel')
    if not profile.get('frontend') or profile.get('frontend')!=BASE_SHA and profile.get('frontend')!=profile.get('approved'):raise RuntimeError('Unknown launcher frontend; this release requires reviewed frontend 1.5.25')
    if not profile.get('home',{}).get('ours'):raise RuntimeError('Enable CleanYourTV as Home before installing')
    if profile.get('freeBytes',0)<160*1048576:raise RuntimeError('Free at least 160 MB in TV system storage first')
def ssh_args(args):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9.:-]{0,252}',args.host):raise RuntimeError('Invalid TV hostname or address')
    key=Path(args.key).expanduser().resolve()
    if not key.is_file():raise RuntimeError('SSH key does not exist')
    options=['ssh','-i',str(key),'-o','IdentitiesOnly=yes','-o','ConnectTimeout=8','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','LogLevel=ERROR']
    if args.known_hosts:
        known=Path(args.known_hosts).expanduser().resolve()
        if not known.is_file():raise RuntimeError('Known-hosts file does not exist')
        options+=['-o','UserKnownHostsFile='+str(known)]
    return options+['root@'+args.host]
def remote(ssh,script):
    p=subprocess.run(ssh+['sh -s'],input=script,text=True,capture_output=True,timeout=90)
    if p.returncode:raise RuntimeError(p.stderr.strip() or p.stdout.strip() or 'TV command failed')
    return p.stdout
PREFLIGHT="node <<'NEONDECK_PREFLIGHT'\n"+(ROOT/'installer/preflight.js').read_text()+"\nNEONDECK_PREFLIGHT\n"
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--host',required=True);p.add_argument('--key',required=True);p.add_argument('--known-hosts');p.add_argument('--dry-run',action='store_true');p.add_argument('--max-quality',choices=['720','1080','2160'],default='1080');p.add_argument('--no-reload',action='store_true');a=p.parse_args()
    ssh=ssh_args(a);profile=json.loads(remote(ssh,PREFLIGHT));validate(profile);profile['maxQuality']=int(a.max_quality)
    print('Compatible baseline:',profile['model'],profile['firmware'],'Node',profile['node'])
    if a.dry_run:print('Read-only preflight passed. No files changed.');return
    with tempfile.TemporaryDirectory(prefix='neondeck-') as tmp:
        folder=Path(tmp);build(folder/'index.html');(folder/'profile.json').write_text(json.dumps(profile))
        paths={'index.html':folder/'index.html','profile.json':folder/'profile.json','theme/theme.json':ROOT/'theme/theme.json'}
        for f in (ROOT/'service').glob('*.js'):paths['service/'+f.name]=f
        for f in (ROOT/'installer').iterdir():
            if f.is_file():paths['installer/'+f.name]=f
        if profile.get('ffmpeg')!=FFMPEG_SHA:
            print('Downloading and verifying the standalone video converter...')
            with urllib.request.urlopen(FFMPEG_URL,timeout=45) as response:archive=response.read(25*1048576+1)
            if len(archive)>25*1048576:raise RuntimeError('Converter archive exceeds size limit')
            with tarfile.open(fileobj=io.BytesIO(archive)) as t:
                for name in ['ffmpeg','GPLv3.txt','readme.txt']:
                    matches=[m for m in t.getmembers() if m.isfile() and m.name.endswith('/'+name)]
                    if len(matches)!=1:raise RuntimeError('Unexpected converter archive')
                    data=t.extractfile(matches[0]).read()
                    if name=='ffmpeg' and hashlib.sha256(data).hexdigest()!=FFMPEG_SHA:raise RuntimeError('Converter checksum failed')
                    f=folder/name;f.write_bytes(data);paths['bin/'+name]=f
        manifest={name:hashlib.sha256(f.read_bytes()).hexdigest() for name,f in paths.items()};(folder/'manifest.json').write_text(json.dumps(manifest));paths['manifest.json']=folder/'manifest.json'
        bundle=folder/'bundle.tar'
        with tarfile.open(bundle,'w') as t:
            for name,f in paths.items():t.add(f,arcname=name)
        remote(ssh,'mkdir -p /var/lib/tanados-tv/neondeck-staging\n')
        scp=['scp','-O']+ssh[1:-1]+[str(bundle),ssh[-1]+':/var/lib/tanados-tv/neondeck-staging/bundle.tar'];subprocess.run(scp,check=True)
        script="set -eu\ntar -xf /var/lib/tanados-tv/neondeck-staging/bundle.tar -C /var/lib/tanados-tv/neondeck-staging\nnode /var/lib/tanados-tv/neondeck-staging/installer/apply.js\n"
        print(remote(ssh,script).strip())
        if not a.no_reload:
            refresh=r'''set -eu
sh /media/developer/cleanyourtv/stage-home.sh
fg=$(luna-send -n 1 -w 5000 luna://com.webos.applicationManager/getForegroundAppInfo '{}' </dev/null)
case "$fg" in
 *'"appId":"com.webos.app.home"'*)
  luna-send -n 1 -w 5000 luna://com.palm.webappmanager/killApp '{"appId":"com.webos.app.home"}' </dev/null >/dev/null
  sleep 2
  luna-send -n 1 -w 5000 luna://com.webos.applicationManager/launch '{"id":"com.webos.app.home"}' </dev/null >/dev/null;;
 *) echo 'Current app preserved; open Home when ready.';;
esac
'''
            print(remote(ssh,refresh).strip())
        remote(ssh,'rm -rf /var/lib/tanados-tv/neondeck-staging\n')
    print('Installed. Recovery: node /var/lib/tanados-tv/neondeck-uninstall.js')
if __name__=='__main__':
    try:main()
    except (RuntimeError,subprocess.CalledProcessError) as e:raise SystemExit(str(e))
