import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { content, brand, priceFor, APP_URL, CHECKOUT_URLS } from "./site-content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "www", "public");

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// ---------- Orijinal Marka ve Platform SVG Logoları ----------
const BRAND_LOGOS = {
  // Platformlar
  windows: `<svg viewBox="0 0 24 24" fill="#0078D4" class="brand-svg" aria-hidden="true"><rect x="1.5" y="1.5" width="9.8" height="9.8" rx="1.5"/><rect x="12.7" y="1.5" width="9.8" height="9.8" rx="1.5"/><rect x="1.5" y="12.7" width="9.8" height="9.8" rx="1.5"/><rect x="12.7" y="12.7" width="9.8" height="9.8" rx="1.5"/></svg>`,
  linux: `<svg viewBox="0 0 24 24" fill="#FCC624" class="brand-svg" aria-hidden="true"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139z"/></svg>`,
  android: `<svg viewBox="0 0 24 24" fill="#3DDC84" class="brand-svg" aria-hidden="true"><path d="M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z"/></svg>`,
  apple: `<svg viewBox="0 0 24 24" fill="currentColor" class="brand-svg" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>`,

  // Akıllı Ev Protokol ve Markaları
  shelly: `<svg viewBox="0 0 24 24" fill="#4495D1" class="brand-svg" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12a12 12 0 0 0 .033.88c1.07-.443 2.495-.679 4.322-.679h5.762c-.167.61-.548 1.087-1.142 1.436-.532.308-1.14.463-1.823.463h-.927c-.89 0-1.663.154-2.32.463-.859.403-1.286 1-1.286 1.789 0 .893.59 1.594 1.774 2.1a7.423 7.423 0 0 0 2.927.581c1.318 0 2.416-.29 3.297-.867 1.024-.664 1.535-1.616 1.535-2.857 0-.854-.325-2.08-.976-3.676-.65-1.597-.975-2.837-.975-3.723 0-2.79 2.305-4.233 6.916-4.324.641-.01 1.337-.005 1.916-.004.593 0 1.144.05 1.66.147A12 12 0 0 0 12 0zm4.758 5.691c-1.206 0-1.809.502-1.809 1.506 0 .514.356 1.665 1.067 3.451.71 1.787 1.064 3.186 1.064 4.198 0 2.166-1.202 3.791-3.607 4.875-1.794.797-3.892 1.197-6.297 1.197-1.268 0-2.442-.114-3.543-.316A12 12 0 0 0 12 24c6.627 0 12-5.373 12-12a12 12 0 0 0-.781-4.256 3.404 3.404 0 0 1-.832.77h-4.371l1.425-2.828a299.94 299.94 0 0 0-2.683.005Z"/></svg>`,
  tasmota: `<svg viewBox="0 0 24 24" fill="#1FA3EC" class="brand-svg" aria-hidden="true"><path d="M12 0L0 12l1.371 1.372L12 2.743l10.629 10.629L24 12 12 0zm0 8.463a7.41 7.41 0 0 0-2.64 14.334v-2.133a5.464 5.464 0 0 1 1.671-10.17V24h1.94V10.494a5.464 5.464 0 0 1 1.669 10.171v2.133A7.41 7.41 0 0 0 12 8.463z"/></svg>`,
  esphome: `<svg viewBox="0 0 24 24" fill="#18BCF2" class="brand-svg" aria-hidden="true"><path d="M11.999.311c-.384 0-.769.146-1.06.437l-9.878 9.88C.478 11.21 0 12.364 0 13.189v9c0 .825.675 1.5 1.5 1.5h5.899V8.755a.6.6 0 0 1 .6-.6h8a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5v1.2h5a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5v1.2h5a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5.6a.6.6 0 1 1 0-1.2h5v-1.2h-5a.6.6 0 0 1-.6-.6v-2.4a.6.6 0 0 1 .6-.6h5v-1.2h-5a.6.6 0 0 1-.6-.6v-2.4a.6.6 0 0 1 .6-.6h5v-1.2H8.6v14.334h13.9c.825 0 1.5-.675 1.5-1.5v-9c0-.825-.478-1.978-1.061-2.561l-9.88-9.88A1.5 1.5 0 0 0 12 .311"/></svg>`,
  philipshue: `<svg viewBox="0 0 24 24" fill="#0065D3" class="brand-svg" aria-hidden="true"><path d="M20.672 9.6c-2.043 0-3.505 1.386-3.682 3.416h-.664c-.247 0-.395.144-.395.384 0 .24.148.384.395.384h.661c.152 2.09 1.652 3.423 3.915 3.423.944 0 1.685-.144 2.332-.453.158-.075.337-.217.292-.471a.334.334 0 0 0-.15-.242c-.104-.065-.25-.072-.422-.02a7.93 7.93 0 0 0-.352.12c-.414.146-.771.273-1.599.273-1.75 0-2.908-1.023-2.952-2.605v-.025h5.444c.313 0 .492-.164.505-.463v-.058C23.994 9.865 21.452 9.6 20.672 9.6zm2.376 3.416h-5l.004-.035c.121-1.58 1.161-2.601 2.649-2.601 1.134 0 2.347.685 2.347 2.606zM9.542 10.221c0-.335-.195-.534-.52-.534s-.52.2-.52.534v2.795h1.04zm4.29 3.817c0 1.324-.948 2.361-2.16 2.361-1.433 0-2.13-.763-2.13-2.333v-.282h-1.04v.34c0 2.046.965 3.083 2.868 3.083 1.12 0 1.943-.486 2.443-1.445l.02-.036v.861c0 .334.193.534.519.534.325 0 .52-.2.52-.534v-2.803h-1.04zm.52-4.351c-.326 0-.52.2-.52.534v2.795h1.04v-2.795c0-.335-.195-.534-.52-.534zM3.645 9.6c-1.66 0-2.31 1.072-2.471 1.4l-.135.278V7.355c0-.347-.199-.562-.52-.562-.32 0-.519.215-.519.562v5.661h1.039v-.015c0-1.249.72-2.592 2.304-2.592 1.29 0 2.001.828 2.001 2.332v.275h1.04v-.246c0-2.044-.973-3.17-2.739-3.17zM0 16.558c0 .347.199.563.52.563.32 0 .519-.216.519-.563v-2.774H0zm5.344 0c0 .347.2.563.52.563s.52-.216.52-.563v-2.774h-1.04z"/></svg>`,
  homeassistant: `<svg viewBox="0 0 24 24" fill="#18BCF2" class="brand-svg" aria-hidden="true"><path d="M22.939 10.627 13.061.749a1.505 1.505 0 0 0-2.121 0l-9.879 9.878C.478 11.21 0 12.363 0 13.187v9c0 .826.675 1.5 1.5 1.5h9.227l-4.063-4.062a2.034 2.034 0 0 1-.664.113c-1.13 0-2.05-.92-2.05-2.05s.92-2.05 2.05-2.05 2.05.92 2.05 2.05c0 .233-.041.456-.113.665l3.163 3.163V9.928a2.05 2.05 0 0 1-1.15-1.84c0-1.13.92-2.05 2.05-2.05s2.05.92 2.05 2.05a2.05 2.05 0 0 1-1.15 1.84v8.127l3.146-3.146A2.051 2.051 0 0 1 18 12.239c1.13 0 2.05.92 2.05 2.05s-.92 2.05-2.05 2.05c-.25 0-.488-.047-.709-.13L12.9 20.602v3.088h9.6c.825 0 1.5-.675 1.5-1.5v-9c0-.825-.477-1.977-1.061-2.561z"/></svg>`,
  tplink: `<svg viewBox="0 0 24 24" fill="#4ACBD6" class="brand-svg" aria-hidden="true"><path d="M15.185 0C10.218 0 6.25 3.984 6.25 8.903V10.8h4.99V8.903c0-2.135 1.736-3.863 3.946-3.863 2.187 0 3.708 1.536 3.708 3.815 0 2.257-1.64 3.912-3.827 3.912h-1.878v5.039h1.878c4.874 0 8.819-4.007 8.819-8.952C23.885 3.72 20.2 0 15.185 0zM.115 12.6v4.103c0 .624.523 1.248 1.236 1.248h4.753v4.801c0 .624.523 1.248 1.236 1.248h4.065V12.6Z"/></svg>`,
  lifx: `<svg viewBox="0 0 24 24" fill="#E5007D" class="brand-svg" aria-hidden="true"><path d="M3.128 8.2a3.11 3.11 0 0 0-2.212.92A3.148 3.148 0 0 0 0 11.347a3.144 3.144 0 0 0 .916 2.226l.27.266.014-.014a2.729 2.729 0 0 1 1.932-.795 2.739 2.739 0 0 1 1.931.795l.015.014.266-.27a3.157 3.157 0 0 0 .916-2.226c0-.806-.305-1.612-.916-2.226A3.139 3.139 0 0 0 3.128 8.2zm0 .725a2.39 2.39 0 0 1 1.701.707 2.431 2.431 0 0 1 .156 3.252 3.42 3.42 0 0 0-3.72 0 2.45 2.45 0 0 1-.544-1.537c0-.618.234-1.24.706-1.715a2.38 2.38 0 0 1 1.701-.707zm5.316.082v6.025h3.167v-1.487H9.928l.004-4.538zm4.247 0v6.022h1.487V9.007zm2.585 0v6.025h1.487V13.15h1.918v-1.41h-1.918v-1.228h3.047l.863 1.545-1.662 2.975h1.662l.813-1.53.696 1.53h1.779l-1.665-2.975L24 9.007h-1.779l-.735 1.686-.735-1.686z"/></svg>`,
  zigbee: `<svg viewBox="0 0 24 24" fill="#EB0443" class="brand-svg" aria-hidden="true"><path d="M11.988 0a11.85 11.85 0 00-8.617 3.696c7.02-.875 11.401-.583 13.289-.34 3.752.583 3.558 3.404 3.558 3.404L8.237 19.112c2.299.22 6.897.366 13.796-.631a11.86 11.86 0 001.912-6.469C23.945 5.374 18.595 0 11.988 0zm.232 4.31c-2.451-.014-5.772.146-9.963.723C.854 7.003.055 9.41.055 12.012.055 18.626 5.38 24 11.988 24c3.63 0 6.85-1.63 9.053-4.182-7.286.948-11.813.631-13.75.388-3.775-.56-3.557-3.404-3.557-3.404L15.691 4.474a38.635 38.635 0 00-3.471-.163Z"/></svg>`,
  mqtt: `<svg viewBox="0 0 24 24" fill="#660066" class="brand-svg" aria-hidden="true"><path d="M10.657 23.994h-9.45A1.212 1.212 0 0 1 0 22.788v-9.18h.071c5.784 0 10.504 4.65 10.586 10.386Zm7.606 0h-4.045C14.135 16.246 7.795 9.977 0 9.942V6.038h.071c9.983 0 18.121 8.044 18.192 17.956Zm4.53 0h-.97C21.754 12.071 11.995 2.407 0 2.372v-1.16C0 .55.544.006 1.207.006h7.64C15.733 2.49 21.257 7.789 24 14.508v8.291c0 .663-.544 1.195-1.207 1.195ZM16.713.006h6.092A1.19 1.19 0 0 1 24 1.2v5.914c-.91-1.242-2.046-2.65-3.158-3.762C19.588 2.11 18.122.987 16.714.005Z"/></svg>`,
  matter: `<svg viewBox="0 0 24 24" fill="#4B5562" class="brand-svg" aria-hidden="true"><path d="M19.494 9.614c-.152 0-.265.046-.333.121a.412.412 0 0 0-.114.296c0 .314.14.469.416.469.167 0 .288-.038.364-.114a.416.416 0 0 0 .11-.302c0-.314-.137-.47-.417-.47h-.023zm-17.341.038-1.078 1.866L0 13.383h2.85v-1.9l-.058-.722Zm18.086.015v3.394l.25-.461.022.007a2.232 2.232 0 0 0 .73.224.31.31 0 0 0 .179-.053c.049-.03.068-.065.068-.125 0-.065-.027-.114-.099-.155a1.298 1.298 0 0 0-.17-.091 2.811 2.811 0 0 1-.738-.39c-.151-.129-.227-.322-.227-.567a.757.757 0 0 1 .303-.625 1.196 1.196 0 0 1 .753-.227c.295 0 .53.076.704.212a.844.844 0 0 1 .302.587v.022l-.726.14-.008-.03c-.011-.114-.038-.185-.087-.238a.299.299 0 0 0-.223-.08.227.227 0 0 0-.163.057c-.045.042-.068.087-.068.129 0 .049.008.079.019.102a.254.254 0 0 0 .05.068l.075.064a.802.802 0 0 0 .094.053l.13.05c.04.026.147.075.313.15v-.01a1.392 1.392 0 0 1 .44.275c.116.114.177.28.177.489 0 .211-.098.4-.291.567a1.022 1.022 0 0 1-.492.227H24V9.667Z"/></svg>`,
  wled: `<svg viewBox="0 0 24 24" fill="#E040FB" class="brand-svg" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7M9 21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1H9z"/></svg>`,
  sonoff: `<svg viewBox="0 0 24 24" fill="#00B0A0" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#00B0A0"/><path d="M5 12h14M12 5v14" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  yeelight: `<svg viewBox="0 0 24 24" fill="#E60012" class="brand-svg" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 8l4 5 4-5M12 13v4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  wiz: `<svg viewBox="0 0 24 24" fill="#00A6D6" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="6"/><circle cx="9" cy="12" r="2.2" fill="#fff"/><circle cx="15" cy="12" r="2.2" fill="#fff"/></svg>`,
  govee: `<svg viewBox="0 0 24 24" fill="#1B6EF3" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="6"/><path d="M16 8h-6a4 4 0 000 8h6v-4h-4" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
};

function getBrandLogo(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("shelly")) return BRAND_LOGOS.shelly;
  if (n.includes("tasmota")) return BRAND_LOGOS.tasmota;
  if (n.includes("wled")) return BRAND_LOGOS.wled;
  if (n.includes("esphome")) return BRAND_LOGOS.esphome;
  if (n.includes("hue") || n.includes("philips")) return BRAND_LOGOS.philipshue;
  if (n.includes("home assistant")) return BRAND_LOGOS.homeassistant;
  if (n.includes("sonoff")) return BRAND_LOGOS.sonoff;
  if (n.includes("tp-link") || n.includes("kasa")) return BRAND_LOGOS.tplink;
  if (n.includes("yeelight")) return BRAND_LOGOS.yeelight;
  if (n.includes("wiz")) return BRAND_LOGOS.wiz;
  if (n.includes("lifx")) return BRAND_LOGOS.lifx;
  if (n.includes("govee")) return BRAND_LOGOS.govee;
  if (n.includes("matter")) return BRAND_LOGOS.matter;
  if (n.includes("zigbee")) return BRAND_LOGOS.zigbee;
  if (n.includes("mqtt")) return BRAND_LOGOS.mqtt;
  return icon("plug");
}

function getPlatformLogo(plat) {
  if (plat === "windows") return BRAND_LOGOS.windows;
  if (plat === "linux") return BRAND_LOGOS.linux;
  if (plat === "android") return BRAND_LOGOS.android;
  return BRAND_LOGOS.apple;
}

// ---------- Tasarım Sistemi CSS ----------
const CSS = `
:root{
  --brand:#4C7DFF; --brand-press:#3F6FFF; --accent:#22D3EE;
  --brand-grad:linear-gradient(135deg,#4C7DFF 0%,#22D3EE 100%);
  --page:#ECE9FD; --page-grad:linear-gradient(180deg,#ECE9FD 0%,#DDD8FB 100%);
  --surface:#FFFFFF; --surface-2:#F4F5FA; --text:#0F172A; --text-2:#334155;
  --muted:#64748B; --border:#E2E8F0; --danger:#E5484D;
  --radius:18px; --radius-lg:26px;
  --shadow:0 4px 16px rgba(15,23,42,.06); --shadow-lg:0 20px 48px rgba(15,23,42,.12);
  --header-h:68px; --max:1100px;
}
html[data-theme=dark]{
  --page:#0B1120; --page-grad:linear-gradient(180deg,#050814 0%,#0B1120 100%);
  --surface:#151F32; --surface-2:#1D2A44; --text:#F8FAFC; --text-2:#CBD5E1;
  --muted:#94A3B8; --border:rgba(148,163,184,.16);
  --shadow:0 4px 18px rgba(0,0,0,.45); --shadow-lg:0 22px 55px rgba(0,0,0,.55);
  color-scheme:dark;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  background:var(--page-grad) fixed;color:var(--text);-webkit-font-smoothing:antialiased;line-height:1.6}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
.wrap{max-width:var(--max);margin:0 auto;padding:0 22px}
.icon{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.brand-svg{width:20px;height:20px;flex:none;display:inline-block;vertical-align:middle}

/* Başlık / Navbar */
.hd{position:sticky;top:0;z-index:50;height:var(--header-h);display:flex;align-items:center;
  background:color-mix(in srgb,var(--surface) 80%,transparent);backdrop-filter:blur(16px);
  border-bottom:1px solid var(--border);transition:all .2s ease}
.hd .wrap{display:flex;align-items:center;gap:16px;width:100%}
.logo{display:flex;align-items:center;gap:11px;font-weight:800;font-size:19px;letter-spacing:-.02em}
.logo svg{width:32px;height:32px}
.nav{display:none;gap:4px;margin-left:auto}
.nav a{padding:8px 14px;border-radius:999px;font-size:14px;font-weight:600;color:var(--text-2);transition:all .15s ease}
.nav a:hover{background:var(--surface);color:var(--text)}

.nav-controls{display:flex;align-items:center;gap:10px;margin-left:auto}
@media(min-width:960px){.nav{display:flex}.nav-controls{margin-left:8px}}

/* Dil Değiştirici */
.lang-switch{display:inline-flex;align-items:center;background:var(--surface);border:1px solid var(--border);
  border-radius:999px;padding:3px;box-shadow:var(--shadow)}
.lang-btn{border:0;background:transparent;color:var(--muted);font:700 12px/1 Inter,sans-serif;
  padding:6px 11px;border-radius:999px;cursor:pointer;transition:all .15s ease}
.lang-btn:hover{color:var(--text)}
.lang-btn.active{background:var(--brand);color:#fff;box-shadow:0 2px 8px rgba(76,125,255,.32)}

/* Tema Değiştirici */
.theme-t{border:1px solid var(--border);background:var(--surface);color:var(--text-2);
  border-radius:999px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;box-shadow:var(--shadow);transition:transform .2s ease,color .15s ease,border-color .15s ease}
.theme-t:hover{transform:rotate(15deg);color:var(--text);border-color:var(--brand)}
.theme-t .ic-moon{display:none}
html[data-theme=dark] .theme-t .ic-sun{display:none}
html[data-theme=dark] .theme-t .ic-moon{display:block}
.hd-cta{display:none}
@media(min-width:960px){.hd-cta{display:inline-flex}}

/* Butonlar */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;
  border-radius:999px;font-weight:700;font-size:15px;cursor:pointer;border:0;transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--brand-grad);color:#fff;box-shadow:0 8px 24px rgba(76,125,255,.32)}
.btn-primary:hover{opacity:.94;box-shadow:0 10px 28px rgba(76,125,255,.42)}
.btn-ghost{background:var(--surface);color:var(--text);border:1px solid var(--border);box-shadow:var(--shadow)}
.btn-ghost:hover{border-color:var(--brand);color:var(--brand)}
.btn.disabled{opacity:.55;pointer-events:none}

/* Hero */
.hero{padding:60px 0 36px;position:relative;overflow:hidden}
.hero .wrap{display:grid;gap:40px;align-items:center}
@media(min-width:960px){.hero .wrap{grid-template-columns:1.05fr .95fr;padding-top:24px}}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;color:var(--brand);background:color-mix(in srgb,var(--brand) 10%,transparent);
  padding:6px 14px;border-radius:999px}
h1{font-size:clamp(34px,5.8vw,56px);line-height:1.08;letter-spacing:-.03em;margin:18px 0 0;font-weight:800}
h1 .grad{background:var(--brand-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{font-size:clamp(15px,1.9vw,17.5px);color:var(--text-2);max-width:54ch;margin:18px 0 26px}
.hero-cta{display:flex;flex-wrap:wrap;gap:12px}
.ver-chip{display:inline-flex;align-items:center;gap:8px;margin-top:18px;font-size:13px;color:var(--muted)}
.ver-chip b{color:var(--text)}
.dot{width:8px;height:8px;border-radius:99px;background:#10B981;flex:none}
.trust{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.trust span{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--text-2);
  background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:8px 14px}
.trust .icon{width:15px;height:15px;color:var(--brand)}

/* Gerçekçi Akıllı Telefon Çerçevesi (Hero Mockup) */
.phone-wrapper{position:relative;margin:0 auto;max-width:320px;text-align:center}
.phone-glow{position:absolute;inset:-10% -6%;background:var(--brand-grad);filter:blur(65px);opacity:.22;border-radius:50%;z-index:-1;animation:heroGlow 6s ease-in-out infinite alternate}
@keyframes heroGlow{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.08) translate(8px,-6px)}}

.phone-case{
  position:relative;width:100%;aspect-ratio:390/810;max-height:620px;margin:0 auto;
  border-radius:46px;background:#080C16;padding:11px;
  box-shadow:0 0 0 2px rgba(255,255,255,.14), 0 24px 60px rgba(15,23,42,.35);
  overflow:hidden;cursor:pointer;user-select:none;
  transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s ease;
}
.phone-case:hover{transform:translateY(-4px) scale(1.01);box-shadow:0 0 0 2px rgba(76,125,255,.4), 0 32px 70px rgba(76,125,255,.25)}
.phone-island{
  position:absolute;top:17px;left:50%;transform:translateX(-50%);
  width:90px;height:24px;background:#000;border-radius:18px;z-index:25;
  display:flex;align-items:center;justify-content:flex-end;padding-right:9px;gap:5px;
}
.island-camera{width:9px;height:9px;border-radius:50%;background:#111b33;border:1px solid #1e293b}
.island-sensor{width:4px;height:4px;border-radius:50%;background:#090d16}
.phone-screen{
  position:relative;width:100%;height:100%;border-radius:36px;overflow:hidden;background:#000;
}
.shot-slide{
  position:absolute;inset:0;opacity:0;visibility:hidden;
  transition:opacity .35s ease, transform .35s ease;
  transform:scale(.97);
}
.shot-slide.active{
  opacity:1;visibility:visible;transform:scale(1);z-index:2;
}
.shot-slide img{width:100%;height:100%;object-fit:cover;object-position:top}
.phone-chin{
  position:absolute;bottom:13px;left:50%;transform:translateX(-50%);width:105px;height:4px;
  background:rgba(255,255,255,.4);border-radius:99px;z-index:25;pointer-events:none;
}
.phone-glass-shine{
  position:absolute;inset:0;border-radius:46px;pointer-events:none;z-index:22;
  background:linear-gradient(135deg,rgba(255,255,255,.12) 0%,transparent 35%,transparent 100%);
}
.phone-nav{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:16px;flex-wrap:wrap}
.phone-nav-dot{
  display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);
  background:var(--surface);color:var(--muted);font:600 12px/1 Inter,sans-serif;
  border-radius:999px;padding:7px 13px;cursor:pointer;transition:all .2s ease;
}
.phone-nav-dot .dot-indicator{width:6px;height:6px;border-radius:50%;background:var(--muted);transition:all .2s ease}
.phone-nav-dot.active{background:var(--brand);border-color:var(--brand);color:#fff;box-shadow:0 3px 12px rgba(76,125,255,.32)}
.phone-nav-dot.active .dot-indicator{background:#fff;transform:scale(1.2)}
.phone-tap-hint{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;color:var(--muted)}
.phone-tap-hint svg{width:14px;height:14px;color:var(--brand)}

/* Bölümler */
section{padding:72px 0}
.sec-head{max-width:640px;margin-bottom:36px}
h2{font-size:clamp(24px,3.8vw,36px);letter-spacing:-.02em;line-height:1.16;margin:0 0 12px;font-weight:800}
.sec-head p{color:var(--text-2);margin:0}
.grid{display:grid;gap:18px}
@media(min-width:700px){.grid.c3{grid-template-columns:repeat(3,1fr)}.grid.c2{grid-template-columns:repeat(2,1fr)}}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:24px;box-shadow:var(--shadow);transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease,border-color .25s ease}
.card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:color-mix(in srgb,var(--brand) 30%,transparent)}
.f-ic{width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--brand) 12%,transparent);
  color:var(--brand);display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.card h3{margin:0 0 8px;font-size:17px;font-weight:700;letter-spacing:-.01em}
.card p{margin:0;color:var(--muted);font-size:14px}

/* Nasıl Çalışır */
.steps{display:grid;gap:18px;counter-reset:st}
@media(min-width:800px){.steps{grid-template-columns:repeat(3,1fr)}}
.step{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:26px 24px 24px;box-shadow:var(--shadow)}
.step-n{position:absolute;top:-16px;left:22px;width:34px;height:34px;border-radius:12px;background:var(--brand-grad);
  color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(76,125,255,.35)}
.step h3{margin:8px 0 8px;font-size:16.5px;font-weight:700}
.step p{margin:0;color:var(--muted);font-size:14px}

/* Entegrasyonlar */
.int-groups{display:grid;gap:18px}
@media(min-width:800px){.int-groups{grid-template-columns:repeat(2,1fr)}}
.chips{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}
.chip{display:inline-flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--border);
  border-radius:999px;padding:9px 16px;font-size:13.5px;font-weight:600;color:var(--text-2);box-shadow:0 2px 6px rgba(15,23,42,.03);
  transition:all .18s ease}
.chip:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--brand) 30%,transparent);box-shadow:var(--shadow)}
.int-more{margin-top:22px;display:inline-flex;align-items:center;gap:8px;color:var(--brand);font-weight:700;font-size:14px}

