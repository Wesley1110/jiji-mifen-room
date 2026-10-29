import assert from 'node:assert/strict';
import {createWardrobeDrawerMotion,drawerPuff,WARDROBE_DRAWER_TRAVEL} from '../wardrobe-storage-motion.js';

const drawer=createWardrobeDrawerMotion();
drawer.setOpen(true,0);drawer.update(600);
const half=drawer.state.extension;
assert(half>0&&half<WARDROBE_DRAWER_TRAVEL);
drawer.setOpen(false,600);drawer.update(600);
assert.equal(drawer.state.extension,half,'reversing at a click must not teleport the drawer');
drawer.update(1800);assert.equal(drawer.state.extension,0);
drawer.setOpen(true,1900);drawer.update(4000);
assert.equal(drawer.state.extension,WARDROBE_DRAWER_TRAVEL);
assert.equal(drawer.state.moving,false);
const before={...drawer.state};drawer.update(NaN);drawer.setOpen(false,Infinity);assert.deepEqual(drawer.state,before);

for(const minZ of [-.44,-.35,-.05,.14])for(let i=0;i<=100;i++){
 const amount=i/100,puff=drawerPuff(amount,minZ);
 assert(puff>=0&&puff<=1);
 if(minZ+amount*WARDROBE_DRAWER_TRAVEL<=.705)assert.equal(puff,0,'toys must stay compressed until their trailing edge clears the fixed rail');
 assert.equal(drawerPuff(amount,minZ),puff,'opening and closing have the same safe envelope');
}
for(let i=0;i<40;i++){drawer.toggle(5000+i*31);drawer.update(5015+i*31);assert(drawer.state.amount>=0&&drawer.state.amount<=1);}
console.log('Carrot drawer: smooth reversal, bounds, rapid clicks and rail clearance passed.');
