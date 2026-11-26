import * as THREE from 'three/webgpu';
import {craft, contactShadow, roundedShape} from './house-craft.js';
import {cloneMiniPinkCarrot} from './wardrobe-carrot-storage.js?revision=mini-carrot-template-1';
import {FOYER_CONSOLE} from './house-layout.js?revision=foyer-cane-4';
import {caneMaterial} from './foyer-textiles.js?revision=foyer-sewn-2';
import {makeRunner} from './foyer-runner.js?revision=foyer-sewn-2';
import {rabbitDishGeometry, stonewareGlaze} from './foyer-ceramics.js?revision=foyer-sewn-2';

function makeKeyDish(cabinet, m, topY) {
  const {group, mesh, tube, panel} = craft(cabinet,'Foyer');
  const dish = group('Mifen ceramic key dish',[.34,topY,.035],-.13,cabinet);
  mesh(dish,'one-piece rabbit dish with foot and rolled lip',rabbitDishGeometry(),stonewareGlaze());
  contactShadow(dish,0,0,.42,.35,.60,.001);
  const brass=m.material('Foyer | warm satin brass house key','#ba9359',.38);
  brass.metalness=.50;
  const key=group('house key',[-.092,.032,-.068],-.43,dish);
  contactShadow(key,0,.085,.052,.164,.66,.009);
  const ringShape=new THREE.Shape();
  ringShape.absellipse(0,0,.062,.060,0,2*Math.PI,false,0);
  const hole=new THREE.Path();
  hole.absellipse(.013,.030,.017,.012,0,2*Math.PI,true,0);
  ringShape.holes.push(hole);
  const bow=panel(key,'pierced bow',ringShape,[0,.010,0],.007,brass,.0025);
  bow.rotation.x=-Math.PI/2;
  const bit=new THREE.Shape();
  const outline=[[-.020,.045],[.024,.045],[.024,.065],[.016,.073],[.016,.146],
    [.035,.149],[.036,.159],[.022,.170],[.032,.178],[.036,.186],[.016,.199],
    [.025,.209],[.013,.224],[-.002,.239],[-.020,.228]];
  outline.forEach(([x,z],i)=>i?bit.lineTo(x,-z):bit.moveTo(x,-z));
  bit.closePath();
  const blade=panel(key,'notched key blade',bit,[0,.010,0],.007,brass,.0016);
  blade.rotation.x=-Math.PI/2;
  tube(key,'fine ridge along milled key blade',[[-.009,.019,.067],[-.009,.019,.139],[-.009,.019,.216]],.0025,brass);
  const ringCenter=[-.003,.106,-.092], radius=.085;
  const coil=[];
  for(let i=0;i<=88;i++){
    const t=i/88,a=t*Math.PI*2*1.77+.58;
    coil.push([ringCenter[0]+.83*radius*Math.cos(a),
      ringCenter[1]+.65*radius*Math.cos(a)+.24*radius*Math.sin(a)+.006*(t-.5),
      ringCenter[2]+.84*radius*Math.sin(a)]);
  }
  tube(dish,'split brass keyring',coil,.0055,brass);
  const charm=cloneMiniPinkCarrot(0);
  charm.name='Foyer | original wardrobe carrot key fob';
  const charmHolder=group('velour key fob pose',[.053,.087,.173],-.41,dish);
  contactShadow(dish,.097,.065,.096,.119,.72,.044);
  charm.rotation.x=-Math.PI/2; charm.scale.set(.103,.139,.081); charmHolder.add(charm);
  // On the miniature, the face stitches need to crest the short pile.
  for(const part of charm.children) {
    if(!part.isMesh)continue;
    if(part.name.endsWith('short curved carrot embroidery')){
      part.geometry=part.geometry.clone();
      const pos=part.geometry.attributes.position;
      part.geometry.computeBoundingBox();
      const center=part.geometry.boundingBox.getCenter(new THREE.Vector3());
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i), y=pos.getY(i);
        pos.setXY(i,center.x+1.8*(x-center.x),center.y+1.65*(y-center.y));
      }
      pos.needsUpdate=true;part.geometry.computeVertexNormals();part.geometry.computeBoundingSphere();
      part.position.z+=.062;
      part.material=part.material.clone();part.material.color.set('#ae7378');
    }else if(part.name.endsWith('continuous padded carrot body') || part.userData.fiberCount>1000){
      part.material=part.material.clone();part.material.color.set('#d38d94');
    }
  }
  // Fob seam by its felt leaves to the actual metal ring.
  tube(dish,'blush fabric loop',[[.135,.089,-.021],[.100,.132,-.047],
    [.061,.167,-.059],[.052,.159,-.062],[.077,.132,-.052],[.132,.087,-.029]],.0048,m.rose);
}

