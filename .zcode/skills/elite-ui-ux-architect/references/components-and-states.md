# Components & State Patterns

Component library contract: every component ships with **variants** × **states** × **sizes**. If a state isn't designed, it will look broken in production.

## Universal states (every interactive component)

`default · hover · focus-visible · active/pressed · focused · disabled · loading · error · readonly · selected`

Design each. `focus-visible` (keyboard) differs from `focused` (mouse) only when meaningful.

## Buttons

| Variant   | When to use                                   |
|-----------|-----------------------------------------------|
| Primary   | One per screen — the main forward action      |
| Secondary | Alternative/secondary forward actions         |
| Tertiary  | Low-emphasis, inline, or in dense toolbars    |
| Ghost     | On colored/branded backgrounds                |
| Danger    | Destructive (delete, disconnect) — confirm    |

Sizes: `sm (32h) · md (40h) · lg (48h)`. Min width 96px. Icon+label buttons: 8px gap. Icon-only: 40×40 minimum, `aria-label` required.

## Inputs

- Label always visible above the field (not placeholder-only).
- Helper text below; error text replaces helper in `error` state, in `danger` color + icon.
- Required indicator: `*` after label, never color alone.
- Affordance prefix (icon, currency) inside the field, left-aligned.
- Clear (`×`) button appears on input when content present.
- Char counter only when there's a limit the user must respect.

## Cards

Container for grouped content. Use `bg-surface`, `radius-md/lg`, `e2`. Card variants: `default · outlined · interactive (hover=e2→e3, cursor pointer) · selected`. Never nest cards more than two levels deep.

## Lists

- Row height tiers: `dense 48 · comfortable 56 · spacious 72`.
- Leading: icon/avatar/checkbox. Trailing: meta + chevron/disclosure.
- Swipe actions (mobile): primary (left→right) + destructive (right→left) with confirm.
- Empty list ≠ "no screen". Show empty state with next action.

## Navigation patterns

| Surface  | Primary nav          | Secondary           |
|----------|----------------------|---------------------|
| Desktop  | Left rail / top bar  | Tabs, breadcrumbs   |
| Web      | Top bar              | Tabs, in-page nav   |
| iOS      | TabBar (≤5) / sidebbar on iPad | NavigationStack, sheet |
| Android  | NavigationBar (≤5) / NavigationRail on tablet/foldable | Top app bar, bottom sheet |

Bottom nav: 3–5 destinations, icon + label always visible, active state uses brand color + weight/indicator. Never exceed 5.

## Modal vs Sheet vs Drawer vs Toast

| Pattern | Trigger               | Placement | Dismissal                          |
|---------|-----------------------|-----------|------------------------------------|
| Modal   | Blocking action/confirm | Center    | Esc / scrim tap / explicit button  |
| Sheet   | Add/edit, filters     | Bottom (mobile), side (desktop) | Scrim, drag-down, Esc |
| Drawer  | Persistent nav/detail | Side      | Scrim or toggle                    |
| Toast   | Non-blocking feedback | Bottom/top| Auto-dismiss 4–8s, swipe to clear  |

One modal at a time. Never stack modals; escalate to a flow instead.

## Empty states

Every list/dashboard has an empty state. Structure: **illustration/icon → headline → explanation → primary CTA → secondary link**. Be specific ("No devices paired yet") not generic ("Nothing here").

## Loading states

- Skeletons for initial page/list loads (match final layout, shimmer `motion-base`).
- Inline spinners for button/row actions.
- Progress bars for deterministic uploads/installs (always show %).
- Never block the whole screen for a partial update.

## Error states

- Inline field errors (closest to input).
- Full-page error: icon → code/title → explanation → retry CTA → "contact support".
- Network/offline banner: persistent, dismissible once resolved, doesn't block.
- Destructive errors need confirmation before applying.

## Offline state

- Cache last-known data; show stale indicator ("Updated 2m ago · offline").
- Queue writes, show "will sync when online", flush silently on reconnect.
- Never show a hard error for transient connectivity loss.

## Smart-home / IoT device status

| Status     | Color    | Icon              | Pattern                                   |
|------------|----------|-------------------|-------------------------------------------|
| Online     | success  | dot / check       | Solid dot, available to control           |
| Offline    | fg-disabled | dot (outline)  | Greyed, controls disabled with tooltip    |
| Updating   | info     | spinner / arrow   | Progress ring + "Updating 42%"            |
| Error      | danger   | alert triangle    | Red badge + tap for detail                |
| Low battery| warning  | battery           | Icon + % when < 20%                       |
| Connecting | info     | pulsing dot       | Animated, "Connecting…" caption           |

One-tap primary action per device (toggle). Long-press / chevron → detail. Group by room; rooms collapse.
