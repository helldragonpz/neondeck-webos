"""Read-only installer policy checks, no SSH connection."""
import importlib.util,tempfile,unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import install,build
class Policy(unittest.TestCase):
 def profile(self):return dict(uid=0,node='16.20.2',kernelArch='aarch64',frontend=build.BASE_SHA,home={'ours':True},freeBytes=200*1048576)
 def test_supported(self):install.validate(self.profile())
 def test_reject_incompatible_and_busy(self):
  for key,value in [('uid',1),('node','8.12.0'),('kernelArch','armv7l'),('frontend','unknown'),('home',{}),('freeBytes',10),('busy',True)]:
   with self.subTest(key=key),self.assertRaises(RuntimeError):install.validate({**self.profile(),key:value})
 def test_reproducible_frontend(self):
  with tempfile.TemporaryDirectory() as d:self.assertEqual(build.build(Path(d)/'a.html'),build.build(Path(d)/'b.html'))
 def test_no_media_restored_after_deletion(self):
  text=(build.ROOT/'installer/restore.js').read_text();self.assertIn('wallpapers:[]',text);self.assertNotIn('copyFileSync(L',text)
if __name__=='__main__':unittest.main()
