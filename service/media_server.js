'use strict';
// Loopback-only gallery with authenticated downloads and a fixed management bridge.
const fs=require('fs'),http=require('http'),path=require('path'),crypto=require('crypto');
const root=process.env.TANADOS_MEDIA_ROOT||'/var/lib/tanados-tv-wallpapers';
const port=Number(process.env.TANADOS_MEDIA_PORT||8775);
const token=process.env.TANADOS_MEDIA_TOKEN||fs.readFileSync('/var/lib/tanados-tv-dns/gallery.token','utf8').trim();
if(token.length<24)throw Error('Missing local gallery token');
let catalog,routes,body,stamp,provider;
function reload(){
 const current=fs.statSync(path.join(root,'catalog.json')).mtimeMs;
 if(current===stamp)return;
 const next=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
 if(next.version!==1||!Array.isArray(next.wallpapers)||next.wallpapers.length>64)throw Error('Invalid wallpaper catalogue');
 const list=new Map();let total=0;
 for(const item of next.wallpapers){
  item.bytes=0;
  if(!/^[a-z0-9-]{1,40}$/.test(item.id)||typeof item.title!=='string'||item.title.length>100)throw Error('Invalid wallpaper');
  for(const ext of ['mp4','jpg']){
   const file=path.join(root,item.id+'.'+ext),stat=fs.lstatSync(file);
   if(!stat.isFile()||stat.isSymbolicLink()||stat.size<16||stat.size>(ext==='mp4'?100:2)*1024*1024)throw Error('Invalid wallpaper asset');
   const url='/wallpaper/'+item.id+'.'+ext;
   if(list.has(url))throw Error('Duplicate wallpaper');
   total+=stat.size;item.bytes+=stat.size;list.set(url,{file,size:stat.size,type:ext==='mp4'?'video/mp4':'image/jpeg'});
  }
 }
 if(total>384*1024*1024)throw Error('Wallpaper library exceeds permitted size');
 catalog=next;routes=list;body=Buffer.from(JSON.stringify(catalog));stamp=current;
}
reload();
function json(res,status,value){const b=Buffer.from(JSON.stringify(value));res.writeHead(status,{'Content-Type':'application/json','Content-Length':b.length,'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'});res.end(b);}
function authorized(req){const supplied=Buffer.from(String(req.headers['x-tanados-token']||'')),secret=Buffer.from(token);return supplied.length===secret.length&&crypto.timingSafeEqual(supplied,secret);}
async function readBody(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>2048)throw Error('Request too large');}return JSON.parse(data||'{}');}
const server=http.createServer(async(req,res)=>{
 if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,x-tanados-token','Access-Control-Allow-Methods':'GET,HEAD,POST,OPTIONS'});res.end();return;}
 const url=new URL(req.url,'http://127.0.0.1');
 // Only fixed package-management routes reach the privileged local broker.
 if(/^\/apps\/(catalog|removable|status|install|remove)$/.test(url.pathname)||/^\/apps\/icon\/[A-Za-z0-9._-]{1,120}$/.test(url.pathname)){
  if(!url.pathname.startsWith('/apps/icon/')&&!authorized(req))return json(res,403,{error:'Authentication required'});
  if(url.pathname.startsWith('/apps/icon/')&&req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  let payload;try{payload=req.method==='POST'?Buffer.from(JSON.stringify(await readBody(req))):null;}catch(e){return json(res,400,{error:e.message});}
  const upstream=http.request({host:'127.0.0.1',port:Number(process.env.TANADOS_MANAGEMENT_PORT||8774),path:url.pathname+url.search,method:req.method,headers:{'X-Tanados-Token':token,...(payload?{'Content-Type':'application/json','Content-Length':payload.length}:{})},timeout:50000},r=>{res.writeHead(r.statusCode,{'Content-Type':r.headers['content-type']||'application/json','Access-Control-Allow-Origin':'*','Cache-Control':r.headers['cache-control']||'no-store'});r.pipe(res);});
  upstream.on('timeout',()=>upstream.destroy(Error('App Shop did not answer')));upstream.on('error',()=>{if(!res.headersSent)json(res,503,{error:'App Shop is not available yet'});else res.destroy();});upstream.end(payload);return;
 }

 if(['/online/search','/online/detail','/download','/download/status','/download/cancel','/online/preview','/remove','/cache/clear','/settings','/storage'].includes(url.pathname)){
  if(!authorized(req))return json(res,403,{error:'Local Home authentication required'});
  try{
   if(req.method==='GET'&&url.pathname==='/online/search')return json(res,200,await provider.search(url.searchParams.get('q'),Number(url.searchParams.get('page')||1)));
   if(req.method==='GET'&&url.pathname==='/online/detail')return json(res,200,await provider.details(url.searchParams.get('id')));
   if(req.method==='GET'&&url.pathname==='/download/status')return json(res,200,provider.status());
   if(req.method==='POST'&&url.pathname==='/download')return json(res,200,await (async()=>{const b=await readBody(req);return provider.install(b.id,b.quality||720);})());
   if(req.method==='POST'&&url.pathname==='/online/preview')return json(res,200,await provider.preview((await readBody(req)).id));
   if(req.method==='POST'&&url.pathname==='/download/cancel')return json(res,200,provider.cancel());
   if(req.method==='POST'&&url.pathname==='/cache/clear')return json(res,200,provider.clearCache());
   if(req.method==='GET'&&url.pathname==='/settings')return json(res,200,provider.prefs());
   if(req.method==='POST'&&url.pathname==='/settings')return json(res,200,provider.settings(await readBody(req)));
   if(req.method==='GET'&&url.pathname==='/storage')return json(res,200,require('./storage').state(root,provider.prefs()));
   if(req.method==='POST'&&url.pathname==='/remove')return json(res,200,provider.remove((await readBody(req)).id));
   return json(res,405,{error:'Method not allowed'});
  }catch(e){return json(res,400,{error:e.message});}
 }
 try{reload();}catch(e){return json(res,503,{error:'Wallpaper library unavailable'});}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
 if(req.url==='/catalog.json'){
  res.writeHead(200,{'Content-Type':'application/json','Content-Length':body.length,'Access-Control-Allow-Origin':'*','Cache-Control':'no-cache'});
  res.end(req.method==='HEAD'?undefined:body);return;
 }
 let asset=routes.get(req.url);
 const poster=/^\/online\/(mw-[a-f0-9]{16})\.(jpg|preview\.mp4)$/.exec(req.url);
 if(poster){const file=path.join(root,'online',poster[1]+'.'+poster[2]);try{const st=fs.lstatSync(file);if(st.isFile()&&!st.isSymbolicLink()&&st.size<(poster[2]==='jpg'?1:8)*1024*1024)asset={file,size:st.size,type:poster[2]==='jpg'?'image/jpeg':'video/mp4'};}catch(_){}}

 if(!asset){res.writeHead(404);res.end();return;}
 const {file,size,type}=asset;let start=0,end=size-1,partial=false;
 const range=req.headers.range;
 if(range){
  const m=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!m||(!m[1]&&!m[2])||(!m[1]&&Number(m[2])===0)){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return;}
  if(!m[1])start=Math.max(0,size-Number(m[2]));
  else{start=Number(m[1]);if(m[2])end=Math.min(size-1,Number(m[2]));}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start<0||start>=size){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return;}
  partial=true;
 }
 const headers={'Content-Type':type,'Accept-Ranges':'bytes','Content-Length':end-start+1,
  'Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=3600'};
 if(partial)headers['Content-Range']='bytes '+start+'-'+end+'/'+size;
 res.writeHead(partial?206:200,headers);
 if(req.method==='HEAD'){res.end();return;}
 const stream=fs.createReadStream(file,{start,end});
 stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
});
server.requestTimeout=10000;server.keepAliveTimeout=5000;
server.listen(port,'127.0.0.1',()=>{
 if(process.getuid()===0){process.setgroups([]);process.setgid(7779);process.setuid(7779);}
 provider=require('./wallpaper_provider.js').create({root,maxQuality:Number(process.env.TANADOS_MAX_QUALITY||1080),ffmpeg:process.env.TANADOS_FFMPEG||'/var/lib/tanados-tv-media-bin/ffmpeg'});
 console.log('Local wallpaper library ready: '+catalog.wallpapers.length+' videos');
});
