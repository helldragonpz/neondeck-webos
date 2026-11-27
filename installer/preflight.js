'use strict';
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const D='/media/developer/cleanyourtv',S='/var/lib/tanados-tv/personal-ui';
const digest=p=>fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):'';
function cmd(bin,args){return cp.execFileSync(bin,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});}
const properties=JSON.parse(cmd('luna-send',['-n','1','-w','5000','luna://com.webos.service.tv.systemproperty/getSystemInfo',JSON.stringify({keys:['modelName','firmwareVersion','sdkVersion']})]));
let manager={};try{manager=JSON.parse(cmd('curl',['-fsS','-m','5','http://127.0.0.1:8765/api/manager/status']));}catch(_){}
let busy=false;try{const token=fs.readFileSync('/var/lib/tanados-tv-dns/gallery.token','utf8').trim();for(const route of ['/download/status','/apps/status']){const job=JSON.parse(cmd('curl',['-fsS','-m','3','-H','X-Tanados-Token: '+token,'http://127.0.0.1:8775'+route]));if(['downloading','converting','installing','removing'].includes(job.status))busy=true;}}catch(_){}
const df=cmd('df',['-Pk','/var']).trim().split('\n').at(-1).trim().split(/\s+/);
console.log(JSON.stringify({uid:process.getuid(),busy,node:process.versions.node,kernelArch:cmd('uname',['-m']).trim(),model:properties.modelName,firmware:properties.firmwareVersion,sdk:properties.sdkVersion,frontend:digest(D+'/app/index.html'),approved:digest(S+'/index.html'),freeBytes:Number(df.at(-3))*1024,home:manager.home||{},ffmpeg:digest('/var/lib/tanados-tv-media-bin/ffmpeg')}));
