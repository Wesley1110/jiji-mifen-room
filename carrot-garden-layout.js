// Hallway-local coordinates; +Z leads from the house into the front garden.
// The porch, centre path and the cross aisle stay free of planted beds.
export const CARROT_BEDS=[
 {x:-7.25,z:13.70,width:3.80,depth:1.95},
 {x:.05,z:13.70,width:3.80,depth:1.95},
 {x:-7.25,z:16.60,width:3.80,depth:1.95},
 {x:.05,z:16.60,width:3.80,depth:1.95}
];
export const CARROT_SOIL_HEIGHT=.235;
export function gardenPlantings(){
 let seed=73191;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
 return CARROT_BEDS.flatMap((b,bed)=>Array.from({length:6},(_,i)=>({
  bed,index:bed*6+i,x:b.x+((i%3)-1)*1.10+(rand()-.5)*.095,
  z:b.z+(i<3?-.43:.43)+(rand()-.5)*.07,
  scale:.51+rand()*.095,y:CARROT_SOIL_HEIGHT-(.27+rand()*.04),
  yaw:(bed%2?-.65:.65)+(rand()-.5)*.90,
  leanX:(rand()-.5)*.13,leanZ:(rand()-.5)*.16
 })));
}
