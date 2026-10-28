import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {heartPath} from './storybook-desk.js?revision=nightstand-preview-1';
import {makeHinokiMaterials,makeWovenMaterial} from './wardrobe-materials.js?revision=bunny-wardrobe-3';
import {createPinkCarrotPlushes} from './wardrobe-plush.js?revision=bunny-wardrobe-3';
import {createWardrobeController} from './wardrobe-interaction.js?revision=bunny-wardrobe-3';

// The viewer stands at the bed facing +Z: +X is the left side of the doorway.
// Local +Z is the cabinet front. Keep this movable asset independent of the GLB.
export const WARDROBE_PLACEMENT={position:[1.30,0,9.18],rotation:Math.PI,scale:.90};

function roundedArch(width,height,r=.12){
 const s=new THREE.Shape(),w=width/2,cap=width*.36;
 s.moveTo(-w+r,0);s.lineTo(w-r,0);s.quadraticCurveTo(w,0,w,r);s.lineTo(w,height-cap);
 s.bezierCurveTo(w,height+cap*.12,-w,height+cap*.12,-w,height-cap);
 s.lineTo(-w,r);s.quadraticCurveTo(-w,0,-w+r,0);s.closePath();return s;
}

export function createStorybookWardrobe(){
 const root=new THREE.Group();root.name='Bunny heart | storybook hinoki wardrobe';
 const {wood,horizontal,edge,pale,inner}=makeHinokiMaterials();
 const recess=new THREE.MeshStandardMaterial({name:'Wardrobe | warm joinery shadow',color:'#8c6541',roughness:.95});
 const rose=new THREE.MeshPhysicalMaterial({name:'Wardrobe | rose ceramic petals',color:'#eeb3a1',roughness:.43,specularIntensity:.25,clearcoat:.12,clearcoatRoughness:.47});
 const pollen=new THREE.MeshPhysicalMaterial({name:'Wardrobe | honey flower heart',color:'#eabe77',roughness:.46,specularIntensity:.23});
 const brass=new THREE.MeshStandardMaterial({name:'Wardrobe | brushed brass hinges',color:'#bba172',metalness:.48,roughness:.62});
 const group=(parent,name,p=[0,0,0])=>{const g=new THREE.Group();g.name='Wardrobe | '+name;g.position.fromArray(p);parent.add(g);return g;};
 const mesh=(parent,name,g,m)=>{const o=new THREE.Mesh(g,m);o.name='Wardrobe | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(parent,name,size,p,m=wood,r=.035)=>{
  const g=new RoundedBoxGeometry(...size,4,r);
  if(m.map===wood.map||m.map===horizontal.map){const v=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<v.count;i++){const top=Math.abs(n.getY(i))>.7;uv.setXY(i,(Math.abs(n.getX(i))>.7?v.getZ(i):v.getX(i))/1.35+.5+p[0]*.13,(top?v.getZ(i):v.getY(i))/3.2+p[1]*.19);}}
  const o=mesh(parent,name,g,m);o.position.fromArray(p);return o;
 };
 const oval=(parent,name,p,size,m)=>{const o=mesh(parent,name,new THREE.SphereGeometry(1,24,16),m);o.position.fromArray(p);o.scale.fromArray(size);return o;};
 const tube=(parent,name,points,r,m,closed=false)=>mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal'),Math.max(24,points.length*2),r,8,closed),m);
 const rod=(parent,name,a,b,r,m)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av),o=mesh(parent,name,new THREE.CylinderGeometry(r,r,d.length(),16),m);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
 function panel(parent,name,shape,p,depth,m=wood,bevel=.018){
  const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:36,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:4}),v=g.attributes.position,uv=g.attributes.uv;
  // Use local timber coordinates instead of stretching every small moulding to
  // a whole plank. Adjacent front panels retain the same grain scale.
  for(let i=0;i<v.count;i++)uv.setXY(i,v.getX(i)/1.35+.5,v.getY(i)/3.2);
  const o=mesh(parent,name,g,m);o.position.fromArray(p);return o;
 }
 function contour(parent,name,shape,p,r,m){
  const pts=shape.getPoints(100);if(pts[0].distanceTo(pts.at(-1))<1e-8)pts.pop();
  return tube(parent,name,pts.map(v=>[v.x+p[0],v.y+p[1],p[2]]),r,m,true);
 }
 function flowerPull(parent,p,size=.115){
  const g=group(parent,'five-petal porcelain flower pull',p);
  rod(g,'short wooden pull stem',[0,0,-.045],[0,0,.020],.033,wood);
  oval(g,'rounded wooden rosette',[0,0,.024],[size*.74,size*.74,.037],horizontal);
  for(let i=0;i<5;i++){
   const a=i*Math.PI*2/5,o=oval(g,'padded round ceramic petal',[Math.sin(a)*size*.53,Math.cos(a)*size*.53,.066],[size*.40,size*.46,size*.24],rose);o.rotation.z=-a;
  }
  oval(g,'small honey flower centre',[0,0,.100],[size*.28,size*.28,size*.25],pollen);return g;
 }

 // Real deep casework and framing; the inset side fields remain visible when
 // walking around the piece. The back sits in front of the room skirting.
 const carcass=group(root,'solid framed cabinet');
 box(carcass,'recessed rear timber panel',[2.72,3.67,.075],[0,2.29,-.625],inner,.022);
 for(const x of [-.86,0,.86])box(carcass,'fine rear panel join',[.008,2.94,.010],[x,2.55,-.583],edge,.003);
 for(const side of [-1,1]){
  box(carcass,'thick solid cabinet side',[.17,3.79,1.22],[side*1.38,2.27,-.01],wood,.042);
  const sideField=group(carcass,'raised side panel',[side*1.472,1.15,-.02]);sideField.rotation.y=side*Math.PI/2;
  panel(sideField,'soft side panel bevel',roundedArch(.91,2.66),[0,0,0],.013,edge,.015);
  panel(sideField,'quiet side timber field',roundedArch(.85,2.60),[0,.03,.018],.012,wood,.014);
  for(const z of [-.51,.54]){
   box(carcass,'rounded solid stile and foot',[.195,4.05,.21],[side*1.38,2.065,z],wood,.041);
   box(carcass,'softly flared timber foot',[.218,.25,.235],[side*1.38,.13,z],wood,.041);
  }
 }
 box(carcass,'internal bottom shelf',[2.70,.12,1.18],[0,.34,0],horizontal,.025);
 box(carcass,'solid toy compartment floor',[2.64,.12,1.12],[0,1.036,-.025],horizontal,.022);
 box(carcass,'lower drawer opening',[2.64,.55,.055],[0,.66,.55],recess,.018);
 box(carcass,'drawer top rail',[2.73,.085,1.19],[0,.970,0],horizontal,.023);
 box(carcass,'upper framing rail',[2.78,.11,1.23],[0,4.075,0],horizontal,.025);
 box(carcass,'crown lower fillet',[2.99,.085,1.39],[0,4.165,0],edge,.027);
 box(carcass,'thick eased cornice',[3.15,.137,1.48],[0,4.270,0],horizontal,.048);
 box(carcass,'cornice fine upper lip',[3.19,.055,1.50],[0,4.359,0],pale,.021);

 // A real lined, empty-volume compartment; no opaque board behind the doors.
 const lining=makeWovenMaterial('Wardrobe | oat cotton quilted lining','#e8d9c2');
 const piping=makeWovenMaterial('Wardrobe | blush cotton piping','#d7b5ad');
 const cushion=box(carcass,'plump cotton cushion under the two toys',[2.46,.105,.99],[0,1.132,-.024],lining,.047);
 tube(carcass,'cushion piping',[[-1.16,1.133,.46],[1.16,1.133,.46],[1.20,1.133,.41],[1.20,1.133,-.45],[1.15,1.133,-.50],[-1.15,1.133,-.50],[-1.20,1.133,-.45],[-1.20,1.133,.41]],.009,piping,true);
 const toys=createPinkCarrotPlushes();root.add(toys);
 const pivots=[],pickTargets=[];
 const pickMaterial=new THREE.MeshBasicMaterial({visible:false});

 // Two framed leaves with real rounded arch relief. Fine shadow seams remain
 // at the meeting stile, hinges and drawer, rather than painted outlines.
 for(const side of [-1,1]){
  const pivot=group(root,(side<0?'left':'right')+' outward hinge',[side*1.34,0,.64]);pivots.push(pivot);
  const door=group(pivot,(side<0?'left':'right')+' framed door',[-side*.663,0,-.64]);
  box(door,'rounded door frame',[1.308,3.064,.127],[0,2.518,.660],wood,.036);
  if(side<0)box(door,'rebated timber strip behind the meeting seam',[.092,3.045,.039],[.676,2.518,.568],wood,.009);
  const arch=roundedArch(1.052,2.800,.13);
  panel(door,'subtle recessed arch shadow',arch,[0,1.120,.725],.007,edge,.009);
  const field=roundedArch(.973,2.723,.125);
  panel(door,'inset solid timber arch field',field,[0,1.159,.738],.014,wood,.014);
  contour(door,'fine rounded arch moulding',arch,[0,1.120,.752],.0125,pale);
  flowerPull(door,[-side*.470,2.37,.751]);
  box(door,'inset lining on the inner door',[1.13,2.90,.016],[0,2.518,.587],inner,.035);
  // A matching small flower inside makes closing natural after opening wide.
  const insidePull=group(door,'inner porcelain closing pull',[-side*.470,2.37,.559]);insidePull.rotation.y=Math.PI;flowerPull(insidePull,[0,0,0],.091);
  for(const z of [.827,.491]){
   const pick=mesh(door,'flower handle hit area',new THREE.SphereGeometry(.148,12,8),pickMaterial);pick.position.set(-side*.470,2.37,z);pick.castShadow=pick.receiveShadow=false;pick.userData.sceneControlPick=true;pickTargets.push(pick);
  }
  for(const y of [1.38,3.65]){
   const h=group(door,'small inset brass hinge',[side*.663,y,.649]);
   box(h,'hinge plate',[.075,.126,.021],[0,0,0],brass,.008);
   rod(h,'hinge pin',[side*.023,-.090,.025],[side*.023,.090,.025],.018,brass);
  }
 }
 const drawer=group(root,'wide lower drawer');
 box(drawer,'separate drawer front',[2.631,.493,.117],[0,.671,.661],horizontal,.037);
 box(drawer,'slender inset drawer bevel',[2.479,.344,.023],[0,.671,.730],edge,.033);
 box(drawer,'soft raised drawer centre',[2.435,.300,.025],[0,.671,.749],horizontal,.030);
 for(const x of [-.70,.70])flowerPull(drawer,[x,.67,.788],.102);

 // An integrated bunny-eared crown with a genuine heart-shaped opening.
 const crown=new THREE.Shape();crown.moveTo(-1.44,4.37);crown.lineTo(1.44,4.37);
 crown.bezierCurveTo(1.44,4.55,1.24,4.61,1.02,4.59);
 crown.bezierCurveTo(.89,4.73,.77,4.72,.70,4.68);
 crown.bezierCurveTo(.95,5.16,.73,5.56,.45,5.34);
 crown.bezierCurveTo(.23,5.18,.24,4.92,.19,4.77);
 crown.bezierCurveTo(.08,4.79,-.08,4.79,-.19,4.77);
 crown.bezierCurveTo(-.24,4.92,-.23,5.18,-.45,5.34);
 crown.bezierCurveTo(-.73,5.56,-.95,5.16,-.70,4.68);
 crown.bezierCurveTo(-.77,4.72,-.89,4.73,-1.02,4.59);
 crown.bezierCurveTo(-1.24,4.61,-1.44,4.55,-1.44,4.37);crown.closePath();
 const heart=heartPath(0,4.574,.247,THREE.Path);crown.holes.push(heart);
 panel(root,'sculpted bunny ear crown with pierced heart',crown,[0,0,.49],.145,wood,.029);
 contour(root,'fine crown carved rim',crown,[0,0,.663],.011,pale);
 contour(root,'soft inner edge of heart opening',heart,[0,0,.661],.009,edge);
 for(const side of [-1,1]){
  const ear=new THREE.Shape();ear.moveTo(side*.34,4.83);
  ear.bezierCurveTo(side*.34,5.01,side*.44,5.25,side*.55,5.26);
  ear.bezierCurveTo(side*.73,5.29,side*.73,5.03,side*.59,4.83);
  contour(root,'ear carved inner flute',ear,[0,0,.659],.009,edge);
 }

 // Continuous scallops and stout rounded feet, with the same motif wrapping
 // around the visible side rails instead of stopping abruptly at the front.
 const apron=new THREE.Shape();apron.moveTo(-1.40,.43);apron.lineTo(1.40,.43);apron.lineTo(1.40,.10);
 apron.bezierCurveTo(1.29,.09,1.29,.23,1.18,.25);
 for(let i=0;i<5;i++){
  const x=1.18-i*.472;apron.bezierCurveTo(x-.10,.075,x-.33,.075,x-.472,.25);
 }
 apron.bezierCurveTo(-1.29,.23,-1.29,.09,-1.40,.10);apron.closePath();
 panel(root,'scalloped solid lower apron',apron,[0,0,.565],.118,horizontal,.024);
 for(const side of [-1,1]){
  const g=group(root,'side scalloped apron',[side*1.38,0,0]);g.rotation.y=side*Math.PI/2;
  const s=new THREE.Shape();s.moveTo(-.54,.43);s.lineTo(.54,.43);s.lineTo(.54,.16);s.bezierCurveTo(.38,.31,.29,.14,0,.15);s.bezierCurveTo(-.29,.14,-.38,.31,-.54,.16);s.closePath();
  panel(g,'curved side rail',s,[0,0,0],.085,horizontal,.020);
 }

 // Upholstered keepsake boxes, offset to leave the pierced heart unobstructed.
 const boxes=group(root,'tailored linen keepsake boxes');
 const oatmeal=makeWovenMaterial('Wardrobe | oatmeal linen storage case','#d8c7a6');
 const blush=makeWovenMaterial('Wardrobe | dusty rose linen storage case','#d9a8a8');
 const seam=new THREE.MeshStandardMaterial({name:'Wardrobe | ivory box stitching',color:'#f5e6d0',roughness:1});
 const leather=new THREE.MeshPhysicalMaterial({name:'Wardrobe | warm tan leather tabs',color:'#ac7d55',roughness:.70,specularIntensity:.20});
 function storageCase(name,p,size,material,angle){
  const c=group(boxes,name,p);c.rotation.y=angle;const [w,h,d]=size;
  box(c,'fabric wrapped rigid storage case',[w,h,d],[0,h/2,0],material,.045);
  box(c,'padded overlapping lid',[w+.055,.105,d+.055],[0,h+.032,0],material,.035);
  for(const y of [.045,h+.035])tube(c,'tailored linen edge piping',[[-w/2+.045,y,d/2+.010],[w/2-.045,y,d/2+.010],[w/2+.010,y,d/2-.045],[w/2+.010,y,-d/2+.045],[w/2-.045,y,-d/2-.010],[-w/2+.045,y,-d/2-.010],[-w/2-.010,y,-d/2+.045],[-w/2-.010,y,d/2-.045]],.006,seam,true);
  box(c,'small brass label holder',[.31,.115,.017],[0,h*.59,d/2+.015],brass,.015);
  box(c,'ivory linen label insert',[.25,.070,.009],[0,h*.59,d/2+.028],lining,.007);
  const heart=heartPath(0,0,.037);panel(c,'tiny embossed label heart',heart,[0,h*.59,d/2+.036],.002,leather,.001);
  tube(c,'curved leather carry handle',[[-.12,h*.23,d/2+.021],[-.08,h*.15,d/2+.068],[.08,h*.15,d/2+.068],[.12,h*.23,d/2+.021]],.015,leather);
  for(const x of [-.12,.12])oval(c,'brass handle rivet',[x,h*.23,d/2+.04],[.017,.017,.008],brass);
 }
 storageCase('large natural linen keepsake box',[-.85,4.391,-.12],[1.24,.49,.91],oatmeal,-.035);
 storageCase('small blush keepsake box',[-.75,4.966,-.18],[1.05,.36,.77],blush,.055);

 // Batch each moving assembly independently. Never bake a door into the case
 // or merge the instanced fibre ribbons / invisible handle targets.
 function batch(scope,exclude=new Set()){
  root.updateMatrixWorld(true);const inverse=scope.matrixWorld.clone().invert(),buckets=new Map();
  function visit(o){if(exclude.has(o))return;if(o.isMesh&&!o.userData.sceneControlPick&&!o.geometry.isInstancedBufferGeometry){const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);}for(const child of o.children)visit(child);}
  visit(scope);
  for(const list of buckets.values())if(list.length>1){
   const geoms=list.map(o=>{let g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(g.index){const flat=g.toNonIndexed();g.dispose();g=flat;}return g;});
   const merged=mergeGeometries(geoms,false);if(merged){mesh(scope,'joined '+list[0].material.name,merged,list[0].material);for(const o of list){o.removeFromParent();o.geometry.dispose();}}geoms.forEach(g=>g.dispose());
  }
 }
 batch(root,new Set([...pivots,toys]));pivots.forEach(p=>batch(p));
 toys.children.forEach(t=>batch(t));
 root.wardrobeController=createWardrobeController(root,pivots,pickTargets);
 root.position.fromArray(WARDROBE_PLACEMENT.position);root.rotation.y=WARDROBE_PLACEMENT.rotation;root.scale.setScalar(WARDROBE_PLACEMENT.scale);root.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(root);let count=0,triangles=0,invalid=0;
 root.traverse(o=>{if(o.isMesh){count++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.geometry.isInstancedBufferGeometry?o.geometry.instanceCount:1);for(const a of Object.values(o.geometry.attributes))for(const v of a.array)if(!Number.isFinite(v))invalid++;}});
 root.userData={revision:'bunny-wardrobe-3',placement:WARDROBE_PLACEMENT,meshCount:count,triangles,invalidCoordinates:invalid,worldBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},reference:'codex-clipboard-e90d6f6b-4bb8-46f9-8250-aeba72d32419.png',details:['irregular satin hinoki grain','rabbit ear crown','real heart opening','two hinged outward-opening doors','porcelain flower pulls on both sides','wide lower drawer','scalloped plinth','two tailored linen storage boxes','cotton-lined interior','two large pink carrot plush dolls'],interior:toys.userData,doorState:root.wardrobeController.state,preview:false};
 return root;
}
