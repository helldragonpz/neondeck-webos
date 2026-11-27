'use strict';
const assert=require('assert/strict'),p=require('../frontend/palette');
function pixels(colours){return new Uint8ClampedArray(colours.flatMap(c=>Array.from({length:100},()=>[...c,255]).flat()));}
const red=p.derive(pixels([[170,20,30],[200,35,45],[80,10,15]])),blue=p.derive(pixels([[10,50,180],[30,70,210],[5,10,25]]));
assert(red.hue<20||red.hue>340);assert(blue.hue>200&&blue.hue<260);assert.notEqual(red.accent,blue.accent);assert(red.accent.match(/^#[a-f0-9]{6}$/));assert(p.derive(pixels([[2,2,2],[250,250,250],[110,110,110]])).neutral);
const hex=s=>[1,3,5].map(n=>parseInt(s.slice(n,n+2),16));for(let hue=0;hue<360;hue+=15){const a=p.derive(pixels([p.rgb(hue,.8,.4)]));assert(p.contrast(hex(a.accent),hex(a.panel))>=7);}
assert.deepEqual(p.derive(pixels([[170,20,30]])),p.derive(pixels([[170,20,30]])));
console.log('PASS palette hue selection, neutral fallback, determinism and contrast across 24 hues');
