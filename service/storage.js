'use strict';
const fs=require('fs'),cp=require('child_process'),path=require('path');
const M=1048576;
function parseDf(text){return text.trim().split('\n').slice(1).map(line=>{const x=line.trim().split(/\s+/);if(x.length<6)return null;return {total:Number(x.at(-5))*1024,used:Number(x.at(-4))*1024,free:Number(x.at(-3))*1024,percent:Number(x.at(-2).replace('%',''))};}).filter(x=>x&&Number.isFinite(x.free));}
function volume(p){const rows=parseDf(cp.execFileSync('df',['-Pk',p],{encoding:'utf8'}));if(!rows.length)throw Error('Could not read storage');return rows.at(-1);}
function usage(root){let bytes=0,count=0;try{const c=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));for(const w of c.wallpapers)for(const ext of ['mp4','jpg']){try{bytes+=fs.statSync(path.join(root,w.id+'.'+ext)).size;if(ext==='mp4')count++;}catch(_){}}}catch(_){}return {bytes,count};}
function state(root,{warningMB=128,reserveMB=64,quotaMB=256}={}){
 const wall=volume(root),apps=volume(process.env.TANADOS_APP_STORAGE||'/media/developer'),lib=usage(root);
 const low=v=>v.free<warningMB*M||v.percent>=90;
 return {wallpapers:{...wall,libraryBytes:lib.bytes,count:lib.count,quotaBytes:quotaMB*M},apps,warning:low(wall)||low(apps),critical:wall.free<reserveMB*M||apps.free<reserveMB*M,warningMB,reserveMB};
}
function guard(root,need,{reserveMB=64,quotaMB=256,finalBytes=0}={}){
 const v=volume(root),lib=usage(root);if(v.free<need+reserveMB*M)throw Error('Not enough TV storage. Delete wallpapers or apps first.');if(lib.bytes+finalBytes>quotaMB*M)throw Error('Wallpaper limit reached. Delete wallpapers or raise the library limit.');
}
module.exports={parseDf,volume,usage,state,guard};
