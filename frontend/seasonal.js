/* Configurable holiday windows; Orthodox Easter, including Bulgarian dates. */
(function(root){
 function easter(y){var a=y%4,b=y%7,c=y%19,d=(19*c+15)%30,e=(2*a+4*b-d+34)%7,n=d+e+114;return new Date(Date.UTC(y,Math.floor(n/31)-1,n%31+1+Math.floor(y/100)-Math.floor(y/400)-2));}
 function dayInSofia(value,zone){var d=new Date(value);try{var parts=new Intl.DateTimeFormat('en-US',{timeZone:zone||'Europe/Sofia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d),o={};parts.forEach(function(p){o[p.type]=p.value;});return new Date(Date.UTC(Number(o.year),Number(o.month)-1,Number(o.day)));}catch(_){return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));}}
 function season(value,config){var c=config||{},day=dayInSofia(value,c.timezone),year=day.getUTCFullYear(),month=day.getUTCMonth()+1,date=day.getUTCDate(),md=month*100+date;
  if(c.newyear&&(md>=1229||md<=102))return 'newyear';
  if(c.halloween&&md>=1024&&md<=1101)return 'halloween';
  var start={'11-15':1115,'12-01':1201,'12-15':1215,'12-20':1220}[c.christmasStart]||1201,end=c.christmasEnd==='01-01'?101:106;
  if(md>=start||md<=end)return 'christmas';
  var before=[7,14,21].indexOf(c.easterBefore)>=0?c.easterBefore:14,after=[1,3,7].indexOf(c.easterAfter)>=0?c.easterAfter:3,delta=(day-easter(year))/86400000;
  return delta>=-before&&delta<=after?'easter':'';
 }
 var api={easter:easter,season:season,dayInSofia:dayInSofia};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TANADOS_SEASONS=api;
})(this);
