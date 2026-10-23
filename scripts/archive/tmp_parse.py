from pathlib import Path
import json, re

project_html = Path('www/stitch-integrations.html').read_text(encoding='utf-8', errors='ignore')
start = project_html.find('var CATALOG = [')
if start < 0:
    raise SystemExit('Catalog start not found')
start = project_html.find('[', start)
brace = 0
end = None
for i in range(start, len(project_html)):
    c = project_html[i]
    if c == '[':
        brace += 1
    elif c == ']':
        brace -= 1
    if brace == 0:
        end = i + 1
        break
if end is None:
    raise SystemExit('Catalog end not found')

cat = json.loads(project_html[start:end])
print('PROJECT categories:', len(cat))
for c in cat:
    total = sum(len(g['items']) for g in c['groups'])
    print(f"{c['key']} | {c['label']} | groups={len(c['groups'])} | items={total}")

source_path = Path(r'c:\Users\ensar\Downloads\cihaz-ekle.html')
if not source_path.exists():
    print('Source file missing:', source_path)
    raise SystemExit(1)
source_html = source_path.read_text(encoding='utf-8', errors='ignore')

# Get source categories from nav buttons
labels = re.findall(r'<button[^>]*data-target="([^"]+)"[^>]*>([^<]+)</button>', source_html)
print('SOURCE nav categories:', len(labels))
for key, label in labels:
    print(f'{key} | {label}')

# Extract sections and item names from source file
sections = []
for m in re.finditer(r'<section[^>]*class="group"[^>]*>(.*?)</section>', source_html, re.S):
    sec = m.group(1)
    title_match = re.search(r'<h3[^>]*>([^<]+)</h3>', sec)
    title = title_match.group(1).strip() if title_match else None
    items = [it.group(1).strip() for it in re.finditer(r'<div[^>]*class="card"[^>]*>.*?<div[^>]*class="name"[^>]*>([^<]+)</div>', sec, re.S)]
    sections.append((title, items))
print('SOURCE groups:', len(sections))
for title, items in sections:
    print(f'{title} | {len(items)}')

# Show group names and missing project items with same group title
project_items = {}
for c in cat:
    for g in c['groups']:
        project_items.setdefault(g['title'], set()).update(item['n'] for item in g['items'])

for title, items in sections:
    proj = project_items.get(title, set())
    missing = [it for it in items if it not in proj]
    if missing:
        print(f'MISSING in group {title}: {len(missing)}')
        print(missing)
