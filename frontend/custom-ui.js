/* Local personalisation of the installed launcher. ES5 for the TV renderer. */
(function () {
  if (typeof tile !== 'function' || typeof act !== 'function' || window.TANADOS_UI) return;
  var state = (window.TANADOS_UI = { version: 8, motion: false, videoReady: false });
  ICONS.shop='<path d="M5 7h14l2 14H3Z"/><path d="M8 7V5a4 4 0 0 1 8 0v2M9 14h6m-3-3v6"/>';
  var labels = window.NEONDECK_INPUTS || {};
  var artNames = {'com.webos.app.hdmi1':'tvbox','com.webos.app.hdmi2':'ps4','com.webos.app.hdmi3':'ps5','amazon':'prime','com.disney.disneyplus-prod':'disney','org.jellyfin.webos':'jellyfin','youtube.leanback.v4':'youtube','netflix':'netflix','org.webosbrew.hbchannel':'shop'};
  var originalTile = tile;
  tile = function (a) {
    var d=originalTile(a),icon=d.querySelector('.tanados-icon'),name=artNames[a.id];
    if(a.input)name=/ps\s*5|playstation\s*5/i.test(a.title)?'ps5':/ps\s*4|playstation\s*4/i.test(a.title)?'ps4':'tvbox';
    if(!icon){
      icon=document.createElement('div');icon.className='tanados-icon';
      if(a.input){d.replaceChild(icon,d.children[0]);}else d.insertBefore(icon,d.firstChild);

    }
    NEONDECK_ICONS.paint(icon,name,a.title);
    if(a.input)d.children[1].textContent=labels[a.id]||a.title;
    if(!a.input && !a.sys){
      var title=d.querySelector('.tanados-title');
      if(!title){title=document.createElement('span');title.className='tanados-title';d.appendChild(title);}
      title.textContent=a.title;
    }
    return d;
  };
  var media = window.NEONDECK_MEDIA || 'http://127.0.0.1:8775', library = [], selected = 'gamer-eye', interval = 15;
  var seasonal=false,christmas='christmas-anime',spring='spring-sakura',lastSeason='';
  var enabled = true, focused = true, switchedAt = Date.now();
  function stored(key, fallback) { try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (_) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, String(value)); } catch (_) {} }
  selected = stored('tanados.wallpaper', selected);
  seasonal=stored('tanados.seasonal','off')==='on';
  christmas=stored('tanados.christmas',christmas);spring=stored('tanados.easter',spring);
  enabled = stored('tanados.motion', 'on') !== 'off';
  interval = Number(stored('tanados.rotation', '15'));
  if ([0,5,15,30,60].indexOf(interval) < 0) interval = 15;
  var video = document.createElement('video'), still = document.createElement('img'), shade = document.createElement('div');
  video.id = 'tanados-motion'; still.id = 'tanados-wallpaper-still'; shade.id = 'tanados-motion-shade';
  video.muted = true; video.loop = true; video.preload = 'auto'; video.autoplay = true;
  video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
  video.setAttribute('autoplay', ''); video.setAttribute('webkit-playsinline', '');
  video.setAttribute('aria-hidden', 'true'); still.setAttribute('aria-hidden', 'true');
  var home = document.getElementById('homepage') || document.body;
  home.insertBefore(shade, home.firstChild); home.insertBefore(video, home.firstChild); home.insertBefore(still, home.firstChild);
  function release() {
    video.pause(); video.removeAttribute('src'); video.load(); video.style.display = 'none';
    state.motion = false; state.videoReady = false;
  }
  function active() { return focused && !document.hidden; }
  function current() { for (var i = 0; i < library.length; i++) if (library[i].id === selected) return library[i]; return null; }
  function applyMotion() {
    if (!enabled || !active() || !current() || previewVideo&&!previewVideo.paused) { release(); return; }
    var src = media + '/wallpaper/' + selected + '.mp4';
    if (video.getAttribute('src') === src && !video.paused) return;
    release(); video.poster = media + '/wallpaper/' + selected + '.jpg';
    video.src = src; video.style.display = 'block'; video.load();
    var p = video.play();
    if (p && p.catch) p.catch(function (e) {
      if (e.name === 'AbortError') return;
      if (typeof logLine === 'function') logLine('Wallpaper unavailable: ' + selected + ' ' + String(e.message || e).slice(0,100));
      release();
    });
  }
  function choose(id, manual) {
    var found = false;
    for (var i = 0; i < library.length; i++) if (library[i].id === id) found = true;
    if (!found) return;
    if(manual){if(seasonal&&seasonId()){seasonal=false;save('tanados.seasonal','off');lastSeason='';state.seasonal=false;state.season='';}save('tanados.normalWallpaper',id);}
    selected = id; state.wallpaper = id; state.rotationMinutes = interval; switchedAt = Date.now();
    save('tanados.wallpaper', id);
    var changed=document.createEvent('CustomEvent');changed.initCustomEvent('neondeck:wallpaper',false,false,current());window.dispatchEvent(changed);
    still.style.display='block';still.src = media + '/wallpaper/' + id + '.jpg'; video.poster = still.src;
    release(); applyMotion();
    if (typeof logLine === 'function') logLine('Wallpaper selected: ' + id + '; rotation=' + interval + '; motion=' + enabled);
  }
  function seasonConfig(){return {christmasStart:stored('tanados.christmasStart','12-01'),christmasEnd:stored('tanados.christmasEnd','01-06'),easterBefore:Number(stored('tanados.easterBefore','14')),easterAfter:Number(stored('tanados.easterAfter','3')),halloween:stored('tanados.halloween','off')==='on',newyear:stored('tanados.newyear','off')==='on',timezone:stored('tanados.seasonTimezone','Europe/Sofia')};}
  function seasonPool(kind){
    var raw=stored('tanados.playlist.'+kind,'');try{if(raw){var ids=JSON.parse(raw);if(Array.isArray(ids))return library.filter(function(w){return ids.indexOf(w.id)>=0;});}}catch(_){}
    var old=stored(kind==='christmas'?'tanados.christmas':kind==='easter'?'tanados.easter':'tanados.unassigned','');
    if(old)return library.filter(function(w){return w.id===old;});return library.filter(function(w){return w.season===kind;});
  }
  function seasonId(){if(!seasonal)return '';var c=seasonConfig(),kind=TANADOS_SEASONS.season(Date.now(),c);if(seasonPool(kind).length)return kind;if(kind==='newyear'||kind==='halloween'){c.newyear=false;c.halloween=false;kind=TANADOS_SEASONS.season(Date.now(),c);if(seasonPool(kind).length)return kind;}return '';}
  function applySeason(){
    var kind=seasonId(),pool=seasonPool(kind);state.seasonal=seasonal;state.season=kind;
    if(kind&&pool.length&&(kind!==lastSeason||!pool.some(function(w){return w.id===selected;}))){
      if(!lastSeason&&current()&&!pool.some(function(w){return w.id===selected;}))save('tanados.normalWallpaper',selected);
      choose(pool[0].id);
    }
    if(!kind&&lastSeason){var normal=stored('tanados.normalWallpaper','gamer-eye');if(library.some(function(w){return w.id===normal;}))choose(normal);else if(library.length)choose(library[0].id);else emptyWallpaper();}
    lastSeason=kind;return !!kind;
  }
  function next(){
    applySeason();var kind=seasonId(),assigned=[];
    ['christmas','easter','newyear','halloween'].forEach(function(k){seasonPool(k).forEach(function(w){assigned.push(w.id);});});
    var pool=kind?seasonPool(kind):library.filter(function(w){return !w.season&&assigned.indexOf(w.id)<0;});if(!pool.length)pool=library;
    if(pool.length<2)return;
    for(var i=0;i<pool.length;i++)if(pool[i].id===selected){choose(pool[(i+1)%pool.length].id);return;}choose(pool[0].id);
  }
  function rotationTick(){
    if(!active())return;applySeason();if(interval&&library.length>1&&!(typeof stack!=='undefined'&&stack.length)&&Date.now()-switchedAt>=interval*60000)next();
  }
  function seasonPlaylist(kind){
    openBuilt({christmas:'Christmas playlist',easter:'Easter playlist',newyear:'New Year playlist',halloween:'Halloween playlist'}[kind],function(){
      var pool=seasonPool(kind).map(function(w){return w.id;});var entries=library.map(function(w){return {label:w.title,sub:pool.indexOf(w.id)>=0?'Included':'Off',tanadosPoster:w.id,desc:'Choose one or more videos. Automatic rotation uses this playlist during the holiday.',stay:true,fn:function(){var next=pool.slice(),i=next.indexOf(w.id);if(i>=0)next.splice(i,1);else next.push(w.id);save('tanados.playlist.'+kind,JSON.stringify(next));applySeason();}};});
      entries.push({label:'Find more holiday wallpapers',stay:true,fn:function(){searchOnline(kind==='easter'?'spring':kind==='newyear'?'new year':kind,1);}});return entries;
    });
  }
  function seasonChoice(title,key,values){openMenu(title,values.map(function(v){return {label:v[0],stay:true,fn:function(){save(key,v[1]);applySeason();backMenu();}};}));}
  function seasonMenu(){
    openBuilt('Seasonal wallpapers',function(){return [
      {label:'Automatic seasonal wallpapers',sub:seasonal?'On':'Off',stay:true,fn:function(){seasonal=!seasonal;save('tanados.seasonal',seasonal?'on':'off');applySeason();}},
      {label:'Christmas playlist',sub:seasonPool('christmas').length+' videos',stay:true,fn:function(){seasonPlaylist('christmas');}},
      {label:'Easter playlist',sub:seasonPool('easter').length+' videos',stay:true,fn:function(){seasonPlaylist('easter');}},
      {label:'New Year',sub:stored('tanados.newyear','off'),stay:true,fn:function(){openMenu('New Year',[{label:'Enable New Year',stay:true,fn:function(){save('tanados.newyear',stored('tanados.newyear','off')==='on'?'off':'on');applySeason();backMenu();}},{label:'Choose videos',stay:true,fn:function(){seasonPlaylist('newyear');}}]);}},
      {label:'Halloween',sub:stored('tanados.halloween','off'),stay:true,fn:function(){openMenu('Halloween',[{label:'Enable Halloween',stay:true,fn:function(){save('tanados.halloween',stored('tanados.halloween','off')==='on'?'off':'on');applySeason();backMenu();}},{label:'Choose videos',stay:true,fn:function(){seasonPlaylist('halloween');}}]);}},
      {label:'Christmas starts',sub:stored('tanados.christmasStart','12-01'),stay:true,fn:function(){seasonChoice('Christmas starts','tanados.christmasStart',[['15 November','11-15'],['1 December','12-01'],['15 December','12-15'],['20 December','12-20']]);}},
      {label:'Christmas ends',sub:stored('tanados.christmasEnd','01-06'),stay:true,fn:function(){seasonChoice('Christmas ends','tanados.christmasEnd',[['1 January','01-01'],['6 January','01-06']]);}},
      {label:'Before Orthodox Easter',sub:stored('tanados.easterBefore','14')+' days',stay:true,fn:function(){seasonChoice('Start before Easter','tanados.easterBefore',[[7,7],[14,14],[21,21]]);}},
      {label:'After Orthodox Easter',sub:stored('tanados.easterAfter','3')+' days',stay:true,fn:function(){seasonChoice('Finish after Easter','tanados.easterAfter',[[1,1],[3,3],[7,7]]);}},
      {label:'Holiday timezone',sub:stored('tanados.seasonTimezone','Europe/Sofia'),stay:true,fn:function(){seasonChoice('Holiday timezone','tanados.seasonTimezone',[['Bulgaria · Sofia','Europe/Sofia'],['United Kingdom · London','Europe/London'],['US Eastern · New York','America/New_York'],['US Pacific · Los Angeles','America/Los_Angeles']]);}},
      {label:'Find more holiday wallpapers',stay:true,fn:function(){openMenu('Holiday wallpapers',['Christmas','Spring','Halloween','New Year','Winter'].map(function(q){return {label:q,stay:true,fn:function(){searchOnline(q.toLowerCase(),1);}};}));}}
    ];});
  }

  video.addEventListener('playing', function () {
    if (!enabled || !active()) { release(); return; }
    var firstPlay = !state.motion;
    state.videoReady = true; state.motion = true;
    if (firstPlay && typeof logLine === 'function') logLine('Wallpaper playing: ' + selected);
  });
  video.addEventListener('error', function () {
    if (typeof logLine === 'function') logLine('Wallpaper error: ' + selected + ' code=' + (video.error && video.error.code));
    release();
  });
  document.addEventListener('visibilitychange', function () { focused = !document.hidden; applyMotion(); });
  window.addEventListener('blur', function () { focused = false; release(); });
  window.addEventListener('focus', function () { focused = true; applyMotion(); });
  document.addEventListener('webOSRelaunch', function () { focused = true; applyMotion(); });
  window.addEventListener('pagehide', release);
  setInterval(rotationTick, 10000);
  function toggleMotion() {
    enabled = !enabled; save('tanados.motion', enabled ? 'on' : 'off'); applyMotion();
    if (typeof toast === 'function') toast(enabled ? 'Animated wallpapers on' : 'Still wallpaper on');
  }
  var previewVideo=null,previewImage='',previewOwner=null,detailRequests={};
  function onlineDetails(id){var hit=detailRequests[id];if(hit&&Date.now()-hit.at<300000)return hit.promise;var entry={at:Date.now()};entry.promise=callMedia('/online/detail?id='+encodeURIComponent(id)).catch(function(e){delete detailRequests[id];throw e;});detailRequests[id]=entry;var keys=Object.keys(detailRequests);if(keys.length>48)delete detailRequests[keys[0]];return entry.promise;}
  function warmPosters(results){var n=0;function next(){if(n>=Math.min(results.length,4))return;var item=results[n++];onlineDetails(item.id).then(next,next);}next();}
  function stopPreview(resume){
    if(previewVideo){previewVideo.pause();previewVideo.removeAttribute('src');previewVideo.load();previewVideo.remove();previewVideo=null;}
    if(sideEl){var image=sideEl.querySelector('img');if(image)image.style.display='block';}
    state.preview=false;if(resume)applyMotion();
  }
  function showPreview(url){
    if(!sideEl)return;stopPreview(false);release();
    var v=document.createElement('video');previewVideo=v;v.muted=true;v.loop=true;v.autoplay=true;v.setAttribute('muted','');v.setAttribute('playsinline','');v.src=media+url;
    sideEl.querySelector('.pvbox').appendChild(v);sideEl.querySelector('img').style.display='none';
    var play=v.play();if(play&&play.catch)play.catch(function(){stopPreview(true);toast('Preview could not play',true);});state.preview=true;
  }
  var originalSide=drawSide;
  drawSide=function(it){
    if(!it||(!it.tanadosPoster&&!it.onlinePoster&&!it.appIcon)){stopPreview(false);previewOwner=null;originalSide(it);applyMotion();return;}
    var url=it.appIcon?(it.appIcon.indexOf('http')===0?it.appIcon:media+it.appIcon):it.onlinePoster?media+it.onlinePoster:media+'/wallpaper/'+it.tanadosPoster+'.jpg';
    if(previewImage!==url){stopPreview(false);previewImage=url;applyMotion();}
    if(!sideEl){sideEl=document.createElement('div');sideEl.id='ovside';sideEl.innerHTML='<div class="pvbox"><img alt=""></div><div class="pt"></div><div class="pd"></div>';document.body.appendChild(sideEl);}
    sideEl.querySelector('.pvbox').className='pvbox'+(it.appIcon?' app-preview':'');
    var image=sideEl.querySelector('img');if(image.getAttribute('data-u')!==url){image.setAttribute('data-u',url);image.style.visibility='hidden';image.onload=function(){image.style.visibility='';};
      if(it.onlineId){
        var focusedUrl=url;
        sideEl.querySelector('.pd').textContent='Loading preview...';
        onlineDetails(it.onlineId).then(function(d){if(sideEl&&sideEl.contains(image)&&image.getAttribute('data-u')===focusedUrl){image.src=media+d.poster;sideEl.querySelector('.pd').textContent=previewOwner&&previewOwner.desc||'';}}).catch(function(){if(sideEl&&sideEl.contains(image)&&image.getAttribute('data-u')===focusedUrl){image.removeAttribute('data-u');sideEl.querySelector('.pd').textContent='Preview unavailable. Move focus here to retry.';}});
      }else image.src=url;}
    sideEl.querySelector('.pt').textContent=it.previewTitle||it.label;sideEl.querySelector('.pd').textContent=it.desc||'';
    previewOwner=it;
  };
  var originalDrawMenu=drawMenu;
  drawMenu=function(win){originalDrawMenu(win);var m=stack[stack.length-1];if(!m||!ovEl)return;ovEl.classList.toggle('appshop',!!m.appshop);
    if(m.appshop)[].forEach.call(ovEl.querySelectorAll('.row'),function(row){var item=m.items[Number(row.getAttribute('data-i'))];if(item&&item.appIcon){var img=document.createElement('img');img.className='store-icon';img.alt='';img.src=item.appIcon.indexOf('http')===0?item.appIcon:media+item.appIcon;row.insertBefore(img,row.firstChild);}});
  };
  document.addEventListener('visibilitychange',function(){if(document.hidden)stopPreview(false);});
  window.addEventListener('blur',function(){stopPreview(false);});
  function rotationMenu() {
    openBuilt('Change wallpaper every', function () {
      return [0,5,15,30,60].map(function (minutes) {
        return {label: minutes ? minutes + ' minutes' : 'Off', sub: interval === minutes ? 'Selected' : '', fn: function () {
          interval = minutes; state.rotationMinutes = minutes; switchedAt = Date.now(); save('tanados.rotation', minutes);
          backMenu();
        }};
      });
    });
  }
  function libraryItems(){
    var items=library.map(function(w){return {label:w.title,sub:w.id===selected?'Selected':w.height?w.height+'p':'',tanadosPoster:w.id,
      desc:'Animated video · '+(w.durationLabel||'Local loop')+'\nOK uses this wallpaper. Delete options are in Storage & delete.',fn:function(){choose(w.id,true);}};});
    if(!items.length)items.push({note:'Your library is empty. Find a wallpaper to download.'});return items;
  }
  function wallpaperItems(){
    return [{label:'My wallpapers',sub:library.length+' saved',stay:true,fn:function(){openMenu('My wallpapers',libraryItems());}},
      {label:'Search & download wallpapers',stay:true,fn:searchMenu},
      {label:'Download status / retry',stay:true,fn:function(){callMedia('/download/status').then(function(s){if(!s.id||s.status==='idle'){toast('No wallpaper download is running');return;}if(s.status==='ready'){toast((s.title||'Wallpaper')+' is saved in My wallpapers');return;}var id=s.id.replace(/-(720|1080|2160)$/,'');downloadProgress({id:id,title:s.title||'Wallpaper'},s,'/online/'+id+'.jpg',s.kind==='preview');}).catch(failed);}},
      {label:'Seasonal wallpapers',sub:seasonal?'On':'Off',stay:true,fn:seasonMenu},
      {label:'Animation',sub:enabled?'On':'Off',stay:true,fn:toggleMotion},
      {label:'Automatic rotation',sub:interval?'Every '+interval+' min':'Off',stay:true,fn:rotationMenu},
      {label:'Storage & delete',stay:true,fn:storageMenu},
      {label:'Next wallpaper',fn:next}];
  }
  function callMedia(route,data){
    return new Promise(function(resolve,reject){
      var x=new XMLHttpRequest();x.open(data?'POST':'GET',media+route);x.timeout=50000;
      x.setRequestHeader('X-Tanados-Token',window.TANADOS_LOCAL_TOKEN||'');
      if(data)x.setRequestHeader('Content-Type','application/json');
      x.onload=function(){try{var r=JSON.parse(x.responseText);if(x.status!==200||r.error&&r.status!=='error')throw Error(r.error||'Wallpaper service unavailable');resolve(r);}catch(e){reject(e);}};
      x.onerror=function(){reject(Error('Wallpaper service unavailable'));};x.ontimeout=function(){reject(Error('Wallpaper source did not answer'));};x.send(data?JSON.stringify(data):null);
    });
  }
  function failed(e){toast(e.message||String(e),true);}
  function searchMenu(){
    var categories=['Anime','Gaming','Fantasy','Neon','Christmas','Spring'];
    openMenu('Find live wallpapers',[{label:'Type a search...',stay:true,fn:searchField}].concat(categories.map(function(q){return {label:q,stay:true,fn:function(){searchOnline(q,1);}};})));
  }
  function searchField(onSearch,heading){
    var old=document.getElementById('tanados-search');if(old)old.remove();
    var box=document.createElement('div');box.id='tanados-search';
    box.innerHTML='<label for="tanados-query">Search live wallpapers</label><input id="tanados-query" type="text" maxlength="70" autocomplete="off" placeholder="Try neon, anime or Christmas"><p>OK searches · Back cancels</p>';
    box.querySelector('label').textContent=heading||'Search live wallpapers';if(heading)box.querySelector('input').placeholder='Search by app name';
    document.body.appendChild(box);if(heading)box.querySelector('label').textContent=heading;var input=box.querySelector('input');
    input.addEventListener('keydown',function(e){e.stopPropagation();var k=e.keyCode||e.which;
      if(k===13){e.preventDefault();var q=input.value.trim();if(q.length<2){toast('Type at least two letters',true);return;}box.remove();if(onSearch)onSearch(q);else searchOnline(q,1);}
      else if(k===461||k===27||k===8&&!input.value){e.preventDefault();box.remove();}
    });input.focus();
  }
  function searchOnline(q,page){
    toast('Finding wallpapers and previews...');
    callMedia('/online/search?q='+encodeURIComponent(q)+'&page='+page).then(function(data){
      var items=data.results.map(function(w){return {label:w.title,sub:w.installed?'Saved':'Preview',onlinePoster:w.poster,
        desc:'MoeWalls animated wallpaper.\nOK opens quality choices and an animated preview.',onlineId:w.id,stay:true,fn:function(){onlineDetail(w);}};});
      if(!items.length)items.push({note:'No wallpapers found. Try a shorter search.'});
      if(data.results.length>=12)items.push({label:'More results',stay:true,fn:function(){searchOnline(q,page+1);}});
      openMenu('Results: '+q,items);warmPosters(data.results);
    }).catch(failed);
  }
  function onlineDetail(w){
    toast('Loading wallpaper...');
    onlineDetails(w.id).then(function(d){
      var existing=library.filter(function(x){return x.source===w.source;});
      var desc='Animated video from MoeWalls.\nChoose 720p, Full HD or 4K where the source and TV support it. Higher qualities can take longer.';
      var items=[{label:'Play animated preview',onlinePoster:d.poster,desc:desc,stay:true,fn:function(){if(d.preview)showPreview(d.preview);else preparePreview(w,d);}}];
      if(existing.length)items.push({label:'Use saved wallpaper',onlinePoster:d.poster,desc:desc,fn:function(){choose(existing[0].id,true);}});
      d.qualities.forEach(function(q){items.push({label:q===2160?'Download 4K':q===1080?'Download Full HD 1080p':'Download HD 720p',onlinePoster:d.poster,desc:desc,stay:true,fn:function(){beginDownload(w,q,d.poster);}});});
      openMenu(d.title,items);
    }).catch(failed);
  }
  function pollDownload(menu,poster,preview){
    function poll(){callMedia('/download/status').then(function(s){
      if(menu.downloadId&&s.id&&s.id!==menu.downloadId)return;
      menu.status=s;menu.items=menu.build();if(stack[stack.length-1]===menu)drawMenu();
      if(s.status==='ready'){
        if(preview){if(stack.indexOf(menu)>=0&&active()){backMenu();showPreview(s.preview);}return;}
        loadLibrary(false,function(){if(stack.indexOf(menu)>=0&&active()){closeMenus();choose(s.id,true);}toast('Wallpaper downloaded');checkStorage(false);});return;
      }
      if(s.status==='error'){failed(Error(s.error));return;}
      if(s.status==='cancelled')return;setTimeout(poll,1500);
    }).catch(failed);}setTimeout(poll,800);
  }
  function downloadProgress(w,job,poster,preview){
    openBuilt(preview?'Preparing animated preview':'Downloading wallpaper',function(){
      var m=stack[stack.length-1],s=m&&m.status||job;
      var detail=s.status==='converting'?'Converting on the TV · large 4K loops can take several minutes':s.status==='downloading'?'Downloading':s.status==='error'?s.error:s.status;
      return [{label:w.title,sub:(s.progress||0)+'%',onlinePoster:poster,desc:detail+'\n'+(preview?'Animated preview':'Your preview stays visible while this downloads.'),stay:true,fn:function(){}},
        {label:s.status==='error'?'Retry download':'Continue browsing',fn:function(){if(s.status==='error')beginDownload(w,s.quality||job.quality||720,poster);else toast('Download continues in the background');}},
        {label:s.status==='error'?'Try HD 720p':'Cancel download',stay:true,fn:function(){if(s.status==='error'){beginDownload(w,720,poster);return;}callMedia('/download/cancel',{}).then(function(){backMenu();toast('Download cancelled');}).catch(failed);}}];
    });var m=stack[stack.length-1];m.status=job;m.downloadId=job.id;pollDownload(m,poster,preview);
  }
  function beginDownload(w,quality,poster){
    stopPreview(true);callMedia('/download',{id:w.id,quality:quality||720}).then(function(job){downloadProgress(w,job,poster,false);}).catch(function(e){failed(e);if(/storage|limit|space/i.test(e.message))storageMenu();});
  }
  function preparePreview(w,d){callMedia('/online/preview',{id:w.id}).then(function(job){if(job.status==='ready')showPreview(job.preview);else downloadProgress(w,job,d.poster,true);}).catch(failed);}
  function emptyWallpaper(){document.documentElement.setAttribute('data-gallery-empty','on');lastSeason='';selected='';save('tanados.wallpaper','');release();still.removeAttribute('src');still.style.display='none';state.wallpaper='';var changed=document.createEvent('CustomEvent');changed.initCustomEvent('neondeck:wallpaper',false,false,null);window.dispatchEvent(changed);}
  function deleteWallpaper(w){
    openMenu('Delete '+w.title+'?', [{label:'Cancel',stay:true,fn:backMenu},{label:'Delete wallpaper',sub:'Frees '+(w.bytes?formatBytes(w.bytes):'TV space'),stay:true,fn:function(){
      if(selected===w.id){var other=library.filter(function(x){return x.id!==w.id;})[0];if(other)choose(other.id,true);else emptyWallpaper();}
      callMedia('/remove',{id:w.id}).then(function(){loadLibrary(false,function(){closeMenus();manageDownloads();checkStorage(false);});}).catch(failed);
    }}]);
  }
  function manageDownloads(){
    loadLibrary(false,function(){openMenu('Delete wallpapers',library.length?library.map(function(w){return {label:w.title,sub:w.height?w.height+'p':'',tanadosPoster:w.id,desc:'Delete this wallpaper to free TV storage. You can download it again later.',stay:true,fn:function(){deleteWallpaper(w);}};}):[{note:'No wallpapers saved.'},{label:'Find wallpapers',stay:true,fn:searchMenu}]);});
  }
  function formatBytes(n){return n>=1073741824?(n/1073741824).toFixed(1)+' GB':Math.round(n/1048576)+' MB';}
  var storageState=null;
  function checkStorage(force){
    if(!active()&&!force)return;
    callMedia('/storage').then(function(s){storageState=s;document.documentElement.setAttribute('data-storage-low',s.warning?'on':'off');
      if(s.warning&&stored('tanados.storageWarnings','on')==='on'&&(force||Date.now()-Number(stored('tanados.lastStorageWarning','0'))>3600000)){
        save('tanados.lastStorageWarning',Date.now());toast((s.critical?'TV storage is almost full. ':'TV storage is running low. ')+'Open Storage & delete to remove apps or wallpapers.',true);
      }
    }).catch(function(){});
  }
  setInterval(function(){checkStorage(false);},60000);setTimeout(function(){checkStorage(false);},8000);
  function storageMenu(){
    callMedia('/storage').then(function(s){storageState=s;openBuilt('Storage & delete',function(){return [
      {note:'Wallpapers: '+formatBytes(s.wallpapers.libraryBytes)+' saved · '+formatBytes(s.wallpapers.free)+' TV space free.\nApps: '+formatBytes(s.apps.free)+' free.'},
      {label:'Delete wallpapers',sub:s.wallpapers.count+' saved',stay:true,fn:manageDownloads},
      {label:'Remove apps',stay:true,fn:removeAppsMenu},
      {label:'Clear preview cache',stay:true,fn:function(){callMedia('/cache/clear',{}).then(function(r){toast(formatBytes(r.freed)+' freed');backMenu();storageMenu();}).catch(failed);}},
      {label:'Storage notifications',sub:stored('tanados.storageWarnings','on')==='on'?'On':'Off',stay:true,fn:function(){save('tanados.storageWarnings',stored('tanados.storageWarnings','on')==='on'?'off':'on');}},
      {label:'Wallpaper library limit',sub:formatBytes(s.wallpapers.quotaBytes),stay:true,fn:function(){openMenu('Wallpaper library limit',[128,256,384].map(function(n){return {label:n+' MB',stay:true,fn:function(){callMedia('/settings',{quotaMB:n}).then(function(){backMenu();backMenu();storageMenu();}).catch(failed);}};}));}},
      {label:'Warn below free space',sub:s.warningMB+' MB',stay:true,fn:function(){openMenu('Storage warning level',[64,128,256].map(function(n){return {label:n+' MB',stay:true,fn:function(){callMedia('/settings',{warningMB:n}).then(function(){backMenu();backMenu();storageMenu();}).catch(failed);}};}));}}
    ];});}).catch(failed);
  }
  function removeAppsMenu(){
    callMedia('/apps/removable').then(function(r){openMenu('Remove apps',r.apps.length?r.apps.map(function(a){return {label:a.title,sub:a.running?'Currently open':'Delete',appIcon:API+'/icon/'+a.id,
      desc:'Removing an app frees app storage. Account data in that app may be removed too. The TV display, inputs and core Home apps are protected.',stay:true,fn:function(){confirmAppRemove(a);}};}):[{note:'No removable apps found.'}]);}).catch(failed);
  }
  function appJob(action,a){
    callMedia('/apps/'+action,{id:a.id}).then(function(job){
      openBuilt(action==='install'?'Installing app':'Removing app',function(){var m=stack[stack.length-1],j=m&&m.appStatus||job;return [{note:a.title},{note:j.message||j.status},{label:'Continue browsing',fn:function(){toast('App operation continues in the background');}}];});
      var menu=stack[stack.length-1];menu.appStatus=job;
      function poll(){callMedia('/apps/status').then(function(j){menu.appStatus=j;if(stack[stack.length-1]===menu)refreshMenu();
        if(j.status==='ready'){toast(j.message||'App operation complete');if(typeof load==='function')load();if(stack[stack.length-1]===menu){closeMenus();shopMenu();}checkStorage(false);return;}
        if(j.status==='error'){failed(Error(j.error));return;}setTimeout(poll,1500);
      }).catch(failed);}setTimeout(poll,800);
    }).catch(failed);
  }
  function confirmAppRemove(a){openMenu('Remove '+a.title+'?',[{label:'Cancel',stay:true,fn:backMenu},{label:'Remove app',stay:true,fn:function(){appJob('remove',a);}}]);}
  function newerVersion(installed,available){var a=String(installed||'').split('.'),b=String(available||'').split('.');for(var i=0;i<Math.max(a.length,b.length);i++){var x=parseInt(a[i],10)||0,y=parseInt(b[i],10)||0;if(y!==x)return y>x;}return false;}
  function appDetails(a,nativeApp){
    var icon=nativeApp?API+'/icon/'+a.id:a.icon;
    var info=(a.description||'Installed app on this TV.')+'\n'+(a.version?'Version '+a.version+' · ':'')+(a.size?formatBytes(a.size)+' · ':'')+(a.rootRequired?'Requires root':'')+(a.requirements?'\nRequires '+a.requirements:'');
    var rows=[];
    function row(label,fn,stay){return {label:label,appIcon:icon,desc:info,stay:!!stay,fn:fn};}
    if(a.installed||nativeApp)rows.push(row('Open app',function(){launch(a.id);}));
    if(a.core)rows.push(row('Open original manager',function(){launch(a.id);}));
    else if(!nativeApp&&(!a.installed||newerVersion(a.installedVersion,a.version)))rows.push(row(a.installed?'Update app':'Install app',function(){openMenu((a.installed?'Update ':'Install ')+a.title+'?',[{label:'Cancel',stay:true,fn:backMenu},{label:'Install verified package',sub:a.version,appIcon:icon,desc:info,stay:true,fn:function(){appJob('install',a);}}]);},true));
    if((a.installed||nativeApp)&&!a.core&&a.removable!==false)rows.push(row('Remove app',function(){confirmAppRemove(a);},true));
    if(!rows.length)rows.push({note:'This app is managed by the TV.'});openMenu(a.title,rows);
  }
  function shopSearch(q){callMedia('/apps/catalog?q='+encodeURIComponent(q)).then(function(d){var items=storeRows(d.apps,false);openMenu('Apps: '+q,items);stack[stack.length-1].appshop=true;drawMenu();}).catch(failed);}
  function storeRows(list,nativeApps){return list.length?list.map(function(a){return {label:a.title,sub:nativeApps?'Installed':a.installed?newerVersion(a.installedVersion,a.version)?'Update':'Installed':a.version,
    appIcon:nativeApps?API+'/icon/'+a.id:a.icon,desc:(a.description||'Installed application on your TV.')+'\n'+(a.size?formatBytes(a.size)+' package. ':'')+(a.rootRequired?'Root required.':''),stay:true,fn:function(){appDetails(a,nativeApps);}};}):[{note:'No apps in this category.'}];}
  function shopMenu(){
    toast('Loading App Shop...');
    Promise.all([callMedia('/apps/catalog'),callMedia('/apps/removable').catch(function(){return {apps:[]};})]).then(function(all){
      var d=all[0],removable=all[1].apps;
      var common=[{label:'Search apps...',icon:'search',appIcon:'/apps/icon/org.webosbrew.hbchannel',desc:'Browse the official Homebrew catalogue in the NeonDeck theme.',stay:true,fn:function(){searchField(shopSearch,'Search Homebrew apps');}},{label:'Storage & remove apps',appIcon:'/apps/icon/org.webosbrew.hbchannel',desc:'See free space and remove apps or wallpapers.',stay:true,fn:storageMenu}];
      function group(test){return common.concat(storeRows(d.apps.filter(test),false));}
      openTabbed('App Shop',[
        {label:'All',build:function(){return group(function(){return true;});}},
        {label:'Games',build:function(){return group(function(a){return /game|emulator/.test(a.category);});}},
        {label:'Media',build:function(){return group(function(a){return /media|stream|internet/.test(a.category);});}},
        {label:'Tools',build:function(){return group(function(a){return /system|utility|screen|launcher|amb/.test(a.category);});}},
        {label:'Installed',build:function(){return common.concat(storeRows(apps.filter(function(a){return !a.input&&!a.sys&&(cfg.hidden||[]).indexOf(a.id)<0;}).map(function(a){return {id:a.id,title:a.title,version:a.version||'',removable:removable.some(function(x){return x.id===a.id;}),core:['org.webosbrew.hbchannel','com.cleanyourtv.manager'].indexOf(a.id)>=0};}),true));}}
      ]);stack[stack.length-1].appshop=true;stack[stack.length-1].idx=usable(stack[stack.length-1],2);drawMenu();
    }).catch(failed);
  }

  var palettes={violet:'#c7b0ff',ice:'#a1e8ff',rose:'#ffc0dc',gold:'#f6d58e',white:'#edf3ff',mint:'#a8ffd5',crimson:'#ff8a9d',sunset:'#ffbd8a'};
  function applyAppearance(){
    var root=document.documentElement,palette=stored('tanados.palette','violet');
    if(!palettes[palette])palette='violet';
    var opacity=Number(stored('tanados.dockOpacity','78')),dim=Number(stored('tanados.dim','15')),size=Number(stored('tanados.iconSize','100'));
    root.style.setProperty('--personal-accent',palettes[palette]);
    root.style.setProperty('--personal-dock-alpha',String([45,65,78,90].indexOf(opacity)>=0?opacity/100:.78));
    root.style.setProperty('--personal-dim',String([0,15,30,50].indexOf(dim)>=0?dim/100:.15));
    root.style.setProperty('--personal-icon-size',([88,100,112].indexOf(size)>=0?size:100)+'px');
    var iconStyle=NEONDECK_ICONS.info(stored('tanados.iconStyle','glass')).key;
    root.setAttribute('data-personal-style',iconStyle);NEONDECK_ICONS.refresh(iconStyle);
    root.setAttribute('data-toolbar-labels',stored('tanados.toolbarLabels','on'));
    root.setAttribute('data-personal-preview',stored('tanados.previewSide','left'));
    root.setAttribute('data-dock-labels',stored('tanados.dockLabels','on'));
    root.style.setProperty('--personal-video-fit',stored('tanados.wallpaperFit','cover')==='contain'?'contain':'cover');
    root.style.setProperty('--personal-clock-size',String(Number(stored('tanados.clockSize','100'))/100));
    root.style.setProperty('--personal-focus-width',stored('tanados.focusWidth','2')+'px');
    root.style.setProperty('--personal-corner',stored('tanados.corners','24')+'px');
    state.palette=palette;
    if(window.NEONDECK_THEME)NEONDECK_THEME.refresh();
  }
  function choices(title,key,values){
    openMenu(title,values.map(function(v){return {label:v.label,sub:stored(key,String(v.defaultValue||''))===String(v.value)?'Selected':v.description||'',desc:v.description||'',stay:true,fn:function(){save(key,v.value);if(key==='tanados.palette'&&window.NEONDECK_THEME)NEONDECK_THEME.setMode('off');applyAppearance();backMenu();}};}));
  }
  function autoThemeMenu(){openBuilt('Auto Theme',function(){return [{label:'Match wallpaper',sub:window.NEONDECK_THEME&&NEONDECK_THEME.mode()==='on'?'Selected':'',stay:true,fn:function(){NEONDECK_THEME.setMode('on');}},{label:'Use my manual colour',sub:window.NEONDECK_THEME&&NEONDECK_THEME.mode()==='off'?'Selected':'',stay:true,fn:function(){NEONDECK_THEME.setMode('off');}}];});}
  function appearanceMenu(){
    openBuilt('Theme & appearance',function(){return [
      {label:'Auto Theme',sub:window.NEONDECK_THEME&&NEONDECK_THEME.mode()==='on'?'Matches wallpaper':'Manual colour',stay:true,fn:autoThemeMenu},
      {label:'Icon colour',sub:stored('tanados.palette','violet'),stay:true,fn:function(){choices('Icon colour','tanados.palette',Object.keys(palettes).map(function(k){return {label:k.charAt(0).toUpperCase()+k.slice(1),value:k,defaultValue:'violet'};}));}},
      {label:'Icon style',sub:stored('tanados.iconStyle','glass'),stay:true,fn:function(){choices('Icon style','tanados.iconStyle',NEONDECK_ICONS.styles.map(function(s){return {label:s.label,value:s.key,defaultValue:'glass',description:s.description};}));}},
      {label:'Icon size',sub:stored('tanados.iconSize','100')+'%',stay:true,fn:function(){choices('Icon size','tanados.iconSize',[88,100,112].map(function(n){return {label:n+'%',value:n,defaultValue:100};}));}},
      {label:'Dock opacity',sub:stored('tanados.dockOpacity','78')+'%',stay:true,fn:function(){choices('Dock opacity','tanados.dockOpacity',[45,65,78,90].map(function(n){return {label:n+'%',value:n,defaultValue:78};}));}},
      {label:'Wallpaper dimming',sub:stored('tanados.dim','15')+'%',stay:true,fn:function(){choices('Wallpaper dimming','tanados.dim',[0,15,30,50].map(function(n){return {label:n+'%',value:n,defaultValue:15};}));}},
      {label:'Toolbar names',sub:stored('tanados.toolbarLabels','on')==='on'?'On':'Off',stay:true,fn:function(){save('tanados.toolbarLabels',stored('tanados.toolbarLabels','on')==='on'?'off':'on');applyAppearance();}},
      {label:'Preview panel side',sub:stored('tanados.previewSide','left'),stay:true,fn:function(){choices('Preview panel side','tanados.previewSide',[{label:'Left',value:'left',defaultValue:'left'},{label:'Right',value:'right'}]);}},
      {label:'Wallpaper fit',sub:stored('tanados.wallpaperFit','cover'),stay:true,fn:function(){choices('Wallpaper fit','tanados.wallpaperFit',[{label:'Fill screen',value:'cover',defaultValue:'cover'},{label:'Fit whole video',value:'contain'}]);}},
      {label:'Clock size',sub:stored('tanados.clockSize','100')+'%',stay:true,fn:function(){choices('Clock size','tanados.clockSize',[80,100,120].map(function(n){return {label:n+'%',value:n,defaultValue:100};}));}},
      {label:'App names on dock',sub:stored('tanados.dockLabels','on')==='on'?'On':'Off',stay:true,fn:function(){save('tanados.dockLabels',stored('tanados.dockLabels','on')==='on'?'off':'on');applyAppearance();}},
      {label:'Focus outline',sub:stored('tanados.focusWidth','2')+' px',stay:true,fn:function(){choices('Focus outline','tanados.focusWidth',[2,3,4].map(function(n){return {label:n+' px',value:n,defaultValue:2};}));}},
      {label:'Dock corners',sub:stored('tanados.corners','24')+' px',stay:true,fn:function(){choices('Dock corners','tanados.corners',[8,24,40].map(function(n){return {label:n+' px',value:n,defaultValue:24};}));}},
      {label:'Wallpapers & seasonal mode',stay:true,fn:function(){loadLibrary(false);openBuilt('Wallpapers',wallpaperItems);}},
      {label:'More launcher settings',stay:true,fn:function(){customizeMenu();}}
    ];});
  }
  window.NEONDECK_HOME={media:media,palettes:palettes,get:stored,set:function(k,v){save(k,v);applyAppearance();},library:function(){return library.slice();},selected:function(){return selected;},appearance:appearanceMenu,api:callMedia};
  applyAppearance();

  var originalAct = act;
  act = function (e) {
    if (e && e._o && (e._o.action === 'tanados-apps' || e._o.action === 'apps')) {
      if (rows[2] && rows[2].length) setFocus(2, 0); return;
    }
    if (e && e._o && (e._o.action === 'tanados-wallpapers' || e._o.action === 'tanados-motion')) {
      loadLibrary(false);openBuilt('Wallpapers', wallpaperItems); return;
    }
    if(e&&e._o&&e._o.action==='tanados-shop'){shopMenu();return;}
    if(e&&e._o&&e._o.action==='customize'){appearanceMenu();return;}
    return originalAct(e);
  };
  function loadLibrary(selectInitial,done) {
    var xhr=new XMLHttpRequest();xhr.open('GET',media+'/catalog.json');xhr.timeout=5000;
    xhr.onload=function(){try{
      var data=JSON.parse(xhr.responseText);
      if(xhr.status!==200||data.version!==1||!data.wallpapers)throw Error('Invalid library');
      library=data.wallpapers.filter(function(w){return /^[a-z0-9-]{1,40}$/.test(w.id)&&typeof w.title==='string';});
      if(!library.length){emptyWallpaper();if(done)done();return;}
      document.documentElement.removeAttribute('data-gallery-empty');still.style.display='block';if(!current())selected=library[0].id;
      if(selectInitial){choose(selected);applySeason();}
      if(done)done();
    }catch(e){if(typeof logLine==='function')logLine('Wallpaper library unavailable: '+String(e));}};
    xhr.send();
  }
  loadLibrary(true);
  setTimeout(function () {
    if (typeof logLine === 'function') logLine('Wallpaper status: ' + JSON.stringify({id:selected,hidden:document.hidden,focused:focused,ready:video.readyState,paused:video.paused,time:video.currentTime,source:video.getAttribute('src'),error:video.error && video.error.code}));
  }, 4000);
  if (typeof rebuild === 'function' && typeof apps !== 'undefined' && apps.length) rebuild(false);
})();
