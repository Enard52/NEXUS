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
proj_names = {norm(item['n']): item['n'] for c in proj for g in c['groups'] for item in g['items']}
source_html = Path(r'c:\Users\ensar\Downloads\cihaz-ekle.html').read_text(encoding='utf-8',errors='ignore')
missing=[]
for m in re.finditer(r'<div class="pane" id="([^"]+)">(.*?)</div>', source_html, re.S):
    pane_id=m.group(1)
    chtml=m.group(2)
    for gm in re.finditer(r'<section class="group">(.*?)</section>', chtml, re.S):
        sec=gm.group(1)
        title_match=re.search(r'<h3[^>]*>([^<]+)</h3>', sec)
        title=title_match.group(1).strip() if title_match else ''
        for item in re.findall(r'<div class="card">.*?<div class="name">([^<]+)</div>', sec, re.S):
            name = item.strip()
            n = norm(name)
            if n not in proj_names:
                missing.append((pane_id, title, name))
print('missing count', len(missing))
for row in missing:
    print(row)
PY