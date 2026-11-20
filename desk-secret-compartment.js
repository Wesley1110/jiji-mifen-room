import * as THREE from 'three/webgpu';
import {createDeathNote} from './death-note.js';
import {interlockDrawer} from './desk-compartment-motion.js';
import {cloneMiniPinkCarrot} from './wardrobe-carrot-storage.js?revision=mini-carrot-template-1';
import {createCarrotCatchPress} from './carrot-catch-press.js?revision=desk-secret-4';

const FLOOR_Y = 1.944;
const HINGE_Z = -.149;
const OPEN_ANGLE = 88 * Math.PI / 180;

function makeLiftRibbon() {
  const path = new THREE.CatmullRomCurve3([
    [0,.002,0],[.059,.004,.004],[.139,.008,.012],[.187,.015,.020],
    [.196,.021,.022],[.187,.026,.021],[.151,.019,.014],[.120,.009,.011]
  ].map(p=>new THREE.Vector3(...p)));
  const segments=64, positions=[], colours=[], indices=[];
  const thread = new THREE.Color('#86565d');
  for(let i=0; i<=segments; i++) {
    const p=path.getPointAt(i/segments);
    const lane = .92+.08*Math.cos(i*Math.PI);
    for(const edge of [-1,1]) {
      positions.push(p.x,p.y,p.z+edge*.023);
      colours.push(thread.r*lane,thread.g*lane,thread.b*lane);
    }
    if(i<segments) {
      const k=2*i;
      indices.push(k,k+1,k+2,k+1,k+3,k+2);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const ribbon=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({
    name:'Oxblood grosgrain',vertexColors:true,roughness:.85,side:THREE.DoubleSide}));
  ribbon.name='Desk | folded fabric book lift';
  ribbon.castShadow=ribbon.receiveShadow=true;
  return ribbon;
}

export function installDeskCompartment(slide, {box, oval, rod, pale}) {
  const tray = slide.moving;
  const pivot = new THREE.Group();
  pivot.name = 'Desk | concealed floor hinge';
  pivot.position.set(0, FLOOR_Y, HINGE_Z);
  tray.add(pivot);

  // Sample the top pieces in common drawer coordinates so the grain runs
  // through the closed panel and its surround, including the hinge line.
  function floorPiece(parent, name, width, height, depth, x, z) {
    const hinged = parent === pivot;
    const part = box(parent, name, [width,height,depth],
      [x, (hinged ? 0 : FLOOR_Y) - height/2, z - (hinged ? HINGE_Z : 0)], pale, .003);
    const {position, normal, uv} = part.geometry.attributes;
    for (let i=0; i<position.count; i++) {
      if (normal.getY(i) > .8) {
        uv.setXY(i, (position.getX(i)+x+1.045)/2.09, (position.getZ(i)+z+.439)/.994);
      }
    }
    return part;
  }
  floorPiece(tray, 'rear drawer bed', 2.087,.131,.288, 0,-.295);
  floorPiece(tray, 'left false floor surround', .347,.131,.703,-.8705,.2015);
  floorPiece(tray, 'right false floor surround',.327,.131,.703,.8805,.2015);
  floorPiece(tray, 'front landing lip',1.415,.118,.009,.01,.5495);
  floorPiece(pivot,'hinged hinoki panel',1.404,.025,.689,.01,.1965);
  for (const x of [-.55,.57]) {
    box(pivot,'lid underside batten',[.048,.014,.53],[x,-.031,.36],pale,.006);
  }
  const brass = new THREE.MeshStandardMaterial({name:'Aged brass',color:'#aa7942',metalness:.61,roughness:.46});
  const brightBrass = new THREE.MeshStandardMaterial({name:'Brushed brass rivets',color:'#dbb16b',metalness:.54,roughness:.37});
  for (const x of [-.49,.51]) {
    const y = FLOOR_Y-.001;
    rod(tray,'recessed hinge barrel',[x-.056,y,HINGE_Z],[x+.056,y,HINGE_Z],.009,brass);
    box(pivot,'hinge leaf under panel',[.095,.004,.071],[x,-.026,.043],brass,.002);
    for(const dx of [-.027,.027]) {
      oval(pivot,'hinge rivet',[x+dx,-.028,.056],[.007,.003,.007],brightBrass);
    }
  }

  const lining = new THREE.Group();
  lining.name = 'Desk | lined well and hidden notebook';
  tray.add(lining);
  const textile=new THREE.TextureLoader().load(new URL('./assets/desk-compartment-felt.webp',import.meta.url).href);
  textile.colorSpace=THREE.SRGBColorSpace; textile.anisotropy=8;
  const felt = new THREE.MeshPhysicalMaterial({name:'Dusty plum brushed felt',map:textile,
    roughness:.98,specularIntensity:.12,sheen:.25,sheenRoughness:.94,sheenColor:'#a39398'});
  const liner=box(lining,'felt compartment liner',[1.415,.009,.691],[.01,1.8135,.197],felt,.004);
  const {position,normal,uv}=liner.geometry.attributes;
  for(let i=0; i<position.count; i++) {
    if(normal.getY(i)>.8) uv.setXY(i,position.getX(i)/1.415+.5,.5-position.getZ(i)/.691);
  }
  const tab=makeLiftRibbon();
  tab.position.set(.091,1.819,.270); tab.rotation.y=-.13;
  lining.add(tab);
  const book=createDeathNote();
  book.position.set(-.070,1.819,.174); book.rotation.y=-.035;
  lining.add(book);
  lining.visible=false;

  // The catch sits on the fixed left ledge and is accessible in both poses.
  const catchGroup=new THREE.Group();
  catchGroup.name='Desk | pink carrot catch';
  catchGroup.position.set(-.865,FLOOR_Y,.305);
  catchGroup.rotation.y=-.40;
  tray.add(catchGroup);
  const carrot=cloneMiniPinkCarrot();
  carrot.rotation.x=-Math.PI/2;
  carrot.scale.set(.142,.143,.078);
  carrot.position.set(0,.014,.145);
  catchGroup.add(carrot);
  const knob=carrot.getObjectByName('Carrot plush | continuous padded carrot body');
  // Raise the existing embroidery above the short pile. Keep the threads'
  // original curved paths and avoid changing the wardrobe copies.
  const vertex=new THREE.Vector3(), normalAtVertex=new THREE.Vector3();
  for(const seam of carrot.children) {
    if(seam.name!=='Carrot plush | short curved carrot embroidery') continue;
    const thread=seam.geometry.clone();
    const {position,normal}=thread.attributes;
    for(let i=0; i<position.count; i++) {
      vertex.fromBufferAttribute(position,i).addScaledVector(normalAtVertex.fromBufferAttribute(normal,i),.009);
      position.setXYZ(i,vertex.x,vertex.y,vertex.z);
    }
    thread.computeBoundingBox();
    thread.computeBoundingSphere();
    seam.geometry=thread;
    seam.position.z=.062;
  }
  const pick=box(catchGroup,'carrot catch hit area',[.210,.135,.339],[0,.032,0],
    new THREE.MeshBasicMaterial({visible:false}),.027);
  pick.castShadow=pick.receiveShadow=false;
  pick.userData.sceneControlPick=true;
  pick.visible=false;

  const press=createCarrotCatchPress(carrot);
  const motion=interlockDrawer(slide);
  const compartment={
    state:motion.lid, knob, pickTargets:[pick], hint:'暗層', highlightOnHover:false,
    setPressed:press.setPressed,
    toggle(now=performance.now()) {
      if(!motion.toggleLid(now)) return false;
      press.tap(now);
      return true;
    }
  };
  return {
    ...slide, compartment, setOpen:motion.setOpen, toggle:motion.toggle,
    get hint() { return motion.wantsDrawerOpen() ? '點圓把手收回抽屜' : '點圓把手拉開抽屜'; },
    update(now) {
      motion.update(now);
      const amount=motion.lid.amount;
      pivot.rotation.x=-OPEN_ANGLE*amount;
      catchGroup.visible=slide.state.extension>0;
      pick.visible=motion.canLift();
      if(!pick.visible) press.setPressed(false,now);
      press.update(now);
      lining.visible=amount>0;
    }
  };
}
