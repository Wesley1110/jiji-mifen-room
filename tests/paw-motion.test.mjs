import assert from 'node:assert/strict';
import {PAT_DURATION,sampleDoublePat,advanceDoublePat} from '../paw-motion.js';
for (const hz of [15,20,30,60,120]) {
  let previous=false, contacts=0;
  for (let t=0;t<PAT_DURATION+.2;t+=1/hz) {
    const s=sampleDoublePat(t);
    assert.ok(s.pressure>=0&&s.pressure<=1&&Number.isFinite(s.lift));
    if (s.touching&&!previous) contacts++;
    previous=s.touching;
  }
  assert.equal(contacts,2,`Exactly two separated contacts at ${hz} Hz`);
}
assert.equal(sampleDoublePat(.84).pressure,0,'Paw lifts between pats');
assert.equal(sampleDoublePat(PAT_DURATION).envelope,0,'Paw retracts');
for(const delta of [.016,.10,1]){
  let t=0,wasTouching=false,contacts=0;
  while(t<PAT_DURATION){t=advanceDoublePat(t,delta);const touching=sampleDoublePat(t).touching;if(touching&&!wasTouching)contacts++;wasTouching=touching;}
  assert.equal(contacts,2,`Frame delay ${delta}s must not skip a pat`);
}
console.log('PASS: two distinct pats at 15/20/30/60/120 Hz; lift and retraction.');