/* Fiyatlar */
.billing-toggle-wrap{display:flex;align-items:center;justify-content:center;margin:0 0 32px}
.billing-toggle{display:inline-flex;align-items:center;background:var(--surface);border:1px solid var(--border);
  border-radius:999px;padding:4px;box-shadow:var(--shadow)}
.billing-btn{border:0;background:transparent;color:var(--muted);font:700 13px/1 Inter,sans-serif;
  padding:9px 18px;border-radius:999px;cursor:pointer;transition:all .15s ease;display:inline-flex;align-items:center;gap:6px}
.billing-btn.active{background:var(--brand-grad);color:#fff;box-shadow:0 4px 14px rgba(76,125,255,.35)}
.save-badge{font-size:11px;font-weight:800;background:rgba(255,255,255,.25);padding:3px 7px;border-radius:99px}
.billing-btn:not(.active) .save-badge{background:color-mix(in srgb,var(--brand) 15%,transparent);color:var(--brand)}

.plans{display:grid;gap:20px}
@media(min-width:900px){.plans{grid-template-columns:repeat(3,1fr)}}
.plan{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:28px;box-shadow:var(--shadow);display:flex;flex-direction:column;transition:transform .25s ease,box-shadow .25s ease}
.plan:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.plan.hot{border:2px solid var(--brand);box-shadow:0 20px 50px rgba(76,125,255,.18)}
.plan-badge{position:absolute;top:-13px;left:24px;background:var(--brand-grad);color:#fff;font-size:11px;font-weight:800;
  letter-spacing:.06em;text-transform:uppercase;padding:6px 14px;border-radius:999px;box-shadow:0 4px 12px rgba(76,125,255,.35)}
.plan h3{margin:0 0 12px;font-size:18px;font-weight:800}
.price{font-size:38px;font-weight:800;letter-spacing:-.03em;line-height:1}
.price small{font-size:14px;font-weight:600;color:var(--muted);letter-spacing:0}
.price-note{color:var(--muted);font-size:13px;margin:8px 0 0}
.plan ul{list-style:none;margin:22px 0 26px;padding:0;display:grid;gap:12px;flex:1}
.plan li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--text-2);line-height:1.4}
.plan li .icon{width:17px;height:17px;color:#10B981;margin-top:2px;flex-shrink:0}
.plan .btn{width:100%}
.cur-note{font-size:12.5px;color:var(--muted);margin-top:18px;text-align:center}

/* İndirmeler */
.dl-grid{display:grid;gap:18px}
@media(min-width:800px){.dl-grid{grid-template-columns:repeat(3,1fr)}}
.dl-card{display:flex;flex-direction:column;gap:6px;background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius-lg);padding:24px;box-shadow:var(--shadow);transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;color:inherit}
.dl-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:var(--brand)}
.dl-top{display:flex;align-items:center;gap:14px;margin-bottom:6px}
.dl-ic{width:48px;height:48px;border-radius:15px;background:var(--surface-2);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center}
.dl-card h3{margin:0;font-size:17px;font-weight:800}
.dl-card .plat{color:var(--muted);font-size:13px}
.dl-meta{display:flex;gap:6px;margin:12px 0 18px;flex-wrap:wrap}
.dl-meta span{font-size:12px;font-weight:600;color:var(--text-2);background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:4px 9px}
.dl-card .btn{margin-top:auto}
.dl-note{color:var(--muted);font-size:13px;margin-top:20px;max-width:72ch}
.dl-web{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:16px;justify-content:space-between;
  background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius-lg);padding:24px 28px}
