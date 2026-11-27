#!/usr/bin/env python3
"""Reject private machine data and bundled media in the public source tree."""
from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[1]
SKIP={'.git','build','__pycache__'}
bad=[]
for p in ROOT.rglob('*'):
 if not p.is_file() or set(p.relative_to(ROOT).parts)&SKIP:continue
 rel=p.relative_to(ROOT)
 if p.suffix.lower() in {'.mp4','.webm','.ipk','.pem','.key','.token'} or p.name in {'personal-key.js','known_hosts'} or 'private' in rel.parts:bad.append(str(rel)+': excluded file');continue
 try:text=p.read_text()
 except UnicodeDecodeError:continue
 if re.search(r'\b(?!127\.0\.0\.1\b)(?:\d{1,3}\.){3}\d{1,3}\b',text):bad.append(str(rel)+': non-loopback IPv4 literal')
 if re.search('/'+'home/'+r'[^/\s]+/|-----BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}',text):bad.append(str(rel)+': possible private path or credential')
if bad:print('\n'.join(bad));sys.exit(1)
print('Public-source privacy audit passed')
