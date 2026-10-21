export const PAT_DURATION = 1.8;
const smooth = value => { const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t); };

// Exactly two separate press/lift cycles, followed by a gentle retraction.
export function sampleDoublePat(seconds) {
  let pressure=0, beat=-1;
  for (const [i,start] of [.32,.94].entries()) {
    const phase=(seconds-start)/.44;
    if (phase>0&&phase<1) { pressure=Math.sin(Math.PI*phase)**2;beat=i; }
  }
  return {pressure,beat,touching:pressure>.55,envelope:smooth(seconds/.3)*(1-smooth((seconds-1.48)/.32)),lift:.16*(1-pressure)};
}
