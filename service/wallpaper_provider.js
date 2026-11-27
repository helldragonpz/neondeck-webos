'use strict';
// Public metadata/media only; site scripts and advertising are never executed.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),os=require('os');
const net=require('./network'),storage=require('./storage');
const M=1048576,HOSTS=['moewalls.com','go.moewalls.com'];
const clean=s=>String(s).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#0?39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&#8211;|&#8212;/g,'–').replace(/&#\d+;/g,'').trim();
function urlSafe(raw,kind){const u=net.allowed(new URL(raw,'https://moewalls.com').href,['moewalls.com']);if(kind==='media'&&!/^\/wp-content\/uploads\/[A-Za-z0-9_./-]+\.(webm|mp4|jpg|jpeg|png)$/.test(u.pathname))throw Error('Unsupported media URL');return u;}
const fetchBytes=(url,max)=>net.request(url,{hosts:HOSTS,max});
function parseSearch(html){
 const hits=[];const re=/<h3\b[^>]*>[\s\S]*?<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/gi;let m;
 while((m=re.exec(html))&&hits.length<12){let u;try{u=urlSafe(m[1],'page');}catch(_){continue;}if(!/^\/[a-z-]+\/[a-z0-9-]+-live-wallpaper\/$/.test(u.pathname))continue;
  const id='mw-'+crypto.createHash('sha256').update(u.href).digest('hex').slice(0,16);
  if(!hits.some(h=>h.id===id))hits.push({id,title:clean(m[2]).replace(/ Live Wallpaper$/i,'').slice(0,100),source:u.href});
 }return hits;
}
function parsePage(html){
 const vm=/<source\b[^>]*src=["']([^"']+\.(?:webm|mp4))["']/i.exec(html),im=/<video\b[^>]*poster=["']([^"']+)["']/i.exec(html);
 if(!vm||!im)throw Error('No animated preview available');
 const tag=/<a\b[^>]*id=["']moe-download["'][^>]*>/i.exec(html),token=tag&&/data-url=["']([^"']+)["']/i.exec(tag[0]);
 const size=/<em>File Size<\/em>\s*([\d.]+)\s*(MB|GB|KB)/i.exec(html);
 let original='';if(token){let t=token[1];try{t=decodeURIComponent(t);}catch(_){}if(/^[A-Za-z0-9+/=]{20,600}$/.test(t))original='https://go.moewalls.com/download.php?video='+encodeURIComponent(t);}
 return {video:urlSafe(vm[1],'media').href,poster:urlSafe(im[1],'media').href,original,sourceBytes:size?Math.ceil(Number(size[1])*(size[2].toUpperCase()==='GB'?1024*M:size[2].toUpperCase()==='KB'?1024:M)):0};
}
function parseProbe(text){const line=text.split('\n').find(x=>/Video:/.test(x))||'',dim=/(\d{3,5})x(\d{3,5})/.exec(line),fps=/([\d.]+) fps/.exec(line),duration=/Duration:\s*(\d+):(\d+):([\d.]+)/.exec(text);if(!dim)throw Error('Could not read video resolution');return {width:Number(dim[1]),height:Number(dim[2]),fps:fps?Number(fps[1]):30,codec:/Video:\s*([^\s,]+)/.exec(line)?.[1]||'',duration:duration?Number(duration[1])*3600+Number(duration[2])*60+Number(duration[3]):0};}
function create({root,ffmpeg,fetcher=fetchBytes,download=net.request,maxQuality=2160}){
 const cache=path.join(root,'online');fs.mkdirSync(cache,{recursive:true});
 for(const n of fs.readdirSync(cache))if(/^mw-[a-f0-9]{16}(?:-\d+)?\.(input|part\.mp4)$/.test(n))try{fs.unlinkSync(path.join(cache,n));}catch(_){}
 let known={};try{known=JSON.parse(fs.readFileSync(path.join(cache,'index.json'),'utf8'));}catch(_){}
 let job={status:'idle'},child=null,busy=false,controller=null;
 const read=()=>JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
 const atomic=(file,data)=>{fs.writeFileSync(file+'.new',data,{mode:0o644});fs.renameSync(file+'.new',file);};
 const prefs=()=>{let p={};try{p=JSON.parse(fs.readFileSync(path.join(root,'settings.json'),'utf8'));}catch(_){}return {quotaMB:[128,256,384].includes(p.quotaMB)?p.quotaMB:256,warningMB:[64,128,256].includes(p.warningMB)?p.warningMB:128,reserveMB:64};};
 function settings(p){const old=prefs();if(p.quotaMB!==undefined&&!Number.isInteger(p.quotaMB)||p.warningMB!==undefined&&!Number.isInteger(p.warningMB))throw Error('Invalid storage setting');const next={...old,...p};if(![128,256,384].includes(next.quotaMB)||![64,128,256].includes(next.warningMB))throw Error('Invalid storage setting');atomic(path.join(root,'settings.json'),JSON.stringify({quotaMB:next.quotaMB,warningMB:next.warningMB}));return prefs();}
 function run(args,{progress,probe=false}={}){return new Promise((resolve,reject)=>{
  child=cp.spawn(ffmpeg,args,{stdio:['ignore','ignore','pipe']});const active=child;let tail='';try{os.setPriority(active.pid,19);}catch(_){}
  const timer=setTimeout(()=>active.kill('SIGKILL'),probe?15000:600000);
  active.stderr.on('data',b=>{tail=(tail+b).slice(-16000);if(progress)progress(tail);});active.on('error',e=>{clearTimeout(timer);child=null;reject(e);});active.on('close',code=>{clearTimeout(timer);child=null;if(probe)return resolve(parseProbe(tail));code===0?resolve(tail):reject(Error(job.status==='cancelled'?'Download cancelled':'Video conversion failed. Choose a lower quality.'));});
 });}
 function pruneCache(){const list=fs.readdirSync(cache).filter(n=>/^mw-[a-f0-9]{16}\.(jpg|preview\.mp4)$/.test(n)).map(name=>({name,...fs.statSync(path.join(cache,name))})).sort((a,b)=>a.mtimeMs-b.mtimeMs);let bytes=list.reduce((n,s)=>n+s.size,0),count=list.length;for(const f of list){if(bytes<=20*M&&count<=40)break;if(job.id&&f.name.startsWith(job.id))continue;try{fs.unlinkSync(path.join(cache,f.name));bytes-=f.size;count--;}catch(_){}}}
 async function details(id){const item=known[id];if(!item)throw Error('Search for this wallpaper again');let p;
  if(item._page&&Date.now()-(item._stamp||0)<3600000)p=item._page;else{p=parsePage((await fetcher(item.source,2*M)).toString());item._page=p;item._stamp=Date.now();}
  const dest=path.join(cache,id+'.jpg');if(!fs.existsSync(dest)){const poster=await fetcher(p.poster,M);if(poster[0]!==0xff||poster[1]!==0xd8)throw Error('Invalid preview image');atomic(dest,poster);pruneCache();}
  return {id:item.id,title:item.title,source:item.source,poster:'/online/'+id+'.jpg',qualities:[720,...(p.original&&maxQuality>=1080?[1080,...(maxQuality>=2160?[2160]:[])]:[])],sourceBytes:p.sourceBytes,_page:p,preview:fs.existsSync(path.join(cache,id+'.preview.mp4'))?'/online/'+id+'.preview.mp4':''};
 }
 async function search(query,page=1){const q=String(query||'').trim();if(q.length<2||q.length>70||!Number.isInteger(page)||page<1||page>20)throw Error('Enter 2–70 letters to search');
  const html=(await fetcher('https://moewalls.com/'+(page>1?'page/'+page+'/':'')+'?s='+encodeURIComponent(q),2*M)).toString(),hits=parseSearch(html);
  for(const h of hits)known[h.id]={...known[h.id],...h};known=Object.fromEntries(Object.entries(known).slice(-250));atomic(path.join(cache,'index.json'),JSON.stringify(known));
  return {results:hits.map(h=>({...h,poster:'/online/'+h.id+'.jpg',installed:read().wallpapers.some(w=>w.source===h.source)})),page};
 }
 async function install(id,quality=720,{preview=false}={}){
  quality=Number(quality);if(![720,1080,2160].includes(quality)||quality>maxQuality)throw Error('This quality is not supported on this TV');if(busy)throw Error('Another download is running; wait for it to finish or cancel');if(!known[id])throw Error('Search again to download this wallpaper');
  const asset=quality===720?id:id+'-'+quality,cat=read();const existing=cat.wallpapers.find(w=>w.id===asset);
  if(!preview&&existing){job={status:'ready',id:asset,kind:'wallpaper'};return {...job};}
  if(preview&&fs.existsSync(path.join(cache,id+'.preview.mp4'))){job={status:'ready',id,kind:'preview',preview:'/online/'+id+'.preview.mp4'};return {...job};}
  if(!preview&&cat.wallpapers.length>=64)throw Error('Library is full. Delete a wallpaper first.');
  busy=true;let detail,page;try{detail=await details(id);page=detail._page;if(quality>720&&!page.original)throw Error('Higher-resolution source is unavailable');
  const inputEstimate=quality>720?(page.sourceBytes||100*M):25*M,outputLimit=preview?6*M:quality===2160?96*M:quality===1080?48*M:25*M;
  storage.guard(root,inputEstimate+outputLimit+8*M,{...prefs(),finalBytes:preview?0:outputLimit});
  }catch(e){busy=false;throw e;}
  const outputLimit=preview?6*M:quality===2160?96*M:quality===1080?48*M:25*M;controller=new AbortController();const title=known[id].title;job={status:'downloading',id:asset,title,quality,kind:preview?'preview':'wallpaper',progress:0};
  (async()=>{const input=path.join(cache,asset+'.input'),output=path.join(cache,asset+'.part.mp4');let committed=false;
   try{
    await download(quality>720?page.original:page.video,{hosts:HOSTS,max:quality>720?180*M:25*M,file:input,timeout:180000,signal:controller.signal,progress:(n,t)=>{if(t)job.progress=Math.min(40,Math.round(n/t*40));}});
    if(job.status==='cancelled')throw Error('Download cancelled');
    const info=await run(['-hide_banner','-i',input],{probe:true});
    if(info.width>4096||info.height>2160)throw Error('Source exceeds this TV’s safe conversion limit. Use 720p for this wallpaper.');
    if(quality>720&&info.height<quality)throw Error('Source is below the requested resolution; no upscaling was performed');
    if(info.duration>90&&!preview)throw Error('This source loop is over 90 seconds. Choose another wallpaper.');
    job.status='converting';job.progress=45;const target=preview?360:quality,width=preview?640:quality===2160?3840:quality===1080?1920:1280;
    const copy=!preview&&quality===2160&&info.codec==='h264'&&info.height===2160&&info.fps<=30;
    const codec=copy?['-c:v','copy']:['-vf',`scale=w='min(${width},iw)':h=-2,fps=${preview?20:24}`,'-c:v','libx264','-threads','1','-filter_threads','1','-preset','ultrafast','-crf',preview?'27':quality===2160?'26':'23','-maxrate',quality===2160?'12M':quality===1080?'5M':'2500k','-bufsize',quality===2160?'24M':'8M','-profile:v','high','-level:v',quality===2160?'5.1':'4.1','-pix_fmt','yuv420p'];
    await run(['-hide_banner','-loglevel','error','-y','-threads','1','-i',input,'-map','0:v:0','-an',...(preview?['-t','6']:[]),...codec,'-movflags','+faststart','-fs',String(outputLimit),'-progress','pipe:2',output],{progress:text=>{const all=[...text.matchAll(/out_time_us=(\d+)/g)];if(all.length&&info.duration)job.progress=Math.min(98,45+Math.round(Number(all.at(-1)[1])/1000000/(preview?Math.min(6,info.duration):info.duration)*53));}});
    if(job.status==='cancelled')throw Error('Download cancelled');
    const actual=await run(['-hide_banner','-i',output],{probe:true});if(!preview&&quality>720&&actual.height<quality)throw Error('Requested resolution was not produced');if(!preview&&info.duration&&actual.duration+0.3<info.duration)throw Error('Video exceeds the size limit. Choose a lower quality.');
    if(preview){fs.renameSync(output,path.join(cache,id+'.preview.mp4'));fs.chmodSync(path.join(cache,id+'.preview.mp4'),0o644);job={status:'ready',id,title,kind:'preview',preview:'/online/'+id+'.preview.mp4',progress:100};pruneCache();return;}
    storage.guard(root,0,{...prefs(),finalBytes:fs.statSync(output).size+M});
    fs.renameSync(output,path.join(root,asset+'.mp4'));fs.chmodSync(path.join(root,asset+'.mp4'),0o644);fs.copyFileSync(path.join(cache,id+'.jpg'),path.join(root,asset+'.jpg'));
    const digest=await new Promise((resolve,reject)=>{const h=crypto.createHash('sha256'),s=fs.createReadStream(path.join(root,asset+'.mp4'));s.on('data',b=>h.update(b));s.on('error',reject);s.on('end',()=>resolve(h.digest('hex')));});
    const next=read();next.wallpapers.push({id:asset,title:quality>720?title+' · '+(quality===2160?'4K':'1080p'):title,source:known[id].source,durationLabel:actual.duration.toFixed(1)+' s',duration:actual.duration,width:actual.width,height:actual.height,quality,downloaded:true,sha256:digest});atomic(path.join(root,'catalog.json'),JSON.stringify(next,null,2));committed=true;job={status:'ready',id:asset,title,kind:'wallpaper',quality,progress:100};
   }catch(e){if(job.status!=='cancelled')job={status:'error',id:asset,title,error:e.message,progress:0};}
   finally{busy=false;controller=null;for(const file of [input,output])try{fs.unlinkSync(file);}catch(_){}if(!preview&&!committed)for(const ext of ['mp4','jpg'])try{fs.unlinkSync(path.join(root,asset+'.'+ext));}catch(_){}}
  })();return {...job};
 }
 function remove(id){const cat=read(),w=cat.wallpapers.find(w=>w.id===id);if(!w)throw Error('Wallpaper not found');if(job.id===id&&['downloading','converting'].includes(job.status))throw Error('Cancel its download first');cat.wallpapers=cat.wallpapers.filter(w=>w.id!==id);atomic(path.join(root,'catalog.json'),JSON.stringify(cat,null,2));for(const ext of ['mp4','jpg'])try{fs.unlinkSync(path.join(root,id+'.'+ext));}catch(_){}return {removed:id};}
 function cancel(){if(!['downloading','converting'].includes(job.status))return {...job};job.status='cancelled';if(controller)controller.abort();if(child)child.kill('SIGTERM');return {...job};}
 function clearCache(){if(['downloading','converting'].includes(job.status))throw Error('Wait for the current download');let freed=0;for(const n of fs.readdirSync(cache))if(/^mw-[a-f0-9]{16}\.(jpg|preview\.mp4)$/.test(n)){const f=path.join(cache,n);freed+=fs.statSync(f).size;fs.unlinkSync(f);}return {freed};}
 return {search,details:async id=>{const d=await details(id);delete d._page;return d;},install,preview:id=>install(id,720,{preview:true}),status:()=>({...job}),remove,cancel,clearCache,prefs,settings};
}
module.exports={create,parseSearch,parsePage,parseProbe,urlSafe,fetchBytes};
