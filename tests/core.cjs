'use strict';
// Synthetic fixtures only. These tests never contact or modify a TV.
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const provider=require('../service/wallpaper_provider'),store=require('../service/app_store'),network=require('../service/network');
const {extract}=require('../service/management_server'),storage=require('../service/storage'),cal=require('../frontend/seasonal');
let count=0;function check(name,fn){fn();count++;console.log('ok '+name);}
const html='<video poster="https://moewalls.com/wp-content/uploads/test.jpg"><source src="https://moewalls.com/wp-content/uploads/test.webm"></video><a id="moe-download" data-url="QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo="></a><em>File Size</em> 7.5 MB';
const sleep=()=>new Promise(r=>setTimeout(r,30));
(async()=>{
 check('original and preview media are separate',()=>{const p=provider.parsePage(html);assert(p.video.endsWith('.webm'));assert(p.original.startsWith('https://go.moewalls.com/download.php?video='));assert.equal(p.sourceBytes,7864320);});
 check('search result metadata has stable safe IDs',()=>{const p=provider.parseSearch('<h3><a href="https://moewalls.com/fantasy/example-live-wallpaper/">Example Live Wallpaper</a></h3>');assert.equal(p[0].title,'Example');assert.match(p[0].id,/^mw-[a-f0-9]{16}$/);});
 check('actual 4K metadata parses',()=>assert.deepEqual(provider.parseProbe('Duration: 00:00:07.63\nVideo: h264 (High), yuv420p, 3840x2160, 24 fps'),{width:3840,height:2160,fps:24,codec:'h264',duration:7.63}));
 check('HTTPS sources reject arbitrary hosts, credentials and ports',()=>{for(const u of ['http://moewalls.com/x','https://localhost/x','https://x@moewalls.com/x','https://moewalls.com:8443/x'])assert.throws(()=>network.allowed(u,['moewalls.com']));});
 check('Luna subscriptions preserve braces inside strings',()=>{const p=extract('notice {"message":"a } b","o":{"x":1}}\n{"finished":true}');assert.equal(p.messages.length,2);assert.equal(p.messages[0].message,'a } b');});
 check('storage reads exact available bytes',()=>assert.equal(storage.parseDf('Filesystem 1024-blocks Used Available Capacity Mounted on\noverlay 738304 200000 538304 27% /var\n')[0].free,538304*1024));
 check('Orthodox Easter and optional holidays',()=>{assert.equal(cal.easter(2027).toISOString().slice(0,10),'2027-05-02');assert.equal(cal.season('2026-11-20T12:00:00Z',{christmasStart:'11-15'}),'christmas');assert.equal(cal.season('2026-12-31T12:00:00Z',{newyear:true}),'newyear');assert.equal(cal.season('2026-10-31T12:00:00Z'),'');assert.equal(cal.season('2026-10-31T12:00:00Z',{halloween:true}),'halloween');});
 check('package IDs and checksums are required',()=>{assert.throws(()=>store.idSafe('foo;poweroff'));assert.throws(()=>store.normalize({id:'com.example.app',manifest:{ipkUrl:'https://github.com/example/app.ipk'}}));});
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'neondeck-test-'));
 try{
  const library=path.join(root,'library');fs.mkdirSync(library);fs.writeFileSync(path.join(library,'catalog.json'),JSON.stringify({version:1,wallpapers:[{id:'example',title:'Example'}]}));fs.writeFileSync(path.join(library,'example.mp4'),'synthetic');fs.writeFileSync(path.join(library,'example.jpg'),'synthetic');
  const p=provider.create({root:library,ffmpeg:'unused',maxQuality:720});p.remove('example');
  check('deleting the last wallpaper keeps an empty catalogue across restart',()=>{provider.create({root:library,ffmpeg:'unused'});assert.deepEqual(JSON.parse(fs.readFileSync(path.join(library,'catalog.json'))).wallpapers,[]);assert(!fs.existsSync(path.join(library,'example.mp4')));assert.equal(storage.usage(library).bytes,0);});
  let release;const gate=new Promise(r=>{release=r;});let gated=true;
  const fetcher=async u=>{if(u.endsWith('.jpg'))return Buffer.from([255,216,255,217]);if(u.includes('?s='))return Buffer.from('<h3><a href="https://moewalls.com/fantasy/example-live-wallpaper/">Example Live Wallpaper</a></h3>');if(gated)await gate;return Buffer.from(html);};
  const limited=provider.create({root:library,ffmpeg:'unused',maxQuality:720,fetcher,download:async()=>{throw Error('synthetic download');}});const found=await limited.search('example');const pending=limited.install(found.results[0].id,720);await assert.rejects(limited.install(found.results[0].id,720),/Another download/);release();await pending;limited.cancel();await sleep();gated=false;
  check('only one wallpaper operation can enter preparation',()=>assert(true));
  assert.deepEqual((await limited.details(found.results[0].id)).qualities,[720]);count++;console.log('ok quality list respects the installation limit');
  let local=[],foreground='com.webos.app.home',seen;
  const manifest={id:'com.example.puzzle',title:'Puzzle',version:'1.0.0',ipkUrl:'https://github.com/example/puzzle/releases/download/v1/app.ipk',ipkHash:{sha256:'a'.repeat(64)},ipkSize:1000};
  const catalogue=async()=>Buffer.from(JSON.stringify({packages:[{id:manifest.id,title:'Puzzle',category:'game',manifest}]}));
  const luna=async(uri,data,options)=>{if(uri.endsWith('/listApps'))return {apps:local};if(uri.endsWith('/getForegroundAppInfo'))return {appId:foreground};if(uri.endsWith('/install')){seen=data;options.onMessage({progress:50});local=[{...manifest,removable:true}];return {finished:true};}if(uri.endsWith('/uninstall')){local=[];return {statusText:'Finished'};}throw Error(uri);};
  const client=store.create({dir:path.join(root,'store'),luna,fetcher:catalogue,freeBytes:async()=>500*1048576});
  assert.equal((await client.list()).apps[0].id,manifest.id);await client.install(manifest.id);await sleep();
  check('verified install uses the repository SHA256',()=>{assert.equal(client.status().status,'ready');assert.equal(seen.ipkHash,manifest.ipkHash.sha256);assert.equal(seen.ipkUrl,manifest.ipkUrl);});
  foreground=manifest.id;await assert.rejects(client.remove(manifest.id),/Close this app/);foreground='com.webos.app.home';await client.remove(manifest.id);await sleep();
  check('confirmed removal completes',()=>assert.equal(client.status().status,'ready'));
  for(const id of ['org.webosbrew.hbchannel','com.webos.app.browser','com.palm.app.settings'])await assert.rejects(client.remove(id));count++;console.log('ok core apps are protected');
  let unlock;const held=new Promise(r=>{unlock=r;});const slow=store.create({dir:path.join(root,'slow'),luna,fetcher:async()=>{await held;return catalogue();},freeBytes:async()=>500*1048576});const operation=slow.install(manifest.id);await assert.rejects(slow.remove(manifest.id),/Another app/);unlock();await operation;await sleep();count++;console.log('ok app install and remove cannot overlap during preparation');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
 console.log('PASS '+count+' core checks');
})().catch(e=>{console.error(e);process.exitCode=1;});
