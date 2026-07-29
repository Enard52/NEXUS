// Yorum duvarındaki harfli SVG placeholder avatarları gerçek insan portreleriyle değiştirir.
// Portreler telifsiz randomuser.me setinden, isimlerin cinsiyetiyle uyumlu seçildi.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PEOPLE = [
  { name: "Sarah Jenkins", initials: "SJ", photo: "/images/avatars/sarah-jenkins.jpg" },
  { name: "David Chen", initials: "DC", photo: "/images/avatars/david-chen.jpg" },
  { name: "Emma Thompson", initials: "ET", photo: "/images/avatars/emma-thompson.jpg" },
  { name: "Mateo Alvarez", initials: "MA", photo: "/images/avatars/mateo-alvarez.jpg" },
  { name: "Aisha Rahman", initials: "AR", photo: "/images/avatars/aisha-rahman.jpg" },
  { name: "Noah Williams", initials: "NW", photo: "/images/avatars/noah-williams.jpg" },
  { name: "Sofia Martins", initials: "SM", photo: "/images/avatars/sofia-martins.jpg" },
  { name: "Kenji Sato", initials: "KS", photo: "/images/avatars/kenji-sato.jpg" },
  { name: "Olivia Brooks", initials: "OB", photo: "/images/avatars/olivia-brooks.jpg" },
  { name: "Lucas Meyer", initials: "LM", photo: "/images/avatars/lucas-meyer.jpg" },
];

const FILES = [
  "public/index.html",
  "public/light.html",
  "public/tr/index.html",
  "public/tr/light.html",
  "packages/web/dist/index.html",
  "packages/web/dist/light.html",
  "packages/web/dist/tr/index.html",
  "packages/web/dist/tr/light.html",
];

for (const rel of FILES) {
  const file = path.join(__dirname, "..", rel);
  let html = fs.readFileSync(file, "utf-8");
  let total = 0;

  for (const p of PEOPLE) {
    // 1) Yorum kartlarındaki portreler (alt="Portrait of X" ile eşleşir)
    const cardRe = new RegExp(
      'src="data:image/svg\\+xml;charset=utf-8,[^"]*" alt="Portrait of ' + p.name + '"',
      "g",
    );
    html = html.replace(cardRe, () => {
      total++;
      return 'src="' + p.photo + '" alt="Portrait of ' + p.name + '"';
    });

    // 2) Üstteki avatar yığını ve aria-hidden kopya setler (URI içindeki aria-label baş harfleriyle eşleşir, alt boş)
    const stackRe = new RegExp(
      '<img src="data:image/svg\\+xml;charset=utf-8,[^"]*aria-label%3D%22' + p.initials + '%22[^"]*" alt=""( loading="lazy" decoding="async")?>',
      "g",
    );
    html = html.replace(stackRe, () => {
      total++;
      return '<img src="' + p.photo + '" alt="" loading="lazy" decoding="async">';
    });
  }

  fs.writeFileSync(file, html, "utf-8");
  console.log(rel + ": " + total + " avatar degistirildi");
}

// Kontrol: yorum bölümünde harfli SVG kalmamalı
for (const rel of FILES) {
  const html = fs.readFileSync(path.join(__dirname, "..", rel), "utf-8");
  const leftovers = (html.match(/review-author-photo"><img src="data:image/g) || []).length;
  const stackLeft = /review-avatar-stack[\s\S]{0,3000}?<img src="data:image/.test(
    html.slice(html.indexOf("review-avatar-stack")),
  );
  console.log(rel + " kalan kart placeholder: " + leftovers + ", stack placeholder kaldi mi: " + stackLeft);
}
