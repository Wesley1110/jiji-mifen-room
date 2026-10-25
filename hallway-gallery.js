import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Looking out of the bedroom along +Z, the visitor's left is the +X wall.
// Frame-local +X runs along +Z; the fronts face the walkable hall (-X).
export const GALLERY_LAYOUT = {
  wallX: 2.044, centerZ: 14.89, centerHeight: 2.27,
  photoHeight: .98, matBorder: .13, frameBorder: .08, gap: .42,
};
export const GALLERY_PHOTOS = [
  {file:'01-kneeling.jpg',width:680,height:611},
  {file:'02-closeup.jpg',width:2000,height:1334},
  {file:'03-raised-fist.jpg',width:2000,height:1333},
  {file:'04-conversation.png',width:1440,height:960},
];

function walnutTexture(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#493225';ctx.fillRect(0,0,128,512);
  for(let i=0;i<110;i++){
    ctx.beginPath();
    for(let y=0;y<=512;y+=4){const x=i*1.3+Math.sin(y*.014+i*.63)*1.2+Math.sin(y*.041+i)*.3;y?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.lineWidth=i%5===0?.9:.45;ctx.strokeStyle=i%3===0?'#ac85582a':'#1d130d25';ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;return texture;
}

function ringGeometry(width,height,openingWidth,openingHeight,depth,bevel=.003){
  const shape=new THREE.Shape();shape.moveTo(-width/2,-height/2);shape.lineTo(width/2,-height/2);
  shape.lineTo(width/2,height/2);shape.lineTo(-width/2,height/2);shape.closePath();
  const hole=new THREE.Path();hole.moveTo(-openingWidth/2,-openingHeight/2);hole.lineTo(-openingWidth/2,openingHeight/2);
  hole.lineTo(openingWidth/2,openingHeight/2);hole.lineTo(openingWidth/2,-openingHeight/2);hole.closePath();shape.holes.push(hole);
  const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:1});
  // Rail grain follows each of the four mitred sides, including the top/bottom.
  const pos=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),horizontal=Math.abs(y)/(height/2)>Math.abs(x)/(width/2);
    uv.setXY(i,(horizontal?y:x)*7,(horizontal?x:y)*1.8);
  }
  return g;
}

