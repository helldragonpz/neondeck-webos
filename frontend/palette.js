/* Small, deterministic wallpaper palette model. No network or DOM dependency. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NEONDECK_PALETTE=factory();})(this,function(){
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function hsl(r,g,b){r/=255;g/=255;b/=255;var max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2,h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;}return [h,s,l];}
  function rgb(h,s,l){h=(h%360+360)%360;var c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,p=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return p.map(function(v){return Math.round((v+m)*255);});}
  function hex(c){return '#'+c.map(function(v){return ('0'+clamp(Math.round(v),0,255).toString(16)).slice(-2);}).join('');}
  function lum(c){var v=c.map(function(x){x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);});return v[0]*.2126+v[1]*.7152+v[2]*.0722;}
  function contrast(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function derive(pixels){var bins=[],i;for(i=0;i<24;i++)bins.push({weight:0,hx:0,hy:0,s:0});
    for(i=0;i+3<pixels.length;i+=4){if(pixels[i+3]<180)continue;var c=hsl(pixels[i],pixels[i+1],pixels[i+2]);if(c[2]<.07||c[2]>.94||c[1]<.12)continue;var weight=(.25+c[1])*(1-Math.abs(c[2]-.46)),bin=bins[Math.floor(c[0]/15)%24],a=c[0]*Math.PI/180;bin.weight+=weight;bin.hx+=Math.cos(a)*weight;bin.hy+=Math.sin(a)*weight;bin.s+=c[1]*weight;}
    bins.sort(function(a,b){return b.weight-a.weight;});if(!bins[0].weight)return {accent:'#d8deeb',secondary:'#a8b4cc',panel:'#111722',rgb:'216,222,235',onAccent:'#101521',neutral:true};
    var b=bins[0],h=(Math.atan2(b.hy,b.hx)*180/Math.PI+360)%360,s=clamp(b.s/b.weight,.48,.84),accent=rgb(h,s,.75),secondary=rgb(h+42,s*.85,.7),panel=rgb(h,.35,.075);
    while(contrast(accent,panel)<7&&hsl.apply(null,accent)[2]<.9)accent=rgb(h,s,hsl.apply(null,accent)[2]+.025);
    return {accent:hex(accent),secondary:hex(secondary),panel:hex(panel),rgb:accent.join(','),onAccent:'#101521',hue:Math.round(h),neutral:false};
  }
  return {derive:derive,hsl:hsl,rgb:rgb,hex:hex,contrast:contrast};
});
