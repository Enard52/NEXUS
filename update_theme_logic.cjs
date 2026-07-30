const fs = require('fs');

let themeJs = fs.readFileSync('theme.js', 'utf8');

const newDarkCss = `
  var darkCss = [
    /* Base Body - handle custom gradients properly */
    'html.dark body { background-color: #0f172a !important; color: #e2e8f0 !important; }',
    'html.dark body.bg-dashboard-gradient, html.dark body.bg-gradient-custom { background: linear-gradient(180deg, #020617 0%, #0f172a 100%) !important; }',
    'html.dark body.bg-smart-gradient { background: linear-gradient(180deg, #022c22 0%, #064e3b 100%) !important; }',
    
    /* General Backgrounds */
    'html.dark .bg-white { background-color: #1e293b !important; border-color: rgba(255,255,255,0.05) !important; }',
    'html.dark [class*="bg-white/"] { background-color: rgba(30,41,59,0.85) !important; border-color: rgba(255,255,255,0.05) !important; }',
    'html.dark .bg-slate-50, html.dark .bg-slate-100, html.dark .bg-gray-50, html.dark .bg-gray-100 { background-color: #334155 !important; }',
    
    /* Specific Sheets / Modals with inline light gradients that break text visibility */
    'html.dark .qa-sheet, html.dark #quick-create-sheet, html.dark #code-modal-content { background: #1e293b !important; border: 1px solid rgba(255,255,255,0.1) !important; }',

    /* Text Colors */
    'html.dark .text-black, html.dark .text-slate-900, html.dark .text-slate-800, html.dark .text-gray-900, html.dark .text-gray-800 { color: #f8fafc !important; }',
    'html.dark .text-slate-700, html.dark .text-slate-600, html.dark .text-gray-700, html.dark .text-gray-600 { color: #cbd5e1 !important; }',
    'html.dark .text-slate-500, html.dark .text-slate-400, html.dark .text-gray-500, html.dark .text-gray-400 { color: #94a3b8 !important; }',

    /* Borders */
    'html.dark .border-slate-100, html.dark .border-slate-200, html.dark .border-gray-100, html.dark .border-gray-200, html.dark .border-nexus-border { border-color: #334155 !important; }',
    'html.dark .divide-slate-100 > *, html.dark .divide-gray-100 > * { border-color: #334155 !important; }',
    
    /* Form Elements */
    'html.dark input:not([type=checkbox]):not([type=radio]), html.dark textarea, html.dark select { background-color: #0f172a !important; color: #e2e8f0 !important; border-color: #334155 !important; }',
    
    /* Settings Switches in Dark Mode */
    'html.dark .switch .slider { background-color: #475569 !important; }',
    'html.dark input:checked + .slider { background-color: #7C5CFF !important; }',
    'html.dark .switch .slider:before { background-color: #cbd5e1 !important; }',
    
    /* Shadows */
    'html.dark .shadow-sm, html.dark .shadow, html.dark .shadow-md, html.dark .shadow-lg, html.dark .shadow-xl { box-shadow: 0 4px 16px rgba(0,0,0,0.6) !important; }',
    
    /* Bottom Navigation / Top Header Borders */
    'html.dark nav, html.dark header { border-color: rgba(255,255,255,0.05) !important; }',
    
    /* Active States */
    'html.dark .active\\\\:bg-gray-50:active, html.dark .active\\\\:bg-slate-50:active { background-color: #334155 !important; }'
  ].join('\\n');
`;

// Replace the old darkCss block
themeJs = themeJs.replace(/var darkCss = \[\s*[\s\S]*?\]\.join\('\\n'\);/, newDarkCss.trim());

fs.writeFileSync('theme.js', themeJs, 'utf8');
console.log('Updated theme.js to fix dark mode logic');
