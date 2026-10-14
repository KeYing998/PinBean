import {describe,it,expect} from 'vitest';
import {artkalPalette,hamaPalette,builtInPalettes} from './palettes';
import {validatePalette} from './model';
import {mapImage} from './color';
describe('additional brand palettes',()=>{
  it('validates all built-in catalogs and globally unique bead IDs across brands',()=>{builtInPalettes.forEach(validatePalette);const beads=builtInPalettes.filter(p=>!p.id.startsWith('perler')).flatMap(p=>p.beads);expect(new Set(beads.map(b=>b.id)).size).toBe(beads.length);});
  it('uses official Artkal RGB and excludes unreported metallic RGB',()=>{expect(artkalPalette.beads).toHaveLength(173);expect(artkalPalette.beads.find(b=>b.code==='S01')?.hex).toBe('#FFFFFF');expect(artkalPalette.beads.find(b=>b.code==='S13')?.hex).toBe('#000000');expect(artkalPalette.beads.some(b=>['S41','S42','S63'].includes(b.code))).toBe(false);});
  it('includes Hama opaque candidates, excludes retired codes and disables special effects',()=>{expect(hamaPalette.beads).toHaveLength(88);expect(hamaPalette.beads.filter(b=>b.autoMatch!==false)).toHaveLength(65);expect(hamaPalette.beads.find(b=>b.code==='H13')?.autoMatch).toBe(false);expect(hamaPalette.beads.some(b=>['H25','H39','H40','H41'].includes(b.code))).toBe(false);});
  it.each([artkalPalette,hamaPalette])('matches solely to %s members',p=>{const g=mapImage({width:2,height:1,name:'check',rgba:[255,255,255,255,0,0,0,0]},p.beads.filter(b=>b.autoMatch!==false));expect(p.beads.some(b=>b.id===g.cells[0])).toBe(true);expect(g.cells[1]).toBe(null);});
});
