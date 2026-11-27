'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
let changed=false;
try {
const T='/var/lib/tanados-tv/neondeck-staging',B='/var/lib/tanados-tv/neondeck-backup',D='/media/developer/cleanyourtv',R='/var/lib/tanados-tv',S=R+'/personal-ui',W='/var/lib/tanados-tv-dns',L='/var/lib/tanados-tv-wallpapers';
function cmd(bin,args){return cp.execFileSync(bin,args,{stdio:['ignore','pipe','pipe'],encoding:'utf8'});}
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const profile=JSON.parse(fs.readFileSync(T+'/profile.json','utf8')),manifest=JSON.parse(fs.readFileSync(T+'/manifest.json','utf8'));
for(const [name,hash]of Object.entries(manifest)){if(name.includes('..')||name.startsWith('/')||digest(T+'/'+name)!==hash)throw Error('Bundle integrity failed');}
// Recheck activity immediately before updating services.
try{const secret=fs.readFileSync(W+'/gallery.token','utf8').trim();for(const route of ['/download/status','/apps/status']){const j=JSON.parse(cmd('curl',['-fsS','-m','3','-H','X-Tanados-Token: '+secret,'http://127.0.0.1:8775'+route]));if(['downloading','converting','installing','removing'].includes(j.status))throw Error('BUSY: wait for the current operation');}}catch(e){if(e.message.startsWith('BUSY:'))throw e;}
const original=digest(D+'/app/index.html');if(original!==profile.frontend)throw Error('Home changed since preflight; nothing applied');
const files=[];
for(const name of ['media_server.js','wallpaper_provider.js','network.js','storage.js','management_server.js','app_store.js'])files.push([T+'/service/'+name,W+'/'+name]);
for(const name of ['tanados-media.service','tanados-management.service'])files.push([T+'/installer/'+name,W+'/'+name]);
files.push([T+'/index.html',D+'/app/index.html'],[T+'/theme/theme.json',D+'/themes/neon/theme.json'],[T+'/installer/restore.js',R+'/restore-personal-ui.js'],[T+'/installer/guard.js',R+'/neondeck-guard.js'],[T+'/installer/uninstall.js',R+'/neondeck-uninstall.js']);
for(const name of ['09-tanados-ui','09-tanados-video','09-tanados-management'])files.push([T+'/installer/'+name,'/var/lib/webosbrew/init.d/'+name]);
const snapshot=[...new Set(files.map(x=>x[1]).concat([D+'/config.json',D+'/app/personal-key.js',S+'/index.html',S+'/personal-key.js',S+'/theme.json',R+'/neondeck-profile.json']))];
fs.mkdirSync(B,{recursive:true,mode:0o700});fs.chmodSync(B,0o700);
if(!fs.existsSync(B+'/manifest.json')){
 const records=[];snapshot.forEach((dest,i)=>{const exists=fs.existsSync(dest),copy=String(i)+'.backup';if(exists)fs.copyFileSync(dest,B+'/'+copy);records.push({dest,exists,copy});});
 const active={};for(const unit of ['tanados-media.service','tanados-management.service']){try{active[unit]=cmd('systemctl',['is-active',unit]).trim()==='active';}catch(_){active[unit]=false;}}
 fs.writeFileSync(B+'/manifest.json',JSON.stringify({files:records,active},null,2),{mode:0o600});
}
changed=true;fs.mkdirSync(W,{recursive:true});fs.mkdirSync(S,{recursive:true});fs.mkdirSync(L,{recursive:true});fs.chownSync(L,7779,7779);fs.chmodSync(L,0o755);
if(!fs.existsSync(L+'/catalog.json'))fs.writeFileSync(L+'/catalog.json',JSON.stringify({version:1,wallpapers:[]}),{mode:0o644});
if(!fs.existsSync(W+'/gallery.token'))fs.writeFileSync(W+'/gallery.token',crypto.randomBytes(32).toString('hex')+'\n',{mode:0o600});
const token=fs.readFileSync(W+'/gallery.token','utf8').trim(),key='window.TANADOS_LOCAL_TOKEN='+JSON.stringify(token)+';\n';
for(const [source,dest]of files){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest+'.new');fs.chmodSync(dest+'.new',dest.includes('/init.d/')?0o755:0o644);fs.renameSync(dest+'.new',dest);}
fs.writeFileSync(D+'/app/personal-key.js',key,{mode:0o644});fs.writeFileSync(S+'/personal-key.js',key,{mode:0o600});fs.copyFileSync(T+'/index.html',S+'/index.html');fs.copyFileSync(T+'/theme/theme.json',S+'/theme.json');
fs.mkdirSync('/var/lib/tanados-tv-media-bin',{recursive:true});if(fs.existsSync(T+'/bin/ffmpeg')){fs.copyFileSync(T+'/bin/ffmpeg','/var/lib/tanados-tv-media-bin/ffmpeg');fs.chmodSync('/var/lib/tanados-tv-media-bin/ffmpeg',0o755);for(const name of ['GPLv3.txt','readme.txt'])fs.copyFileSync(T+'/bin/'+name,'/var/lib/tanados-tv-media-bin/'+name);}
let conf={};try{conf=require(D+'/config.js').main();conf.update('NeonDeck installer',c=>{c.theme={id:'neon',accent:''};const bar=c.topbar||[{label:'Inputs',icon:'inputs',action:'inputs'},{label:'Apps',icon:'grid',action:'tanados-apps'},{label:'Settings',icon:'settings',app:'com.palm.app.settings'}];if(!bar.some(b=>b.action==='tanados-shop'))bar.push({label:'App Shop',icon:'shop',action:'tanados-shop'});if(!bar.some(b=>b.action==='tanados-wallpapers'))bar.push({label:'Wallpapers',icon:'photo',action:'tanados-wallpapers'});c.topbar=bar;});}catch(e){throw Error('Could not update launcher configuration: '+e.message);}
fs.writeFileSync(R+'/neondeck-profile.json',JSON.stringify({model:profile.model,firmware:profile.firmware,sdk:profile.sdk,maxQuality:profile.maxQuality},null,2),{mode:0o600});
let unit=fs.readFileSync(W+'/tanados-media.service','utf8').replace(/Environment=TANADOS_MAX_QUALITY=\d+\n/g,'');unit=unit.replace('[Service]\n','[Service]\nEnvironment=TANADOS_MAX_QUALITY='+profile.maxQuality+'\n');fs.writeFileSync(W+'/tanados-media.service',unit);
for(const unitName of ['tanados-media.service','tanados-management.service']){const link='/run/systemd/system/'+unitName;try{fs.unlinkSync(link);}catch(_){}fs.symlinkSync(W+'/'+unitName,link);}
cmd('systemctl',['daemon-reload']);cmd('systemctl',['restart','tanados-management.service']);cmd('systemctl',['restart','tanados-media.service']);
console.log('NeonDeck files, catalogue service and recovery backup installed.');

}catch(e){console.error('Installation stopped: '+e.message);if(changed){try{cp.execFileSync('/usr/bin/node',['/var/lib/tanados-tv/neondeck-staging/installer/uninstall.js'],{stdio:'inherit'});}catch(_) {console.error('Recovery backup: /var/lib/tanados-tv/neondeck-backup');}}process.exitCode=1;}
