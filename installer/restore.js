'use strict';
const fs=require('fs'),crypto=require('crypto');
const D='/media/developer/cleanyourtv',S='/var/lib/tanados-tv/personal-ui',L='/var/lib/tanados-tv-wallpapers';
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
try{
 const current=D+'/app/index.html',approved=S+'/index.html';if(!fs.existsSync(current)||!fs.existsSync(approved))process.exit(0);
 const h=digest(current);if(h!=='7bfe584a43c4651e78408258eb3e45dc2074030982a3e1fce4edddb49dce4d34'&&h!==digest(approved)){console.log('New upstream frontend needs review');process.exit(0);}
 if(h!==digest(approved)){fs.copyFileSync(approved,current+'.new');fs.chmodSync(current+'.new',0o644);fs.renameSync(current+'.new',current);}
 fs.mkdirSync(L,{recursive:true});if(!fs.existsSync(L+'/catalog.json'))fs.writeFileSync(L+'/catalog.json',JSON.stringify({version:1,wallpapers:[]}));
 if(!fs.existsSync(D+'/app/personal-key.js')){fs.copyFileSync(S+'/personal-key.js',D+'/app/personal-key.js');fs.chmodSync(D+'/app/personal-key.js',0o644);}
 fs.mkdirSync(D+'/themes/neon',{recursive:true});if(!fs.existsSync(D+'/themes/neon/theme.json'))fs.copyFileSync(S+'/theme.json',D+'/themes/neon/theme.json');
}catch(e){console.error(e.message);process.exitCode=1;}
