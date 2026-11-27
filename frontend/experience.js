/* Clock, immediate pointer previews and incremental menu focus. ES5 for the TV. */
(function () {
  if (!window.TANADOS_UI) return;
  var state=window.TANADOS_UI,root=document.documentElement;
  function get(k,d){try{var v=localStorage.getItem('neondeck.'+k);return v===null?d:v;}catch(_){return d;}}
  function put(k,v){try{localStorage.setItem('neondeck.'+k,String(v));}catch(_){}apply();}
  function options(title,key,values,def){openMenu(title,values.map(function(v){return {label:v[0],sub:get(key,def)===String(v[1])?'Selected':'',stay:true,fn:function(){put(key,v[1]);backMenu();}};}));}
  function clockMenu(){openBuilt('Clock',function(){return [
    {label:'Clock style',sub:get('clockStyle','panel'),stay:true,fn:function(){options('Clock style','clockStyle',[['Clean','clean'],['Glass panel','panel'],['Large digits','hero'],['Analogue','analog'],['Original launcher clock','original'],['Hidden','off']],'panel');}},
    {label:'Time format',sub:get('clockFormat','24')+' hour',stay:true,fn:function(){options('Time format','clockFormat',[['24 hour','24'],['12 hour','12']],'24');}},
    {label:'Show date',sub:get('clockDate','on'),stay:true,fn:function(){put('clockDate',get('clockDate','on')==='on'?'off':'on');}},
    {label:'Show seconds',sub:get('clockSeconds','off'),stay:true,fn:function(){put('clockSeconds',get('clockSeconds','off')==='on'?'off':'on');}},
    {label:'Clock position',sub:get('clockPosition','left'),stay:true,fn:function(){options('Clock position','clockPosition',[['Top left','left'],['Top centre','center']],'left');}},
    {label:'Clock language',sub:get('clockLanguage','en-GB'),stay:true,fn:function(){options('Clock language','clockLanguage',[['English','en-GB'],['Bulgarian','bg-BG']],'en-GB');}},
    {label:'Clock timezone',sub:get('clockZone','Europe/Sofia'),stay:true,fn:function(){options('Clock timezone','clockZone',[['Bulgaria / Sofia','Europe/Sofia'],['TV local time','local'],['London','Europe/London'],['New York','America/New_York'],['Los Angeles','America/Los_Angeles']],'Europe/Sofia');}}
  ];});}
  function motionMenu(){openBuilt('Motion & performance',function(){return [
    {label:'Button animations',sub:get('motion','subtle'),stay:true,fn:function(){options('Button animations','motion',[['Off / fastest','off'],['Subtle','subtle'],['Expressive','expressive']],'subtle');}},
    {label:'Pause wallpaper in menus',sub:get('menuPause','on'),stay:true,fn:function(){put('menuPause',get('menuPause','on')==='on'?'off':'on');syncMenuVideo();}},
    {note:'Focus updates reuse menu rows. Pointer previews follow focus immediately. Short transform animations avoid expensive blur effects.'}
  ];});}
  var originalBuilt=openBuilt;
  openBuilt=function(title,build,idx){if(title==='Theme & appearance'){var buildOld=build;build=function(){var extra=[{label:'Clock',stay:true,fn:clockMenu},{label:'Motion & performance',stay:true,fn:motionMenu}];if(apps.some(function(a){return a.id==='org.neondeck.setup';}))extra.push({label:'Install & USB setup',fn:function(){launch('org.neondeck.setup');}});return extra.concat(buildOld());};}return originalBuilt(title,build,idx);};
  // The stock menu rebuilds every row on every arrow press. Reuse rows when only focus changes.
  var originalMenu=drawMenu,lastMenu=null,lastItems=null,lastStart=-1,lastTab=-1,lastIdx=-1,lastShop=false,lastTitle='';
  state.menuFullDraws=0;state.menuFocusUpdates=0;
  function windowStart(m,win){var n=m.tabs?7:8;return typeof win==='number'?Math.max(0,Math.min(win,m.items.length-n)):Math.max(0,Math.min(m.idx-3,m.items.length-n));}
  function syncMenuVideo(){var v=document.getElementById('tanados-motion'),pause=!!stack.length&&get('menuPause','on')==='on';if(!v)return;if(pause&&!v.paused){v.pause();state.menuVideoPaused=true;}else if(!pause&&state.menuVideoPaused){state.menuVideoPaused=false;if(!document.hidden&&state.motion){var p=v.play();if(p&&p.catch)p.catch(function(){});}}}
  function pointerPreview(ev){var row=ev.target.closest?ev.target.closest('.row'):null,m=stack[stack.length-1];if(!row||!m||!ovEl.contains(row))return;var n=Number(row.getAttribute('data-i'));if(n===m.idx)return;ev.stopPropagation();m.idx=n;drawMenu(m.start||0);}
  drawMenu=function(win){var m=stack[stack.length-1];if(!m)return originalMenu(win);var start=windowStart(m,win);
    if(ovEl&&ovEl.isConnected&&m===lastMenu&&m.items===lastItems&&start===lastStart&&m.tab===lastTab&&!!m.appshop===lastShop&&m.title===lastTitle&&m.idx!==lastIdx){
      var old=ovEl.querySelector('.row.f'),next=ovEl.querySelector('.row[data-i="'+m.idx+'"]');if(old)old.classList.remove('f');if(next)next.classList.add('f');drawSide(m.items.some(function(x){return x.desc!==undefined;})&&!skip(m.items[m.idx])?m.items[m.idx]:null);state.menuFocusUpdates++;
    }else{originalMenu(win);state.menuFullDraws++;if(ovEl&&!ovEl._ndPointer){ovEl._ndPointer=true;ovEl.addEventListener('mousemove',pointerPreview,true);ovEl.addEventListener('pointermove',pointerPreview,true);}}
    lastMenu=m;lastItems=m.items;lastStart=start;lastTab=m.tab;lastIdx=m.idx;lastShop=!!m.appshop;lastTitle=m.title;syncMenuVideo();
  };
  var originalClose=closeMenus;
  closeMenus=function(){originalClose();lastMenu=null;lastItems=null;syncMenuVideo();};
  // Stop background video in a menu even when the initial preview restarted it.
  var originalSide=drawSide;drawSide=function(it){originalSide(it);syncMenuVideo();};
  document.addEventListener('click',function(e){var el=e.target.closest&&e.target.closest('.tile,.pill,.row');if(!el||get('motion','subtle')==='off')return;el.classList.add('nd-press');setTimeout(function(){el.classList.remove('nd-press');},180);},true);
  var clock=document.createElement('div');clock.id='neondeck-clock';clock.setAttribute('aria-label','Clock');clock.innerHTML='<div class="nd-dial"><i class="nd-hand nd-hour"></i><i class="nd-hand nd-minute"></i><i class="nd-hand nd-second"></i><b></b></div><div class="nd-clock-copy"><div class="nd-time"></div><div class="nd-date"></div></div>';document.body.appendChild(clock);
  var timer=0,format=null,dateFormat=null,clockSignature='';
  function tickClock(){clearTimeout(timer);if(document.hidden)return;var now=new Date(),time,date;
    try{time=format.format(now);date=dateFormat.format(now);}catch(_){time=('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2);date=now.toDateString();}
    var t=clock.querySelector('.nd-time'),d=clock.querySelector('.nd-date');if(t.textContent!==time)t.textContent=time;if(d.textContent!==date)d.textContent=date;
    if(get('clockStyle','panel')==='analog'){var parts;try{parts=new Intl.DateTimeFormat('en-GB',{timeZone:get('clockZone','Europe/Sofia')==='local'?undefined:get('clockZone','Europe/Sofia'),hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);}catch(_){parts=[];}var values={};parts.forEach(function(p){values[p.type]=Number(p.value);});var h=values.hour||0,m=values.minute||0,s=values.second||0;clock.querySelector('.nd-hour').style.transform='rotate('+(h*30+m/2)+'deg)';clock.querySelector('.nd-minute').style.transform='rotate('+(m*6+s/10)+'deg)';clock.querySelector('.nd-second').style.transform='rotate('+(s*6)+'deg)';}
    timer=setTimeout(tickClock,get('clockSeconds','off')==='on'?1000-now.getMilliseconds():60000-now.getSeconds()*1000-now.getMilliseconds());
  }
  function apply(){var style=get('clockStyle','panel'),zone=get('clockZone','Europe/Sofia'),lang=get('clockLanguage','en-GB'),seconds=get('clockSeconds','off')==='on';root.setAttribute('data-nd-clock',style);root.setAttribute('data-nd-motion',get('motion','subtle'));clock.setAttribute('data-position',get('clockPosition','left'));clock.setAttribute('data-date',get('clockDate','on'));clock.setAttribute('data-seconds',seconds?'on':'off');
    var sig=[zone,lang,seconds,get('clockFormat','24')].join('|');if(sig!==clockSignature){clockSignature=sig;try{var opts={hour:'2-digit',minute:'2-digit',hour12:get('clockFormat','24')==='12'};if(zone!=='local')opts.timeZone=zone;if(seconds)opts.second='2-digit';format=new Intl.DateTimeFormat(lang,opts);var dateOpts={weekday:'short',day:'numeric',month:'long'};if(zone!=='local')dateOpts.timeZone=zone;dateFormat=new Intl.DateTimeFormat(lang,dateOpts);}catch(_){format=null;}}
    tickClock();state.clockStyle=style;state.buttonMotion=get('motion','subtle');
  }
  document.addEventListener('visibilitychange',function(){if(document.hidden)clearTimeout(timer);else tickClock();});window.addEventListener('focus',tickClock);apply();
})();
