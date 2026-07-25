# Deliverables Templates

Use these structures when presenting a design. Trim sections that don't apply rather than padding. Keep every section scannable.

## 1. User Flow

```
[Entry point] → [Step 1: action] → [Decision]
                                  ├─ yes → [Step 2] → [Success state]
                                  └─ no  → [Recovery / error path]
```
Note branch conditions, what triggers each step, and exit points (cancel/back/abandon). Mark the happy path explicitly.

## 2. Information Architecture

Tree of screens grouped by section. Show depth (max 3 taps to primary content). Annotate shared components across screens.

```
App
├── Home (dashboard)
├── Devices
│   ├── Rooms
│   └── Device detail
├── Automations
└── Settings
```

## 3. Wireframe / Hi-Fi description

For each screen: **purpose (1 line) → layout (grid/columns) → components → primary action → secondary actions**. Use ASCII or structured bullets; a designer should be able to rebuild it.

## 4. Design System decisions

List tokens chosen and why: color role assignments, type scale used, spacing rhythm, elevation, motion. Reference `design-system-tokens.md` token names.

## 5. Component breakdown

Table: Component · Variant · States · Props · Used on. Maps 1:1 to a frontend component file.

| Component       | Variant   | States                              | Props                | Used on          |
|-----------------|-----------|-------------------------------------|----------------------|------------------|
| Button          | Primary   | default,hover,focus,disabled,loading| label,icon,onClick   | Every CTA        |
| DeviceCard      | Interactive| default,hover,selected,offline      | device,status,onToggle| Home, Devices   |

## 6. Platform versions

For each platform (Desktop / Web / Android / iOS): what changes — layout, nav pattern, component mapping, gestures, native affordances. Reference `cross-platform-patterns.md`.

## 7. Responsive behavior

Breakpoints + what reflows at each. State explicitly: nav collapse, grid column count, which components hide/transform, touch-target resize, font scale.

| Breakpoint | Layout change                                           |
|------------|---------------------------------------------------------|
| ≥1280      | 3-pane: sidebar · list · detail                         |
| 1024–1279  | 2-pane: sidebar · list/detail tabs                      |
| 768–1023   | Single pane, bottom nav, sheets                         |
| <768       | Single column, FAB, bottom nav, stacked cards           |

## 8. Accessibility notes

Contrast ratios (cite pairs), keyboard path, screen-reader labels, focus order, touch target sizes, reduced-motion behavior, color-independence (icon+text+color).

## 9. Developer handoff

- Token references (not raw values)
- Component variants × states × sizes table
- Spacing on the 8pt grid
- Asset list with formats (SVG for icons, @1x/@2x/@3x or vector for logos)
- Interaction specs (hover/focus/disabled/loading) with motion tokens
- Edge cases + empty/loading/error/offline states

## 10. Edge cases & states

For every screen enumerate: **empty · loading · error · offline · no-permission · single-item · many-items · very-long-content · destructive-confirm**. One line each on how it's handled.

## 11. Future scalability

What the design accommodates without rework: new sections, more device types, more data, localization (text expansion), RTL, dark mode, larger type.