.dl-web h3{margin:0 0 4px;font-size:17px;font-weight:700}
.dl-web p{margin:0;color:var(--muted);font-size:14px}

/* SSS */
details.faq{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);margin-bottom:12px;overflow:hidden;transition:all .2s ease}
details.faq summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:20px 22px;font-weight:700;font-size:15.5px}
details.faq summary::-webkit-details-marker{display:none}
details.faq summary .icon{transition:transform .2s;color:var(--muted)}
details.faq[open] summary .icon{transform:rotate(180deg)}
details.faq p{margin:0;padding:0 22px 20px;color:var(--text-2);font-size:14.5px}

/* Footer */
.ft{border-top:1px solid var(--border);background:color-mix(in srgb,var(--surface) 60%,transparent);padding:48px 0 34px;margin-top:24px}
.ft-grid{display:grid;gap:28px}
@media(min-width:800px){.ft-grid{grid-template-columns:1.5fr repeat(3,1fr)}}
.ft h4{margin:0 0 14px;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
.ft a{display:block;font-size:14px;color:var(--text-2);padding:5px 0;transition:color .15s ease}
.ft a:hover{color:var(--brand)}
.ft-brand p{color:var(--muted);font-size:13.5px;margin:12px 0 0;max-width:34ch}
.ft-bottom{margin-top:36px;padding-top:20px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:14px;
  justify-content:space-between;align-items:center;color:var(--muted);font-size:13px}
.ft-privacy{display:inline-flex;align-items:center;gap:8px;font-weight:600}
.ft-privacy .icon{width:16px;height:16px;color:var(--brand);flex-shrink:0}

/* Animasyonlar */
.rv{opacity:0;transform:translateY(16px);transition:opacity .55s cubic-bezier(.16,1,.3,1),transform .55s cubic-bezier(.16,1,.3,1)}
.rv.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.rv{opacity:1;transform:none;transition:none}}

