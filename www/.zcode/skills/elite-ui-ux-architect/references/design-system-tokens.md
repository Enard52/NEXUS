# Design System Tokens

Reference scale for every design. Use tokens, never raw values, in handoff. All spacing follows the **8pt grid** (4pt allowed for tight icon internals).

## Color

A token has three layers: **primitive** (`blue-500`), **semantic** (`action-primary`), **component** (`button-primary-bg`). Map primitives → semantics so themes (light/dark/brand) swap by changing one layer.

| Token role            | Light           | Dark            | Use                                   |
|-----------------------|-----------------|-----------------|---------------------------------------|
| `bg-canvas`           | `#FFFFFF`       | `#0B0D10`       | App background                        |
| `bg-surface`          | `#F6F7F9`       | `#14171C`       | Cards, sheets                         |
| `bg-surface-raised`   | `#FFFFFF`       | `#1C2026`       | Modals, popovers                      |
| `fg-primary`          | `#0E1116`       | `#F2F4F7`       | Body text                             |
| `fg-secondary`        | `#475467`       | `#A6B0BE`       | Captions, helper text                 |
| `fg-disabled`         | `#98A2B3`       | `#5B6675`       | Disabled text                         |
| `border-subtle`       | `#E4E7EC`       | `#2A2F37`       | Hairlines, dividers                   |
| `action-primary`      | brand `#5B5BD6` | brand `#7C7CE6` | Primary CTA                           |
| `action-primary-hover`| `#4A4AC0`       | `#9393EE`       | Hover                                 |
| `success`             | `#12B76A`       | `#16DB8A`       | Online / done                         |
| `warning`             | `#F79009`       | `#FFB020`       | Caution / pending                     |
| `danger`              | `#F04438`       | `#FF6A60`       | Error / destructive                   |
| `info`                | `#2E90FA`       | `#53B1FD`       | Informational                         |

Replace `action-primary` with the product's actual brand hue. Verify every text/bg pair meets WCAG AA (4.5:1 body / 3:1 ≥18px or bold ≥14px / UI components).

## Typography

Single type family preferred (e.g. Inter or product face). One display face allowed for hero/brand only.

| Token            | Size / Line         | Weight  | Use                      |
|------------------|---------------------|---------|--------------------------|
| `display-2xl`    | 72 / 80             | 700     | Hero headline            |
| `display-xl`     | 60 / 68             | 700     | Marketing hero           |
| `display-lg`     | 48 / 56             | 700     | Page title (desktop)     |
| `heading-xl`     | 36 / 44             | 600     | H1                       |
| `heading-lg`     | 30 / 38             | 600     | H2                       |
| `heading-md`     | 24 / 32             | 600     | H3 / section title       |
| `heading-sm`     | 20 / 28             | 600     | H4 / card title          |
| `body-xl`        | 18 / 28             | 400     | Lead paragraph           |
| `body-lg`        | 16 / 24             | 400     | Body (desktop default)   |
| `body-md`        | 14 / 22             | 400     | Body (mobile default)    |
| `body-sm`        | 13 / 20             | 500     | Labels, captions         |
| `caption`        | 12 / 18             | 500     | Metadata, timestamps     |
| `overline`       | 11 / 16 · letter-spacing 0.08em · uppercase | 600 | Section eyebrows |

Minimum body size 14px (mobile) / 16px (desktop). Never go below 12px.

## Spacing (8pt grid)

`0 · 2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`

- `4` — icon internals only
- `8` / `12` — tight grouping, inline gaps
- `16` — default component padding
- `24` / `32` — section / card spacing
- `48`+ — page-level rhythm

## Radius

| Token        | Value | Use                          |
|--------------|-------|------------------------------|
| `radius-none`| 0     | Full-bleed media, tables     |
| `radius-sm`  | 6px   | Inputs, chips, small buttons |
| `radius-md`  | 10px  | Cards, list items            |
| `radius-lg`  | 16px  | Sheets, large cards          |
| `radius-xl`  | 24px  | Modals, hero containers      |
| `radius-full`| 9999px| Pills, avatars, FABs         |

## Elevation / Shadow

| Token     | Shadow                                                          | Use                       |
|-----------|-----------------------------------------------------------------|---------------------------|
| `e0`      | none                                                            | Flat surfaces             |
| `e1`      | `0 1px 2px rgba(16,24,40,.05)`                                  | Sticky headers, hairlines |
| `e2`      | `0 4px 8px -2px rgba(16,24,40,.10), 0 2px 4px -2px rgba(16,24,40,.06)` | Cards, dropdowns   |
| `e3`      | `0 12px 16px -4px rgba(16,24,40,.08), 0 4px 6px -2px rgba(16,24,40,.03)` | Popovers, menus |
| `e4`      | `0 20px 24px -4px rgba(16,24,40,.08), 0 8px 8px -4px rgba(16,24,40,.03)` | Modals        |
| `e5`      | `0 24px 48px -12px rgba(16,24,40,.18)`                           | Toasts, FAB, drag preview |

In dark themes, prefer subtle `1px` border + low-opacity shadow over heavy drop shadows.

## Motion

| Token             | Duration | Easing                       | Use                          |
|-------------------|----------|------------------------------|------------------------------|
| `motion-instant`  | 0ms      | —                            | Color, opacity snaps         |
| `motion-fast`     | 100ms    | `ease-out`                   | Hover, press, toggle         |
| `motion-base`     | 200ms    | `cubic-bezier(.2,.8,.2,1)`   | Sheets, dropdowns, fades     |
| `motion-slow`     | 320ms    | `cubic-bezier(.2,.8,.2,1)`   | Page transitions, modals     |
| `motion-expressive`| 400ms   | `cubic-bezier(.34,1.56,.64,1)`| Spring/overshoot, hero entry |

Keep motion ≤ 400ms for UI. Respect `prefers-reduced-motion` — collapse to instant/crossfade.

## Iconography

- One stroke-based set, consistent **2px** stroke at 24×24 viewBox, rounded joins/caps.
- Optical alignment: icons sit in a 20px safe area inside the 24px box.
- Sizes: `16 · 20 · 24 · 32`. Never scale below 16px for tappable affordances.
- Pair every icon with a text label in dense data views; icon-only buttons need `aria-label`.

## Z-Index scale

`base 0 · sticky 100 · dropdown 200 · drawer 300 · modal 400 · toast 500 · tooltip 600`. Never invent values between.
