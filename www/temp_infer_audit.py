from pathlib import Path
import re
text = Path('www/stitch-integrations.html').read_text(encoding='utf-8', errors='ignore')
start = text.index('function inferCatalogImage')
end = text.index('function onCatalogImageError', start)
fn = text[start:end]
rets = sorted(set(re.findall(r"return '([^']+)'", fn)))
assets = {p.name for p in Path('www/assets/products').glob('*') if p.is_file()}
print('infer returns', len(rets))
miss = []
for r in rets:
    ok = r in assets
    print(ok, r)
    if not ok:
        miss.append(r)
print('missing count', len(miss))
print('missing', miss)
