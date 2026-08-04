from pathlib import Path
import re
source = Path(r'c:/Users/ensar/Downloads/cihaz-ekle.html').read_text(encoding='utf-8', errors='ignore')
nav = re.findall(r'<button class="cat" data-target="([^\"]+)">([^<]+)', source)
panes = re.findall(r'<div class="pane" id="([^\"]+)">(.*?)</div>\s*(?=<div class="pane"|</main>)', source, re.S)
for pid, label in nav:
    label_txt = label.replace('<br>', ' ').strip()
    pane_html = next((html for p, html in panes if p == pid), None)
    if not pane_html:
        continue
    print('CATEGORY', pid, label_txt)
    for gm in re.finditer(r'<section class="group"><h3>([^<]+)</h3><div class="grid">(.*?)</div></section>', pane_html, re.S):
        title = gm.group(1).strip()
        grid = gm.group(2)
        items = [item.strip() for item in re.findall(r'<div class="card">.*?<div class="name">([^<]+)</div>', grid, re.S)]
        print('  GROUP', title, len(items))
        for item in items:
            print('   -', item)
    print('')
