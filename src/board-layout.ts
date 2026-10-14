import type {Grid} from './model';
export function boardExtent(grid:Pick<Grid,'width'|'height'>,board:{width:number;height:number},visible:boolean){return visible?{width:Math.ceil(grid.width/board.width)*board.width,height:Math.ceil(grid.height/board.height)*board.height}:{width:grid.width,height:grid.height};}
export function fitCellSize(width:number,height:number,viewportWidth:number,viewportHeight:number){return Math.max(.25,Math.min(24,Math.floor(Math.min((viewportWidth-72)/width,(viewportHeight-72)/height)*100)/100));}
