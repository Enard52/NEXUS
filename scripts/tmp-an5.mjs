// Head + CSS content-strings + tail structure of the premium desktop page.
import { readFileSync } from "node:fs";

const s = readFileSync("public/desktop-home.html", "utf8");
console.log("chars:", s.length);
console.log("=== HEAD (to first @font-face) ===");
console.log(s.slice(0, s.indexOf("@font-face")));
console.log("=== CSS content strings ===");
const css = s.slice(s.indexOf("<style>"), s.indexOf("</style>"));
for (const m of css.matchAll(/content:\s*["']([^"']{2,})["']/g)) console.log(JSON.stringify(m[1]));
console.log("=== BODY TAG ===");
const b = s.indexOf("<body");
console.log(s.slice(b, b + 160));
console.log("=== TAIL after </script> ===");
const e = s.indexOf("</script>", 500000);
console.log(JSON.stringify(s.slice(e, e + 120)));