/* About Sayfası */
.about-hero{padding:64px 0 8px}
.about-body{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);
  padding:28px;margin:26px 0;display:grid;gap:14px}
.about-body p{margin:0;color:var(--text-2);font-size:15px}
`;

// ---------- Sayfa Davranış Betiği (site.js) ----------
function pageJs() {
  return `
// Tema: sistem tercihi + kullanıcı seçimi
(function(){
  var t;
  try{t=localStorage.getItem('nx-site-theme')}catch(e){}
  var d=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  document.documentElement.setAttribute('data-theme',d);
})();

function nxToggleTheme(){
  var d=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',d);
  try{localStorage.setItem('nx-site-theme',d)}catch(e){}
}

// Dil değiştirme: seçimi kaydet ve doğru sayfaya git
function nxSetLang(lang){
  try{localStorage.setItem('nx-lang',lang)}catch(e){}
  var p=location.pathname;
  var isTr=/^\\\\/tr(\\\\/|$)/.test(p);
  if(lang==='tr'){
    if(isTr)return;
    var sub=p.replace(/^\\\\/+/,'');
    location.href='/tr/'+sub+location.search+location.hash;
  }else{
    if(!isTr)return;
    var sub=p.replace(/^\\\\/tr(\\\\/|$)/,'');
    location.href='/'+sub+location.search+location.hash;
  }
}

