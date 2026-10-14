import { describe, it, expect } from 'vitest';
import { deltaE, rgbToLab, mapImage, mergeRare } from './color';
import { statistics, removeBackground, resizeGrid, transformRegion, flood, gridChange, applyChange, parseProject, validatePalette, clone, type Grid } from './model';
import { sampleProject, defaultPalette, bucketPalette } from './sample';
const a=defaultPalette.beads[0].id,b=defaultPalette.beads[2].id;
const grid=(w:number,h:number,cells:Grid['cells']):Grid=>({width:w,height:h,cells,done:new Array(cells.length).fill(false)});
describe('CIEDE2000 reference pairs (Sharma 2005)',()=>{
  it.each([
    [[50,2.6772,-79.7751],[50,0,-82.7485],2.0425],
    [[50,3.1571,-77.2803],[50,0,-82.7485],2.8615],
    [[50,2.8361,-74.0200],[50,0,-82.7485],3.4412],
    [[50,-1.3802,-84.2814],[50,0,-82.7485],1],
    [[50,0,0],[50,-1,2],2.3669],
  ])('matches %j', (x,y,expected)=>expect(deltaE(x as [number,number,number],y as [number,number,number])).toBeCloseTo(expected as number,4));
  it('white/black Lab',()=>{expect(rgbToLab(255,255,255)[0]).toBeCloseTo(100,3);expect(rgbToLab(0,0,0)[0]).toBe(0);});
});
describe('palette integrity',()=>{
  it('both kits contain exactly 30 colors, 25 default candidates; union 33',()=>{for(const p of [defaultPalette,bucketPalette]){expect(validatePalette(p).beads).toHaveLength(30);expect(p.beads.filter(b=>b.autoMatch!==false)).toHaveLength(25);}expect(new Set([...defaultPalette.beads,...bucketPalette.beads].map(b=>b.id)).size).toBe(33);});
  it('rejects duplicate IDs and invalid colors',()=>{const p=clone(defaultPalette);p.beads.push(p.beads[0]);expect(()=>validatePalette(p)).toThrow();});
});
describe('pixel conversion and document operations',()=>{
  it('transparent/half alpha pixels, actual color limit and count invariant',()=>{const g=mapImage({width:3,height:1,name:'test',rgba:[255,255,255,0,255,0,0,255,255,0,0,128]},defaultPalette.beads.filter(b=>b.autoMatch!==false),1);expect(g.cells[0]).toBe(null);const s=statistics(g);expect(s.total).toBe(2);expect(s.colors).toBe(1);expect(Object.values(s.counts).reduce((a,b)=>a+b,0)).toBe(s.total);});
  it('removes edge background but preserves enclosed white',()=>{const g=grid(5,5,[a,a,a,a,a,a,b,b,b,a,a,b,a,b,a,a,b,b,b,a,a,a,a,a,a]);const next=removeBackground(g,defaultPalette,0,defaultPalette.beads[0].hex);expect(next.cells[0]).toBe(null);expect(next.cells[12]).toBe(a);expect(statistics(next).total).toBe(9);});
  it('crop/pad retain cell positions; nearest does not smooth',()=>{const g=grid(2,2,[a,b,null,a]);expect(resizeGrid(g,3,3,'crop').cells).toEqual([a,b,null,null,a,null,null,null,null]);expect(resizeGrid(g,4,4,'nearest').cells.slice(0,4)).toEqual([a,a,b,b]);});
  it('fill is four-connected and does not leak diagonally',()=>{expect(flood(grid(2,2,[a,b,b,a]),0,b).cells).toEqual([b,b,b,a]);});
  it('overlapping move reads from original; rotate bounds reject before changes',()=>{const g=grid(3,2,[a,b,null,null,null,null]);expect(transformRegion(g,{x:0,y:0,width:2,height:1},'move',1,0,false).cells.slice(0,3)).toEqual([null,a,b]);expect(()=>transformRegion(g,{x:2,y:0,width:1,height:2},'rotate')).toThrow();expect(g.cells[0]).toBe(a);});
  it('rare color merge clears changed progress',()=>{const g=grid(3,1,[a,a,b]);g.done[2]=true;const n=mergeRare(g,defaultPalette.beads,1);expect(n.cells).toEqual([a,a,a]);expect(n.done[2]).toBe(false);});
  it('diff undo restores pixels and progress, dimension undo restores shape',()=>{const g=grid(2,1,[a,b]);g.done[0]=true;const n=flood(g,0,b),change=gridChange(g,n)!;expect(applyChange(n,change,true)).toEqual(g);expect(applyChange(g,change,false)).toEqual(n);const resized=resizeGrid(g,3,2,'crop'),c=gridChange(g,resized)!;expect(applyChange(resized,c,true)).toEqual(g);});
  it('round-trips project and rejects unknown cell, wrong counts or versions',()=>{const p=sampleProject();expect(parseProject(JSON.stringify(p))).toEqual(p);const q=clone(p);q.grid.cells[0]='bad';expect(()=>parseProject(JSON.stringify(q))).toThrow();expect(()=>parseProject('{"format":"pinbean","version":99}')).toThrow();});
  it('supports distinct historical palette after kit switch',()=>{const p=sampleProject();p.snapshots.push({id:'v1',name:'original',date:p.updated,grid:clone(p.grid),palette:clone(p.palette),enabled:[...p.enabled]});p.palette=bucketPalette;p.enabled=bucketPalette.beads.filter(b=>b.autoMatch!==false).map(b=>b.id);const shared=p.palette.beads[0].id;p.grid.cells=p.grid.cells.map(c=>c?shared:null);expect(parseProject(JSON.stringify(p)).snapshots[0].palette.id).toBe(defaultPalette.id);});
  it('512 × 512 conversion and sparse history complete within reasonable time',()=>{const rgba=Array.from({length:512*512},(_,i)=>i%3?[176,53,60,255]:[0,0,0,0]).flat();const start=performance.now();const g=mapImage({width:512,height:512,rgba,name:'stress'},defaultPalette.beads.filter(b=>b.autoMatch!==false));expect(g.cells).toHaveLength(262144);expect(statistics(g).total).toBe(174762);const n=clone(g);n.cells[0]=a;expect(gridChange(g,n)?.patches).toHaveLength(1);expect(performance.now()-start).toBeLessThan(5000);});
});
