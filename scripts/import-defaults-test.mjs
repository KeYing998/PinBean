import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.argv[2]||'http://127.0.0.1:5186/');
  await page.getByRole('button',{name:'使用小蘑菇示例',exact:true}).click();
  const read=async()=>{await page.getByRole('button',{name:'导出图纸',exact:true}).click();const event=page.waitForEvent('download');await page.getByRole('button',{name:'保存工程文件',exact:true}).click();return JSON.parse(fs.readFileSync(await(await event).path(),'utf8'));};
  const original=await read();
  const image=async(width,height)=>Buffer.from(await page.evaluate(({width,height,colors})=>{const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');for(let x=0;x<width;x++){ctx.fillStyle=colors[x%colors.length];ctx.fillRect(x,0,1,height);}return c.toDataURL().split(',')[1];},{width,height,colors:original.palette.beads.filter(b=>original.enabled.includes(b.id)).slice(0,12).map(b=>b.hex)}),'base64');
  const small={name:'twelve-colors.png',mimeType:'image/png',buffer:await image(12,8)};
  const large={name:'large-colors.png',mimeType:'image/png',buffer:await image(600,12)};
  const limit=page.getByLabel('最多使用颜色',{exact:true});
  await limit.selectOption('8');
  await page.getByRole('button',{name:'应用配色',exact:true}).click();await page.getByRole('button',{name:'应用修改',exact:true}).click();
  const old=await read();if(old.conversion.limit!==8)throw Error('Original setting not saved');
  await page.getByRole('button',{name:'首页',exact:true}).click();await page.reload();
  await page.getByRole('button',{name:'继续编辑',exact:true}).click();await expect(limit).toHaveValue('8');
  await page.getByRole('button',{name:'首页',exact:true}).click();
  const upload=async file=>{await page.locator('input[type=file]').nth(0).setInputFiles(file);await expect(page.getByRole('button',{name:'进入工作区',exact:true})).toBeVisible();};
  await upload(small);await page.getByRole('button',{name:'取消导入',exact:true}).click();
  await page.getByRole('button',{name:'继续编辑',exact:true}).click();await expect(limit).toHaveValue('8');if((await read()).id!==old.id)throw Error('Cancel replaced old project');
  await page.getByRole('button',{name:'首页',exact:true}).click();await upload(small);
  await expect(page.getByRole('dialog').locator('.compare>div').nth(1)).toContainText('12 色');
  await page.getByRole('button',{name:'进入工作区',exact:true}).click();await expect(limit).toHaveValue('0');
  const fresh=await read();if(fresh.conversion.limit!==0||new Set(fresh.grid.cells.filter(Boolean)).size!==12)throw Error('New import inherited color limit');
  if(fresh.id===old.id)throw Error('New import overwrote old project');
  await limit.selectOption('8');
  await page.locator('input[type=file]').nth(0).setInputFiles(large);
  await page.getByLabel('导入列数',{exact:true}).fill('300');await page.getByRole('button',{name:'生成图纸',exact:true}).click();await page.getByRole('button',{name:'进入工作区',exact:true}).click();await expect(limit).toHaveValue('0');if((await read()).conversion.limit!==0)throw Error('Large image inherited color limit');
  // Applying settings to the current image should still respect the selected limit.
  await limit.selectOption('8');await page.getByRole('button',{name:'应用配色',exact:true}).click();await page.getByRole('button',{name:'应用修改',exact:true}).click();
  const modified=await read();if(modified.conversion.limit!==8||new Set(modified.grid.cells.filter(Boolean)).size>8)throw Error('Existing project ignores selected limit');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('Passed: persisted project settings, new import resets before conversion, 12-color preview and result, cancel preserves old settings, large import resets, current-image recoloring still respects limit.');
}finally{await browser.close();}
