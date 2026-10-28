// The two stuffed cushions are settled under gravity before their detailed
// surfaces and fur are built. A compliant chain represents each filled body;
// short flexible end links carry the cloth leaves. Floor, side-wall and
// inter-cushion contacts determine the resting shape, rather than an upright
// display transform. The settled geometry costs no per-frame physics work.
export const CARROT_BODY_HEIGHT=1.86;
export const CARROT_CABINET={floor:1.1845,left:-1.245,right:1.245,back:-.56,front:.48};
export function carrotRadius(y){const t=Math.max(0,Math.min(1,(y-.025)/CARROT_BODY_HEIGHT));return .48*Math.pow(Math.max(0,Math.sin(Math.PI*t)),.49)*(.55+.45*t);}

export function settleCarrotPlushes({steps=1080}={}){
 const ys=[.075,.24,.44,.64,.84,1.04,1.24,1.44,1.64,1.81,2.00,2.20,2.40];
 const starts=[{x:-.96,y:1.68,dx:.978,dy:.208},{x:.98,y:2.61,dx:-.94,dy:.342}];
 const chains=starts.map((s,k)=>ys.map(y=>{
  const radius=y<1.86?Math.max(.035,carrotRadius(y)):(y<2.1?.105:.13);
  const x=s.x+s.dx*y,py=s.y+s.dy*y;
  return {x,y:py,px:x,py,r:radius,localY:y,invMass:y>1.86?4:1/(.3+radius*radius*7),owner:k};
 }));
 const constraints=[];
 for(const nodes of chains)for(let span=1;span<=3;span++)for(let i=0;i<nodes.length-span;i++){
  const leaf=i+span>=10;
  // Long body spans preserve the softly stuffed silhouette. Leaves retain
  // segment lengths and light bending resistance, and droop under their weight.
  if(leaf&&span>2)continue;
  constraints.push({a:nodes[i],b:nodes[i+span],rest:ys[i+span]-ys[i],stiffness:span===1?.99:leaf?.28:span===2?.91:.70});
 }
 const floor=CARROT_CABINET.floor;
 function bounds(n){
  const radius=n.r*.94;
  n.x=Math.max(CARROT_CABINET.left+radius,Math.min(CARROT_CABINET.right-radius,n.x));
  if(n.y<floor+radius){n.y=floor+radius;n.x-=Math.max(-.012,Math.min(.012,(n.x-n.px)*.28));}
 }
 function separate(a,b){
   const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=(a.r+b.r)*.94;
   if(d>=min||d<1e-8)return;
   const c=(min-d)/d*.92,w=a.invMass+b.invMass;
   a.x-=dx*c*a.invMass/w;a.y-=dy*c*a.invMass/w;
   b.x+=dx*c*b.invMass/w;b.y+=dy*c*b.invMass/w;
 }
 function contacts(){
  for(const a of chains[0])for(const b of chains[1])separate(a,b);
  // The soft leaves may drape over the filling, but never fold through it.
  for(const nodes of chains)for(let i=10;i<nodes.length;i++)for(let j=0;j<=i-3;j++)separate(nodes[i],nodes[j]);
 }
 const dt=1/120;
 for(let step=0;step<steps;step++){
  for(const nodes of chains)for(const n of nodes){const x=n.x,y=n.y;n.x+=(n.x-n.px)*.965;n.y+=(n.y-n.py)*.965-9.81*dt*dt;n.px=x;n.py=y;}
  for(let iteration=0;iteration<18;iteration++){
   for(const c of constraints){const dx=c.b.x-c.a.x,dy=c.b.y-c.a.y,d=Math.hypot(dx,dy);if(d<1e-9)continue;const v=(d-c.rest)/d*c.stiffness,w=c.a.invMass+c.b.invMass;c.a.x+=dx*v*c.a.invMass/w;c.a.y+=dy*v*c.a.invMass/w;c.b.x-=dx*v*c.b.invMass/w;c.b.y-=dy*v*c.b.invMass/w;}
   contacts();chains.forEach(ns=>ns.forEach(bounds));
  }
 }
 const sample=(index,y)=>{
  const ns=chains[index];let i=0;while(i<ns.length-2&&ns[i+1].localY<y)i++;
  const a=ns[i],b=ns[i+1],before=ns[Math.max(0,i-1)],after=ns[Math.min(ns.length-1,i+2)];
  const length=b.localY-a.localY,t=(y-a.localY)/length;
  const ax=(b.x-before.x)/(b.localY-before.localY),ay=(b.y-before.y)/(b.localY-before.localY);
  const bx=(after.x-a.x)/(after.localY-a.localY),by=(after.y-a.y)/(after.localY-a.localY);
  // Cubic Hermite interpolation avoids visible corners between solver nodes.
  const t2=t*t,t3=t2*t,h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;
  const x=h00*a.x+h10*length*ax+h01*b.x+h11*length*bx,py=h00*a.y+h10*length*ay+h01*b.y+h11*length*by;
  const dx=(6*t2-6*t)*a.x+(3*t2-4*t+1)*length*ax+(-6*t2+6*t)*b.x+(3*t2-2*t)*length*bx;
  const dy=(6*t2-6*t)*a.y+(3*t2-4*t+1)*length*ay+(-6*t2+6*t)*b.y+(3*t2-2*t)*length*by;
  const d=Math.hypot(dx,dy)||1;return {x,y:py,tx:dx/d,ty:dy/d};
 };
 function deform(index,x,y,z){
  const c=sample(index,y);let px=c.x+c.ty*x,py=c.y-c.tx*x;
  // At contact the filling flattens into a broad footprint. A narrow smooth
  // transition avoids a hard cut while leaving the upper body rounded.
  const softMax=(v,limit,width)=>{const d=v-limit;return d>width?v:d< -width?limit:limit+(d+width)**2/(4*width);};
  py=softMax(py,floor-.009,.055);
  px=softMax(px,CARROT_CABINET.left+.005,.025);
  px=-softMax(-px,-CARROT_CABINET.right+.005,.025);
  return [px,py,z+(index===0?-.045:.025)];
 }
 const maxSpeed=Math.max(...chains.flat().map(n=>Math.hypot(n.x-n.px,n.y-n.py)/dt));
 let maxPenetration=0;
 for(const a of chains[0])for(const b of chains[1])maxPenetration=Math.max(maxPenetration,(a.r+b.r)*.94-Math.hypot(b.x-a.x,b.y-a.y));
 const tiltDegrees=chains.map(ns=>Math.atan2(Math.abs(ns[8].x-ns[1].x),Math.abs(ns[8].y-ns[1].y))*180/Math.PI);
 return {chains,sample,deform,report:{method:'gravity-settled compliant cushion chains',gravity:9.81,simulatedSeconds:steps*dt,contacts:['cotton cushion','cabinet sides','other carrot'],tiltDegrees,maxSpeed,maxPenetration,staticAfterSettling:true}};
}
