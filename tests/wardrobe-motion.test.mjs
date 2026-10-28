import assert from 'node:assert/strict';
import {createWardrobeMotion} from '../wardrobe-motion.js';

const motion=createWardrobeMotion();
assert.equal(motion.state.amount,0);
assert.equal(motion.setOpen(true,100),true);
motion.update(625);
assert(motion.state.amount>0&&motion.state.amount<1);
assert(motion.state.leftAngle<0&&motion.state.rightAngle>0,'both leaves must open outwards');
const halfway=motion.state.amount;
assert.equal(motion.setOpen(false,625),true);
motion.update(625);
assert.equal(motion.state.amount,halfway,'reversing during travel must not jump');
motion.update(2000);
assert.equal(motion.state.amount,0);
assert.equal(motion.state.moving,false);
motion.setOpen(true,2100);motion.update(4000);
assert.equal(motion.state.amount,1);
assert.equal(motion.state.moving,false);
assert.equal(motion.setOpen(true,4100),false,'repeat open is a no-op');
const before={...motion.state};motion.update(NaN);motion.setOpen(false,NaN);
assert.deepEqual(motion.state,before,'invalid time cannot corrupt door transforms');

const fine=createWardrobeMotion(),coarse=createWardrobeMotion();
fine.setOpen(true,0);coarse.setOpen(true,0);
for(let t=0;t<=1050;t+=7)fine.update(t);
coarse.update(1050);
assert.deepEqual(fine.state,coarse.state,'final position is independent of frame frequency');
for(let i=0;i<30;i++){
 const t=5000+i*75;motion.toggle(t);motion.update(t+30);
 assert(motion.state.amount>=0&&motion.state.amount<=1,'rapid repeated clicks stay within hinge limits');
}
console.log('Wardrobe: outward opening, endpoints, reversal, invalid input and repeated clicks passed.');