function makeConsole(parent,m) {
  const {box,oval,panel,tube,group,rod}=craft(parent,'Foyer');
  const {x,z,width,depth,height}=FOYER_CONSOLE;
  const cabinet=group('hinoki and cane console',[x,-.04,z],Math.PI);
  const hw=width/2,hd=depth/2,topY=height;
  for(const side of [-1,1]) for(const end of [-1,1]) {
    const foot=box(cabinet,'rounded cabinet foot',[.145,.24,.145],
      [side*(hw-.18),.125,end*(hd-.135)],m.wood,.047);
    foot.rotation.z=-side*.045;
  }
  box(cabinet,'inset plinth',[width-.22,.105,depth-.13],[0,.21,0],m.edge,.035);
  box(cabinet,'rounded hinoki carcass',[width-.055,height-.32,depth-.065],
    [0,(height+.16)/2,-.018],m.wood,.062);
  box(cabinet,'lower cross grain apron',[width-.042,.114,depth-.035],[0,.276,.004],m.horizontal,.039);
  box(cabinet,'gently eased top',[width,.137,depth],[0,topY-.0685,0],m.horizontal,.056);
  const doorDepth=hd-.002, doorW=(width-.235)/2, doorH=height-.54;
  const doorY=.335+doorH/2, weave=caneMaterial();
  box(cabinet,'shadow gap behind paired doors',[width-.16,doorH+.035,.025],
    [0,doorY,doorDepth-.026],m.edge,.012);
  const band=m.material('Foyer | waxed cane binding','#b78954',.73);
  for(const side of [-1,1]) {
    const leaf=group('inset cane door',[side*(doorW/2+.013),doorY,doorDepth],0,cabinet);
    const outer=roundedShape(doorW,doorH,.076);
    const aperture=roundedShape(doorW-.14,doorH-.15,.108);
    outer.holes.push(new THREE.Path(aperture.getPoints(22)));
    panel(leaf,'solid rounded hinoki door frame',outer,[0,0,.002],.043,m.wood,.009);
    panel(leaf,'inset finely woven cane',aperture,[0,0,.003],.008,weave,.001);
    tube(leaf,'inset reed spline',aperture.getPoints(12).map(p=>[p.x,p.y,.024]),.009,band,true);
    const knob=group('brass flower knob',[-side*(doorW/2-.122),.010,.061],0,leaf);
    rod(knob,'knob stem',[0,0,-.019],[0,0,.052],.026,m.brass);
    for(let i=0;i<5;i++) {
      const a=i*Math.PI*2/5;
      oval(knob,'rounded brass petal',[.034*Math.sin(a),.034*Math.cos(a),.050],
        [.029,.040,.018],m.brass).rotation.z=-a;
    }
    oval(knob,'flower centre',[0,0,.069],[.025,.025,.015],m.brass);
  }
  makeKeyDish(cabinet,m,topY);
  contactShadow(parent,x,z,hw+.22,hd+.18,.37);
  return cabinet;
}

export function addFoyerFurniture(hall,materials) {
  makeConsole(hall,materials);
  makeRunner(hall,materials);
}
