#!/usr/bin/env python3
"""Generate original, address-free installation illustrations."""
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]/'docs/images'
cards=[
 ('01-compatibility','01','Check compatibility','TV information',['Model + firmware + webOS','Check your exact version','cani.rootmy.tv'],'A model name alone is not a compatibility check.'),
 ('02-homebrew','02','Prepare Homebrew','Homebrew Channel settings',['Root privileges: available','SSH: ON','Telnet: OFF','Block updates: ON'],'Follow the root method for your exact firmware.'),
 ('03-ssh','03','Connect privately','Your computer → your TV',['Dedicated SSH key','TV_HOST stays on your computer','Public key goes to the TV','Private key stays with you'],'Never share keys, tokens or network screenshots.'),
 ('04-baseline','04','Set up the baseline','CleanYourTV Manager',['Service 1.6.32','Frontend 1.5.25','Set up → enable as Home','Test Home and HDMI inputs'],'Use the reviewed release before adding the overlay.'),
 ('05-preflight','05','Run the read-only check','On your computer',['python3 install.py','--host TV_HOST','--key ~/.ssh/neondeck_tv','--dry-run'],'Expected: read-only preflight passed; no files changed.'),
 ('06-install','06','Install NeonDeck','On your computer',['Run install.py without --dry-run','Backup created on the TV','Files verified; local key generated','Open Home when ready'],'Optional: --max-quality 2160 enables eligible 4K downloads.'),
 ('11-recovery','11','Keep a way back','In the TV SSH shell',['node /var/lib/tanados-tv/','neondeck-uninstall.js','','Restore previous UI; keep wallpapers'],'The two displayed path lines form one command in the guide.')]
ROOT.mkdir(parents=True,exist_ok=True)
for slug,n,title,panel,lines,foot in cards:
 rows=''.join(f'<text x="190" y="{270+i*58}" fill="{("#c7b0ff" if i==0 else "#edf3ff")}" font-size="26">{escape(line)}</text>' for i,line in enumerate(lines))
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="{escape(title)} illustration">
 <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#080d1d"/><stop offset="1" stop-color="#24133c"/></linearGradient></defs>
 <rect width="1200" height="675" rx="24" fill="url(#bg)"/><circle cx="1070" cy="100" r="220" fill="#a88aff" opacity=".05"/>
 <g font-family="Arial,Helvetica,sans-serif"><text x="65" y="74" fill="#c7b0ff" font-size="21" letter-spacing="4">NEONDECK · SETUP {n}</text>
 <text x="65" y="132" fill="#f3f1ff" font-size="41" font-weight="700">{escape(title)}</text>
 <rect x="150" y="180" width="900" height="360" rx="23" fill="#101725" stroke="#b8a0ff" stroke-opacity=".45" stroke-width="2"/>
 <text x="190" y="223" fill="#a1e8ff" font-size="21">{escape(panel)}</text>{rows}
 <text x="65" y="591" fill="#d5cbea" font-size="21">{escape(foot)}</text>
 <text x="65" y="636" fill="#a098b6" font-size="18">Illustration · menu wording and layout vary by TV</text></g></svg>'''
 (ROOT/(slug+'.svg')).write_text(svg)
print('Created',len(cards),'setup illustrations')
