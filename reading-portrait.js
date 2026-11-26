import * as THREE from 'three/webgpu';
import {craft} from './house-craft.js';

// Each rail has its own board coordinates. Equal setbacks on the two ends
// form a 45-degree mitre at every change in the moulding profile.
function moulding(width,height,profile) {
  const positions=[], uv=[], indices=[];
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
  for(let rail=0;rail<4;rail++){
    const a=corners[rail], b=corners[(rail+1)%4];
    const start=positions.length/3;
    for(const [inset,z] of profile){
      for(const [sx,sy] of [a,b]){
        const x=sx*(width/2-inset), y=sy*(height/2-inset);
        positions.push(x,y,z);
        const along=a[1]===b[1] ? x : y;
        uv.push(.16+rail*.18+(inset+z*.25)*1.45,.5+along*.45);
      }
    }
    for(let i=0;i<profile.length-1;i++){
      const j=start+i*2;
      indices.push(j,j+1,j+2,j+1,j+3,j+2);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  return geo;
}

export function hangReadingPortrait(room,m) {
  const {group,box,mesh}=craft(room,'Reading portrait');
  const frame=group('Jiji and Mifen in a hinoki frame',[-8.18,3.27,3.501]);
  const printW=1.70, printH=1.19, margin=.114, rail=.091;
  const matW=printW+2*margin, matH=printH+2*margin;
  box(frame,'recessed wooden back',[matW+rail,matH+rail,.021],[0,0,.011],m.edge,.007);
  mesh(frame,'satin hinoki ogee moulding',moulding(matW+2*rail,matH+2*rail,[
    [.008,.010],[.002,.016],[0,.021],[0,.078],[.002,.087],[.008,.092],
    [.019,.093],[.024,.090],[.029,.083],[.038,.078],[.060,.075],
    [.071,.078],[.077,.084],[.084,.084],[.089,.080],[rail,.075],[rail,.049]
  ]),m.wood);
  mesh(frame,'warm cotton window mat',moulding(matW+.004,matH+.004,[
    [0,.057],[margin-.003,.057],[margin+.002,.052]
  ]),m.paper);
  const paper=new THREE.TextureLoader().load(new URL('./assets/reading-plush-portrait.webp',import.meta.url).href);
  paper.colorSpace=THREE.SRGBColorSpace;paper.anisotropy=8;
  const photo=mesh(frame,'portrait print',new THREE.PlaneGeometry(printW+.006,printH+.0042),
    new THREE.MeshBasicMaterial({map:paper,toneMapped:false}));
  photo.position.z=.050;photo.castShadow=photo.receiveShadow=false;
}
