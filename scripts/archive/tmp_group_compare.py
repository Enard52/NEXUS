from pathlib import Path
import re, json
html_proj = Path('www/stitch-integrations.html').read_text(encoding='utf-8', errors='ignore')
start=html_proj.find('var CATALOG = [')
start=html_proj.find('[', start)
brace=0
end=None
for i in range(start, len(html_proj)):
    c=html_proj[i]
    if c=='[': brace+=1
    elif c==']': brace-=1
    if brace==0:
        end=i+1
        break
proj=json.loads(html_proj[start:end])
proj_groups=set()
proj_map={}
for c in proj:
    for g in c['groups']:
        proj_groups.add((c['label'], g['title']))
        proj_map.setdefault((c['label'], g['title']), []).extend(item['n'] for item in g['items'])
source_raw = Path(r'c:\Users\ensar\Downloads\cihaz-ekle.html').read_text(encoding='utf-8', errors='ignore')
source_groups=[]
for m in re.finditer(r'<div class="pane" id="([^"]+)">(.*?)</div>', source_raw, re.S):
    pane_id=m.group(1)
    content=m.group(2)
    for gm in re.finditer(r'<section class="group">(.*?)</section>', content, re.S):
        sec=gm.group(1)
        title_match=re.search(r'<h3[^>]*>([^<]+)</h3>', sec)
        title=title_match.group(1).strip() if title_match else None
        items=[it.group(1).strip() for it in re.finditer(r'<div class="card">.*?<div class="name">([^<]+)</div>', sec, re.S)]
        source_groups.append((pane_id, title, items))
source_groups_set=set((pane,title) for pane,title,_ in source_groups)
print('proj groups', len(proj_groups))
print('source groups', len(source_groups_set))
missing_source_groups = source_groups_set - proj_groups
missing_proj_groups = proj_groups - source_groups_set
print('missing source groups', len(missing_source_groups))
for pane,title in sorted(missing_source_groups)[:40]:
    print('src missing group', pane, title)
print('missing proj groups', len(missing_proj_groups))
for pane,title in sorted(missing_proj_groups)[:40]:
    print('proj missing group', pane, title)

# group match counts by title only
proj_titles=set(title for _,title in proj_groups)
source_titles=set(title for _,title in source_groups_set)
print('proj unique titles', len(proj_titles), 'source unique titles', len(source_titles))
print('titles missing source', sorted(source_titles - proj_titles)[:40])
print('titles missing proj', sorted(proj_titles - source_titles)[:40])
