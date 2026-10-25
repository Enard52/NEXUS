const fs = require("fs");

const file = "c:/Users/ensar/Desktop/NEXUS-main/stitch-integrations.html";
let content = fs.readFileSync(file, "utf8");

// 1. Rewrite the CSS for category buttons
const oldCssRegex =
  /\/\* Modern Category Button States \*\/[\s\S]*?html\.dark \.cat-inactive \.cat-text \{\s*color: #94a3b8;\s*\}/;
const newCss = `/* Text Only Category Button States */
    .cat-btn {
      position: relative;
      border-left-width: 4px;
      border-left-color: transparent;
      transition: all 0.2s ease;
    }
    .cat-active {
      background-color: rgba(124, 92, 255, 0.08);
      border-left-color: #7C5CFF;
    }
    .cat-active .cat-text {
      color: #7C5CFF;
      font-weight: 800;
    }
    .cat-inactive .cat-text {
      color: #64748b;
      font-weight: 600;
    }
    html.dark .cat-inactive .cat-text {
      color: #94a3b8;
    }`;

content = content.replace(oldCssRegex, newCss);

// 2. Rewrite the buttons
// We will match the entire block from <aside ... id="sidebar-categories"> to </aside>
const asideStart = content.indexOf(
  '<aside class="w-[22%] bg-slate-50 border-r border-slate-100 overflow-y-auto flex flex-col pb-10 shadow-[inset_-2px_0_10px_rgba(0,0,0,0.02)]" id="sidebar-categories">',
);
const asideEnd = content.indexOf("</aside>", asideStart) + "</aside>".length;

const oldAside = content.substring(asideStart, asideEnd);

const cats = [
  { id: "all", label: "Tümü", active: true },
  { id: "lighting", label: "Aydınlatma", active: false },
  { id: "plugs", label: "Prizler", active: false },
  { id: "security", label: "Güvenlik", active: false },
  { id: "climate", label: "İklim", active: false },
  { id: "sensors", label: "Sensörler", active: false },
  { id: "entertainment", label: "Eğlence", active: false },
  { id: "appliances", label: "Beyaz Eşya", active: false },
];

let newAside = `<aside class="w-[22%] bg-slate-50 border-r border-slate-100 overflow-y-auto flex flex-col pb-10 shadow-[inset_-2px_0_10px_rgba(0,0,0,0.02)] pt-2" id="sidebar-categories">\n`;

for (const cat of cats) {
  const activeCls = cat.active ? "cat-active" : "cat-inactive";
  newAside += `      <button onclick="filterCategory('${cat.id}', this)" class="cat-btn ${activeCls} w-full text-left py-4 px-3 border-b border-slate-100/50">
        <span class="cat-text text-[11px] uppercase tracking-wider block break-words">${cat.label}</span>
      </button>\n`;
}

newAside += `    </aside>`;

content = content.replace(oldAside, newAside);

fs.writeFileSync(file, content);
console.log("Categories updated to text only");