// Fiyatlandırma: Aylık / Yıllık geçişi
function nxSetBilling(period){
  var isYearly=period==='yearly';
  var btnM=document.getElementById('billingMonthly');
  var btnY=document.getElementById('billingYearly');
  if(btnM&&btnY){
    btnM.classList.toggle('active',!isYearly);
    btnY.classList.toggle('active',isYearly);
  }
  document.querySelectorAll('[data-price-monthly]').forEach(function(el){
    el.innerHTML=isYearly?el.getAttribute('data-price-yearly'):el.getAttribute('data-price-monthly');
  });
  document.querySelectorAll('[data-period-monthly]').forEach(function(el){
    el.textContent=isYearly?el.getAttribute('data-period-yearly'):el.getAttribute('data-period-monthly');
  });
  document.querySelectorAll('[data-cta-monthly]').forEach(function(el){
    var href=isYearly?el.getAttribute('data-cta-yearly'):el.getAttribute('data-cta-monthly');
    if(href)el.setAttribute('href',href);
  });
}

// Kaydırma giriş animasyonu
(function(){
  var els=document.querySelectorAll('.rv');
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){
    els.forEach(function(e){e.classList.add('in')});
    return;
  }
  var io=new IntersectionObserver(function(es){
    es.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}
    });
  },{threshold:.12});
  els.forEach(function(e){io.observe(e)});
})();

// SSS tek-açıklık davranışı
document.querySelectorAll('details.faq').forEach(function(d){
  d.addEventListener('toggle',function(){
    if(d.open)document.querySelectorAll('details.faq[open]').forEach(function(o){if(o!==d)o.open=false});
  });
});

// Telefon önizleme kontrolleri
var currentShotIdx = 0;
function nxUpdateShot(idx){
  var slides = document.querySelectorAll('.shot-slide');
  var dots = document.querySelectorAll('.phone-nav-dot');
  if(!slides.length) return;
  currentShotIdx = (idx + slides.length) % slides.length;
  slides.forEach(function(s, i){
    s.classList.toggle('active', i === currentShotIdx);
  });
  dots.forEach(function(d, i){
    d.classList.toggle('active', i === currentShotIdx);
    d.setAttribute('aria-selected', i === currentShotIdx ? 'true' : 'false');
  });
}

function nxNextShot(){
  nxUpdateShot(currentShotIdx + 1);
}

