from pathlib import Path
import re

project_path = Path('www/stitch-integrations.html')
source_path = Path(r'c:/Users/ensar/Downloads/cihaz-ekle.html')
asset_dir = Path('www/assets/products')
project = project_path.read_text(encoding='utf-8', errors='ignore')
source = source_path.read_text(encoding='utf-8', errors='ignore')

proj_cats = []
for cat_match in re.finditer(r'\{\s*"key"\s*:\s*"([^\"]+)"\s*,\s*"label"\s*:\s*"([^\"]+)"\s*,\s*"groups"\s*:\s*\[(.*?)\]\s*\}', project, re.S):
    key = cat_match.group(1)
    label = cat_match.group(2)
    groups_blob = cat_match.group(3)
    groups = []
    for g in re.finditer(r'\{\s*"title"\s*:\s*"([^\"]+)"\s*,\s*"items"\s*:\s*\[(.*?)\]\s*\}', groups_blob, re.S):
        title = g.group(1)
        items_blob = g.group(2)
        items = [m.group(1) for m in re.finditer(r'\{\s*"n"\s*:\s*"([^\"]+)"', items_blob)]
        groups.append((title, items))
    proj_cats.append((key, label, groups))

print('PROJECT CATEGORIES:', len(proj_cats))
for key, label, groups in proj_cats:
    print(' -', key, label, 'groups=', len(groups), 'items=', sum(len(items) for _, items in groups))

src_nav = re.findall(r'<button class="cat" data-target="([^\"]+)">([^<]+)', source)
source_panes = re.findall(r'<div class="pane" id="([^\"]+)">(.*?)</div>\s*(?=<div class="pane"|</main>)', source, re.S)
print('\nSOURCE NAV:', len(src_nav))
for pid, label in src_nav:
    print(' -', pid, '->', label.replace('<br>', ' '))
print('\nSOURCE PANES:', len(source_panes))
for pid, pane_html in source_panes[:5]:
    print(' -', pid, 'len=', len(re.findall(r'<section class="group">', pane_html)))

assets = {p.name for p in asset_dir.glob('*') if p.is_file()}
print('\nASSETS', len(assets))
print('has smart-hub.jpg?', 'smart-hub.jpg' in assets)
print('has smart-hub.png?', 'smart-hub.png' in assets)
print('assets sample', sorted([a for a in assets if a.startswith('smart_')])[:20])
print('generic sample', sorted([a for a in assets if a.startswith('generic_')])[:20])
print('control sample', sorted([a for a in assets if a.startswith('control_')])[:20])
print('security sample', sorted([a for a in assets if a.startswith('security_')])[:20])

trans = str.maketrans('çşığüöıÇŞİĞÜÖ', 'csiguoICSIGUO')
def normalize(text):
    t = text.translate(trans).lower()
    return re.sub(r'[^a-z0-9]', '', t)

proj_label_by_norm = {normalize(label): label for _, label, _ in proj_cats}
for pid, raw_label in src_nav:
    label = raw_label.replace('<br>', ' ').strip()
    norm_label = normalize(label)
    match = proj_label_by_norm.get(norm_label)
    if not match:
        match = next((proj_label for n, proj_label in proj_label_by_norm.items() if n.startswith(norm_label) or norm_label.startswith(n)), None)
    print('\nSRC CATEGORY:', label, '->', match)
    pane_html = next((pane_html for p, pane_html in source_panes if p == pid), None)
    if not pane_html:
        print('  no pane')
        continue
    src_items = set(re.findall(r'<div class="card">.*?<div class="name">([^<]+)</div>', pane_html, re.S))
    proj_items = set(item for _, _, groups in proj_cats for _, items in groups for item in items)
    missing = sorted(src_items - proj_items)
    print('  source items', len(src_items), 'proj items', len(proj_items), 'missing', len(missing))
    if missing:
        for item in missing[:50]:
            print('   -', item)
