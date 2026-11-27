'use strict';
const fs=require('fs'),cp=require('child_process');
try{const p=JSON.parse(fs.readFileSync('/var/lib/tanados-tv/neondeck-profile.json','utf8'));const v=JSON.parse(cp.execFileSync('luna-send',['-n','1','-w','5000','luna://com.webos.service.tv.systemproperty/getSystemInfo',JSON.stringify({keys:['modelName','firmwareVersion']})],{stdio:['ignore','pipe','pipe']}));if(v.modelName!==p.model||v.firmwareVersion!==p.firmware)throw Error('TV firmware changed; review compatibility before starting NeonDeck');}catch(e){console.error(e.message);process.exitCode=1;}
