'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const provider=require('../service/wallpaper_provider');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function finished(p){for(let n=0;n<100;n++){const s=p.status();if(['ready','error'].includes(s.status))return s;await sleep(30);}throw Error('Fixture conversion timed out');}
(async()=>{
 assert(provider.conversionTimeout({duration:50.25},2160)>20*60000);assert(provider.conversionTimeout({duration:10000},2160)<=45*60000);
 assert.deepEqual(provider.targetSize({width:3840,height:1608},1080),{width:1920,height:804});assert(provider.supportsQuality({width:3840,height:1608},2160));assert(!provider.supportsQuality({width:2560,height:1080},2160));
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'neondeck-downloads-'));
 try{
  fs.writeFileSync(path.join(root,'catalog.json'),JSON.stringify({version:1,wallpapers:[]}));const ff=path.join(root,'fake-ffmpeg');
  fs.writeFileSync(ff,`#!/usr/bin/env node
const fs=require('fs'),path=require('path'),args=process.argv.slice(2),input=args[args.indexOf('-i')+1],info=JSON.parse(fs.readFileSync(input)),marker=path.join(__dirname,'fail-once');
if(!args.includes('-y')){console.error('Duration: 00:00:'+info.duration+'\\nVideo: h264, yuv420p, '+info.width+'x'+info.height+', 24 fps');process.exit(1);}
setTimeout(()=>{if(!fs.existsSync(marker)){fs.writeFileSync(marker,'failed');console.error('Cannot allocate memory');process.exit(1);}fs.writeFileSync(args[args.length-1],JSON.stringify(info));process.exit(0);},500);
`,{mode:0o755});
  const pages='<h3><a href="https://moewalls.com/fantasy/long-example-live-wallpaper/">'+'Long title '.repeat(12)+'</a></h3><h3><a href="https://moewalls.com/fantasy/other-example-live-wallpaper/">Other</a></h3>';
  const html='<video poster="https://moewalls.com/wp-content/uploads/example.jpg"><source src="https://moewalls.com/wp-content/uploads/example.webm"></video><a id="moe-download" data-url="QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo="></a><em>File Size</em> 1 MB';
  const fetcher=async url=>Buffer.from(url.endsWith('.jpg')?[255,216,255,217]:url.includes('?s=')?pages:html);let downloads=0;
  const options={root,ffmpeg:ff,fetcher,download:async(_url,{file})=>{downloads++;fs.writeFileSync(file,JSON.stringify({width:3840,height:2160,duration:50.25}));}};
  let p=provider.create(options);const result=await p.search('example'),id=result.results[0].id;await p.install(id,2160);
  for(let n=0;n<100&&p.status().status!=='converting';n++)await sleep(10);
  const cache=path.join(root,'online'),poster=path.join(cache,id+'.jpg');fs.utimesSync(poster,0,0);
  for(let n=0;n<44;n++)fs.writeFileSync(path.join(cache,'mw-'+n.toString(16).padStart(16,'0')+'.jpg'),'cache');
  await p.details(result.results[1].id);assert(fs.existsSync(poster),'active 4K poster was evicted by browsing');
  let job=await finished(p);assert.equal(job.status,'error');assert.match(job.error,/memory/);assert(job.canRetry);assert(fs.existsSync(path.join(cache,'retry-source.input')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'download-history.json')))[0].quality,2160);
  p=provider.create(options);assert.equal(p.status().status,'error');await p.install(id,2160);job=await finished(p);assert.equal(job.status,'ready');assert.equal(downloads,1,'retry downloaded the original again');
  const cat=JSON.parse(fs.readFileSync(path.join(root,'catalog.json')));assert.equal(cat.wallpapers.length,1);assert(cat.wallpapers[0].title.length<=100);assert.equal(cat.wallpapers[0].width,3840);assert(!fs.existsSync(path.join(cache,'retry-source.input')));
  console.log('PASS long 4K timeout, aspect ratios, poster pinning, retained errors, source reuse and valid catalogue titles');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