function nxGoToShot(name){
  var slides = document.querySelectorAll('.shot-slide');
  for(var i=0; i<slides.length; i++){
    if(slides[i].getAttribute('data-shot') === name){
      nxUpdateShot(i);
      break;
    }
  }
}
`.trim();
}

// ---------- downloads.js (GitHub Releases entegrasyonu) ----------
function downloadsJs() {
  return `
(function(){
  var TR=(document.documentElement.lang||'en').slice(0,2)==='tr';
  var FILES={
    windows:[["NEXUS-Setup.exe",".exe"]],
    linux:[["NEXUS-linux.AppImage",".AppImage"],["NEXUS-linux.deb",".deb"]],
    android:[["NEXUS-Android.apk",".apk"]]
  };
  function mb(n){return n>=1048576?(Math.round(n/104857.6)/10).toLocaleString(TR?'tr-TR':'en-US')+' MB':Math.round(n/1024)+' KB'}
  fetch('https://api.github.com/repos/Enard52/nexus-releases/releases/latest',{headers:{Accept:'application/vnd.github+json'}})
    .then(function(r){return r.ok?r.json():null})
    .then(function(d){
      if(!d||!d.tag_name)return;
      var v=String(d.tag_name).replace(/^v/,'');
      document.querySelectorAll('[data-nexus-ver]').forEach(function(e){e.textContent='v'+v});
      var sizes={};(d.assets||[]).forEach(function(a){sizes[a.name]=a.size});
      Object.keys(FILES).forEach(function(p){
        var card=document.querySelector('.dl-card[data-platform="'+p+'"]');if(!card)return;
        var row=card.querySelector('.dl-meta');if(!row)return;
        FILES[p].forEach(function(f){
          var s=sizes[f[0]];
          var sp=document.createElement('span');
          sp.textContent=f[0].replace('NEXUS-','')+(s?' · '+mb(s):'');
          row.appendChild(sp);
        });
      });
    }).catch(function(){});
})();
`.trim();
}

// ---------- Lucide SVG İkonları ----------
const ICONS = {
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  sparkles:
    '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/>',
};
const icon = (name, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

// ---------- HTML Üretim Fonksiyonları ----------
function renderHeader(c) {
  return `<header class="hd">
  <div class="wrap">
    <a class="logo" href="${c.canonical}">${brand.logoSvg}<span>NEXUS</span></a>
    <nav class="nav" aria-label="${c.lang === "tr" ? "Ana menü" : "Main menu"}">
      ${c.nav.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join("\n      ")}
    </nav>
    <div class="nav-controls">
      <div class="lang-switch" role="group" aria-label="${c.lang === "tr" ? "Dil seçimi" : "Language selection"}">
        <button class="lang-btn${c.lang === "tr" ? " active" : ""}" onclick="nxSetLang('tr')" title="Türkçe">TR</button>
        <button class="lang-btn${c.lang === "en" ? " active" : ""}" onclick="nxSetLang('en')" title="English">EN</button>
      </div>
      <button class="theme-t" onclick="nxToggleTheme()" aria-label="${c.lang === "tr" ? "Tema değiştir" : "Toggle theme"}" title="${c.lang === "tr" ? "Karanlık/Aydınlık Tema" : "Toggle theme"}">
        <span class="ic-sun">${icon("sun")}</span>
        <span class="ic-moon">${icon("moon")}</span>
      </button>
      <a class="btn btn-primary hd-cta" href="${c.navCta.href}" style="min-height:40px;padding:0 18px;font-size:13.5px">${esc(c.navCta.label)}</a>
    </div>
  </div>
</header>`;
}

function renderHero(c, hasShots) {
  const shots = hasShots
    ? [
        { file: "home", label: c.lang === "tr" ? "Ana ekran" : "Home" },
        { file: "energy", label: c.lang === "tr" ? "Enerji" : "Energy" },
        { file: "smart", label: c.lang === "tr" ? "Akıllı" : "Smart" },
        { file: "chat", label: "NEXUS AI" },
      ]
    : [];
  return `<section class="hero" id="top">
  <div class="wrap">
    <div>
      <span class="eyebrow">${icon("sparkles", "icon")}${esc(c.hero.eyebrow)}</span>
      <h1>${esc(c.hero.h1a)}<br><span class="grad">${esc(c.hero.h1b)}</span></h1>
      <p class="lead">${esc(c.hero.lead)}</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="${c.hero.primary.href}">${esc(c.hero.primary.label)}</a>
        <a class="btn btn-ghost" href="${c.hero.secondary.href}" target="_blank" rel="noopener">${esc(c.hero.secondary.label)}</a>
      </div>
      <p class="ver-chip"><span class="dot"></span>${esc(c.hero.versionNote)}: <b data-nexus-ver>v0.8.0</b></p>
      <div class="trust">
        ${c.hero.trust.map((t) => `<span>${icon("check")}${esc(t)}</span>`).join("\n        ")}
      </div>
    </div>
    ${
      hasShots
        ? `
    <div class="phone-wrapper rv">
      <div class="phone-glow" aria-hidden="true"></div>
      <div class="phone-case" id="phoneMockup" onclick="nxNextShot()" title="${c.lang === "tr" ? "Sonraki ekran için dokunun" : "Tap to see next screen"}">
        <div class="phone-island">
          <span class="island-camera"></span>
          <span class="island-sensor"></span>
        </div>
        <div class="phone-screen">
          ${shots.map((s, i) => `<div class="shot-slide${i === 0 ? " active" : ""}" data-shot="${s.file}"><img src="/images/shots/${s.file}.png" alt="${esc(c.hero.shotAlt)} — ${esc(s.label)}" width="390" height="844" loading="${i === 0 ? "eager" : "lazy"}" decoding="async"></div>`).join("\n          ")}
        </div>
        <div class="phone-chin"></div>
        <div class="phone-glass-shine"></div>
      </div>
      <div class="phone-nav" role="tablist" aria-label="${c.lang === "tr" ? "Ekran görüntüleri" : "Screenshots"}">
        ${shots.map((s, i) => `<button class="phone-nav-dot${i === 0 ? " active" : ""}" role="tab" aria-selected="${i === 0}" data-shot-btn="${s.file}" onclick="nxGoToShot('${s.file}')"><span class="dot-indicator"></span><span class="dot-label">${esc(s.label)}</span></button>`).join("\n        ")}
      </div>
      <span class="phone-tap-hint">${icon("sparkles")}${c.lang === "tr" ? "Ekranlar arasında geçiş için dokunun" : "Tap phone to preview screens"}</span>
    </div>`
        : ""
    }
  </div>
</section>`;
}

function renderFeatures(c) {
  return `<section id="features">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.features.heading)}</h2><p>${esc(c.features.lead)}</p></div>
    <div class="grid c3">
      ${c.features.items.map(([ic, t, d]) => `<article class="card rv"><div class="f-ic">${icon(ic)}</div><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function renderHow(c) {
  return `<section id="how">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.how.heading)}</h2></div>
    <div class="steps">
      ${c.how.steps.map(([n, t, d]) => `<article class="step rv"><span class="step-n">${esc(n)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function renderIntegrations(c) {
  return `<section id="integrations">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.integrations.heading)}</h2><p>${esc(c.integrations.lead)}</p></div>
    <div class="int-groups">
      ${c.integrations.groups.map(([g, items]) => `<div class="card rv"><h3>${esc(g)}</h3><div class="chips">${items.map((i) => `<span class="chip">${getBrandLogo(i)}${esc(i)}</span>`).join("")}</div></div>`).join("\n      ")}
    </div>
    <a class="int-more" href="${c.integrations.moreHref}" target="_blank" rel="noopener">${esc(c.integrations.more)} ${icon("arrow")}</a>
  </div>
