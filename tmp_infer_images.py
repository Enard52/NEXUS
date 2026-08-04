from pathlib import Path
import re
html = Path('www/stitch-integrations.html').read_text(encoding='utf-8', errors='ignore')
start = html.find('function inferCatalogImage(item, groupTitle)')
end = html.find('function onCatalogImageError', start)
func = html[start:end]
images = sorted(set(re.findall(r"return '([^']+)'", func)))
print('total return names', len(images))
for name in images:
    print(name)
