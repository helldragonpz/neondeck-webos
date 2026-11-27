'use strict';
// Authenticated loopback broker. No arbitrary URLs, filesystem paths or shell commands.
const http=require('http'),fs=require('fs'),crypto=require('crypto'),cp=require('child_process');
function extract(buffer){const out=[];let start=-1,depth=0,string=false,escape=false,last=0;for(let i=0;i<buffer.length;i++){const c=buffer[i];if(start<0){if(c==='{'){start=i;depth=1;}continue;}if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;continue;}if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){out.push(JSON.parse(buffer.slice(start,i+1)));last=i+1;start=-1;}}return {messages:out,rest:buffer.slice(start>=0?start:last)};}
function luna(uri,data,{subscribe=false,onMessage,finished,timeout=12000}={}){return new Promise((resolve,reject)=>{
 if(!/^[A-Za-z0-9.]+\/[A-Za-z0-9/]+$/.test(uri))return reject(Error('Invalid service operation'));
 const child=cp.spawn('luna-send',[...(subscribe?['-i']:['-n','1']),'-w',String(timeout),'luna://'+uri,JSON.stringify(data)],{stdio:[subscribe?'pipe':'ignore','pipe','pipe']});let buffer='',ended=false;
 const finish=(e,result)=>{if(ended)return;ended=true;clearTimeout(timer);child.kill();e?reject(e):resolve(result);};
 const timer=setTimeout(()=>finish(Error('TV service did not finish in time')),timeout);
 child.stdout.on('data',b=>{buffer+=b;if(buffer.length>2*1048576)return finish(Error('TV reply too large'));try{const parsed=extract(buffer);buffer=parsed.rest;for(const m of parsed.messages){if(m.returnValue===false)return finish(Error(m.errorText||'TV service refused operation'));if(onMessage)onMessage(m);if(!subscribe||finished&&finished(m))return finish(null,m);}}catch(e){finish(e);}});
 child.on('error',e=>finish(e));child.on('exit',code=>{if(!ended)finish(Error('TV service ended before completion'));});
});}
function start(){
const token=process.env.TANADOS_MEDIA_TOKEN||fs.readFileSync('/var/lib/tanados-tv-dns/gallery.token','utf8').trim();
const appStore=require('./app_store').create({dir:process.env.TANADOS_MANAGEMENT_DIR||'/var/lib/tanados-tv/appstore',luna,freeBytes:async()=>require('./storage').volume('/media/developer').free});
function authorized(req){const a=Buffer.from(String(req.headers['x-tanados-token']||'')),b=Buffer.from(token);return a.length===b.length&&crypto.timingSafeEqual(a,b);}
const json=(res,status,d)=>{const b=Buffer.from(JSON.stringify(d));res.writeHead(status,{'Content-Type':'application/json','Content-Length':b.length,'Cache-Control':'no-store'});res.end(b);};
async function body(req){let s='';for await(const b of req){s+=b;if(s.length>2048)throw Error('Request too large');}return JSON.parse(s||'{}');}
const server=http.createServer(async(req,res)=>{
 if(!authorized(req))return json(res,403,{error:'Authentication required'});
 try{
  const u=new URL(req.url,'http://127.0.0.1');
  if(req.method==='GET'&&u.pathname==='/apps/catalog')return json(res,200,await appStore.list({q:u.searchParams.get('q')||'',category:u.searchParams.get('category')||'',force:u.searchParams.get('refresh')==='1'}));
  if(req.method==='GET'&&u.pathname==='/apps/removable')return json(res,200,{apps:await appStore.removable()});
  if(req.method==='GET'&&u.pathname==='/apps/status')return json(res,200,appStore.status());
  if(req.method==='POST'&&u.pathname==='/apps/install')return json(res,200,await appStore.install((await body(req)).id));
  if(req.method==='POST'&&u.pathname==='/apps/remove')return json(res,200,await appStore.remove((await body(req)).id));
  const icon=/^\/apps\/icon\/([A-Za-z0-9._-]{1,120})$/.exec(u.pathname);
  if(icon&&req.method==='GET'){const b=await appStore.icon(icon[1]);res.writeHead(200,{'Content-Type':b[0]===0x89?'image/png':'image/jpeg','Content-Length':b.length,'Cache-Control':'public,max-age=3600'});res.end(b);return;}
  return json(res,404,{error:'Not found'});
 }catch(e){return json(res,400,{error:e.message});}
});
server.requestTimeout=10000;server.listen(Number(process.env.TANADOS_MANAGEMENT_PORT||8774),'127.0.0.1',()=>console.log('Local app management ready'));
return server;
}
if(require.main===module)start();
module.exports={extract,luna,start};
