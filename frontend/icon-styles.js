/* Shared artwork and frame metadata for Home, Apps and every style preview. */
(function(){
  var styles=[
    {key:'glass',label:'Glass',family:'line',description:'Clear glass · soft reflections'},
    {key:'minimal',label:'Minimal',family:'line',description:'Bare symbols · fine lines'},
    {key:'outlined',label:'Outlined',family:'line',description:'Technical corners · sharp wirework'},
    {key:'solid',label:'Solid',family:'fill',description:'Bold silhouettes · flat colour'},
    {key:'gradient',label:'Gradient',family:'fill',description:'Sculpted tiles · colour fade'},
    {key:'neon',label:'Neon',family:'line',description:'Glowing tubes · diamond frames'},
    {key:'arcade',label:'Arcade',family:'pixel',description:'Pixel artwork · stepped edges'},
    {key:'orbit',label:'Orbit',family:'duotone',description:'Round planets · satellite rings'},
    {key:'duotone',label:'Duotone',family:'duotone',description:'Two-tone artwork · no backplate'},
    {key:'sticker',label:'Sticker',family:'fill',description:'Paper badges · tilted artwork'},
    {key:'metal',label:'Metal',family:'fill',description:'Brushed alloy · engraved symbols'},
    {key:'hologram',label:'Hologram',family:'line',description:'Cut glass · scan lines'}
  ],byKey={};styles.forEach(function(s){byKey[s.key]=s;});
  function selected(){try{return localStorage.getItem('tanados.iconStyle')||'glass';}catch(_){return 'glass';}}
  function info(style){return byKey[style]||byKey.glass;}
  function artwork(name,style){var family=info(style).family,packs=window.NEONDECK_ICON_PACKS.icons,art;
    if(name==='netflix'&&family!=='pixel')art=TANADOS_ART.marks.netflix;
    else if(name==='jellyfin'&&family!=='pixel')art=TANADOS_ART.marks.jellyfin;
    else if(family==='pixel'&&name==='netflix')art='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h4v18H5zm10 0h4v18h-4zM9 3h2v4h2v4h2v4h2v6h-4v-4h-2v-4H9z"/></svg>';
    else if(family==='pixel'&&name==='jellyfin')art='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2h4v4h2v4h2v4h2v4h2v4H2v-4h2v-4h2v-4h2V6h2zm0 10v4H8v2h8v-2h-2v-4z" fill-rule="evenodd"/></svg>';
    else if(family==='line')art=TANADOS_ART.marks[name]||TANADOS_ART.stroke(name);
    else art=packs[family][name]||packs[family].app;
    return art.replace('<svg ','<svg class="nd-icon-art" data-art-family="'+family+'" aria-hidden="true" ');
  }
  function paint(node,name,title,style){style=info(style||selected()).key;node.setAttribute('data-icon-style',style);node.setAttribute('data-icon-name',name||'');node.setAttribute('data-icon-title',title||'App');
    if(name)node.innerHTML=artwork(name,style);else {node.textContent='';var letters=document.createElement('span');letters.className='tanados-monogram';letters.textContent=(title||'App').replace(/[^A-Za-z0-9]/g,'').slice(0,2)||'AP';node.appendChild(letters);}
    if((name==='ps4'||name==='ps5')&&info(style).family!=='line'){var badge=document.createElement('span');badge.className='nd-console-number';badge.textContent=name==='ps4'?'4':'5';node.appendChild(badge);}
  }
  function refresh(style){[].forEach.call(document.querySelectorAll('.tanados-icon[data-icon-name]'),function(n){paint(n,n.getAttribute('data-icon-name'),n.getAttribute('data-icon-title'),style);});}
  window.NEONDECK_ICONS={styles:styles,info:info,paint:paint,refresh:refresh,artwork:artwork};
})();
