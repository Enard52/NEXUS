from pathlib import Path
import re
html = Path(r'c:\Users\ensar\Downloads\cihaz-ekle.html').read_text(encoding='utf-8', errors='ignore')
print('file length', len(html))
print('count cat buttons', html.count('class="cat"'))
print('count pane ids', html.count('class="pane"'))
print('nav buttons', len(re.findall(r'<button class="cat"[^>]*>.*?</button>', html, re.S)))
print('pane divs', len(re.findall(r'<div class="pane"[^>]*>', html)))
for i, m in enumerate(re.finditer(r'<button class="cat"[^>]*>(.*?)</button>', html, re.S), 1):
    content = m.group(1).replace('\n',' ').strip()
    print('button', i, content[:120])
    if i >= 20: break

for i, m in enumerate(re.finditer(r'<div class="pane"[^>]*>(.*?)</div>', html, re.S), 1):
    print('pane', i, m.group(0)[:120])
    if i >= 20: break
