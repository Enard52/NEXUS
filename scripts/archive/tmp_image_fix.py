from pathlib import Path
import json, re
html = Path('www/stitch-integrations.html').read_text(encoding='utf-8', errors='ignore')
start = html.find('var CATALOG = [')
start = html.find('[', start)
brace = 0
end = None
for i in range(start, len(html)):
    c = html[i]
    if c == '[':
        brace += 1
    elif c == ']':
        brace -= 1
    if brace == 0:
        end = i + 1
        break
cat = json.loads(html[start:end])
assets = {p.name for p in Path('www/assets/products').glob('*')}
missing_images = {}
for c in cat:
    for g in c['groups']:
        for item in g['items']:
            img = item.get('img')
            if img and img not in assets:
                missing_images.setdefault(img, []).append((c['label'], g['title'], item['n']))
for img, entries in sorted(missing_images.items()):
    print('IMAGE', img, 'missing in assets')
    for label, group, name in entries:
        print('   ', label, '|', group, '|', name)
    print()
print('Total unique missing image names:', len(missing_images))
