import { MAX_SIDE, type SourceImage } from './model';
export function suggestedImageSize(width:number,height:number,side=116){
  const scale=Math.min(1,side/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export function validateImportDimensions(width:number,height:number){
  if(![width,height].every(n=>Number.isInteger(n)&&n>=1&&n<=MAX_SIDE))throw Error('图纸行列数应为 1–512 的整数。');
}
export function pixelsFromBitmap(bitmap:ImageBitmap,name:string,width=bitmap.width,height=bitmap.height):SourceImage{
  validateImportDimensions(width,height);const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('无法读取图片，请重试。');ctx.imageSmoothingEnabled=false;ctx.drawImage(bitmap,0,0,width,height);
  return {width,height,rgba:Array.from(ctx.getImageData(0,0,width,height).data),name,originalWidth:bitmap.width,originalHeight:bitmap.height};
}
