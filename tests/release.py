"""Package format checks using synthetic files, without network or a TV."""
from pathlib import Path
import sys,tarfile,io,json,unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
import build_release as release
class Package(unittest.TestCase):
 def test_ar_and_app_contents(self):
  info={'id':'org.neondeck.setup','title':'Setup'};blob=release.ipk({'appinfo.json':json.dumps(info).encode(),'index.html':b'<html>example</html>'},info);self.assertEqual(blob[:8],b'!<arch>\n');pos=8;entries={}
  while pos<len(blob):
   header=blob[pos:pos+60];size=int(header[48:58]);entries[header[:16].decode().strip().rstrip('/')]=blob[pos+60:pos+60+size];pos+=60+size+(size%2)
  self.assertEqual(entries['debian-binary'],b'2.0\n')
  with tarfile.open(fileobj=io.BytesIO(entries['data.tar.gz'])) as t:self.assertEqual(t.extractfile('./usr/palm/applications/org.neondeck.setup/index.html').read(),b'<html>example</html>')
 def test_payload_reproducible(self):self.assertEqual(release.tar_bytes({'a':b'one','b':b'two'}),release.tar_bytes({'b':b'two','a':b'one'}))
if __name__=='__main__':unittest.main()
