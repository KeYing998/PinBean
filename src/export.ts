import { chartCanvas, materialCanvases } from './draw';
import type { Project } from './model';
export function download(data:Blob|string,name:string){const a=document.createElement('a'),url=typeof data==='string'?data:URL.createObjectURL(data);a.href=url;a.download=name;a.click();setTimeout(()=>{if(url.startsWith('blob:'))URL.revokeObjectURL(url);},2000);}
export const safeName=(n:string)=>n.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,80)||'PinBean';
const pause=()=>new Promise(r=>setTimeout(r,0));
async function pngBytes(canvas:HTMLCanvasElement){const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG 编码失败'))));return new Uint8Array(await blob.arrayBuffer());}
export function pageRegions(p:Project,cols:number,rows:number){const regions=[];for(let y=0;y<p.grid.height;y+=rows)for(let x=0;x<p.grid.width;x+=cols)regions.push({x,y,width:Math.min(cols,p.grid.width-x),height:Math.min(rows,p.grid.height-y)});return regions;}
export async function exportPNG(p:Project,signal:AbortSignal,progress:(s:string)=>void){
  const regions=pageRegions(p,Math.min(p.board.width,60),Math.min(p.board.height,60)),files:Record<string,Uint8Array>={},name=safeName(p.name);
  if(regions.length>1024)throw Error('当前豆板设置会产生超过 1024 个分区，请增大豆板尺寸。');
  for(let i=0;i<regions.length;i++){if(signal.aborted)throw Error('导出已取消');progress(`PNG 分区 ${i+1}/${regions.length}`);const r=regions[i];files[`${name}-R${r.y+1}-C${r.x+1}.png`]=await pngBytes(chartCanvas(p,r));await pause();}
  const materials=materialCanvases(p);for(let i=0;i<materials.length;i++){if(signal.aborted)throw Error('导出已取消');files[`材料清单-${i+1}.png`]=await pngBytes(materials[i]);}
  progress('打包 PNG 和材料清单');await pause();if(signal.aborted)throw Error('导出已取消');
  const {zip}=await import('fflate');const buffer=await new Promise<Uint8Array>((resolve,reject)=>{const stop=zip(files,{level:0},(err,data)=>{signal.removeEventListener('abort',cancel);if(err)reject(err);else resolve(data);});const cancel=()=>{stop();reject(Error('导出已取消'));};signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();});download(new Blob([buffer.buffer as ArrayBuffer],{type:'application/zip'}),`${name}-PNG图纸.zip`);
}
export async function exportPDF(p:Project,signal:AbortSignal,progress:(s:string)=>void){
  const {jsPDF}=await import('jspdf');
  const pdf=new jsPDF({orientation:p.print.landscape?'landscape':'portrait',unit:'mm',format:p.print.paper,compress:true});
  const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),m=p.print.margin,pitch=p.print.pitch;
  const usableCols=Math.floor((pw-m*2-16)/pitch),usableRows=Math.floor((ph-m*2-35)/pitch);
  const cols=p.print.boardPages?Math.min(usableCols,p.board.width):usableCols,rows=p.print.boardPages?Math.min(usableRows,p.board.height):usableRows;
  if(cols<1||rows<1)throw Error('纸张无法容纳当前格距，请缩小格距或边距。');
  const regions=p.print.boardPages?boardRegions(p,usableCols,usableRows):pageRegions(p,cols,rows);
  if(regions.length>1024)throw Error('当前设置会产生超过 1024 页，请增大豆板尺寸或调整打印设置。');
  for(let i=0;i<regions.length;i++){
    if(signal.aborted)throw Error('导出已取消');if(i)pdf.addPage();progress(`PDF 图纸 ${i+1}/${regions.length}`);const r=regions[i],size=32,canvas=chartCanvas(p,r,size,`${p.name} · ${i+1}/${regions.length}`),scale=pitch/size;
    pdf.addImage(canvas.toDataURL('image/png'),'PNG',m,m,canvas.width*scale,canvas.height*scale,undefined,'FAST');pdf.setFontSize(8);pdf.text('50 mm calibration | Print at 100%',m,ph-m-8);pdf.line(m,ph-m-4,m+50,ph-m-4);pdf.line(m,ph-m-6,m,ph-m-2);pdf.line(m+50,ph-m-6,m+50,ph-m-2);await pause();
  }
  const materials=materialCanvases(p);for(const canvas of materials){if(signal.aborted)throw Error('导出已取消');pdf.addPage();const scale=Math.min((pw-2*m)/canvas.width,(ph-2*m)/canvas.height);pdf.addImage(canvas.toDataURL('image/png'),'PNG',m,m,canvas.width*scale,canvas.height*scale,undefined,'FAST');await pause();}
  if(signal.aborted)throw Error('导出已取消');pdf.save(`${safeName(p.name)}-施工图.pdf`);
}
function boardRegions(p:Project,cols:number,rows:number){const out=[];for(let by=0;by<p.grid.height;by+=p.board.height)for(let bx=0;bx<p.grid.width;bx+=p.board.width){const bw=Math.min(p.board.width,p.grid.width-bx),bh=Math.min(p.board.height,p.grid.height-by);for(let y=0;y<bh;y+=rows)for(let x=0;x<bw;x+=cols)out.push({x:bx+x,y:by+y,width:Math.min(cols,bw-x),height:Math.min(rows,bh-y)});}return out;}
