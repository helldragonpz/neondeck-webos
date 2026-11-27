/* Analyse a small local poster once per wallpaper change; never sample the video loop. */
(function(){
  if(!window.NEONDECK_HOME||!window.NEONDECK_PALETTE)return;
  var home=NEONDECK_HOME,model=NEONDECK_PALETTE,root=document.documentElement,state=TANADOS_UI,current=null,serial=0,cache={},active=null;
  function get(k,d){try{var v=localStorage.getItem('neondeck.'+k);return v===null?d:v;}catch(_){return d;}}
  function save(k,v){try{localStorage.setItem('neondeck.'+k,String(v));}catch(_){}}
  function notify(){var e=document.createEvent('Event');e.initEvent('neondeck:theme',false,false);window.dispatchEvent(e);}
  function apply(p,mode){active=p;state.autoThemeError='';root.style.setProperty('--personal-accent',p.accent);root.style.setProperty('--personal-accent-rgb',p.rgb);root.style.setProperty('--personal-secondary',p.secondary);root.style.setProperty('--personal-panel',p.panel);root.style.setProperty('--personal-on-accent',p.onAccent);root.style.setProperty('--acc',p.accent);root.style.setProperty('--focus',p.accent);root.setAttribute('data-auto-theme',mode);state.autoTheme=mode==='on';state.activeAccent=p.accent;state.activeSecondary=p.secondary;state.paletteSource=current&&current.id||'';notify();}
  function manual(){var value=home.palettes[home.get('tanados.palette','violet')]||home.palettes.violet;var c=[parseInt(value.slice(1,3),16),parseInt(value.slice(3,5),16),parseInt(value.slice(5,7),16)];apply({accent:value,secondary:model.hex(model.rgb(model.hsl.apply(null,c)[0]+42,.6,.72)),panel:'#101524',rgb:c.join(','),onAccent:'#101521'},'off');}
  function refresh(){var token=++serial;if(get('autoTheme','on')!=='on'){serial++;manual();return;}if(!current){apply({accent:'#c7b0ff',secondary:'#a1e8ff',panel:'#101524',rgb:'199,176,255',onAccent:'#101521'},'on');return;}
    var key=current.id+'|'+(current.sha256||''),stored;try{stored=JSON.parse(get('palette.'+current.id,''));}catch(_){}if(cache[key]||stored&&stored.key===key){apply(cache[key]||stored.palette,'on');return;}
    var image=new Image();image.crossOrigin='anonymous';image.onload=function(){if(token!==serial)return;try{var canvas=document.createElement('canvas');canvas.width=64;canvas.height=36;var ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,64,36);var palette=model.derive(ctx.getImageData(0,0,64,36).data);cache[key]=palette;save('palette.'+current.id,JSON.stringify({key:key,palette:palette}));try{var keys=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf('neondeck.palette.')===0)keys.push(k);}if(keys.length>64)localStorage.removeItem(keys[0]);}catch(_){}apply(palette,'on');}catch(_){state.autoThemeError='Preview colours unavailable';}image.onload=null;image.onerror=null;};image.onerror=function(){if(token===serial)state.autoThemeError='Preview colours unavailable';};image.src=home.media+'/wallpaper/'+current.id+'.jpg';
  }
  function setMode(mode){save('autoTheme',mode==='on'?'on':'off');refresh();}
  window.NEONDECK_THEME={refresh:refresh,setMode:setMode,mode:function(){return get('autoTheme','on');},palette:function(){return active;},wallpaper:function(){return current;}};
  window.addEventListener('neondeck:wallpaper',function(e){current=e.detail;refresh();});
  var id=state.wallpaper||home.selected();if(id)current=home.library().filter(function(w){return w.id===id;})[0]||{id:id};refresh();
})();
