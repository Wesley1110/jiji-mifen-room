// Camera clearance is expressed in scene units. The doorway connects the
// bedroom and hallway; a wider overall bounding box would allow wall clipping.
const RADIUS=.16;
const ROOM={x0:-10.35,x1:5.15,y0:.3,y1:7.7,z0:-2.95,z1:10.02};
const HALL={x0:-8.95,x1:1.84,y0:.3,y1:4.43,z0:10.51,z1:19.05};
const PASSAGE={x0:-15.94,x1:-8.90,y0:.3,y1:4.43,z0:13.77,z1:16.39};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const inBox=(p,b)=>p.x>=b.x0&&p.x<=b.x1&&p.y>=b.y0&&p.y<=b.y1&&p.z>=b.z0&&p.z<=b.z1;

export function createNavigation(getDoorAngle){
 function inHallway(p){return inBox(p,HALL)||inBox(p,PASSAGE);}
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
  // The cross passage has a lower lintel than the hallway ceiling.
  if(p.x> -9.52&&p.x< -8.89&&p.z>13.55&&p.z<16.65&&p.y>3.49)return false;
  return !leafBlocks(p);
 }
 function constrain(p){
  if(allowed(p))return p;
  let best=null,distance=Infinity;
  for(const box of [ROOM,HALL,PASSAGE]){
   const q={x:clamp(p.x,box.x0,box.x1),y:clamp(p.y,box.y0,box.y1),z:clamp(p.z,box.z0,box.z1)};
   if(q.x> -9.52&&q.x< -8.89&&q.z>13.55&&q.z<16.65)q.y=Math.min(q.y,3.49);
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
 return {move,constrain,allowed,inHallway,canClose,region:p=>inBox(p,PASSAGE)?'side passage':inBox(p,HALL)?'hallway':doorway(p)&&p.z>10.02?'doorway':'bedroom'};
}
