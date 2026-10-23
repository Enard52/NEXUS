from pathlib import Path
import re
project = Path('www/stitch-integrations.html').read_text(encoding='utf-8', errors='ignore')
imgs = sorted(set(re.findall(r'"img"\s*:\s*"([^\"]+)"', project)))
assets = {p.name for p in Path('www/assets/products').glob('*') if p.is_file()}
print('unique imgs', len(imgs))
missing = [img for img in imgs if img not in assets]
print('missing imgs', len(missing))
for img in missing:
    print('  ', img)
print('\nassets that match with hyphen replacements:')
for img in missing:
    cand = img.replace('_', '-')
    if cand in assets:
        print('  ', img, '->', cand)
PY