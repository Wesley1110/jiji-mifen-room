// Camera clearance is expressed in scene units. The doorway connects the
// bedroom and hallway; a wider overall bounding box would allow wall clipping.
const RADIUS=.16;
import {HOUSE_BOUNDS,ENTRY,READING_OBSTACLES,GARDEN_OBSTACLES} from './house-layout.js';
const OBSTACLES=[...READING_OBSTACLES,...GARDEN_OBSTACLES];
const {room:ROOM,hall:HALL,reading:PASSAGE,garden:GARDEN}=HOUSE_BOUNDS;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const inBox=(p,b)=>p.x>=b.x0&&p.x<=b.x1&&p.y>=b.y0&&p.y<=b.y1&&p.z>=b.z0&&p.z<=b.z1;
const insideFurniture=(p,b)=>p.x>b.x0-RADIUS&&p.x<b.x1+RADIUS&&p.z>b.z0-RADIUS&&p.z<b.z1+RADIUS&&p.y>b.y0&&p.y<b.y1+RADIUS;

export function createNavigation(getDoorAngle,getEntryAngle=()=>0){
 function nookOpening(p){
  if(p.x< -9.55||p.x> -8.85||p.z<13.85||p.z>17.61||p.y<.3)return false;
  const q=(p.z-15.73)/1.89;
  return p.y<=2.68+1.12*Math.sqrt(Math.max(0,1-q*q))-RADIUS;
 }
 function entryOpening(p){
  if(getEntryAngle()<1.05||p.z<19.10||p.z>19.90||p.y<.3)return false;
  const dx=p.x-ENTRY.x,clear=.95-RADIUS;
  return Math.abs(dx)<=clear&&p.y<=2.45+Math.sqrt(Math.max(0,clear*clear-dx*dx))-RADIUS;
 }
 function inHallway(p){return inBox(p,HALL)||inBox(p,PASSAGE)||inBox(p,GARDEN)||nookOpening(p)||entryOpening(p);}
 function entryLeafBlocks(p,angle=getEntryAngle()){
  if(p.y<0||p.y>3.55)return false;
  const dx=p.x-ENTRY.hingeX,dz=p.z-ENTRY.z,c=Math.cos(angle),s=Math.sin(angle),x=c*dx-s*dz,z=s*dx+c*dz;
  return Math.hypot(x-clamp(x,0,ENTRY.width),z-clamp(z,-.10,.10))<RADIUS;
 }
 function leafBlocks(p,angle=getDoorAngle()){
  if(p.y<.0||p.y>3.52)return false;
  const dx=p.x+4.39,dz=p.z-10.08,c=Math.cos(angle),s=Math.sin(angle),x=c*dx-s*dz,z=s*dx+c*dz;
  const distance=Math.hypot(x-clamp(x,0,1.68),z-clamp(z,.04,.26));
  return distance<RADIUS;
 }
 function doorway(p){
  if(getDoorAngle()<1.05||p.z<9.80||p.z>10.65||p.y<.3)return false;
  const x=p.x+3.55,clear=.885-RADIUS;
  return Math.abs(x)<=clear&&p.y<=2.50+Math.sqrt(Math.max(0,clear*clear-x*x));
 }
 function allowed(p){
  if(!(inBox(p,ROOM)||inHallway(p)||doorway(p)))return false;
  if(OBSTACLES.some(b=>insideFurniture(p,b)))return false;
  return !leafBlocks(p)&&!entryLeafBlocks(p);
 }
 function constrain(p){
  if(allowed(p))return p;
  let best=null,distance=Infinity;
  for(const box of [ROOM,HALL,PASSAGE,GARDEN]){
   const q={x:clamp(p.x,box.x0,box.x1),y:clamp(p.y,box.y0,box.y1),z:clamp(p.z,box.z0,box.z1)};
   for(const b of OBSTACLES)if(insideFurniture(q,b))q.y=Math.max(q.y,b.y1+RADIUS+.03);
   if(leafBlocks(q))q.z=box===ROOM?9.75:10.66;
   if(!allowed(q))continue;
   const d=(q.x-p.x)**2+(q.y-p.y)**2+(q.z-p.z)**2;if(d<distance){best=q;distance=d;}
  }
  if(best){p.x=best.x;p.y=best.y;p.z=best.z;}return p;
 }
 function move(p,delta){
  // Substeps prevent a fast diagonal or scroll movement from tunnelling past
  // the thin wall or door. Axis retries make sliding along walls possible.
  const count=Math.max(1,Math.ceil(Math.hypot(delta.x,delta.y,delta.z)/.055)),step={x:delta.x/count,y:delta.y/count,z:delta.z/count};
  for(let i=0;i<count;i++){
   const q={x:p.x+step.x,y:p.y+step.y,z:p.z+step.z};
   if(allowed(q)){p.x=q.x;p.y=q.y;p.z=q.z;continue;}
   for(const axis of ['x','z','y']){
    const q={x:p.x,y:p.y,z:p.z};q[axis]+=step[axis];if(allowed(q))p[axis]=q[axis];
   }
  }
  return p;
 }
 function canClose(p){
  for(let angle=0;angle<=getDoorAngle()+.05;angle+=.05)if(leafBlocks(p,angle))return false;
  return true;
 }
 function canCloseEntry(p){for(let a=0;a<=getEntryAngle()+.05;a+=.04)if(entryLeafBlocks(p,a))return false;return true;}
 return {move,constrain,allowed,inHallway,canClose,canCloseEntry,region:p=>inBox(p,GARDEN)?'garden':entryOpening(p)?'home entrance':inBox(p,PASSAGE)||nookOpening(p)?'reading room':inBox(p,HALL)?'hallway':doorway(p)&&p.z>10.02?'bedroom doorway':'bedroom'};
}