</section>`;
}

function renderPricing(c) {
  const p = priceFor(c.lang);
  const isTr = c.lang === "tr";
  const monthlyPriceStr = isTr ? `${p.monthly}<small>/ay</small>` : `${p.monthly}<small>/mo</small>`;
  const yearlyPriceStr = isTr ? `${p.perMonthOfYear}<small>/ay</small>` : `${p.perMonthOfYear}<small>/mo</small>`;
  const yearlyPeriodStr = isTr ? `${p.yearly}/yıl faturalandırılır (2 ay ücretsiz)` : `Billed ${p.yearly}/yr (2 months free)`;
  const monthlyPeriodStr = isTr ? "Aylık faturalandırılır" : "Billed monthly";

  return `<section id="pricing">
  <div class="wrap">
    <div class="sec-head rv" style="text-align:center;margin:0 auto 28px">
      <h2>${esc(c.pricing.heading)}</h2>
      <p>${esc(c.pricing.lead)}</p>
    </div>

    <!-- Aylık / Yıllık Seçici -->
    <div class="billing-toggle-wrap rv">
      <div class="billing-toggle" role="radiogroup" aria-label="${isTr ? "Faturalandırma dönemi" : "Billing cycle"}">
        <button class="billing-btn active" id="billingMonthly" onclick="nxSetBilling('monthly')">${isTr ? "Aylık" : "Monthly"}</button>
        <button class="billing-btn" id="billingYearly" onclick="nxSetBilling('yearly')">
          ${isTr ? "Yıllık" : "Yearly"}
          <span class="save-badge">${isTr ? "%33 Tasarruf" : "Save 33%"}</span>
        </button>
      </div>
    </div>

    <div class="plans">
      ${c.pricing.plans
        .map((plan) => {
          const isPlus = plan.name === "NEXUS+" || plan.name.includes("+");
          const isFamily = plan.name === "Family" || plan.name === "Aile";
          const isFree = plan.name === "Free" || plan.name === "Ücretsiz";

          let priceHtml = "";
          let periodHtml = "";
          let ctaHtml = "";

          if (isPlus) {
            priceHtml = `<div class="price" data-price-monthly="${monthlyPriceStr}" data-price-yearly="${yearlyPriceStr}">${monthlyPriceStr}</div>`;
            periodHtml = `<p class="price-note" data-period-monthly="${monthlyPeriodStr}" data-period-yearly="${yearlyPeriodStr}">${monthlyPeriodStr}</p>`;
            ctaHtml = `<a class="btn btn-primary" href="${plan.cta.href}" data-cta-monthly="${plan.cta.href}" data-cta-yearly="${plan.cta.yearlyHref}" target="_blank" rel="noopener">${esc(plan.cta.label)}</a>`;
          } else if (isFamily) {
            priceHtml = `<div class="price">${esc(plan.price)}</div>`;
            periodHtml = `<p class="price-note">${esc(plan.period)}</p>`;
            ctaHtml = `<a class="btn btn-ghost" href="${plan.cta.href}">${esc(plan.cta.label)}</a>`;
          } else {
            priceHtml = `<div class="price">${esc(plan.price)}</div>`;
            periodHtml = `<p class="price-note">${esc(plan.period)}</p>`;
            ctaHtml = `<a class="btn btn-ghost" href="${plan.cta ? plan.cta.href : APP_URL}">${esc(plan.cta ? plan.cta.label : (isTr ? "Hemen Başla" : "Get started free"))}</a>`;
          }

          return `<article class="plan rv${isPlus ? " hot" : ""}">
        ${plan.badge ? `<span class="plan-badge">${esc(plan.badge)}</span>` : ""}
        <h3>${esc(plan.name)}</h3>
        ${priceHtml}
        ${periodHtml}
        <ul>${plan.features.map((f) => `<li>${icon("check")}${esc(f)}</li>`).join("")}</ul>
        ${ctaHtml}
      </article>`;
        })
        .join("\n      ")}
    </div>
    <p class="cur-note">${esc(c.pricing.manageNote)}</p>
  </div>
</section>`;
}

function renderDownloads(c) {
  return `<section id="downloads">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.downloads.heading)}</h2><p>${esc(c.downloads.lead)}</p></div>
    <div class="dl-grid">
      ${c.downloads.cards
        .map(
          ([
            plat,
            ic,
            name,
            sub,
            file,
            ext,
          ]) => `<a class="dl-card rv" data-platform="${plat}" href="${file === "NEXUS-Setup.exe" ? "downloads/NEXUS-Setup.exe" : `downloads/${file}`}" download>
        <div class="dl-top">
          <div class="dl-ic">${getPlatformLogo(plat)}</div>
          <div><h3>${esc(name)}</h3><span class="plat">${esc(sub)}</span></div>
        </div>
        <div class="dl-meta">
          <span><b data-nexus-ver>v0.8.0</b></span>
          <span>${plat === "windows" ? "64-bit .exe" : plat === "android" ? "APK" : "AppImage / .deb"}</span>
          <span>SHA-256</span>
        </div>
        <span class="btn btn-primary">${icon("download")}${c.lang === "tr" ? "İndir" : "Download"}</span>
      </a>`,
        )
        .join("\n      ")}
      <div class="dl-web rv">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            ${BRAND_LOGOS.apple}
            <h3>${esc(c.downloads.webCard.title)}</h3>
          </div>
          <p>${esc(c.downloads.webCard.desc)}</p>
        </div>
        <a class="btn btn-ghost" href="${c.downloads.webCard.cta.href}" target="_blank" rel="noopener">${esc(c.downloads.webCard.cta.label)}</a>
      </div>
    </div>
    <p class="dl-note">${esc(c.downloads.smartScreenNote)}</p>
  </div>
</section>`;
}

function renderFaq(c) {
  return `<section id="faq">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.faq.heading)}</h2></div>
    <div>
      ${c.faq.items.map(([q, a], i) => `<details class="faq rv"${i === 0 ? " open" : ""}><summary>${esc(q)}${icon("chev")}</summary><p>${esc(a)}</p></details>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function renderFooter(c) {
  const col = (title, links) =>
    `<div><h4>${esc(title)}</h4>${links.map(([l, h]) => `<a href="${h}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(l)}</a>`).join("")}</div>`;
  return `<footer class="ft">
  <div class="wrap">
    <div class="ft-grid">
      <div class="ft-brand">
        <a class="logo" href="${c.canonical}">${brand.logoSvg}<span>NEXUS</span></a>
        <p>${esc(c.footer.tagline)}</p>
      </div>
      ${col(c.footer.product, c.footer.productLinks)}
      ${col(c.footer.account, c.footer.accountLinks)}
      ${col(c.footer.legal, c.footer.legalLinks)}
    </div>
    <div class="ft-bottom">
      <span>© ${new Date().getFullYear()} NEXUS. ${esc(c.footer.rights)}</span>
      <span class="ft-privacy">${icon("lock")}${c.lang === "tr" ? "Ev verisi cihazınızda kalır." : "Your home data stays on your devices."}</span>
    </div>
  </div>
</footer>`;
}

function baseHead(c, path) {
  const SITE = "https://nexus-smarthome.pages.dev";
  const url = SITE + (path === "/" ? "/" : path);
  return `<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.description)}"/>
