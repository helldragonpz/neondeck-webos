'use strict';
// One trusted Homebrew catalogue, rendered by our UI; installs remain handled by HBC.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const network=require('./network');
const HOSTS=['repo.webosbrew.org','github.com','api.github.com','raw.githubusercontent.com','objects.githubusercontent.com','release-assets.githubusercontent.com'];
const CORE=new Set(['com.webos.app.home','org.webosbrew.hbchannel','com.cleanyourtv.manager','com.palm.app.settings','com.webos.app.settings']);
function text(s,max=3000){return String(s||'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim().slice(0,max);}
function idSafe(id){if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(id||''))throw Error('Invalid app id');return id;}
function normalize(p){
 const m=p.manifest||{},id=idSafe(p.id),u=new URL(m.ipkUrl||'',p.manifestUrl||'https://repo.webosbrew.org/api/apps.json');network.allowed(u.href,HOSTS);
 const hash=m.ipkHash&&m.ipkHash.sha256;if(!/^[a-f0-9]{64}$/i.test(hash||''))throw Error('App is missing a valid package checksum');
 return {id,title:text(p.title||m.title,100),category:text(p.category||'other',50),description:text(p.shortDescription||m.appDescription),version:text(m.version,40),rootRequired:m.rootRequired===true,size:Number(m.ipkSize)||0,icon:String(p.iconUri||m.iconUri||''),requirements:text((p.requirements&&p.requirements.webosRelease?'webOS '+p.requirements.webosRelease:'')),core:CORE.has(id),_url:u.href,_hash:hash};
}
function create({dir='/var/lib/tanados-tv/appstore',luna,fetcher=network.request,freeBytes}){
 fs.mkdirSync(dir,{recursive:true});let catalogue=[],stamp=0,job={status:'idle'},busy=false;
 try{const d=JSON.parse(fs.readFileSync(path.join(dir,'catalog.json'),'utf8'));catalogue=d.apps;stamp=d.at;}catch(_){}
 async function refresh(force=false){if(!force&&Date.now()-stamp<3600000&&catalogue.length)return;const data=JSON.parse((await fetcher('https://repo.webosbrew.org/api/apps.json',{hosts:HOSTS,max:2*1048576})).toString());if(!Array.isArray(data.packages)||data.packages.length>500)throw Error('Invalid Homebrew catalogue');const next=[];for(const p of data.packages)try{next.push(normalize(p));}catch(_){}if(!next.length)throw Error('No verified packages in catalogue');catalogue=next;stamp=Date.now();fs.writeFileSync(path.join(dir,'catalog.json'),JSON.stringify({at:stamp,apps:catalogue}),{mode:0o600});}
 async function installed(){const d=await luna('com.webos.applicationManager/listApps',{});return d.apps||[];}
 async function confirm(id,present,version){for(let i=0;i<8;i++){const a=(await installed()).find(x=>x.id===id);if(present?!!a&&(!version||a.version===version):!a)return;await new Promise(r=>setTimeout(r,500));}throw Error(present?'Installed app could not be confirmed':'Removal could not be confirmed');}
 async function list({q='',category='',force=false}={}){await refresh(force);const local=await installed(),map=new Map(local.map(a=>[a.id,a]));let apps=catalogue.filter(a=>(!q||(a.title+' '+a.description).toLowerCase().includes(String(q).toLowerCase()))&&(!category||category==='all'||category==='installed'&&map.has(a.id)||a.category===category));
  return {source:'webOS Homebrew Project',count:catalogue.length,categories:[...new Set(catalogue.map(a=>a.category))].sort(),apps:apps.map(a=>{const {_url,_hash,icon,...safe}=a,current=map.get(a.id);return {...safe,icon:'/apps/icon/'+encodeURIComponent(a.id),installed:!!current,installedVersion:current&&current.version||''};})};
 }
 async function icon(id){idSafe(id);await refresh();const a=catalogue.find(a=>a.id===id);if(!a)throw Error('Unknown app');const u=network.allowed(a.icon,['repo.webosbrew.org']);if(!/^\/apps\/icons\/[A-Za-z0-9._-]+\.(png|jpg|webp)$/.test(u.pathname))throw Error('Unsupported app icon');const f=path.join(dir,id+'.png');if(!fs.existsSync(f)){const b=await fetcher(u.href,{hosts:HOSTS,max:1048576});if(!(b[0]===0x89&&b[1]===0x50)&&!(b[0]===0xff&&b[1]===0xd8))throw Error('Invalid app icon');fs.writeFileSync(f,b,{mode:0o644});}return fs.readFileSync(f);}
 async function install(id){idSafe(id);if(busy)throw Error('Another app operation is running');busy=true;try{await refresh();const a=catalogue.find(a=>a.id===id);if(!a||CORE.has(id))throw Error('Manage core applications in their original manager');if(freeBytes&&await freeBytes()<Math.max(a.size*3,30*1048576)+64*1048576)throw Error('Not enough app storage. Remove apps first');job={status:'installing',id,title:a.title,progress:0};
  luna('org.webosbrew.hbchannel.service/install',{id,ipkUrl:a._url,ipkHash:a._hash,subscribe:true},{subscribe:true,onMessage:m=>{if(m.progress!==undefined)job.progress=m.progress;if(m.statusText)job.message=text(m.statusText,200);},finished:m=>m.finished===true,timeout:240000}).then(async()=>{await confirm(id,true,a.version);job={status:'ready',id,title:a.title,message:'Installed'};}).catch(e=>{job={status:'error',id,error:e.message};}).finally(()=>{busy=false;});return {...job};}catch(e){busy=false;throw e;}
 }
 async function removable(){const local=await installed(),fg=await luna('com.webos.applicationManager/getForegroundAppInfo',{});return local.filter(a=>!CORE.has(a.id)&&!/^com\.(webos|palm)\.app\./.test(a.id)&&(a.removable===true||String(a.folder||'').startsWith('/media/developer/apps/'))).map(a=>({id:a.id,title:text(a.title,100),version:text(a.version,40),running:a.id===fg.appId}));}
 async function remove(id){idSafe(id);if(CORE.has(id)||/^com\.(webos|palm)\.app\./.test(id))throw Error('Core applications cannot be removed here');if(busy)throw Error('Another app operation is running');busy=true;try{const items=await removable(),a=items.find(a=>a.id===id);if(!a)throw Error('App cannot be removed');if(a.running)throw Error('Close this app before removing it');job={status:'removing',id,title:a.title};
  luna('org.webosbrew.hbchannel.service/uninstall',{id},{timeout:30000}).then(async()=>{await confirm(id,false);job={status:'ready',id,message:'Removed'};}).catch(e=>{job={status:'error',id,error:e.message};}).finally(()=>{busy=false;});return {...job};}catch(e){busy=false;throw e;}
 }
 return {list,icon,install,removable,remove,status:()=>({...job})};
}
module.exports={create,normalize,idSafe,CORE};
