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
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),p=u.pathname;
 const json=o=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(o));};
 if(p==='/home.html'){res.writeHead(200,{'Content-Type':'text/html'});return res.end(page);}
 if(p==='/personal-key.js'){res.writeHead(200,{'Content-Type':'application/javascript'});return res.end('window.TANADOS_LOCAL_TOKEN="public-preview-fixture-no-secret";');}
 if(p.endsWith('.jpg')){res.writeHead(200,{'Content-Type':'image/svg+xml'});return res.end(art);}
 if(p.includes('/icon/')){res.writeHead(200,{'Content-Type':'image/svg+xml'});return res.end(icon);}
 if(p.endsWith('.mp4')){res.writeHead(404);return res.end();}
 if(p==='/api/apps')return json({apps,config:{clock:'24',topbar:[{label:'Inputs',icon:'inputs',action:'inputs'},{label:'Apps',icon:'grid',action:'apps'},{label:'App Shop',icon:'shop',action:'tanados-shop'},{label:'Wallpapers',icon:'photo',action:'tanados-wallpapers'},{label:'Settings',icon:'settings',app:'com.palm.app.settings'}],dock:apps.map(a=>a.id),theme},usage:{},version:'1.6.32'});
 if(p==='/api/inputs')return json({devices:[]});
 if(p==='/media/catalog.json')return json({version:1,wallpapers:catalogue});
 if(p==='/media/online/search')return json({page:1,results:[{id:'mw-0123456789abcdef',title:'Neon Geometry',source:'https://moewalls.com/fantasy/example-live-wallpaper/',poster:'/online/example.jpg'},{id:'mw-0123456789abcdee',title:'Crystal Geometry',poster:'/online/example.jpg'}]});
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
 await evaluate('closeMenus();act({_o:{action:"tanados-wallpapers"}});0');await pick('Seasonal wallpapers');await shot('holidays');
 await evaluate('closeMenus();act({_o:{action:"tanados-shop"}});0');await sleep(500);await shot('shop');
 await evaluate('closeMenus();act({_o:{action:"tanados-wallpapers"}});0');await pick('Storage & delete');await shot('storage');
}finally{if(ws)ws.close();chrome.kill();server.close();fs.rmSync(userDir,{recursive:true,force:true});}
