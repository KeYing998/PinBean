import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.argv[2]||'http://127.0.0.1:5183/');await page.getByRole('button',{name:'使用小蘑菇示例',exact:true}).click();
const read=async()=>{const event=page.waitForEvent('download');await page.getByRole('button',{name:'导出图纸',exact:true}).click();await page.getByRole('button',{name:'保存工程文件',exact:true}).click();return JSON.parse(fs.readFileSync(await(await event).path(),'utf8'));};
for(const [id,brand,count] of [['artkal-s-5mm','Artkal',173],['hama-midi-5mm','Hama',88]]){
await page.getByLabel('实体套装').selectOption(id);await page.getByRole('button',{name:'应用修改',exact:true}).click();let p=await read();if(p.palette.beads.length!==count||p.palette.beads.some(b=>b.brand!==brand)||p.grid.cells.some(c=>c&&!p.palette.beads.some(b=>b.id===c)))throw Error('brand mismatch');
await page.getByRole('button',{name:'管理色盘',exact:true}).click();await expect(page.getByText('色盘详情与来源',{exact:true})).toHaveCount(0);await expect(page.getByRole('dialog').locator('a')).toHaveCount(0);await page.getByRole('button',{name:'关闭',exact:true}).click();
await page.getByRole('button',{name:'撤销',exact:true}).click();await page.getByRole('button',{name:'重做',exact:true}).click();
const got=page.waitForEvent('download');await page.getByRole('button',{name:'导出图纸',exact:true}).click();await page.getByRole('button',{name:'保存工程文件',exact:true}).click();const file=await got;await file.saveAs(`test-results/${brand}.pinbean.json`);await page.locator('input[type=file]').nth(1).setInputFiles(`test-results/${brand}.pinbean.json`);p=await read();if(p.palette.id!==id||p.palette.compatibility!==`${brand.toLowerCase()}-${brand==='Artkal'?'s':'midi'}-5mm`)throw Error('import lost trusted registry identity');
await page.getByText('已自动保存到本机').waitFor();await page.reload();await page.getByRole('button',{name:'继续编辑',exact:true}).click();await expect(page.getByLabel('实体套装')).toHaveValue(id);
await page.getByRole('button',{name:'导出图纸',exact:true}).click();const pdf=page.waitForEvent('download');await page.getByRole('button',{name:'下载 PDF',exact:true}).click();await(await pdf).saveAs(`test-results/${brand}.pdf`);
}
if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({status:'passed',brands:['Artkal S 173','Hama Midi 88'],checks:['switch','valid member matching','source UI absent','undo redo','project import','reload','PDF download'],errors}));
}finally{await browser.close();}
