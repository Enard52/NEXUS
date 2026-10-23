from pathlib import Path
import re, json

def norm(s):
    return re.sub(r'\s+',' ', s.strip().lower())

proj_html = Path('www/stitch-integrations.html').read_text(encoding='utf-8', errors='ignore')
start = proj_html.find('var CATALOG = [')
start = proj_html.find('[', start)
brace = 0
end = None
for i in range(start, len(proj_html)):
    c = proj_html[i]
    if c == '[': brace += 1
    elif c == ']': brace -= 1
    if brace == 0:
        end = i + 1
        break
proj = json.loads(proj_html[start:end])
proj_names = set(norm(item['n']) for c in proj for g in c['groups'] for item in g['items'])
print('proj item count', len(proj_names))
source_html = Path(r'c:\Users\ensar\Downloads\cihaz-ekle.html').read_text(encoding='utf-8', errors='ignore')
source_items = re.findall(r'<div[^>]*class="name"[^>]*>([^<]+)</div>', source_html)
source_names = set(norm(x) for x in source_items)
print('source item count', len(source_items), 'unique', len(source_names))
missing = [x for x in sorted(source_names) if x not in proj_names]
extra = [x for x in sorted(proj_names) if x not in source_names]
print('missing source items in project', len(missing))
print(missing[:100])
print('extra project items not in source', len(extra))
print(extra[:100])
PY