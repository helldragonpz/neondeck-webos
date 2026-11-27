/* Four original, complete SVG icon sets. Each symbol is drawn as a seasonal object. */
(function(){
  var palettes={
    christmas:{a:'#e94b60',b:'#248c61',c:'#fff0ce',ink:'#492538',edge:'#fff5df',soft:'#bce3cf',cookie:'#b57543'},
    easter:{a:'#c7afff',b:'#96e4b1',c:'#ffe4a0',ink:'#40305e',edge:'#fff4fc',soft:'#f5b8de',cookie:'#d5b697'},
    newyear:{a:'#f5c85e',b:'#85ddec',c:'#fff0b7',ink:'#242d52',edge:'#fff4cf',soft:'#b9b5f8',cookie:'#bf8e43'},
    halloween:{a:'#f49a3d',b:'#a58be0',c:'#ffe5a5',ink:'#382140',edge:'#f7d69a',soft:'#8fbb88',cookie:'#965b39'}
  };
  function path(d,fill,stroke,width){return '<path d="'+d+'" fill="'+(fill||'none')+'" stroke="'+(stroke||'none')+'" stroke-width="'+(width||3)+'" stroke-linecap="round" stroke-linejoin="round"/>';}
  function rect(x,y,w,h,r,fill,stroke){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'" stroke="'+(stroke||'none')+'" stroke-width="3"/>';}
  function circle(x,y,r,fill,stroke){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" stroke="'+(stroke||'none')+'" stroke-width="2"/>';}
  function text(value,x,y,size,fill){return '<text x="'+x+'" y="'+y+'" text-anchor="middle" font-family="Arial,sans-serif" font-size="'+size+'" font-weight="800" fill="'+fill+'" stroke="none">'+value+'</text>';}
  function star(x,y,r,fill){var points=[];for(var i=0;i<10;i++){var angle=(i*36-90)*Math.PI/180,rad=i%2?r*.45:r;points.push(Math.round(x+Math.cos(angle)*rad)+','+Math.round(y+Math.sin(angle)*rad));}return '<polygon points="'+points.join(' ')+'" fill="'+fill+'" stroke="none"/>';}
  function play(p,x,y,size){return path('M'+x+' '+y+'v'+size+'l'+Math.round(size*.83)+' '+(-size/2)+'Z',p);}
  function egg(p,x,y,w,h,fill){return path('M'+x+' '+y+'c-'+w*.4+' 0-'+w*.55+' '+h*.58+'-'+w*.5+' '+h*.75+'c0 '+h*.35+' '+w+' '+h*.35+' '+w+' 0c'+w*.05+'-'+h*.17+'-'+w*.1+'-'+h*.75+'-'+w*.5+'-'+h*.75+'Z',fill,p.edge,2);}
  function pumpkin(p,x,y,r){return path('M'+x+' '+(y-r*.7)+'c-'+r*1.5+'-'+r*.8+'-'+r*1.5+' '+r*1.8+'-'+r*.4+' '+r*1.6+'l'+r*.4+'-'+r*.12+' '+r*.4+' '+r*.12+'c'+r*1.1+' '+r*.2+' '+r*1.1+'-'+r*2.4+'-'+r*.4+'-'+r*1.6+'Z',p.a,p.edge,2)+path('M'+x+' '+(y-r*.7)+'q-3-'+r*.5+' '+r*.3+'-'+r*.6,'none',p.soft,5);}
  function controller(kind,p,five){var a='';
    if(kind==='christmas')a=five?path('M27 29Q12 24 9 44L4 73q1 14 13 9l15-16h32l15 16q12 5 13-9l-5-29Q84 24 69 29Z',p.edge,p.a,4)+path('M12 40 23 36 29 62 16 78 9 75ZM84 40 73 36 67 62 80 78 87 75Z',p.a):path('M25 30Q11 27 9 45L5 72q-1 16 13 10l14-16h32l14 16q14 6 13-10l-4-27q-2-18-16-15Z',p.cookie,p.edge,5)+path('M18 37q-6 1-7 13l-3 21q1 10 8 7l15-16h34l15 16q7 3 8-7l-3-21q-1-12-7-13','none',p.c,2);
    if(kind==='easter')a=five?egg(p,24,26,32,59,p.a)+egg(p,72,26,32,59,p.soft)+rect(22,38,52,28,11,p.edge,p.a):path('M23 42Q6 4 22 7q10-2 13 33h26Q64 5 75 8q14 3-2 34 19 5 17 27l-6 14-17-15H29L12 83 6 69Q4 47 23 42Z',p.b,p.edge,3)+path('M23 15q7 8 7 23m43-22q-6 8-7 22','none',p.soft,7);
    if(kind==='newyear')a=five?path('M22 29 7 46 7 78 18 85 34 65h28l16 20 11-7V46L74 29Z',p.ink,p.a,4)+path('M9 47 22 36 29 61 16 77Zm78 0L74 36 67 61 80 77Z',p.b)+star(48,29,15,p.a):path('M20 30H76l14 19v30l-12 6-17-19H35L18 85 6 79V49Z',p.ink,p.a,5)+path('M15 37h66M13 44h8m54 0h8','none',p.c,3)+star(48,26,11,p.a);
    if(kind==='halloween')a=five?path('M48 27C15 6-4 51 10 78l17 7 11-17h20l11 17 17-7c14-27-5-72-38-51Z',p.a,p.edge,3)+path('M48 28q-4-17 10-19','none',p.soft,7)+path('M30 35q-11 11-11 37m47-37q11 11 11 37','none','#d5742e',3):path('M4 25 29 40 37 30 48 39 59 30 67 40 92 25 87 64 72 59 66 83 48 68 30 83 24 59 9 64Z',p.b,p.edge,3)+path('m29 42 9 4m20 0 9-4','none',p.c,3);
    a+=path('M24 43v17m-8-8h16','none',kind==='halloween'?p.ink:p.b,5)+circle(70,44,4,p.a=== '#f49a3d'?p.ink:p.b)+circle(78,53,4,p.ink)+circle(62,53,4,p.c);
    a+=five?rect(36,33,24,16,4,p.a,p.ink):rect(38,34,20,10,4,p.a);
    return a+text(five?'5':'4',48,65,18,kind==='newyear'?p.c:p.ink);
  }
  function television(kind,p){var a='';
    if(kind==='christmas')a=rect(9,24,78,51,9,p.b,p.edge)+rect(16,31,64,35,4,p.ink)+path('M43 24V9q-19-7-19 3 0 11 19 12m10 0V9q19-7 19 3 0 11-19 12','none',p.a,7)+path('M48 25v49M10 71h76','none',p.a,6)+star(64,45,9,p.c);
    if(kind==='easter')a=path('M12 29Q9 9 22 7q13 3 12 18h28Q61 7 74 7q13 2 10 22v41H12Z',p.a,p.edge,3)+rect(17,31,62,33,9,p.ink)+path('M21 59 37 40 47 51 61 38 75 59Z',p.b)+circle(60,42,6,p.c);
    if(kind==='newyear')a=rect(8,21,80,54,8,p.ink,p.a)+rect(14,27,68,39,4,'#37456b')+star(49,47,15,p.c)+path('M48 31V14M64 38l13-11M31 38 18 27M66 53l13 7','none',p.b,3);
    if(kind==='halloween')a=path('M9 26 80 18 89 73 15 80Z',p.b,p.edge,3)+path('M17 32 75 27 81 66 22 72Z',p.ink)+path('M32 61V45q0-18 16-18 16 0 16 18v16l-8-5-8 5-8-5Z',p.c)+circle(42,44,3,p.ink)+circle(54,44,3,p.ink);
    return a+path('M36 81h24m-12-7v9','none',p.c,5);
  }
  function media(kind,p,name,label){
    if(name==='netflix'){
      if(kind==='christmas')return path('M26 82V14m0 0 44 68m0 0V14','none',p.edge,21)+path('M26 82V14m0 0 44 68m0 0V14','none',p.a,13)+path('m20 29 12-8m-12 31 12-8m28-10 16-8m-16 32 16-8m-43-8 13-8m2 32 13-8','none',p.edge,5);
      if(kind==='easter')return path('M25 83V14l45 69V14','none',p.b,17)+path('M25 74V23m45 51V23','none',p.a,8)+circle(25,15,11,p.soft,p.edge)+circle(70,15,11,p.c,p.edge)+circle(25,15,4,p.c)+circle(70,15,4,p.soft);
      if(kind==='newyear'){var a=path('M25 83V13l46 70V13','none',p.a,18);[23,40,57,74].forEach(function(y){a+=circle(25,y,3,p.edge)+circle(71,y,3,p.edge);});return a+star(49,19,9,p.b)+star(49,79,8,p.b);}
      return path('M14 87 22 8 35 15 36 35 62 63 61 17 76 8 83 86 67 79 63 68 36 46 32 80Z',p.a,p.c,2)+path('m21 24-11-5 11 15m52 20 13-8-11 18M32 66l-11-5','none',p.b,4);
    }
    if(name==='disney'){
      var a=kind==='halloween'?path('M12 83 14 35 28 26 34 46 44 14 60 24 58 45 76 28 85 42 84 83Z',p.b,p.edge,3):path('M12 83V36l12-16 12 16v15h24V36l12-16 12 16v47Z',kind==='christmas'?p.cookie:p.a,p.edge,3)+path('M35 51V23L48 8l13 15v28Z',kind==='easter'?p.soft:p.b,p.edge,2);
      a+=path('M40 83V65q8-15 16 0v18Z',p.ink)+rect(19,42,9,13,3,p.c)+rect(68,42,9,13,3,p.c)+rect(43,29,10,13,3,p.c);
      if(kind==='christmas')a+=path('M11 78h74M14 35h20m28 0h20M39 22h17','none',p.a,5);
      if(kind==='easter')a+=egg(p,23,9,18,26,p.c)+egg(p,73,9,18,26,p.c);
      if(kind==='newyear')a+=star(18,12,9,p.c)+star(79,9,8,p.b)+path('M3 35 9 28m78-2 6 6','none',p.a,4);
      if(kind==='halloween')a+=path('m21 61 6-5 6 5m32 0 6-5 6 5','none',p.a,4);return a;
    }
    if(name==='jellyfin'){
      if(kind==='christmas')return path('m48 5 22 26H59l23 24H65l25 28H6l25-28H14l23-24H26Z',p.b,p.edge,3)+path('m48 43 20 30H28Z',p.c)+path('m48 52 10 16H38Z',p.a)+star(48,10,11,p.a);
      if(kind==='easter')return path('M48 9C32 9 3 66 12 81c8 14 64 14 72 0C93 66 64 9 48 9Z',p.a,p.edge,3)+path('M48 29 72 75H24Z',p.b)+path('m48 47 12 23H36Z',p.soft)+circle(24,73,4,p.c)+circle(72,73,4,p.c);
      if(kind==='newyear')return path('M48 11 89 83H7Z',p.a,p.edge,2)+path('M48 25 76 76H20Z',p.ink)+path('m48 43 17 26H31Z',p.b)+star(48,11,10,p.c)+path('m10 39 8 3m60 0 8-3','none',p.b,4);
      return path('M48 9C30 11 12 53 7 83l16-7 12 9 13-9 13 9 12-9 16 7C84 53 66 11 48 9Z',p.c,p.a,3)+path('m48 46 16 25H32Z',p.b)+circle(36,39,4,p.ink)+circle(60,39,4,p.ink);
    }
    if(name==='youtube'){
      if(kind==='christmas')return rect(37,6,22,15,5,p.c,p.edge)+circle(48,55,35,p.a,p.edge)+path('M19 37q28-21 58 0','none',p.c,6)+play(p.edge,39,39,30)+circle(25,57,4,p.soft);
      if(kind==='easter')return egg(p,48,6,67,82,p.a)+path('m18 61 10-8 10 8 10-8 10 8 10-8 10 8','none',p.b,7)+play(p.edge,39,30,28);
      if(kind==='newyear')return star(48,48,43,p.a)+circle(48,48,23,p.ink,p.edge)+play(p.c,41,34,28)+path('M12 10 17 19m63 57 7 7','none',p.b,5);
      return pumpkin(p,48,53,34)+play(p.ink,39,39,29)+path('m24 71 7 4m34 0 7-4','none',p.ink,4);
    }
    if(name==='prime'){
      if(kind==='christmas')return rect(13,30,70,50,7,p.b,p.edge)+rect(9,23,78,17,5,p.a,p.edge)+path('M48 25Q13 6 27 7q17-2 21 18 4-20 21-18 14-1-21 18M48 25v54','none',p.c,6)+play(p.c,32,45,22)+path('M21 84q27 12 55-2m-9-1 11-2-4 10','none',p.a,5);
      if(kind==='easter')return egg(p,29,14,25,39,p.soft)+egg(p,65,14,25,39,p.a)+path('M13 43q35-15 70 0L73 81H23Z',p.b,p.edge,3)+path('M21 59h56m-50 9h45','none',p.c,4)+play(p.ink,40,47,21);
      if(kind==='newyear')return path('M9 25h78v16q-17 7 0 14v19H9V55q17-7 0-14Z',p.a,p.edge,3)+play(p.ink,38,34,29)+star(20,30,5,p.ink)+star(75,66,5,p.ink);
      return path('M18 66 43 9 65 32 76 68Z',p.b,p.edge,3)+path('M8 68q41-13 80 0l-6 15H15Z',p.ink,p.a,4)+rect(32,45,30,15,3,p.a)+play(p.ink,42,48,10);
    }
    var initials=String(label||'App').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()||'AP';
    return (kind==='christmas'?rect(12,25,72,59,10,p.b,p.edge)+rect(8,19,80,19,5,p.a,p.edge)+path('M47 20q-32-22-27-5 2 13 27 5 25 8 27-5 5-17-27 5Z',p.c):kind==='easter'?egg(p,48,6,72,80,p.a):kind==='newyear'?star(48,48,44,p.a):pumpkin(p,48,54,36))+text(initials,48,67,27,kind==='christmas'?p.edge:p.ink);
  }
  function navigation(kind,p,name){
    if(name==='grid'||name==='app'){var a='';[[12,12],[55,12],[12,55],[55,55]].forEach(function(v,i){if(kind==='easter')a+=egg(p,v[0]+15,v[1]-4,28,33,i%2?p.soft:p.a);else if(kind==='halloween')a+=pumpkin(p,v[0]+15,v[1]+17,16);else a+=rect(v[0],v[1],29,29,kind==='newyear'?3:5,i%2?p.b:p.a,p.edge)+(kind==='christmas'?path('M'+(v[0]+14)+' '+v[1]+'v29m-14-15h29','none',p.c,4):star(v[0]+14,v[1]+15,8,p.c));});return a;}
    if(name==='shop'){
      if(kind==='easter')return egg(p,31,17,23,40,p.a)+egg(p,65,17,23,40,p.soft)+path('M11 43q37-15 74 0L75 84H21Z',p.b,p.edge,3)+path('M21 60h55m-50 11h45','none',p.c,4);
      if(kind==='halloween')return pumpkin(p,48,57,35)+path('M19 38q-1-49 29-31 30-18 29 31','none',p.b,6)+path('m29 49 10-2-5 12m33-10-10-2 5 12m-27 9 13 7 13-7','none',p.ink,5);
      return path('M19 30h58l9 54H10Z',kind==='christmas'?p.b:p.ink,p.edge,3)+path('M32 31V20q16-23 32 0v11','none',p.a,8)+(kind==='christmas'?path('M48 31v52M16 47h65','none',p.a,9):star(48,58,19,p.a));
    }
    if(name==='inputs'||name==='hdmi')return path(kind==='halloween'?'M12 26 29 33 34 20 62 20 67 33 84 26 78 65 65 79H31L18 65Z':'M15 27H81V64L65 80H31L15 64Z',kind==='christmas'?p.a:kind==='newyear'?p.ink:p.b,p.edge,3)+path('M30 27V9m18 18V9m18 18V9','none',kind==='christmas'?p.edge:p.a,7)+path('M30 50h36m-27-8 9 8-9 8','none',p.c,6)+(kind==='christmas'?path('m20 35 10-5m39 31 10-5','none',p.edge,5):'');
    if(name==='settings'){var a='';[22,48,74].forEach(function(x,i){a+=path('M'+x+' 13V83','none',kind==='christmas'?p.a:p.b,8);var y=i===1?33:61;a+=kind==='newyear'?star(x,y,14,p.a):kind==='halloween'?pumpkin(p,x,y,12):circle(x,y,12,i===1?p.soft:p.c,p.edge);if(kind==='christmas')a+=path('m'+(x-3)+' 23 6-4m-6 24 6-4','none',p.edge,3);});return a;}
    if(name==='edit'){
      if(kind==='halloween')return path('M19 75 62 10q6-5 12 5L31 79Z',p.b,p.edge,3)+path('M12 63 40 81 29 92 3 76Z',p.a,p.c,3)+path('m11 72 15 12m-9-18 15 12','none',p.ink,3);
      return path('m11 67 50-56q9-7 20 7L30 77 7 89Z',kind==='christmas'?p.a:kind==='easter'?p.b:p.ink,p.edge,3)+path('m11 67 19 10-23 12Z',p.c)+path('m30 48 12 11m1-26 12 11m0-24 12 11','none',kind==='christmas'?p.edge:p.a,6);
    }
    if(name==='photo')return (kind==='easter'?path('M12 80V35q36-55 72 0v45Z',p.a,p.edge,3):rect(9,15,78,67,8,kind==='halloween'?p.b:kind==='christmas'?p.cookie:p.ink,p.edge))+path('M17 73 35 45 50 63 65 39 80 73Z',kind==='christmas'||kind==='easter'?p.b:kind==='halloween'?p.ink:p.a,kind==='easter'?p.ink:undefined,2)+circle(30,31,8,p.c)+(kind==='newyear'?star(66,28,13,p.b):'');
    if(name==='clock')return circle(48,48,35,kind==='christmas'?p.b:p.ink,p.edge)+circle(48,48,27,p.a)+path('M48 27v24l17 8','none',p.c,6)+(kind==='newyear'?star(48,10,10,p.c):'');
    if(name==='play')return media(kind,p,'youtube');
    if(name==='tv'||name==='devtv')return television(kind,p);
    if(name==='home')return path('M7 43 48 10 89 43H77v41H20V43Z',p.a,p.edge,3)+rect(39,53,19,31,5,p.ink)+rect(26,34,12,12,3,p.c)+rect(59,34,12,12,3,p.c);
    if(name==='trash')return rect(23,28,50,57,6,p.a,p.edge)+rect(15,17,66,16,5,p.b,p.edge)+path('M34 17V8h28v9M39 43v27m18-27v27','none',p.c,5);
    return '';
  }
  function icon(kind,name,label){var p=palettes[kind];if(!p)return '';var art=name==='ps4'||name==='ps5'?controller(kind,p,name==='ps5'):name==='tvbox'?television(kind,p):navigation(kind,p,name)||media(kind,p,name,label);
    return '<svg class="nd-icon-art nd-holiday-art" data-holiday-pack="'+kind+'" data-holiday-subject="'+name+'" viewBox="0 0 96 96" fill="none" aria-hidden="true">'+art+'</svg>';
  }
  window.NEONDECK_HOLIDAY_ART={icon:icon,supports:function(name){return ['ps4','ps5','tvbox','youtube','netflix','prime','disney','jellyfin','app','shop','grid','inputs','hdmi','settings','edit','photo','clock','play','tv','devtv','home','trash'].indexOf(name)>=0;}};
})();
