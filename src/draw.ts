import { statistics, type Project, type Grid, type Palette } from './model';
export const contrast=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).reduce((v,c,k)=>v+c*[.299,.587,.114][k],0)>148?'#29312c':'#ffffff';
export const symbol=(palette:Palette,id:string)=>String(palette.beads.findIndex(b=>b.id===id)+1).padStart(2,'0');
export function drawCells(ctx:CanvasRenderingContext2D,g:Grid,p:Palette,x0:number,y0:number,w:number,h:number,size:number,options:{labels?:boolean;grid?:boolean;highlight?:string;progress?:boolean;ox?:number;oy?:number}={}) {
  const map=new Map(p.beads.map((b,i)=>[b.id,{...b,symbol:String(i+1).padStart(2,'0')}])),ox=options.ox||0,oy=options.oy||0;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${Math.max(8,size*.32)}px system-ui, sans-serif`;
  for(let y=y0;y<Math.min(g.height,y0+h);y++)for(let x=x0;x<Math.min(g.width,x0+w);x++){
    const i=y*g.width+x,c=g.cells[i],bead=c?map.get(c):null,px=ox+(x-x0)*size,py=oy+(y-y0)*size;
    ctx.globalAlpha=options.highlight&&c!==options.highlight ? .2:1;
    if(bead){ctx.fillStyle=bead.hex;ctx.fillRect(px,py,size,size);if(options.labels&&size>=16){ctx.fillStyle=contrast(bead.hex);ctx.fillText(bead.symbol,px+size/2,py+size/2);}if(options.progress&&g.done[i]){ctx.fillStyle='rgba(15,84,60,.45)';ctx.fillRect(px,py,size,size);ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1,size/12);ctx.beginPath();ctx.moveTo(px+size*.23,py+size*.5);ctx.lineTo(px+size*.43,py+size*.7);ctx.lineTo(px+size*.8,py+size*.25);ctx.stroke();}}
    else {ctx.fillStyle=(x+y)%2===0?'#f0eee8':'#faf9f5';ctx.fillRect(px,py,size,size);}
    ctx.globalAlpha=1;
  }
  if(options.grid&&size>=8){ctx.strokeStyle='rgba(30,46,36,.18)';ctx.lineWidth=.6;ctx.beginPath();for(let x=0;x<=w;x++){ctx.moveTo(ox+x*size,oy);ctx.lineTo(ox+x*size,oy+h*size);}for(let y=0;y<=h;y++){ctx.moveTo(ox,oy+y*size);ctx.lineTo(ox+w*size,oy+y*size);}ctx.stroke();}
}
export function chartCanvas(project:Project,region:{x:number;y:number;width:number;height:number},size=32,title=project.name){
  const canvas=document.createElement('canvas');canvas.width=region.width*size+100;canvas.height=region.height*size+128;
  const c=canvas.getContext('2d')!;c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#203d2f';c.font='bold 22px system-ui, sans-serif';c.fillText(title,42,34,canvas.width-84);
  c.font='12px system-ui, sans-serif';c.fillStyle='#606b64';c.fillText(`列 ${region.x+1}–${region.x+region.width} / 行 ${region.y+1}–${region.y+region.height} · ${project.grid.width} × ${project.grid.height}`,42,58);
  c.textAlign='center';c.textBaseline='middle';c.font='10px system-ui, sans-serif';for(let x=0;x<region.width;x++)c.fillText(String(region.x+x+1),50+(x+.5)*size,82);for(let y=0;y<region.height;y++)c.fillText(String(region.y+y+1),28,96+(y+.5)*size);
  drawCells(c,project.grid,project.palette,region.x,region.y,region.width,region.height,size,{labels:true,grid:true,ox:50,oy:96});
  c.textAlign='left';c.fillStyle='#606b64';c.font='11px system-ui, sans-serif';c.fillText('格内数字对应材料清单 · 空格无需放豆 · PinBean',42,canvas.height-12);return canvas;
}
export function materialCanvases(p:Project){
  const stats=statistics(p.grid),beads=p.palette.beads.filter(b=>stats.counts[b.id]),pages:HTMLCanvasElement[]=[];
  for(let start=0;start<Math.max(beads.length,1);start+=24){
    const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1200;const c=canvas.getContext('2d')!;c.fillStyle='#fff';c.fillRect(0,0,1000,1200);c.fillStyle='#203d2f';c.font='bold 32px system-ui,sans-serif';c.fillText('材料清单 / MATERIALS',50,65);c.font='20px system-ui,sans-serif';c.fillText(p.name,50,106,900);c.fillText(`${p.grid.width} × ${p.grid.height} 格 · ${stats.total} 颗豆 · ${stats.colors} 色`,50,145);
    c.font='16px system-ui,sans-serif';c.fillText('标记 / 色号 / 品牌系列',50,192);c.fillText('需要 / 库存 / 缺料',710,192);
    beads.slice(start,start+24).forEach((b,j)=>{const y=226+j*34;c.fillStyle=b.hex;c.fillRect(50,y-15,24,24);c.fillStyle='#28382e';c.fillText(`${symbol(p.palette,b.id)}  ${b.code} · ${b.name}`,90,y,285);c.font='12px system-ui,sans-serif';c.fillStyle='#707971';c.fillText(`${b.brand} / ${b.series} / ${b.size}`,390,y,300);c.font='16px system-ui,sans-serif';c.fillStyle='#28382e';const n=stats.counts[b.id],inv=p.inventory[b.id]||0;c.fillText(`${n} / ${inv} / ${Math.max(0,n-inv)}`,710,y);});
    c.fillStyle='#707971';c.font='15px system-ui,sans-serif';const lines=[`色盘：${p.palette.name} · ${p.palette.version}`,'参考颜色与实物可能存在偏差，请以实际豆色为准。','打印图纸时选择「实际大小 / 100%」，关闭适应纸张。','套装中透明与荧光色的屏幕颜色仅供识别，不参与默认自动匹配。'];lines.forEach((t,i)=>c.fillText(t,50,1080+i*24,900));pages.push(canvas);
  }
  return pages;
}
