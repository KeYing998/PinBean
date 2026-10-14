from pathlib import Path
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw
import subprocess, json, os, shutil
root=Path(__file__).resolve().parents[1]
poppler=os.environ.get('PDFTOPPM') or shutil.which('pdftoppm')
if not poppler:
    raise SystemExit('Install Poppler and add pdftoppm to PATH, or set PDFTOPPM to its executable path.')
results=[]
for name,expected in [('export',2),('multipage',5),('selftest',5)]:
    path=root/'test-results'/f'{name}.pdf'
    doc=PdfReader(path)
    assert len(doc.pages)==expected, (name,len(doc.pages))
    expected_size=(279.4,215.9) if name=='selftest' else (210,297)
    for page in doc.pages:
        assert abs(float(page.mediabox.width)*25.4/72-expected_size[0])<0.01
        assert abs(float(page.mediabox.height)*25.4/72-expected_size[1])<0.01
        assert len(page.images)>=1
    subprocess.run([str(poppler),'-r','100','-png',str(path),str(root/'test-results'/f'{name}-page')],check=True)
    images=[]
    for file in sorted((root/'test-results').glob(f'{name}-page-*.png')):
        im=Image.open(file).convert('RGB');im.thumbnail((420,595));images.append(im)
    sheet=Image.new('RGB',(420*3,625*((len(images)+2)//3)), '#e7e7e2')
    draw=ImageDraw.Draw(sheet)
    for i,im in enumerate(images):
        x=(i%3)*420;y=(i//3)*625;sheet.paste(im,(x,y+25));draw.text((x+12,y+8),f'{name} / page {i+1}',fill='#283d30')
    sheet.save(root/'test-results'/f'{name}-contact.png')
    results.append({'file':name,'pages':len(doc.pages),'paper_mm':list(expected_size)})
print(json.dumps(results))
