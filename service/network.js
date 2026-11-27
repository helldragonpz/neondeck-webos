'use strict';
const https=require('https'),fs=require('fs'),zlib=require('zlib');
const UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/132.0 Safari/537.36';
function allowed(raw,hosts){const u=new URL(raw);if(u.protocol!=='https:'||!hosts.includes(u.hostname)||u.username||u.password||u.port)throw Error('Unsupported download source');return u;}
function request(raw,{hosts,max=2097152,file,timeout=45000,progress,signal,redirects=0}={}){
 return new Promise((resolve,reject)=>{
  let u;try{u=allowed(raw,hosts);}catch(e){reject(e);return;}
  let done=false,out,received=0;const chunks=[];
  const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);if(err){if(out)out.destroy();if(file)try{fs.unlinkSync(file);}catch(_){}reject(err);}else resolve(value);};
  const req=https.get(u,{signal,headers:{'User-Agent':UA,'Accept-Encoding':file?'identity':'gzip'},timeout:15000},res=>{
   if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();if(redirects>=4)return finish(Error('Too many redirects'));let next;try{next=allowed(new URL(res.headers.location,u).href,hosts).href;}catch(e){return finish(e);}request(next,{hosts,max,file,timeout,progress,signal,redirects:redirects+1}).then(v=>finish(null,v),finish);return;}
   if(res.statusCode!==200){res.resume();return finish(Error('Source returned '+res.statusCode));}
   const total=Number(res.headers['content-length'])||0;if(total>max){res.destroy();return finish(Error('Source is too large for this TV'));}
   const stream=res.headers['content-encoding']==='gzip'?res.pipe(zlib.createGunzip()):res;
   if(file){out=fs.createWriteStream(file,{mode:0o600});out.on('error',finish);out.on('finish',()=>finish(null,{bytes:received,total}));}
   stream.on('data',b=>{received+=b.length;if(received>max){req.destroy();stream.destroy();finish(Error('Download exceeds size limit'));return;}if(progress)progress(received,total);if(!file)chunks.push(b);});
   stream.on('error',finish);res.on('aborted',()=>finish(Error('Download interrupted')));
   if(file)stream.pipe(out);else stream.on('end',()=>finish(null,Buffer.concat(chunks)));
  });
  const timer=setTimeout(()=>{req.destroy();finish(Error('Download timed out'));},timeout);
  req.on('timeout',()=>req.destroy(Error('Source did not answer')));req.on('error',finish);
 });
}
module.exports={allowed,request};
