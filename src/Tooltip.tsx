import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
const tips:Record<string,string>={
  '导入新图片':'导入另一张图片并创建新工程，当前作品会保留。',
  '导出图纸':'设置纸张和格距，下载 PDF 或 PNG 图纸包。',
  '调整':'调整行列数；可缩放、裁剪或补透明空格。',
  '管理色盘':'选择可用豆色、添加个人色盘或混合兼容套装。',
  '应用配色':'按当前可用豆色和颜色上限重新匹配，预览确认后应用。',
  '从原图重新转换':'从本次导入的图片重新生成图纸，确认后会替换当前编辑。',
  '去除背景':'移除与图纸边缘连通的背景，保留被主体包围的区域。',
  '合并杂色':'将用量较少的豆色合并到最接近的常用色。',
  '网格':'显示或隐藏格子边界。',
  '# 色号标记':'格内数字对应右侧材料表；放大后显示。',
  '豆板':'显示豆板边界；在左侧工具中设置每块豆板的行列。',
  '整色替换':'将图纸中的一种豆色替换为另一种可用豆色。',
  '方案与版本':'保存命名方案，比较结果或恢复旧版本。',
  '区域操作':'先用框选工具选中区域，再复制、移动、镜像或旋转。',
  '豆板布局':'设置豆板尺寸和方向，查看并标记分区进度。',
  '更多工具':'展开整色替换、版本、区域操作和豆板布局。',
  '制作进度':'显示已完成的格子；用勾选工具标记格子。',
  '隐藏进度':'隐藏完成标记，不会删除已保存的制作进度。',
  '保存工程文件':'下载完整工程备份，包含图纸、原图数据、色盘、库存和版本。Ctrl+S',
  '撤销':'撤销上一次图纸修改。Ctrl+Z',
  '重做':'恢复刚才撤销的修改。Ctrl+Shift+Z',
  '放大':'放大图纸，显示更多格子细节。',
  '缩小':'缩小图纸，查看更大范围。',
  '适合画布':'调整显示倍率，不改变图纸行列数。',
  '使用指南':'查看工具用法、快捷键及打印设置。',
  '平移 V':'拖动画布查看其他位置。快捷键 V',
  '画笔 B':'用当前豆色绘制；一次拖动作为一次撤销操作。快捷键 B',
  '橡皮 E':'将格子擦成空格，同时清除该格制作进度。快捷键 E',
  '取色 I':'点击格子选择它的豆色，再切换到画笔。快捷键 I',
  '填充 G':'用当前豆色填充四向连通的同色区域。快捷键 G',
  '标记完成 P':'点击或拖动标记格子完成，再次点击取消。快捷键 P',
  '框选 S':'拖动选择矩形区域，在左侧工具中操作。快捷键 S',
};
export default function Tooltip(){
  const [shown,setShown]=useState<{text:string;rect:DOMRect;anchor:HTMLElement}|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),active=useRef<HTMLElement|null>(null);
  useEffect(()=>{
    let previousDescription:string|null=null;
    const hide=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;if(active.current){if(previousDescription===null)active.current.removeAttribute('aria-describedby');else active.current.setAttribute('aria-describedby',previousDescription);}active.current=null;setShown(null);};
    const show=(event:Event)=>{const origin=event.target;if(!(origin instanceof Element))return;const anchor=origin.closest<HTMLElement>('[data-tooltip],button,summary');if(!anchor){hide();return;}if(anchor===active.current)return;
      const explicit=anchor.dataset.tooltip;const text=(explicit&&(tips[explicit]||explicit))||tips[anchor.getAttribute('aria-label')||'']||tips[anchor.textContent?.trim()||''];hide();if(!text)return;active.current=anchor;previousDescription=anchor.getAttribute('aria-describedby');timer.current=setTimeout(()=>{if(!anchor.isConnected){hide();return;}anchor.setAttribute('aria-describedby',[previousDescription,'pinbean-tooltip'].filter(Boolean).join(' '));setShown({text,rect:anchor.getBoundingClientRect(),anchor});},250);
    };
    const leave=(event:Event)=>{const related=(event as PointerEvent).relatedTarget;if(active.current&&related instanceof Node&&active.current.contains(related))return;hide();};
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape')hide();};
    const scroll=()=>{if(active.current?.contains(document.activeElement)){const rect=active.current.getBoundingClientRect();setShown(previous=>previous?{...previous,rect}:null);return;}hide();};
    document.addEventListener('pointerover',show);document.addEventListener('pointerout',leave);document.addEventListener('focusin',show);document.addEventListener('focusout',leave);document.addEventListener('pointerdown',hide);document.addEventListener('scroll',scroll,true);window.addEventListener('resize',hide);document.addEventListener('keydown',key);
    return()=>{hide();document.removeEventListener('pointerover',show);document.removeEventListener('pointerout',leave);document.removeEventListener('focusin',show);document.removeEventListener('focusout',leave);document.removeEventListener('pointerdown',hide);document.removeEventListener('scroll',scroll,true);window.removeEventListener('resize',hide);document.removeEventListener('keydown',key);};
  },[]);
  if(!shown)return null;const below=shown.rect.top<90,x=Math.max(142,Math.min(innerWidth-142,shown.rect.left+shown.rect.width/2)),y=below?shown.rect.bottom+9:shown.rect.top-9;
  return createPortal(<div id="pinbean-tooltip" role="tooltip" className={`app-tooltip ${below?'below':''}`} style={{left:x,top:y}}>{shown.text}</div>,shown.anchor.closest('dialog')||document.body);
}
