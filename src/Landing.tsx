import { useState } from 'react';
import { ArrowRight, FileJson, FolderOpen, Grid3X3, ImagePlus, LoaderCircle, Plus, Upload, X } from 'lucide-react';
import type { Project } from './model';
import { sampleProject } from './sample';
type Props={ready:boolean;busy:string;recent:Project|null;onUpload:(file?:File)=>void;onChoose:()=>void;onImport:()=>void;onBlank:()=>void;onSample:()=>void;onContinue:()=>void;onProjects:()=>void;onCancel:()=>void};
export function BeadArtwork({project}:{project:Project}) {
  const byId=new Map(project.palette.beads.map(b=>[b.id,b.hex]));
  return <svg className="bead-artwork" viewBox={`0 0 ${project.grid.width*12} ${project.grid.height*12}`} aria-hidden="true">{project.grid.cells.map((id,i)=>id&&<g key={i}><circle cx={(i%project.grid.width)*12+6} cy={Math.floor(i/project.grid.width)*12+6} r="5.35" fill={byId.get(id)}/><circle cx={(i%project.grid.width)*12+6} cy={Math.floor(i/project.grid.width)*12+6} r="1.7" fill="#f7f4e9" opacity=".78"/></g>)}</svg>;
}
const demo=sampleProject();
export default function Landing(p:Props){
  const [dragging,setDragging]=useState(false);
  return <main className="landing">
    <div className="landing-intro"><div className="landing-kicker"><span/>从图片开始你的下一件作品</div><h1>把喜欢的图片，<br/>拼成自己的<span>作品。</span></h1><p>导入图片，调整豆色，下载可制作的拼豆图纸。</p></div>
    <div className="landing-main">
      <div className={`landing-upload ${dragging?'dragging':''}`} onDragOver={e=>{e.preventDefault();if(!p.busy)setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);if(p.ready&&!p.busy)p.onUpload(e.dataTransfer.files[0]);}}>
        {p.busy?<div className="landing-processing" role="status"><LoaderCircle size={32} className="spin"/><h2>正在生成图纸</h2><p>{p.busy}</p><button className="secondary" onClick={p.onCancel}><X size={15}/>取消</button></div>:<><div className="upload-illustration"><div className="illustration-pixel one"/><div className="illustration-pixel two"/><div className="illustration-pixel three"/><ImagePlus size={34} strokeWidth={1.35}/></div><h2>{dragging?'松开鼠标导入图片':'将图片拖到这里'}</h2><p>或从电脑中选择一张图片</p><button className="primary landing-upload-button" disabled={!p.ready} onClick={p.onChoose}><Upload size={17}/>{p.ready?'选择图片':'正在加载…'}</button><small>PNG、JPG、WebP · 大图可设置图纸尺寸</small></>}
      </div>
      <button className="landing-sample" disabled={!p.ready||!!p.busy} onClick={p.onSample} aria-label="使用小蘑菇示例"><div className="sample-label">没有图片？先试试这张</div><div className="sample-art"><BeadArtwork project={demo}/><span className="sample-spark">✳</span><span className="sample-spark second">+</span></div><div className="sample-meta"><div><strong>林间小蘑菇</strong><small>29 × 29 格 · 7 色</small></div><span className="sample-arrow"><ArrowRight size={20}/></span></div></button>
    </div>
    <div className="landing-options"><button disabled={!p.ready||!!p.busy} onClick={p.onImport}><FileJson size={17}/><span>导入工程</span><ArrowRight size={14}/></button><button disabled={!p.ready||!!p.busy} onClick={p.onBlank}><Plus size={17}/><span>新建空白图纸</span><ArrowRight size={14}/></button><button disabled={!p.ready||!!p.busy} onClick={p.onProjects}><FolderOpen size={17}/><span>打开已有工程</span><ArrowRight size={14}/></button></div>
    {p.recent&&<div className="resume-project"><div className="resume-icon"><Grid3X3 size={20}/></div><div><small>上次的作品</small><strong>{p.recent.name||'未命名图纸'}<span>{p.recent.grid.width} × {p.recent.grid.height} 格</span></strong></div><button className="secondary" onClick={p.onContinue} disabled={!!p.busy}>继续编辑<ArrowRight size={15}/></button></div>}
    <div className="landing-steps"><div><span>01</span><strong>导入图片</strong><p>从像素画或已有工程开始</p></div><div><span>02</span><strong>调整图纸</strong><p>选择豆色，修正想要的细节</p></div><div><span>03</span><strong>下载开拼</strong><p>带上图纸和材料清单开始制作</p></div></div>
  </main>;
}
