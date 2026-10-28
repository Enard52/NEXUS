import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogs = JSON.parse(
  fs.readFileSync(path.join(__dirname, "translated-catalogs.json"), "utf-8"),
);

const langNames = {
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese (Brazil)",
  nl: "Dutch",
  pl: "Polish",
  cs: "Czech",
  ru: "Russian",
  uk: "Ukrainian",
  ar: "Arabic (RTL)",
  he: "Hebrew (RTL)",
  hi: "Hindi",
  ja: "Japanese",
  ko: "Korean",
  "zh-Hans": "Chinese Simplified",
  "zh-Hant": "Chinese Traditional",
  vi: "Vietnamese",
};

const langOrder = [
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "cs",
  "ru",
  "uk",
  "ar",
  "he",
  "hi",
  "ja",
  "ko",
  "zh-Hans",
  "zh-Hant",
  "vi",
];

let code = "";
for (const lang of langOrder) {
  const cat = catalogs[lang];
  if (!cat) {
    console.error(`Missing: ${lang}`);
    continue;
  }
  const key = lang.includes("-") ? `"${lang}"` : lang;
  code += `  // \u2500\u2500 ${langNames[lang]} \u2500\u2500\n`;
  code += `  ${key}: {\n`;
  const entries = Object.entries(cat);
  for (let i = 0; i < entries.length; i++) {
    const [k, v] = entries[i];
    code += `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`;
    code += i < entries.length - 1 ? ",\n" : "\n";
  }
  code += `  },\n`;
}

fs.writeFileSync(path.join(__dirname, "catalog-code.txt"), code, "utf-8");
console.log(`Generated ${code.split("\n").length} lines for ${langOrder.length} languages`);
