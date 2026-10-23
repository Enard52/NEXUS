from pathlib import Path
import json, re

p = Path('www/stitch-integrations.html')
text = p.read_text(encoding='utf-8', errors='ignore')
start = text.find('var CATALOG = [')
if start < 0:
    raise SystemExit('CATALOG not found')
idx = text.find('[', start)
count = 0
end = None
for i, ch in enumerate(text[idx:], start=idx):
    if ch == '[':
        count += 1
    elif ch == ']':
        count -= 1
        if count == 0:
            end = i
            break
if end is None:
    raise SystemExit('CATALOG end not found')
cat_text = text[idx:end+1]
# remove trailing commas before closing objects/arrays
cat_text = re.sub(r',\s*(?=[}\]])', '', cat_text)
# ensure valid JSON by replacing smart dash? not necessary
catalog = json.loads(cat_text)
print('CATALOG len', len(catalog))
for c in catalog[:5]:
    print(c['key'], c['label'], len(c['groups']), sum(len(g['items']) for g in c['groups']))

source = Path(r'c:/Users/ensar/Downloads/cihaz-ekle.html').read_text(encoding='utf-8', errors='ignore')
nav = re.findall(r'<button class="cat" data-target="([^\"]+)">([^<]+)', source)
panes = re.findall(r'<div class="pane" id="([^\"]+)">(.*?)</div>\s*(?=<div class="pane"|</main>)', source, re.S)
print('source nav', len(nav), 'source panes', len(panes))
proj_by_label = {re.sub(r'[^a-z0-9]','', c['label'].lower()): c for c in catalog}
for pid,label in nav:
    label_clean = label.replace('<br>',' ').strip()
    n = re.sub(r'[^a-z0-9]','', label_clean.lower())
    match = proj_by_label.get(n)
    if match is None:
        match = next((c for k,c in proj_by_label.items() if k.startswith(n) or n.startswith(k)), None)
    print('SRC CAT', label_clean, 'match', match['label'] if match else None)
    pane_html = next((html for p, html in panes if p==pid), None)
    if pane_html is None:
        continue
    src_items = [it.strip() for it in re.findall(r'<div class="card">.*?<div class="name">([^<]+)</div>', pane_html, re.S)]
    proj_items = [item['n'] for g in match['groups'] for item in g['items']]
    missing = [it for it in src_items if it not in proj_items]
    print(' missing', len(missing))
    if missing:
        print('  ', missing)
