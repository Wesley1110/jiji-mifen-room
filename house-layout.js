// All navigation coordinates are world coordinates. The model origin remains
// at the bedroom doorway, with hallway-local +Z pointing out of the bedroom.
import {CARROT_BEDS} from './carrot-garden-layout.js';
export const HOUSE_ORIGIN={x:-3.55,z:10.08};
export const ENTRY={x:-7.15,z:19.53,hingeX:-8.05,width:1.8,maximum:Math.PI*.52};
export const HOUSE_BOUNDS={
 room:{x0:-10.35,x1:5.15,y0:.3,y1:7.7,z0:-2.95,z1:10.02},
 hall:{x0:-8.95,x1:1.84,y0:.3,y1:4.43,z0:10.51,z1:19.18},
 reading:{x0:-16.35,x1:-9.49,y0:.3,y1:4.43,z0:13.74,z1:18.12},
 garden:{x0:-20.0,x1:5.7,y0:.3,y1:4.43,z0:19.85,z1:28.4}
};
// Major furniture bodies: visitors can fly above them, but cannot walk through
// the cushioned bench, tea table or bookcase at sitting height.
export const READING_OBSTACLES=[
 {x0:-16.27,x1:-14.65,z0:14.14,z1:17.7,y0:0,y1:1.86},
 {x0:-13.86,x1:-12.55,z0:14.83,z1:16.88,y0:0,y1:.73},
 {x0:-12.95,x1:-10.53,z0:13.63,z1:14.35,y0:0,y1:1.73}
];
// Include the planted canopy when walking. Free flight above the garden is
// still possible, and the open aisle connects all four beds to the porch.
export const GARDEN_OBSTACLES=CARROT_BEDS.map(b=>({
 x0:HOUSE_ORIGIN.x+b.x-b.width/2-.08,x1:HOUSE_ORIGIN.x+b.x+b.width/2+.08,
 z0:HOUSE_ORIGIN.z+b.z-b.depth/2-.08,z1:HOUSE_ORIGIN.z+b.z+b.depth/2+.08,y0:0,y1:1.72
}));
