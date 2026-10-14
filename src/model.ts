export type Bead = { id: string; code: string; name: string; hex: string; brand: string; series: string; size: string; autoMatch?: boolean };
export type Palette = { id: string; name: string; version: string; verified: boolean; compatibility: string | null; sources: { title: string; url: string }[]; note: string; beads: Bead[] };
export type Grid = { width: number; height: number; cells: (string | null)[]; done: boolean[] };
export type SourceImage = { width: number; height: number; rgba: number[]; name: string; originalWidth?:number; originalHeight?:number };
export type Snapshot = { id: string; name: string; date: string; grid: Grid; palette:Palette; enabled:string[] };
export type PrintSettings = { paper: 'a4' | 'letter'; landscape: boolean; margin: number; pitch: number; boardPages: boolean };
export type ConversionSettings = { limit:number; background:string; alphaThreshold:number; rareThreshold:number; tolerance:number };
export const defaultConversion=():ConversionSettings=>({limit:0,background:'#ffffff',alphaThreshold:0,rareThreshold:3,tolerance:35});
export type Project = { format: 'pinbean'; version: 1; id: string; name: string; updated: string; grid: Grid; palette: Palette; source?: SourceImage; enabled: string[]; inventory: Record<string, number>; board: { width: number; height: number }; snapshots: Snapshot[]; print: PrintSettings; conversion:ConversionSettings };
export type Tool = 'pan' | 'brush' | 'eraser' | 'picker' | 'fill' | 'select' | 'progress';
export type Selection = { x: number; y: number; width: number; height: number };
export const MAX_SIDE = 512;
export const MAX_CELLS = 262144;
export const clone = <T,>(value: T): T => structuredClone(value);
export const uid = () => crypto.randomUUID();
export function validatePalette(p: unknown): Palette {
  const v = p as Palette;
  if (!v || typeof v.id !== 'string' || !v.id || typeof v.name !== 'string' || typeof v.version !== 'string' || typeof v.note !== 'string' || typeof v.verified !== 'boolean' || (v.compatibility !== null && typeof v.compatibility !== 'string') || !Array.isArray(v.sources) || !v.sources.every(s => typeof s?.title === 'string' && typeof s?.url === 'string') || !Array.isArray(v.beads) || !v.beads.length || v.beads.length > 512) throw Error('色盘格式不正确：需要名称、版本、来源和 1–512 个色号。');
  const ids = new Set<string>();
  for (const b of v.beads) {
    if (!b || !['id','code','name','hex','brand','series','size'].every(k => {const value=b[k as keyof Bead];return typeof value === 'string' && value.length > 0;}) || !/^#[0-9a-f]{6}$/i.test(b.hex) || ids.has(b.id) || (b.autoMatch !== undefined && typeof b.autoMatch !== 'boolean')) throw Error('色盘含重复 ID、空字段或不合法的 HEX。');
    ids.add(b.id);
  }
  return clone(v);
}
export function validateGrid(g: Grid, palette: Palette) {
  if (!g || !Number.isInteger(g.width) || !Number.isInteger(g.height) || g.width < 1 || g.height < 1 || g.width > MAX_SIDE || g.height > MAX_SIDE || g.width * g.height > MAX_CELLS || !Array.isArray(g.cells) || g.cells.length !== g.width * g.height || !Array.isArray(g.done) || g.done.length !== g.cells.length) throw Error('图纸尺寸或格子数据不正确（最多 512 × 512）。');
  const ids = new Set(palette.beads.map(b => b.id));
  if (!g.cells.every(c => c === null || ids.has(c)) || !g.done.every((d, i) => typeof d === 'boolean' && (!d || g.cells[i] !== null))) throw Error('图纸包含未知色号或不合法的进度。');
}
export function parseProject(text: string): Project {
  const p = JSON.parse(text) as Project;
  if (!p || p.format !== 'pinbean' || p.version !== 1) throw Error('不支持的工程格式或版本。');
  validatePalette(p.palette); validateGrid(p.grid, p.palette);
  p.conversion ??= defaultConversion();
  const config=p.conversion;if(!Number.isInteger(config.limit)||config.limit<0||config.limit>512||!/^#[0-9a-f]{6}$/i.test(config.background)||!Number.isInteger(config.alphaThreshold)||config.alphaThreshold<0||config.alphaThreshold>254||!Number.isInteger(config.rareThreshold)||config.rareThreshold<1||config.rareThreshold>10000||!Number.isFinite(config.tolerance)||config.tolerance<0||config.tolerance>442)throw Error('转换设置不合法。');
  if (typeof p.id !== 'string' || typeof p.name !== 'string' || typeof p.updated !== 'string' || !Array.isArray(p.enabled) || !p.enabled.every(id => p.palette.beads.some(b => b.id === id)) || !p.inventory || typeof p.inventory !== 'object' || !Object.values(p.inventory).every(n => Number.isInteger(n) && n >= 0) || !p.board || ![p.board.width,p.board.height].every(n => Number.isInteger(n) && n > 0 && n <= MAX_SIDE) || !Array.isArray(p.snapshots) || p.snapshots.length > 20 || !p.print || !['a4','letter'].includes(p.print.paper) || typeof p.print.landscape !== 'boolean' || typeof p.print.boardPages !== 'boolean' || !Number.isFinite(p.print.margin) || p.print.margin < 5 || p.print.margin > 40 || !Number.isFinite(p.print.pitch) || p.print.pitch < 3 || p.print.pitch > 12) throw Error('工程设置或库存不合法。');
  for (const s of p.snapshots) { if (typeof s.id !== 'string' || typeof s.name !== 'string' || typeof s.date !== 'string') throw Error('版本数据不合法。'); s.palette ??= clone(p.palette);s.enabled ??= [...p.enabled];validatePalette(s.palette);validateGrid(s.grid,s.palette);if(!Array.isArray(s.enabled)||!s.enabled.every(id=>s.palette.beads.some(b=>b.id===id)))throw Error('版本可用色不合法。'); }
  if (p.source && (!Number.isInteger(p.source.width) || !Number.isInteger(p.source.height) || p.source.width < 1 || p.source.height < 1 || p.source.width > MAX_SIDE || p.source.height > MAX_SIDE || p.source.rgba.length !== p.source.width * p.source.height * 4 || !p.source.rgba.every(n => Number.isInteger(n) && n >= 0 && n <= 255))) throw Error('原图像素数据不合法。');
  if(p.source&&[p.source.originalWidth,p.source.originalHeight].some(n=>n!==undefined&&(!Number.isInteger(n)||n<1||n>32_000_000)))throw Error('原始图片尺寸信息不合法。');
  return p;
}
export function statistics(grid: Grid) {
  const counts: Record<string, number> = {};
  let total = 0, done = 0;
  grid.cells.forEach((c, i) => { if (c) { counts[c] = (counts[c] || 0) + 1; total++; if (grid.done[i]) done++; } });
  return { counts, total, colors: Object.keys(counts).length, done };
}
export function resizeGrid(g: Grid, w: number, h: number, mode: 'nearest' | 'crop'): Grid {
  if (![w,h].every(n => Number.isInteger(n) && n >= 1 && n <= MAX_SIDE)) throw Error('行列数必须为 1–512 的整数。');
  const cells: Grid['cells'] = [], done: boolean[] = [];
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const sx = mode === 'nearest' ? Math.min(g.width-1, Math.floor(x*g.width/w)) : x;
    const sy = mode === 'nearest' ? Math.min(g.height-1, Math.floor(y*g.height/h)) : y;
    const i = sy*g.width+sx;
    cells.push(sx < g.width && sy < g.height ? g.cells[i] : null);
    done.push(mode === 'crop' && sx < g.width && sy < g.height ? g.done[i] : false);
  }
  return { width:w,height:h,cells,done };
}
export function flood(g: Grid, index: number, target: string | null): Grid {
  const source = g.cells[index]; if (source === target || index < 0 || index >= g.cells.length) return g;
  const next = clone(g), queue = [index]; next.cells[index] = target; next.done[index] = false;
  for (let q=0;q<queue.length;q++) {
    const i=queue[q], x=i%g.width;
    for (const n of [x>0?i-1:-1,x<g.width-1?i+1:-1,i-g.width,i+g.width]) {
      if (n>=0 && n<g.cells.length && next.cells[n]===source) { next.cells[n]=target;next.done[n]=false;queue.push(n); }
    }
  }
  return next;
}
export function removeBackground(g: Grid, palette: Palette, tolerance: number, hex: string): Grid {
  const next = clone(g), seen = new Uint8Array(g.cells.length), queue:number[]=[];
  const rgb = (h:string) => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const base=rgb(hex), colors = new Map(palette.beads.map(b=>[b.id,rgb(b.hex)]));
  const visit=(i:number)=>{ if (seen[i]) return;seen[i]=1; const c=g.cells[i], ref=c?colors.get(c):null; if (!c || (ref && Math.sqrt(ref.reduce((n,v,k)=>n+(v-base[k])**2,0))<=tolerance)) { queue.push(i);next.cells[i]=null;next.done[i]=false; } };
  for(let x=0;x<g.width;x++){visit(x);visit((g.height-1)*g.width+x);}for(let y=0;y<g.height;y++){visit(y*g.width);visit(y*g.width+g.width-1);}
  for(let q=0;q<queue.length;q++){const i=queue[q],x=i%g.width;for(const n of [x>0?i-1:-1,x<g.width-1?i+1:-1,i-g.width,i+g.width])if(n>=0&&n<g.cells.length)visit(n);}
  return next;
}
export function transformRegion(g:Grid,s:Selection,operation:'mirror'|'rotate'|'copy'|'move',dx=0,dy=0,skipEmpty=true):Grid {
  const next=clone(g), w=operation==='rotate'?s.height:s.width,h=operation==='rotate'?s.width:s.height;
  const ox=s.x+dx,oy=s.y+dy;
  if(ox<0||oy<0||ox+w>g.width||oy+h>g.height)throw Error('目标区域超出图纸；请调整位置或先扩大图纸。');
  if(operation==='move'||operation==='rotate')for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const i=(s.y+y)*g.width+s.x+x;next.cells[i]=null;next.done[i]=false;}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const sx=operation==='mirror'?s.width-1-x:operation==='rotate'?y:x,sy=operation==='rotate'?s.height-1-x:y;
    const src=(s.y+sy)*g.width+s.x+sx,dest=(oy+y)*g.width+ox+x;
    if(skipEmpty && g.cells[src]===null && (operation==='copy'||operation==='move'))continue;
    next.cells[dest]=g.cells[src];next.done[dest]=false;
  }
  return next;
}
export type GridChange = { before?:Grid; after?:Grid; patches?:{ i:number; old:string|null; value:string|null; oldDone:boolean; done:boolean }[] };
export function gridChange(before:Grid,after:Grid):GridChange|null {
  if(before.width!==after.width||before.height!==after.height)return {before:clone(before),after:clone(after)};
  const patches:NonNullable<GridChange['patches']>=[];
  for(let i=0;i<before.cells.length;i++)if(before.cells[i]!==after.cells[i]||before.done[i]!==after.done[i])patches.push({i,old:before.cells[i],value:after.cells[i],oldDone:before.done[i],done:after.done[i]});
  return patches.length?{patches}:null;
}
export function applyChange(g:Grid,c:GridChange,back:boolean):Grid {
  if(c.before&&c.after)return clone(back?c.before:c.after);
  const n=clone(g);for(const p of c.patches||[]){n.cells[p.i]=back?p.old:p.value;n.done[p.i]=back?p.oldDone:p.done;}return n;
}
