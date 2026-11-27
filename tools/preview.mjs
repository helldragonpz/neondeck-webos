// Offline browser previews with original artwork and synthetic metadata.
// Run python3 build.py, then CHROME=/path/to/chrome node tools/preview.mjs.
// Node 22+ is required for its built-in WebSocket. No TV connection is made.
import http from 'node:http';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(ROOT,'docs/images');
const chromePath=process.env.CHROME||['/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chromePath||typeof WebSocket==='undefined')throw Error('Set CHROME to a Chromium binary and use Node 22+');
const apps=[{id:'com.webos.app.hdmi1',title:'PS5',input:1},{id:'com.webos.app.hdmi2',title:'PS4',input:2},{id:'com.webos.app.hdmi3',title:'TV Box',input:3},{id:'org.jellyfin.webos',title:'Jellyfin'},{id:'youtube.leanback.v4',title:'YouTube'},{id:'netflix',title:'Netflix'},{id:'amazon',title:'Prime Video'},{id:'com.disney.disneyplus-prod',title:'Disney+'}];
const art=`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#080e22"/><stop offset=".55" stop-color="#2c1749"/><stop offset="1" stop-color="#0b2639"/></linearGradient><radialGradient id="r"><stop stop-color="#b499ff" stop-opacity=".22"/><stop offset="1" stop-color="#b499ff" stop-opacity="0"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#g)"/><ellipse cx="1400" cy="330" rx="650" ry="470" fill="url(#r)"/><path d="M0 760 470 220 920 760 1380 270 1920 760" fill="none" stroke="#b499ff" stroke-opacity=".18" stroke-width="2"/><path d="m0 890 470-520 450 520 460-500 540 500" fill="none" stroke="#a1e8ff" stroke-opacity=".12" stroke-width="2"/><circle cx="1400" cy="330" r="130" fill="none" stroke="#c7b0ff" stroke-opacity=".3" stroke-width="2"/></svg>`;
const icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#322849"/><path d="M47 32l45 32-45 32Z" fill="#c7b0ff"/></svg>';
const catalogue=[{id:'example',title:'Neon Geometry',width:1920,height:1080},{id:'winter-example',title:'Winter Geometry',season:'christmas',width:1920,height:1080},{id:'spring-example',title:'Spring Geometry',season:'easter',width:1920,height:1080}];
const store=[{id:'org.jellyfin.webos',title:'Jellyfin',category:'homemedia',description:'Stream your personal media library.',version:'1.2.0',installed:true},{id:'com.limelight.webos',title:'Moonlight',category:'streaming',description:'Stream games from your PC.',version:'1.6.0'},{id:'com.example.puzzle',title:'Number Puzzle',category:'game',description:'A remote-friendly puzzle game.',version:'1.0.0'}].map(a=>({...a,size:2097152,icon:'/apps/icon/'+a.id}));
let page=fs.readFileSync(path.join(ROOT,'build/index.html'),'utf8').replace('<script>','<script>window.NEONDECK_MEDIA="http://127.0.0.1:8765/media";window.webOSSystem={launchParams:"{}"};localStorage.setItem("tanados.motion","off");localStorage.setItem("tanados.previewSide","left");',1);
const theme=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/theme-resolved.json')));
let downloadCalls=0,lastDownloadQuality=0,downloadJob={status:'error',id:'mw-0123456789abcdef-2160',title:'Neon Geometry',quality:2160,kind:'wallpaper',error:'Synthetic conversion error',canRetry:true};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),p=u.pathname;
 const json=o=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(o));};
 if(p==='/home.html'){res.writeHead(200,{'Content-Type':'text/html'});return res.end(page);}
 if(p==='/setup.js'){res.writeHead(200,{'Content-Type':'application/javascript'});return res.end(fs.readFileSync(path.join(ROOT,'setup/setup.js')));}
 if(p==='/setup.html'){const mock="<script>window.PalmServiceBridge=function(){this.call=function(uri,p){var self=this,data=JSON.parse(p);var result={returnValue:true};if(uri.indexOf('getAppInfo')>=0)result.appInfo={folderPath:'/media/developer/apps/usr/palm/applications/org.neondeck.setup'};else{if(data.command.indexOf('nohup ')===0)window._setupCommand=data.command;result.stdoutString=JSON.stringify({status:'ready',message:'Ready',compatible:true,hasBaseline:true,model:'Example LG TV',firmware:'Example',usb:[{id:0,label:'USB volume 1'}]});}setTimeout(function(){self.onservicecallback(JSON.stringify(result));},10);};};</script>";res.writeHead(200,{'Content-Type':'text/html'});return res.end(fs.readFileSync(path.join(ROOT,'setup/index.html'),'utf8').replace('<script src="setup.js">',mock+'<script src="setup.js">'));}
 if(p==='/personal-key.js'){res.writeHead(200,{'Content-Type':'application/javascript'});return res.end('window.TANADOS_LOCAL_TOKEN="public-preview-fixture-no-secret";');}
 if(p.endsWith('.jpg')){res.writeHead(200,{'Content-Type':'image/svg+xml'});return res.end(art);}
 if(p.includes('/icon/')){res.writeHead(200,{'Content-Type':'image/svg+xml'});return res.end(icon);}
 if(p.endsWith('.mp4')){res.writeHead(404);return res.end();}
 if(p==='/api/apps')return json({apps,config:{clock:'24',topbar:[{label:'Inputs',icon:'inputs',action:'inputs'},{label:'Apps',icon:'grid',action:'apps'},{label:'App Shop',icon:'shop',action:'tanados-shop'},{label:'Wallpapers',icon:'photo',action:'tanados-wallpapers'},{label:'Settings',icon:'settings',app:'com.palm.app.settings'}],dock:apps.map(a=>a.id),theme},usage:{},version:'1.6.32'});
 if(p==='/api/inputs')return json({devices:[]});
 if(p==='/media/catalog.json')return json({version:1,wallpapers:catalogue});
 if(p==='/media/online/search')return json({page:1,results:[{id:'mw-0123456789abcdef',title:'Neon Geometry',source:'https://moewalls.com/fantasy/example-live-wallpaper/',poster:'/online/example.jpg'},{id:'mw-0123456789abcdee',title:'Crystal Geometry',poster:'/online/example.jpg'}]});
 if(p==='/test/download-state')return json({downloadCalls,lastDownloadQuality});
 if(p==='/test/reset-download-error'){downloadJob={status:'error',id:'mw-0123456789abcdef-2160',title:'Neon Geometry',quality:2160,kind:'wallpaper',error:'Synthetic conversion error'};return json({ok:true});}
 if(p==='/media/download/status')return json(downloadJob);
 if(p==='/media/download'){let b='';req.on('data',x=>b+=x);req.on('end',()=>{const d=JSON.parse(b);downloadCalls++;lastDownloadQuality=d.quality;downloadJob={status:'ready',id:d.id+(d.quality>720?'-'+d.quality:''),title:'Neon Geometry',quality:d.quality,progress:100};json(downloadJob);});return;}
 if(p==='/media/online/detail')return json({id:u.searchParams.get('id'),title:'Neon Geometry',poster:'/online/example.jpg',qualities:[720,1080,2160]});
 if(p==='/media/apps/catalog')return json({source:'Preview catalogue',apps:store});
 if(p==='/media/apps/removable')return json({apps:[]});
 if(p==='/media/storage')return json({wallpapers:{free:300*1048576,libraryBytes:23*1048576,count:3,quotaBytes:256*1048576},apps:{free:300*1048576},warning:false,warningMB:128,reserveMB:64});
 return json({returnValue:true});
});
await new Promise((r,j)=>{server.on('error',j);server.listen(8765,'127.0.0.1',r);});
const userDir=fs.mkdtempSync(path.join(os.tmpdir(),'neondeck-preview-')),port=9700+Math.floor(Math.random()*200);
const chrome=spawn(chromePath,['--headless=new','--disable-gpu','--hide-scrollbars','--remote-debugging-port='+port,'--user-data-dir='+userDir,'--window-size=1920,1080','about:blank'],{stdio:'ignore',detached:true});
const sleep=n=>new Promise(r=>setTimeout(r,n));let ws;
try{
 let tabs;for(let i=0;i<80;i++){try{tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();if(tabs.some(t=>t.type==='page'))break;}catch(_){}await sleep(200);}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let seq=0;const pending=new Map();
 ws.addEventListener('message',m=>{const d=JSON.parse(m.data);if(pending.has(d.id)){pending.get(d.id)(d);pending.delete(d.id);}});
 const send=(method,params={})=>new Promise(r=>{const id=++seq;pending.set(id,r);ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.result.exceptionDetails)throw Error(r.result.exceptionDetails.exception?.description||r.result.exceptionDetails.text);return r.result.result.value;};
 const pick=async label=>{const ok=await evaluate('(()=>{const m=stack[stack.length-1];const i=m.items.findIndex(x=>x.label==='+JSON.stringify(label)+');if(i<0)return false;m.idx=i;drawMenu();pickMenu();return true;})()');if(!ok)throw Error('Missing '+label);await sleep(400);};
 const shot=async name=>{await sleep(500);await evaluate('document.getElementById("toast").style.display="none";0');const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(r.result.data,'base64'));console.log('Created '+name+'.png');};
 await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:8765/home.html'});await sleep(1800);
 await evaluate('closeMenus();setFocus(1,0);0');await shot('home');
 await evaluate('act({_o:{action:"customize"}});0');await shot('appearance');
 await evaluate('closeMenus();act({_o:{action:"tanados-wallpapers"}});0');await pick('Search & download wallpapers');await pick('Neon');await shot('wallpapers');
 if(process.argv.includes('--test')){
  const verify=async(name,expr)=>{if(!await evaluate(expr))throw Error('FAIL '+name);console.log('PASS '+name);};
  await verify('preview is visible without clicking a result','sideEl.querySelector("img").naturalWidth>0 && stack[stack.length-1].title==="Results: Neon"');
  await evaluate('lastKey=Date.now();document.querySelectorAll(".row")[1].dispatchEvent(new MouseEvent("mousemove",{bubbles:true,clientX:1300,clientY:600}));0');
  await verify('pointer previews ignore the old key delay','stack[stack.length-1].idx===1 && sideEl.querySelector(".pt").textContent==="Crystal Geometry"');
  await evaluate('window._draws=TANADOS_UI.menuFullDraws;window._row=document.querySelector(".row");window._start=performance.now();for(var n=0;n<60;n++)menuKey(n%2?40:38);window._focusMs=performance.now()-_start;0');
  await verify('60 focus moves reuse existing rows','TANADOS_UI.menuFullDraws===_draws && document.querySelector(".row")===_row && TANADOS_UI.menuFocusUpdates>=60');
  console.log('Focus benchmark ms:',await evaluate('_focusMs'));
 }

 await evaluate('closeMenus();act({_o:{action:"tanados-wallpapers"}});0');await pick('Seasonal wallpapers');await shot('holidays');
 await evaluate('closeMenus();act({_o:{action:"tanados-shop"}});0');await sleep(500);if(!await evaluate('!!document.querySelector("#ov.appshop") && document.querySelectorAll(".store-icon").length>0'))throw Error('App Shop decoration missing');await shot('shop');
 await evaluate('closeMenus();act({_o:{action:"tanados-wallpapers"}});0');await pick('Storage & delete');await shot('storage');
 if(process.argv.includes('--test')){
  await evaluate('closeMenus();act({_o:{action:"customize"}});0');await pick('Clock');await pick('Clock style');await pick('Analogue');
  if(!await evaluate('TANADOS_UI.clockStyle==="analog" && getComputedStyle(document.querySelector(".nd-dial")).display!=="none"'))throw Error('Clock style failed');
  await send('Page.reload');await sleep(1000);if(!await evaluate('TANADOS_UI.clockStyle==="analog"'))throw Error('Clock persistence failed');
  console.log('PASS clock style and persistence');
  await evaluate('closeMenus();act({_o:{action:"tanados-wallpapers"}});0');await pick('Download status / retry');if(!await evaluate('stack[stack.length-1].items.some(x=>x.label==="Retry download")'))throw Error('Error retry control missing '+JSON.stringify(await evaluate('({menus:stack.map(m=>({title:m.title,status:m.status,items:m.items.map(x=>x.label)})),toast:document.getElementById("toast").textContent})')));await pick('Retry download');await sleep(1000);let state=await(await fetch('http://127.0.0.1:8765/test/download-state')).json();if(state.downloadCalls!==1||state.lastDownloadQuality!==2160)throw Error('Retry changed the selected quality');await fetch('http://127.0.0.1:8765/test/reset-download-error');await evaluate('closeMenus();act({_o:{action:"tanados-wallpapers"}});0');await pick('Download status / retry');await pick('Try HD 720p');await sleep(1000);state=await(await fetch('http://127.0.0.1:8765/test/download-state')).json();if(state.downloadCalls!==2||state.lastDownloadQuality!==720)throw Error('Lower quality retry failed');console.log('PASS retained download errors, same-quality retry and 720p fallback');

  await send('Page.navigate',{url:'http://127.0.0.1:8765/setup.html'});await sleep(350);if(!await evaluate('!document.getElementById("install").disabled'))throw Error('Setup app preflight failed');await evaluate('document.getElementById("quality").value="2160";document.getElementById("install").click();0');await sleep(100);if(!await evaluate('_setupCommand.indexOf("install 2160")>0'))throw Error('Setup did not request 4K installation');await sleep(2200);await evaluate('document.getElementById("usb").click();0');await sleep(100);if(!await evaluate('_setupCommand.indexOf("usb 2160 0")>0'))throw Error('USB button did not select the validated bundle');console.log('PASS setup app quality, remote actions and USB selection');
 }
}finally{if(ws)ws.close();server.close();/* Only the isolated preview browser's process group. */try{process.kill(-chrome.pid,'SIGTERM');}catch(_){chrome.kill();}await sleep(250);try{process.kill(-chrome.pid,'SIGKILL');}catch(_){}if(chrome.exitCode===null)await Promise.race([new Promise(r=>chrome.once('exit',r)),sleep(2000)]);try{fs.rmSync(userDir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}catch(e){if(e.code!=='ENOTEMPTY')throw e;console.warn('Preview passed; temporary browser files will be cleared by the operating system.');}}
