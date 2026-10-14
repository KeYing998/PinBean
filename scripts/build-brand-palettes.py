import csv,json,re
from pathlib import Path
from pypdf import PdfReader
root=Path(__file__).resolve().parents[1]
def rows(name):
    with (root/'data-sources'/name).open(encoding='utf-8-sig') as f:
        return list(csv.DictReader(f,fieldnames=['code','name','r','g','b','contributor']))
def bead(brand,series,code,name,rgb,auto=True):
    assert len(rgb)==3 and all(0<=n<=255 for n in rgb)
    return {'id':f'{brand.lower()}:{series.lower()}:5mm:{code}','code':code,'name':name,'hex':'#'+''.join(f'{n:02X}' for n in rgb),'brand':brand,'series':series,'size':'5mm',**({'autoMatch':False} if not auto else {})}
artkal_rows={r['code']:r for r in rows('artkal_s.csv')}
pdf=PdfReader(root/'data-sources/artkal-s-rgb.pdf')
text='\n'.join(p.extract_text() for p in pdf.pages[:2])
matches=re.findall(r'\b(S(?:E)?\d{2,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\b',text)
assert len(matches)==173 and len({m[0] for m in matches})==173
artkal=[]
for code,*rgb in matches:
    artkal.append(bead('Artkal','S',code,artkal_rows.get(code,{}).get('name',code),list(map(int,rgb))))
artkal.sort(key=lambda b:(b['code'].startswith('SE'),int(re.search(r'\d+',b['code'])[0])))
sources=[{'title':'Artkal S 官方系列与尺寸','url':'https://www.artkalfusebeads.com/pages/s-color-chart'},{'title':'Artkal 官方 RGB 色表 2024','url':'https://cdn.shopify.com/s/files/1/1323/8195/files/S_MIDI_Beads_RGB_Color_Chart_2024.pdf?v=1744686607'},{'title':'BeadColors 名称参考（MIT）','url':'https://github.com/maxcleme/beadcolors/blob/master/raw/artkal_s.csv'}]
palettes=[('artkal-s.json',{'id':'artkal-s-5mm','name':f'Artkal S · 5mm · {len(artkal)} 色','version':'2026-10-15','verified':False,'compatibility':'artkal-s-5mm','sources':sources,'note':'系列参考色盘，不是单一售卖套装。收录官方 2024 RGB 表的 173 个明确 RGB 色号。官方系列总数较此更多；未公布 RGB、金属效果等不推测补齐。名称参考 MIT BeadColors。','beads':artkal})]
hama=[]
for r in rows('hama.csv'):
    # Retired numbers documented by Hama's own timeline: H25, H39–H41 (H23 absent in dataset).
    if r['code'] in {'H23','H25','H39','H40','H41'}:continue
    auto=not re.search(r'transparent|translucent|clear|neon|fluorescent|glow|gold|silver|bronze|pearl',r['name'],re.I)
    hama.append(bead('Hama','Midi',r['code'],r['name'],[int(r[k]) for k in ['r','g','b']],auto))
hama.sort(key=lambda b:int(b['code'][1:]))
assert len(hama)==88
palettes.append(('hama-midi.json',{'id':'hama-midi-5mm','name':f'Hama Midi · 5mm · {len(hama)} 色','version':'2026-10-15','verified':False,'compatibility':'hama-midi-5mm','sources':[{'title':'Hama 官方 Midi 色号表','url':'https://www.hama.dk/media/104516/nuancier-midiplusmini.pdf'},{'title':'Hama 官方色号历史','url':'https://www.hama.dk/media/102804/timeline-fr.pdf'},{'title':'BeadColors RGB 与名称（MIT）','url':'https://github.com/maxcleme/beadcolors/blob/master/raw/hama.csv'}],'note':'Midi 5mm 系列参考色盘，不是单一套装或完整最新目录。RGB 来源于 MIT BeadColors 社区数据，排除已停用 H25/H39/H40/H41。透明、霓虹、荧光、夜光和金属效果色仅供手动选择，默认不参与自动匹配。','beads':hama}))
for filename,p in palettes:
    (root/'src/data'/filename).write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(p['name'],sum(b.get('autoMatch',True) for b in p['beads']))