export async function createHallwayGallery(){
  const root=new THREE.Group();root.name='Hallway | four framed photographs';
  root.position.set(GALLERY_LAYOUT.wallX,0,GALLERY_LAYOUT.centerZ);root.rotation.y=-Math.PI/2;
  const wood=new THREE.MeshStandardMaterial({name:'Gallery | satin walnut',map:walnutTexture(),roughness:.56,metalness:0});
  const edge=new THREE.MeshStandardMaterial({name:'Gallery | dark walnut edge',color:'#30251e',roughness:.64});
  const brass=new THREE.MeshStandardMaterial({name:'Gallery | brushed champagne brass',color:'#b5945e',metalness:.62,roughness:.36});
  const mat=new THREE.MeshStandardMaterial({name:'Gallery | warm cotton mount',color:'#ece6d9',roughness:1});
  const bevelMat=new THREE.MeshStandardMaterial({name:'Gallery | bevelled mount edge',color:'#d6cfc0',roughness:1});
  const recess=new THREE.MeshStandardMaterial({color:'#292721',roughness:1});
  const glass=new THREE.MeshPhysicalMaterial({name:'Gallery | low reflection glazing',color:'#ffffff',transparent:true,opacity:.018,roughness:.2,metalness:0,depthWrite:false});
  const diffuser=new THREE.MeshBasicMaterial({color:'#ffe8b5',toneMapped:false});
  function mesh(parent,name,geometry,material){
    const o=new THREE.Mesh(geometry,material);o.name='Gallery | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  }
  function box(parent,name,w,h,d,x,y,z,material,r=.003){
    const o=mesh(parent,name,new RoundedBoxGeometry(w,h,d,2,r),material);o.position.set(x,y,z);return o;
  }
  function ring(parent,name,w,h,iw,ih,z,depth,material,bevel){
    const o=mesh(parent,name,ringGeometry(w,h,iw,ih,depth,bevel),material);o.position.z=z;return o;
  }
  const dimensions=GALLERY_PHOTOS.map(p=>{
    const h=GALLERY_LAYOUT.photoHeight,w=h*p.width/p.height;
    return {...p,photoWidth:w,photoHeight:h,width:w+2*(GALLERY_LAYOUT.matBorder+GALLERY_LAYOUT.frameBorder),height:h+2*(GALLERY_LAYOUT.matBorder+GALLERY_LAYOUT.frameBorder)};
  });
  const span=dimensions.reduce((n,p)=>n+p.width,0)+(dimensions.length-1)*GALLERY_LAYOUT.gap;
  let cursor=-span/2;
  const textures=await Promise.all(dimensions.map(p=>new THREE.TextureLoader().loadAsync('./assets/gallery/'+p.file)));
  const frames=[];
  for(let i=0;i<dimensions.length;i++){
    const d=dimensions[i],frame=new THREE.Group();frame.name='Gallery | framed photograph '+(i+1);
    frame.position.set(cursor+d.width/2,GALLERY_LAYOUT.centerHeight,0);root.add(frame);cursor+=d.width+GALLERY_LAYOUT.gap;
    const mw=d.photoWidth+2*GALLERY_LAYOUT.matBorder,mh=d.photoHeight+2*GALLERY_LAYOUT.matBorder;
    box(frame,'backing and wall standoff',d.width-.02,d.height-.02,.033,0,0,.024,edge);
    ring(frame,'deep walnut outer profile',d.width,d.height,mw,mh,.031,.069,wood,.004);
    ring(frame,'fine raised outer bead',d.width-.012,d.height-.012,d.width-.029,d.height-.029,.099,.012,edge,.002);
    ring(frame,'brushed metal inner fillet',mw+.019,mh+.019,mw-.010,mh-.010,.090,.012,brass,.0015);
    ring(frame,'recessed cotton mount',mw,mh,d.photoWidth+.012,d.photoHeight+.012,.061,.010,mat,.001);
    ring(frame,'mount window bevel',d.photoWidth+.024,d.photoHeight+.024,d.photoWidth+.001,d.photoHeight+.001,.057,.007,bevelMat,.001);
    box(frame,'dark rebate',d.photoWidth+.018,d.photoHeight+.018,.005,0,0,.053,recess,.001);
    const texture=textures[i];texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
    // Exact source aspect ratios and neutral colour: no stretch, crop, or invented captions.
    const print=mesh(frame,'unaltered photograph '+(i+1),new THREE.PlaneGeometry(d.photoWidth,d.photoHeight),new THREE.MeshBasicMaterial({name:'Gallery | photograph '+(i+1),map:texture,toneMapped:false}));
    print.position.z=.057;print.castShadow=false;print.receiveShadow=false;
    const glazing=mesh(frame,'low reflection glazing',new THREE.PlaneGeometry(mw-.008,mh-.008),glass);
    glazing.position.z=.082;glazing.castShadow=false;glazing.receiveShadow=false;
    // A small shaded picture light illuminates the mount and plaster, without obscuring the print.
    const ly=d.height/2+.24;
    box(frame,'picture light wall plate',.18,.075,.028,0,ly,.020,brass,.012);
    box(frame,'picture light arm',.023,.023,.25,0,ly,.15,brass,.006);
    box(frame,'picture light hood',.47,.055,.095,0,ly-.016,.276,brass,.017);
    box(frame,'warm underside of hood',.405,.007,.067,0,ly-.044,.276,diffuser,.002).castShadow=false;
    const light=new THREE.SpotLight('#ffe8c7',2.4,3,.80,.80,2);light.position.set(0,ly-.045,.29);light.target.position.set(0,-.12,.02);frame.add(light,light.target);
    frames.push({photo:d.file,centerZ:GALLERY_LAYOUT.centerZ+frame.position.x,centerY:frame.position.y,outerWidth:d.width,outerHeight:d.height,photoAspect:d.photoWidth/d.photoHeight,originalAspect:GALLERY_PHOTOS[i].width/GALLERY_PHOTOS[i].height});
  }
  let meshCount=0;root.traverse(o=>{if(o.isMesh)meshCount++;});
  root.userData={revision:'hallway-gallery-1',meshCount,frameCount:4,gap:GALLERY_LAYOUT.gap,span,wall:'left when exiting the bedroom',imagesUncropped:true,frames};
  return root;
}
