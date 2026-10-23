from pathlib import Path
import re
assets = sorted(Path('www/assets/products').glob('*'))
asset_names = [p.name for p in assets]
print('asset count', len(asset_names))
for name in asset_names:
    print(name)

# find mapping from generic names to actual if possible
invalid = ['smart_hub.jpg','smart_appliance.jpg','camera.jpg','vacuum.jpg']
for name in invalid:
    candidates = [a for a in asset_names if a.replace('-', '_').lower() == name.replace('-', '_').lower()]
    print('invalid',name,'candidates',candidates)
print('---')
for name in sorted(set([n.replace('-', '_') for n in asset_names])):
    print(name)
