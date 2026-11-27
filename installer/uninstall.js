'use strict';
const fs=require('fs'),cp=require('child_process'),path=require('path');
const B='/var/lib/tanados-tv/neondeck-backup';const state=JSON.parse(fs.readFileSync(B+'/manifest.json','utf8'));
for(const unit of ['tanados-media.service','tanados-management.service'])try{cp.execFileSync('systemctl',['stop',unit]);}catch(_){}
for(const r of state.files){if(!['/var/lib/tanados-tv/','/var/lib/tanados-tv-dns/','/var/lib/webosbrew/init.d/','/media/developer/cleanyourtv/'].some(p=>r.dest.startsWith(p))||r.dest.includes('..'))throw Error('Invalid backup path');if(r.exists){fs.mkdirSync(path.dirname(r.dest),{recursive:true});fs.copyFileSync(B+'/'+r.copy,r.dest);if(r.dest.includes('/init.d/'))fs.chmodSync(r.dest,0o755);}else try{fs.unlinkSync(r.dest);}catch(_){}}
cp.execFileSync('systemctl',['daemon-reload']);for(const [unit,active]of Object.entries(state.active))if(active)try{cp.execFileSync('systemctl',['restart',unit]);}catch(_){}
try{cp.execFileSync('sh',['/media/developer/cleanyourtv/stage-home.sh']);}catch(_){}
console.log('Previous UI, configuration and service files restored. Saved wallpapers were kept. Reopen Home.');

try{const luna=(uri,data)=>JSON.parse(cp.execFileSync('luna-send',['-n','1','-w','5000','luna://'+uri,JSON.stringify(data)],{stdio:['ignore','pipe','pipe']}));const fg=luna('com.webos.applicationManager/getForegroundAppInfo',{});luna('com.palm.webappmanager/killApp',{appId:'com.webos.app.home'});if(fg.appId==='com.webos.app.home'){cp.execFileSync('sleep',['2']);luna('com.webos.applicationManager/launch',{id:'com.webos.app.home'});}}catch(_){}
