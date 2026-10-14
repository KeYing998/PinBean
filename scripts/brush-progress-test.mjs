import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.argv[2]||'http://127.0.0.1:5185/');
  await page.getByRole('button',{name:'使用小蘑菇示例',exact:true}).click();
  const read=async()=>{await page.getByRole('button',{name:'导出图纸',exact:true}).click();const download=page.waitForEvent('download');await page.getByRole('button',{name:'保存工程文件',exact:true}).click();return JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));};
  const initial=await read();
  await expect(page.getByText('制作进度',{exact:true})).toHaveCount(1);
  await expect(page.locator('.left-panel .progress-toggle')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'选择画笔豆色',exact:true})).toHaveCount(0);
  await expect(page.locator('.paint-palette button')).toHaveCount(initial.enabled.length);
  const bead=initial.palette.beads.find(b=>b.id===initial.enabled[4]);
  await page.getByRole('button',{name:`画笔颜色 ${bead.name}`,exact:true}).click();
  await expect(page.locator('.current-color')).toHaveAttribute('data-tooltip',new RegExp(bead.name));
  await expect(page.getByRole('button',{name:'画笔 B',exact:true})).toHaveClass('selected');
  await expect(page.getByRole('button',{name:`画笔颜色 ${bead.name}`,exact:true})).toHaveClass(/chosen/);
  const canvas=page.locator('.canvas-scroll canvas'),box=await canvas.boundingBox(),size=Number(await canvas.getAttribute('data-cell-size'));
  await page.mouse.click(box.x+36+size*.5,box.y+36+size*.5);
  if((await read()).grid.cells[0]!==bead.id)throw Error('Chosen brush did not paint');
  await page.getByRole('button',{name:'标记完成 P',exact:true}).click();
  const visibility=page.getByRole('checkbox',{name:'在图纸上显示完成标记',exact:true});await expect(visibility).toBeChecked();
  await page.mouse.click(box.x+36+size*.5,box.y+36+size*.5);
  await visibility.uncheck();if(!(await read()).grid.done[0])throw Error('Hiding progress cleared completion');
  await visibility.check();await expect(page.locator('.progress-card small')).toContainText('已完成 1 /');
  for(const width of [1440,1198,390]){await page.setViewportSize({width,height:900});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error(`Overflow at ${width}`);await expect(page.locator('.current-color')).toBeVisible();}
  if(errors.length)throw Error(errors.join('\n'));
  fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/brush-progress-mobile.png',fullPage:true});
  console.log('Passed: single progress, restored right palette, selection sync, actual painting, completion persistence, responsive layouts; no browser errors.');
}finally{await browser.close();}
