import {describe,it,expect} from 'vitest';
import {suggestedImageSize,validateImportDimensions} from './image-import';
describe('image import dimensions',()=>{
  it('fits a camera-sized image inside a usable grid without changing ratio',()=>{expect(suggestedImageSize(960,720)).toEqual({width:116,height:87});expect(suggestedImageSize(720,960)).toEqual({width:87,height:116});});
  it('does not enlarge small pixel art',()=>expect(suggestedImageSize(32,24)).toEqual({width:32,height:24}));
  it('handles extreme aspect ratios and max grid dimensions',()=>{expect(suggestedImageSize(10000,1,512)).toEqual({width:512,height:1});expect(()=>validateImportDimensions(512,512)).not.toThrow();});
  it.each([[0,1],[513,1],[1,NaN],[1.5,2]])('rejects invalid %i × %i',(w,h)=>expect(()=>validateImportDimensions(w,h)).toThrow());
});
