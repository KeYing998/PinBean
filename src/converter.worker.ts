import { mapImage, remapGrid } from './color';
self.onmessage = (event) => {
  const {id,source,beads,limit,background,alphaThreshold,grid,old}=event.data;
  try{const result=source?mapImage(source,beads,limit,background,alphaThreshold,n=>self.postMessage({id,progress:n})):remapGrid(grid,old,beads,limit);self.postMessage({id,result});}catch(e){self.postMessage({id,error:e instanceof Error?e.message:'转换失败'});}
};
