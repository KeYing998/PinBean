import type { Bead, Grid, SourceImage } from './model';
export type Lab = [number,number,number];
export function rgbToLab(r:number,g:number,b:number):Lab {
  const lin=(v:number)=>{v/=255;return v>.04045?((v+.055)/1.055)**2.4:v/12.92;};
  r=lin(r);g=lin(g);b=lin(b);
  const f=(v:number)=>v>.008856?Math.cbrt(v):7.787*v+16/116;
  const x=f((r*.4124564+g*.3575761+b*.1804375)/.95047),y=f(r*.2126729+g*.7151522+b*.072175),z=f((r*.0193339+g*.119192+b*.9503041)/1.08883);
  return [116*y-16,500*(x-y),200*(y-z)];
}
export function hexLab(h:string):Lab {return rgbToLab(parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16));}
export function deltaE(a:Lab,b:Lab):number {
  const [L1,a1,b1]=a,[L2,a2,b2]=b,rad=Math.PI/180,deg=180/Math.PI;
  const C1=Math.hypot(a1,b1),C2=Math.hypot(a2,b2),C=(C1+C2)/2;
  const G=.5*(1-Math.sqrt(C**7/(C**7+25**7))),A1=(1+G)*a1,A2=(1+G)*a2;
  const c1=Math.hypot(A1,b1),c2=Math.hypot(A2,b2);
  const hue=(aa:number,bb:number)=>{const h=Math.atan2(bb,aa)*deg;return h<0?h+360:h;};
  const h1=c1? hue(A1,b1):0,h2=c2?hue(A2,b2):0;
  const dL=L2-L1,dc=c2-c1;let dh=h2-h1;if(!c1||!c2)dh=0;else if(dh>180)dh-=360;else if(dh<-180)dh+=360;
  const dH=2*Math.sqrt(c1*c2)*Math.sin(dh*rad/2),lm=(L1+L2)/2,cm=(c1+c2)/2;
  let hm=h1+h2;if(c1&&c2){hm=Math.abs(h1-h2)<=180?(h1+h2)/2:h1+h2<360?(h1+h2+360)/2:(h1+h2-360)/2;}
  const T=1-.17*Math.cos((hm-30)*rad)+.24*Math.cos(2*hm*rad)+.32*Math.cos((3*hm+6)*rad)-.20*Math.cos((4*hm-63)*rad);
  const sl=1+.015*(lm-50)**2/Math.sqrt(20+(lm-50)**2),sc=1+.045*cm,sh=1+.015*cm*T;
  const rt=-2*Math.sqrt(cm**7/(cm**7+25**7))*Math.sin(60*Math.exp(-(((hm-275)/25)**2))*rad);
  return Math.sqrt((dL/sl)**2+(dc/sc)**2+(dH/sh)**2+rt*(dc/sc)*(dH/sh));
}
export function nearest(lab:Lab,beads:Bead[]):Bead {
  if(!beads.length)throw Error('至少选择一个可用豆色。');
  let best=beads[0],dist=Infinity;for(const bead of beads){const d=deltaE(lab,hexLab(bead.hex));if(d<dist){best=bead;dist=d;}}return best;
}
export function mapImage(source:SourceImage,beads:Bead[],limit=0,background='#ffffff',alphaThreshold=0,onProgress?:(n:number)=>void):Grid {
  if(!beads.length)throw Error('至少选择一个可用豆色。');
  const bg=[1,3,5].map(i=>parseInt(background.slice(i,i+2),16)),labs=beads.map(b=>hexLab(b.hex)),cache=new Map<number,string>(),counts=new Map<string,number>();
  const cells:(string|null)[]=new Array(source.width*source.height),rgba=source.rgba;
  for(let i=0;i<cells.length;i++){
    const o=i*4,a=rgba[o+3];if(a<=alphaThreshold){cells[i]=null;continue;}
    const rgb=[0,1,2].map(k=>Math.round(rgba[o+k]*a/255+bg[k]*(1-a/255))),key=(rgb[0]<<16)|(rgb[1]<<8)|rgb[2];
    let id=cache.get(key);if(!id){const lab=rgbToLab(rgb[0],rgb[1],rgb[2]);let best=0,d=Infinity;for(let k=0;k<beads.length;k++){const n=deltaE(lab,labs[k]);if(n<d){d=n;best=k;}}id=beads[best].id;cache.set(key,id);}
    cells[i]=id;counts.set(id,(counts.get(id)||0)+1);if(i%4096===0)onProgress?.(Math.round(i/cells.length*80));
  }
  if(limit>0&&counts.size>limit){const chosen=new Set([...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit).map(c=>c[0])),subset=beads.filter(b=>chosen.has(b.id));return mapImage(source,subset,0,background,alphaThreshold,onProgress);}
  onProgress?.(100);return {width:source.width,height:source.height,cells,done:new Array(cells.length).fill(false)};
}
export function remapGrid(g:Grid,old:Bead[],available:Bead[],limit=0):Grid {
  const byId=new Map(old.map(b=>[b.id,b]));const rgba=g.cells.flatMap(c=>c?[...([1,3,5].map(i=>parseInt(byId.get(c)!.hex.slice(i,i+2),16))),255]:[0,0,0,0]);
  const next=mapImage({width:g.width,height:g.height,rgba,name:'当前图纸'},available,limit);
  next.done=next.cells.map((c,i)=>c===g.cells[i]?g.done[i]:false);return next;
}
export function mergeRare(g:Grid,beads:Bead[],threshold:number):Grid {
  const counts=new Map<string,number>();for(const c of g.cells)if(c)counts.set(c,(counts.get(c)||0)+1);
  const targets=beads.filter(b=>(counts.get(b.id)||0)>threshold);
  if(!targets.length)throw Error('没有高于阈值的目标颜色，请降低阈值。');
  const replacements=new Map(beads.filter(b=>counts.has(b.id)&&(counts.get(b.id)||0)<=threshold).map(b=>[b.id,nearest(hexLab(b.hex),targets).id]));
  return {...g,cells:g.cells.map(c=>c?(replacements.get(c)||c):null),done:g.done.map((d,i)=>replacements.has(g.cells[i]||'')?false:d)};
}
