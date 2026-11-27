/* Complete holiday icon sets: one local renderer for Home, Apps and navigation. */
(function(){
  if(!window.NEONDECK_HOME||!window.NEONDECK_HOLIDAY_ART)return;
  var root=document.documentElement,state=TANADOS_UI,queued=false,originalSvg=svg;
  var names={christmas:'Christmas',easter:'Easter',newyear:'New Year',halloween:'Halloween'};
  var colours={christmas:['#ffdb92','255,219,146'],easter:['#d2ffc3','210,255,195'],newyear:['#ffe69c','255,230,156'],halloween:['#ffb16e','255,177,110']};
  function mode(){var v='auto';try{v=localStorage.getItem('neondeck.holidayIcons')||localStorage.getItem('neondeck.holidayAccents')||v;}catch(_){}return v==='auto'||v==='off'||names[v]?v:'auto';}
  function active(){var m=mode();return m==='auto'?(state.seasonal&&names[state.season]?state.season:''):names[m]?m:'';}
  function icon(kind,name,label){return NEONDECK_HOLIDAY_ART.icon(kind,name,label);}
  svg=function(name){var kind=active(),art=kind&&NEONDECK_HOLIDAY_ART.supports(name)?icon(kind,name):originalSvg(name);return art.replace('<svg ','<svg data-nd-base-icon="'+String(name||'').replace(/[^A-Za-z0-9_-]/g,'')+'" ');};
  function toolbar(){[].forEach.call(document.querySelectorAll('#bar .pill'),function(n){
    var old=n.querySelector('svg');if(!old)return;
    var key=old.getAttribute('data-nd-base-icon')||n._o&&n._o.icon;
    if(!key)return;var holder=document.createElement('div');holder.innerHTML=svg(key);old.parentNode.replaceChild(holder.firstChild,old);
  });}
  function sync(){queued=false;var kind=active(),currentMode=mode(),changed=state.holidayIconSet!==kind||state.holidayIconMode!==currentMode;
    state.holidayIconSet=kind;state.holidayIconMode=currentMode;root.setAttribute('data-holiday-iconset',kind||'none');
    if(kind){root.style.setProperty('--holiday-accent',colours[kind][0]);root.style.setProperty('--holiday-rgb',colours[kind][1]);}
    if(changed){
      NEONDECK_ICONS.refresh();toolbar();
      if(typeof logLine==='function')logLine('Holiday icons: '+JSON.stringify({mode:currentMode,active:kind}));
      var e=document.createEvent('Event');e.initEvent('neondeck:holiday',false,false);window.dispatchEvent(e);
    }
  }
  function request(){if(queued)return;queued=true;(window.requestAnimationFrame||function(fn){setTimeout(fn,16);})(sync);}
  function setMode(value){if(value!=='auto'&&value!=='off'&&!names[value])return;try{localStorage.setItem('neondeck.holidayIcons',value);}catch(_){}request();}
  function menu(){var list=[{key:'auto',label:'Automatic',description:'Follow the active holiday playlist'},{key:'off',label:'Off',description:'Use your everyday icons'}];Object.keys(names).forEach(function(k){list.push({key:k,label:names[k],description:'Use this complete icon set now'});});
    openMenu('Holiday icon sets',list.map(function(it){return {label:it.label,sub:mode()===it.key?'Selected':it.description,desc:it.description,ndHolidayMode:it.key,stay:true,fn:function(){setMode(it.key);backMenu();}};}));
  }
  window.NEONDECK_HOLIDAYS={mode:mode,active:active,setMode:setMode,menu:menu,icon:icon,request:request,names:names};
  window.addEventListener('neondeck:season',request);request();
})();
