from pathlib import Path
import json
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
missing_image_names = set()
missing_items = []
no_image_items = []
for c in cat:
    for g in c['groups']:
        for item in g['items']:
            if 'img' not in item:
                no_image_items.append((c['label'], g['title'], item['n']))
                image = '(none)'
            else:
                image = item['img']
                if image not in assets:
                    missing_image_names.add(image)
                    missing_items.append((image, c['label'], g['title'], item['n']))
print('no image count', len(no_image_items))
if no_image_items:
    for row in no_image_items[:20]:
        print('NO IMG', row)
print('missing image names', len(missing_image_names))
for name in sorted(missing_image_names):
    print(name)
print('missing items', len(missing_items))
for row in missing_items[:20]:
    print('ITEM', row)
