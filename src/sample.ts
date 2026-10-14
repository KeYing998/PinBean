import { clone, uid, validatePalette, defaultConversion, type Project, type Grid } from './model';
import {defaultPalette} from './palettes';
export {defaultPalette,bucketPalette} from './palettes';
export function sampleProject():Project {
  const width=29,height=29,cells:Grid['cells']=new Array(width*height).fill(null),find=(name:string)=>defaultPalette.beads.find(b=>b.name===name)!.id;
  const put=(x:number,y:number,name:string)=>{if(x>=0&&x<width&&y>=0&&y<height)cells[y*width+x]=find(name);};
  // Original pixel illustration: a little woodland mushroom.
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const dx=x-14,dy=y-12;
    if(y>=5&&y<=15 && (dx*dx/121+dy*dy/64<=1.05))put(x,y,'Black');
    if(y>=6&&y<=14 && (dx*dx/95+dy*dy/46<=1.05))put(x,y,'Red');
    if(y>=16&&y<=24&&x>=10&&x<=18)put(x,y,'Black');
    if(y>=16&&y<=23&&x>=11&&x<=17)put(x,y,'Tan');
    if(y>=17&&y<=22&&x>=12&&x<=15)put(x,y,'White');
  }
  for(const [cx,cy] of [[10,9],[17,8],[20,12],[7,13],[13,13]])for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)put(cx+dx,cy+dy,'White');
  put(12,20,'Black');put(16,20,'Black');put(14,22,'Light Brown');
  for(let x=5;x<=23;x++){put(x,26,'Dark Green');if(x%3===0)put(x,25,'Kiwi Lime');}
  put(6,24,'Kiwi Lime');put(22,24,'Kiwi Lime');
  const grid={width,height,cells,done:new Array(width*height).fill(false)};
  const byId=new Map(defaultPalette.beads.map(b=>[b.id,b]));const rgba=cells.flatMap(c=>c?[...[1,3,5].map(i=>parseInt(byId.get(c)!.hex.slice(i,i+2),16)),255]:[0,0,0,0]);
  return {format:'pinbean',version:1,id:uid(),name:'林间小蘑菇',updated:new Date().toISOString(),grid,palette:clone(defaultPalette),source:{width,height,rgba,name:'林间小蘑菇 · 示例像素画'},enabled:defaultPalette.beads.filter(b=>b.autoMatch!==false).map(b=>b.id),inventory:{},board:{width:29,height:29},snapshots:[],conversion:defaultConversion(),print:{paper:'a4',landscape:false,margin:10,pitch:5,boardPages:false}};
}
