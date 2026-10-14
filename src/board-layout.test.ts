import {describe,it,expect} from 'vitest';
import {boardExtent,fitCellSize} from './board-layout';
describe('board preview extents and fitting',()=>{
  it('shows complete 4 × 3 boards for a 116 × 75 chart',()=>expect(boardExtent({width:116,height:75},{width:29,height:29},true)).toEqual({width:116,height:87}));
  it('does not expand chart data when board view is off',()=>expect(boardExtent({width:116,height:75},{width:29,height:29},false)).toEqual({width:116,height:75}));
  it('fits both full extents using actual viewport',()=>{const size=fitCellSize(116,87,670,510);expect(116*size+72).toBeLessThanOrEqual(670);expect(87*size+72).toBeLessThanOrEqual(510);});
  it('fits a large chart on a narrow screen',()=>{const size=fitCellSize(512,512,320,430);expect(512*size+72).toBeLessThanOrEqual(320);});
});
