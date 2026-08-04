from pathlib import Path
import re
html = Path(r'c:\Users\ensar\Downloads\cihaz-ekle.html').read_text(encoding='utf-8', errors='ignore')
labels = re.findall(r'<button[^>]*data-target="([^"]+)"[^>]*>([^<]+)</button>', html)
print('nav labels', len(labels))
for k,v in labels:
    print(k, '|', v)

# count panes
panes = re.findall(r'<div class="pane" id="([^"]+)">(.*?)</div>\s*</main>', html, re.S)
print('pane count', len(panes))
for pid, content in panes[:14]:
    head = re.search(r'<h3[^>]*>([^<]+)</h3>', content)
    print('pane', pid, 'first heading', head.group(1) if head else 'NONE')
