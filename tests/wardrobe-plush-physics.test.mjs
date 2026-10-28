import assert from 'node:assert/strict';
import {settleCarrotPlushes,CARROT_CABINET,CARROT_BODY_HEIGHT,carrotRadius} from '../wardrobe-plush-physics.js';

const settled=settleCarrotPlushes();
assert.equal(settled.chains.length,2);
assert(settled.report.tiltDegrees.every(a=>a>45),'neither cushion can remain standing upright');
assert(settled.report.maxPenetration<.004,'contact solver must separate the two stuffed volumes');
assert(settled.report.maxSpeed<.025,'freeze only after the gravity settling is nearly at rest');
assert(settled.chains[1][5].y>settled.chains[0][5].y+.4,'the upper cushion rests above the lower one');

for(let k=0;k<2;k++){
 let lowest=Infinity;
 for(let j=0;j<=64;j++)for(let i=0;i<72;i++){
  const t=j/64,y=.025+t*CARROT_BODY_HEIGHT,r=carrotRadius(y),a=i/72*Math.PI*2;
  const p=settled.deform(k,.025*(1-t)**2+Math.cos(a)*r,y,Math.sin(a)*r*.79);
  assert(p.every(Number.isFinite),'every deformed vertex must remain finite');
  assert(p[0]>=CARROT_CABINET.left&&p[0]<=CARROT_CABINET.right,'body stays inside cabinet sides');
  assert(p[1]>=CARROT_CABINET.floor-.010,'flattened contact cannot pass through the cushion');
  assert(p[2]>CARROT_CABINET.back&&p[2]<CARROT_CABINET.front,'body clears the back panel and closed doors');
  lowest=Math.min(lowest,p[1]);
 }
 if(k===0)assert(lowest<CARROT_CABINET.floor+.055,'the lower cushion has a supporting footprint on the lining');
}
const bodyContact=Math.min(...settled.chains[0].slice(0,10).flatMap(a=>settled.chains[1].slice(0,10).map(b=>Math.hypot(b.x-a.x,b.y-a.y)-(a.r+b.r)*.94)));
assert(Math.abs(bodyContact)<.008,'the upper cushion is supported by the lower cushion');
console.log('Carrot cushions: resting tilt, volume contacts, support, cabinet clearance and finite surfaces passed.');
