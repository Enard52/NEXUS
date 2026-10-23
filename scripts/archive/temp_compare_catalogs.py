from pathlib import Path
import re

project_path = Path('www/stitch-integrations.html')
source_path = Path(r'c:/Users/ensar/Downloads/cihaz-ekle.html')
project = project_path.read_text(encoding='utf-8', errors='ignore')
source = source_path.read_text(encoding='utf-8', errors='ignore')

proj_cats = re.findall(r'\{\s*"key":\s*"([^"]+)"\s*,\s*"label":\s*"([^"]+)"', project)
print('PROJECT', len(proj_cats))
for k,l in proj_cats:
    print(k, '->', l)

src_nav = re.findall(r'<button class="cat" data-target="([^"]+)">([^<]+)', source)
print('\nSOURCE NAV', len(src_nav))
for k,l in src_nav:
    print(k, '->', l.replace('<br>', ' '))

# parse project items
proj_items = {}
proj_group_items = {}
for cat_match in re.finditer(r'\{\s*"key":\s*"([^\"]+)"\s*,\s*"label":\s*"([^\"]+)"\s*,\s*"groups":\s*\[(.*?)\]\s*\}', project, re.S):
    key = cat_match.group(1)
    label = cat_match.group(2)
    groups_blob = cat_match.group(3)
    group_list = []
    for group_match in re.finditer(r'\{\s*"title":\s*"([^\"]+)"\s*,\s*"items":\s*\[(.*?)\]\s*\}', groups_blob, re.S):
        title = group_match.group(1)
        items_blob = group_match.group(2)
        items = [m.group(1) for m in re.finditer(r'\{\s*"n":\s*"([^\"]+)"', items_blob)]
        group_list.append((title, items))
    proj_items[label] = set(items for _, items in group_list if False)  # placeholder
    proj_group_items[label] = {title: [m.group(1) for m in re.finditer(r'\{\s*"n":\s*"([^\"]+)"', group_match.group(2))] for group_match in re.finditer(r'\{\s*"title":\s*"([^\"]+)"\s*,\s*"items":\s*\[(.*?)\]\s*\}', groups_blob, re.S)}

# parse source panes
src_panes = []
source_panes = re.findall(r'<div class="pane" id="([^\"]+)">(.*?)</div>\s*(?=<div class="pane"|</main>)', source, re.S)
for pid, pane_html in source_panes:
    groups = []
    for gm in re.finditer(r'<section class="group"><h3>([^<]+)</h3><div class="grid">(.*?)</div></section>', pane_html, re.S):
        title = gm.group(1).strip()
        items = [item.strip() for item in re.findall(r'<div class="card">.*?<div class="name">([^<]+)</div>', gm.group(2), re.S)]
        groups.append((title, items))
    src_panes.append((pid, groups))

print('\nSRC PANES', len(src_panes))
for pid, groups in src_panes[:5]:
    print(pid, len(groups), sum(len(items) for _, items in groups))


def normalize(s):
    return re.sub(r'[^a-z0-9]', '', s.lower().replace('ç','c').replace('ş','s').replace('ö','o').replace('ü','u').replace('ğ','g').replace('ı','i'))

proj_labels = {normalize(label): label for _, label in proj_cats}
for pid, raw_label in src_nav:
    label = raw_label.replace('<br>', ' ').strip()
    print('\nSOURCE CATEGORY', label, '->', pid)
    nlabel = normalize(label)
    match = proj_labels.get(nlabel)
    if not match:
        match = next((label for norm_label,label in proj_labels.items() if nlabel.startswith(norm_label) or norm_label.startswith(nlabel)), None)
    print('  project match:', match)
    if not match:
        continue
    proj_names = set(i for group in proj_group_items.get(match, {}).values() for i in group)
    src_names = set(i for _, items in next((groups for key, groups in src_panes if key == pid), []) for i in items)
    missing = sorted(src_names - proj_names)
    if missing:
        print('  missing items', len(missing))
        for item in missing:
            print('   -', item)
    else:
        print('  no missing items')