<link rel="canonical" href="${url}"/>
<link rel="alternate" hreflang="en" href="${SITE}/"/>
<link rel="alternate" hreflang="tr" href="${SITE}/tr/"/>
<link rel="alternate" hreflang="x-default" href="${SITE}/"/>
<link rel="icon" href="/icon.svg" type="image/svg+xml"/>
<link rel="manifest" href="/manifest.webmanifest"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="NEXUS"/>
<meta property="og:title" content="${esc(c.title)}"/>
<meta property="og:description" content="${esc(c.description)}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:image" content="${SITE}/og-cover.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<link href="/fonts/inter/inter.css" rel="stylesheet"/>`;
}

// GitHub Pages → Cloudflare yönlendirmesi + sağlam dil algılama
function bootJs() {
  return `
if(location.hostname==='enard52.github.io'){location.replace('https://nexus-smarthome.pages.dev'+location.pathname.replace(/\\\\/index\\\\.html$/,'/').replace(/\\\\.html$/,'')+location.search+location.hash)}
(function(){
  try{
    var L=location, p=L.pathname, isTrPage=/^\\\\/tr(\\\\/|$)/.test(p);
    var q=new URLSearchParams(L.search).get('lang');
    var saved=null;
    try{saved=localStorage.getItem('nx-lang')}catch(e){}
    if(q==='tr'||q==='en'){
      saved=q;
      try{localStorage.setItem('nx-lang',q)}catch(e){}
    }
    var targetLang=saved;
    if(!targetLang){
      var navLangs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]).filter(Boolean);
      var isTr=false;
      for(var i=0;i<navLangs.length;i++){
        if(/^tr/i.test(String(navLangs[i]).split(/[-_]/)[0])){isTr=true;break;}
      }
      targetLang=isTr?'tr':'en';
    }
    if(targetLang==='tr'&&!isTrPage){
      var rel=p.replace(/^\\\\/+/,'');if(rel==='index.html')rel='';
      L.replace('/tr/'+rel+L.search+L.hash);
    }else if(targetLang==='en'&&isTrPage){
      var rel=p.replace(/^\\\\/tr(\\\\/|$)/,'');if(rel==='index.html')rel='';
      L.replace('/'+rel+L.search+L.hash);
    }
  }catch(e){}
})();`.trim();
}

function renderLanding(c, hasShots) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "NEXUS",
    applicationCategory: "SmartHomeApplication",
    operatingSystem: "Windows, Linux, Android, Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: c.lang === "tr" ? "TRY" : "USD" },
    description: c.description,
    url: "https://nexus-smarthome.pages.dev",
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return `<!doctype html>
<html lang="${c.htmlLang}" data-theme="light">
<head>
<script src="/assets/site-boot.js"></script>
${baseHead(c, c.canonical)}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<style>${CSS}</style>
</head>
<body>
${renderHeader(c)}
<main>
${renderHero(c, hasShots)}
${renderFeatures(c)}
${renderHow(c)}
${renderIntegrations(c)}
${renderPricing(c)}
${renderDownloads(c)}
${renderFaq(c)}
</main>
${renderFooter(c)}
<script src="/assets/site.js" defer></script>
<script src="/assets/site-downloads.js" defer></script>
</body>
</html>`;
}

function renderAbout(c) {
  return `<!doctype html>
<html lang="${c.htmlLang}" data-theme="light">
<head>
<script src="/assets/site-boot.js"></script>
${baseHead({ ...c, title: `${c.about.title} — NEXUS` }, c.lang === "tr" ? "/tr/about.html" : "/about.html")}
<style>${CSS}</style>
</head>
<body>
${renderHeader(c)}
<main class="wrap about-hero">
  <span class="eyebrow">${esc(c.about.title)}</span>
  <h2 style="font-size:clamp(26px,4vw,38px);margin-top:16px">${esc(c.about.title)}</h2>
  <div class="about-body rv">
    <p>${esc(c.about.lead)}</p>
    ${c.about.body.map((p) => `<p>${esc(p)}</p>`).join("\n    ")}
  </div>
  <h4 style="margin:8px 0 12px;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)">${esc(c.about.linksTitle)}</h4>
  <div class="chips" style="margin-bottom:56px">
    ${c.footer.productLinks
      .map(
        ([l, h]) =>
          `<a class="chip" href="${h}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${icon("arrow")}${esc(l)}</a>`,
      )
      .join("\n    ")}
  </div>
</main>
${renderFooter(c)}
<script src="/assets/site.js" defer></script>
</body>
</html>`;
}

function renderLightRedirect(tr) {
  const target = tr ? "/tr/" : "/";
  return `<!doctype html>
<html lang="${tr ? "tr" : "en"}">
<head>
<meta charset="utf-8"/>
<meta name="robots" content="noindex"/>
<title>NEXUS</title>
<link rel="canonical" href="https://nexus-smarthome.pages.dev${target}"/>
<meta http-equiv="refresh" content="0;url=${target}"/>
</head>
<body>
<script>location.replace('${target}'+location.hash)</script>
<a href="${target}">NEXUS</a>
</body>
</html>`;
}

// ---------- Çalıştır ----------
const args = process.argv.slice(2);
const WITH_SHOTS = args.includes("--shots");
const shotsDir = join(PUB, "images", "shots");
const hasShots = WITH_SHOTS || existsSync(join(shotsDir, "home.png"));

mkdirSync(join(PUB, "assets"), { recursive: true });
writeFileSync(join(PUB, "assets", "site-boot.js"), bootJs() + "\n");
writeFileSync(join(PUB, "assets", "site.js"), pageJs() + "\n");
writeFileSync(join(PUB, "assets", "site-downloads.js"), downloadsJs() + "\n");

const outputs = [
  ["index.html", renderLanding(content.en, hasShots)],
  [join("tr", "index.html"), renderLanding(content.tr, hasShots)],
  ["about.html", renderAbout(content.en)],
  [join("tr", "about.html"), renderAbout(content.tr)],
  ["light.html", renderLightRedirect(false)],
  [join("tr", "light.html"), renderLightRedirect(true)],
];
mkdirSync(join(PUB, "tr"), { recursive: true });
for (const [rel, html] of outputs) {
  writeFileSync(join(PUB, rel), html + "\n");
  console.log("✓", rel, Math.round(html.length / 1024) + " KB");
}
console.log(
  hasShots ? "Ekran görüntüleri: VAR (images/shots/)" : "Ekran görüntüleri: YOK — --shots ile üret",
);
