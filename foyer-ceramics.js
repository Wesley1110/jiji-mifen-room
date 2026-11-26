import * as THREE from 'three/webgpu';

export function stonewareGlaze() {
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d'); ctx.fillStyle='#fffefa'; ctx.fillRect(0,0,256,256);
  let seed=472;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<2100;i++){
    const x=random()*256,y=random()*256,r=.19+random()*.60;
    ctx.fillStyle=i%9===0?'rgba(139,102,73,.42)':'rgba(177,143,111,.24)';
    ctx.beginPath();ctx.ellipse(x,y,r,r*.72,0,0,Math.PI*2);ctx.fill();
  }
  const map=new THREE.CanvasTexture(canvas); map.colorSpace=THREE.SRGBColorSpace; map.anisotropy=8;
  return new THREE.MeshPhysicalMaterial({name:'Foyer | satin ivory stoneware, pooled blush glaze',
    map,vertexColors:true,roughness:.30,specularIntensity:.36,clearcoat:.36,clearcoatRoughness:.23});
}

// The outline is drawn in plan, with +Z towards the visitor. Both ears are
// part of the vessel: the clay wall, glaze band and rolled lip continue into
// their tips and back into the saddle between them.
export function rabbitDishGeometry() {
  const path = new THREE.CurvePath();
  let last = new THREE.Vector2(0,.259);
  const curve = (a,b,c,d,x,z) => {
    const end = new THREE.Vector2(x,z);
    path.add(new THREE.CubicBezierCurve(last,new THREE.Vector2(a,b),new THREE.Vector2(c,d),end));
    last=end;
  };
  curve(.147,.263,.321,.215,.355,.097);
  curve(.386,-.008,.341,-.129,.221,-.167);
  curve(.191,-.179,.184,-.197,.188,-.236);
  curve(.196,-.306,.186,-.352,.145,-.354);
  curve(.100,-.358,.083,-.303,.076,-.253);
  curve(.069,-.206,.054,-.202,.011,-.204);
  curve(-.034,-.205,-.055,-.205,-.068,-.251);
  curve(-.091,-.321,-.128,-.364,-.166,-.351);
  curve(-.209,-.336,-.196,-.269,-.181,-.224);
  curve(-.175,-.191,-.193,-.172,-.252,-.155);
  curve(-.361,-.077,-.385,.013,-.347,.113);
  curve(-.301,.222,-.138,.264,0,.259);

  const segments=224;
  const outline=Array.from({length:segments},(_,i)=>path.getPoint(i/segments));
  const colors=[], points=[], uvs=[], indices=[];
  const ivory=new THREE.Color('#dec2a2'), cream=new THREE.Color('#ecd6b9');
  const foot=new THREE.Color('#b19069'), rose=new THREE.Color('#debba2');
  const burntHoney=new THREE.Color('#c8a77e'), glaze=new THREE.Color();
  // Scale of footprint, degree of ear contour retained, height, ear lift,
  // glaze colour and amount of blush in the two shallow inner ear wells.
  const sections=[
    [.39,0,.013,0,foot,0],[.46,0,.013,0,foot,0],[.47,0,.002,0,foot,0],
    [.52,0,.002,0,foot,0],[.54,0,.019,0,ivory,0],[.63,.10,.024,.003,ivory,0],
    [.77,.42,.038,.011,ivory,0],[.89,.77,.060,.026,ivory,0],
    [.96,.96,.083,.039,ivory,0],[.991,1,.097,.046,ivory,0],
    [1,1,.105,.048,ivory,0],[.997,1,.111,.049,cream,0],
    [.989,1,.114,.049,cream,0],[.979,1,.114,.049,cream,0],
    [.971,1,.112,.049,burntHoney,0],[.965,1,.111,.049,ivory,0],
    [.952,1,.108,.047,cream,0],[.926,.98,.093,.039,ivory,.30],
    [.86,.90,.067,.024,ivory,.72],[.79,.75,.051,.012,ivory,.60],
    [.68,.47,.041,.004,cream,.25],[.54,.15,.035,0,cream,0],
    [.37,0,.033,0,cream,0],[.16,0,.033,0,cream,0]
  ];
  for (const [scale,contour,y,lift,base,pink] of sections) {
    for (let i=0;i<segments;i++) {
      const p=outline[i],a=2*Math.PI*i/segments;
      const u=Math.max(0,(-p.y-.200)/.154);
      const ear=u*u/(.25+.75*u);
      const x=THREE.MathUtils.lerp(.36*Math.sin(a),p.x,contour)*scale * (1-.19*ear);
      const z=THREE.MathUtils.lerp(.015+.248*Math.cos(a),p.y,contour)*scale + ear*lift*1.8;
      points.push(x,y+ear*lift*3.5,z);
      uvs.push(.5+x/.80,.54-z/.72);
      glaze.copy(base).lerp(rose,pink*ear);colors.push(glaze.r,glaze.g,glaze.b);
    }
  }
  for(let j=0;j<sections.length-1;j++) for(let i=0;i<segments;i++) {
    const a=j*segments+i,b=j*segments+(i+1)%segments;
    indices.push(a,b,a+segments,b,b+segments,a+segments);
  }
  for(const [ring,y,base,top] of [[0,.013,foot,false],[sections.length-1,.033,cream,true]]) {
    const center=points.length/3; points.push(0,y,.015); uvs.push(.5,.52); colors.push(base.r,base.g,base.b);
    for(let i=0;i<segments;i++) {
      const a=ring*segments+i,b=ring*segments+(i+1)%segments;
      if(top) indices.push(center,a,b); else indices.push(center,b,a);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
  return g;
}
