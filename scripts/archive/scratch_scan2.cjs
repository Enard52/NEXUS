const fs = require("fs");

const file = "c:/Users/ensar/Desktop/NEXUS-main/stitch-scan.html";
let content = fs.readFileSync(file, "utf8");

const hintRegex =
  /<a class="mx-auto flex items-center gap-1 text-white\/70 font-medium" href="stitch-integrations\.html">[\s\S]*?QR kod bulunamadı, manuel ekleyin[\s\S]*?<\/a>/;

const newHint = `<a class="mx-auto flex items-center justify-center gap-2 bg-[#7C5CFF]/20 text-[#7C5CFF] hover:bg-[#7C5CFF]/30 transition-colors font-semibold px-6 py-3 rounded-xl w-full max-w-[280px] border border-[#7C5CFF]/30" href="stitch-integrations.html">
    Manuel Cihaz Ekle
    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
</a>`;

if (hintRegex.test(content)) {
  content = content.replace(hintRegex, newHint);
  fs.writeFileSync(file, content);
  console.log("Replaced hint successfully");
} else {
  console.log("Hint target not found");
}
