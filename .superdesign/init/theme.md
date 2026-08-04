# Theme Summary

## Renkler
- `nexusPurple`: `#7C5CFF`
- `nexusCyan`: `#22D3EE`
- home background: `linear-gradient(180deg, #ECE9FD 0%, #DDD8FB 100%)`
- smart background: `linear-gradient(180deg, #f7f5ff 0%, #ffffff 22%, #f8fbff 100%)`
- discover background: `linear-gradient(180deg, #E4E0FB 0%, #F2F0FF 100%)`
- primary text: `#111827` / slate-900
- secondary text: `#64748b`, `#94a3b8`
- surface: `#ffffff` ve yarı saydam `bg-white/60`, `bg-white/88`, `bg-white/90`

## Tipografi
- ana font: `Inter`
- title ağırlıkları: `700`, `800`
- section başlıkları: `text-xl`, `text-2xl`
- küçük label dili: uppercase tracking, `text-[10px]`, `text-xs`

## Radius
- ana kartlar: `rounded-3xl`
- pill/button: `rounded-full`
- bottom sheet: `rounded-t-[3rem]`
- secondary card: `rounded-[2rem]`, `rounded-[1.6rem]`

## Gölge
- hafif kart gölgesi: `0 4px 12px rgba(0, 0, 0, 0.05)`
- büyük panel: `0 18px 45px rgba(15, 23, 42, 0.08)`
- mor glow: `0 12px 24px rgba(124,92,255,.28)`

## Hareket
- aktif dokunuşta hafif `scale-95` / `scale-[0.98]`
- alt sayfalarda translateY bazlı geçiş
- sürükleyerek kapatma davranışı

## Raw source: `package.json`
```json
{
  "name": "nexus-ai",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build:static": "pnpm --filter @nexus/web build:site && pnpm --filter @nexus/desktop build:setup && node scripts/fix-review-avatars.mjs && node scripts/copy-static.mjs"
  },
  "dependencies": {
    "@capacitor/core": "^8.4.2",
    "@fontsource/inter": "^5.3.0"
  }
}
```

## Raw source: `theme.js` token-related excerpt
```js
if (typeof tailwind !== 'undefined') {
  var cfg = tailwind.config || {};
  cfg.darkMode = 'class';
  cfg.theme = cfg.theme || {};
  cfg.theme.extend = cfg.theme.extend || {};
  cfg.theme.extend.colors = Object.assign({}, cfg.theme.extend.colors, {
    nexusPurple: '#7C5CFF',
    nexusCyan: '#22D3EE'
  });
  tailwind.config = cfg;
}
```

## Raw source: page-local CSS excerpts
```css
.bg-dashboard-gradient {
  background: linear-gradient(180deg, #ECE9FD 0%, #DDD8FB 100%);
}

.bg-smart-gradient {
  background: linear-gradient(180deg, #f7f5ff 0%, #ffffff 22%, #f8fbff 100%);
}

.bg-light-blue-gradient {
  background: linear-gradient(180deg, #E4E0FB 0%, #F2F0FF 100%);
}

.custom-gradient-border::before {
  background: linear-gradient(to right, #7C5CFF, #22D3EE, #7C5CFF);
}
```
