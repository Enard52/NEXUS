from html.parser import HTMLParser
from pathlib import Path

class SourceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.panes = []
        self.current_pane = None
        self.current_group = None
        self.current_card = None
        self.current_name = None
        self.in_name = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.stack.append(tag)
        if tag == 'div' and attrs.get('class') == 'pane':
            self.current_pane = {'id': attrs.get('id'), 'groups': []}
        elif tag == 'section' and attrs.get('class') == 'group':
            self.current_group = {'title': None, 'items': []}
        elif tag == 'div' and attrs.get('class') == 'card':
            self.current_card = {'name': None}
        elif tag == 'div' and attrs.get('class') == 'name':
            self.in_name = True
            self.current_name = ''

    def handle_endtag(self, tag):
        if tag == 'div' and self.in_name and self.stack and self.stack[-1] == 'div':
            self.in_name = False
            if self.current_card is not None:
                self.current_card['name'] = self.current_name.strip()
        if tag == 'div' and self.current_card is not None and self.stack and self.stack[-1] == 'div':
            # end card may be after name or other children
            if self.current_card.get('name'):
                if self.current_group is not None:
                    self.current_group['items'].append(self.current_card['name'])
                self.current_card = None
        if tag == 'section' and self.current_group is not None:
            if self.current_group['title'] is not None and self.current_pane is not None:
                self.current_pane['groups'].append(self.current_group)
            self.current_group = None
        if tag == 'div' and self.current_pane is not None and self.stack and self.stack[-1] == 'div':
            # end pane if closing pane div
            if self.current_pane['id'] and self.current_group is None and self.current_card is None:
                self.panes.append(self.current_pane)
                self.current_pane = None
        if self.stack:
            self.stack.pop()

    def handle_data(self, data):
        if self.in_name:
            self.current_name += data
        elif self.current_group is not None and self.stack and self.stack[-1] == 'h3':
            if self.current_group['title'] is None:
                self.current_group['title'] = data.strip()

source_html = Path(r'c:\Users\ensar\Downloads\cihaz-ekle.html').read_text(encoding='utf-8', errors='ignore')
parser = SourceParser()
parser.feed(source_html)
for pane in parser.panes:
    print('pane', pane['id'], 'groups', len(pane['groups']))
    for g in pane['groups']:
        print('  group', g['title'], len(g['items']))
        for it in g['items'][:10]:
            print('    ', it)
    print()
print('total panes', len(parser.panes))
print('total groups', sum(len(p['groups']) for p in parser.panes))
print('total items', sum(len(g['items']) for p in parser.panes for g in p['groups']))
