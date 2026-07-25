# Cross-Platform Native Patterns

The product must feel native on each platform while sharing brand, tokens, and component DNA. Never port one platform's idioms wholesale onto another.

## iOS — Apple Human Interface Guidelines

- **System**: SF Pro (text), SF Symbols (icons). Respect Dynamic Type and Safe Area insets.
- **Navigation**: `NavigationStack` push/pop; `TabView` (≤5); sheets (`.sheet`, `.fullScreenCover`) and `popover` on iPad.
- **Modal**: bottom sheet detents (medium `.fraction(0.5)`, large `.large`); swipe-to-dismiss default ON.
- **Bars**: large-title collapsible nav bar; toolbar trailing/leading actions; tab bar translucent + blur.
- **Touch targets**: 44×44pt minimum.
- **Gestures**: swipe-to-go-back (edge), pull-to-refresh, swipe actions on rows.
- **Selection**: single via tap; multi via edit mode + checkmarks. Context menu (long press) for actions.
- **Haptics**: light/medium impact for taps, success/warning/error notifications, selection feedback for pickers.
- **Search**: `searchable` modifier, search scope bar.
- **Settings**: iOS Settings bundle or in-app grouped form (`Form`, `GroupedListStyle`).
- **Lists**: `List` with sections, swipe actions, disclosure chevrons. Use `InsetGroupedListStyle` for card-style sections.
- **Color & motion**: respect Dark Mode, Reduce Motion, Increase Contrast, Smart Invert. Spring animations (`response: 0.5, dampingFraction: 0.825`).

## Android — Material Design 3

- **System**: Roboto/default; Material Symbols (outlined/rounded). Respect font scale and edge-to-edge insets.
- **Navigation**: `NavigationBar` (mobile ≤5), `NavigationRail` (tablet/foldable), `NavigationDrawer` (large/computing).
- **Top app bar**: small or large (collapsible `LargeTopAppBar`); actions overflow to menu.
- **Modal**: `ModalBottomSheet` with `SheetState` (`.skipPartiallyExpanded` optional); `DatePickerDialog`/`TimePickerDialog`; full-screen `BasicAlertDialog`.
- **Touch targets**: 48×48dp minimum.
- **Gestures**: swipe-to-dismiss (lists), pull-to-refresh (`PullToRefreshBox`), predictive back gesture.
- **Selection**: tap = navigate; long-press or `SelectionContainer` for multi; contextual action bar / bulk mode.
- **FAB**: one primary action, extended or mini; never more than one FAB per screen (exception: dual FAB only with clear separation).
- **Snackbars**: transient feedback with optional single action; 4–8s. Use `SnackbarHost`.
- **Lists**: `LazyColumn` rows with leading/trailing slots; `Divider`/hairline between. Swipe-to-reveal actions.
- **Search**: search bar (docked/expanded) with search view; `SearchBar`.
- **Settings**: grouped preferences, M3 cards, switches/segmented buttons.
- **Color & motion**: Dynamic Color (Material You) optional; M3 motion easing/emphasized tokens; respect `ANIMATOR_SCALE`, remove animations accessibility.

## Web

- **Type/navigation**: top app bar with primary nav; in-page tabs; breadcrumbs for hierarchy.
- **Layout**: responsive grid (12-col desktop, fluid below). Container max-width ~1280–1440 with gutters.
- **Breakpoints** (example, adjust to product): `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
- **Interaction**: keyboard-first. All actions reachable via Tab/Enter/Esc/Space; visible `:focus-visible` rings (≥2px, 3:1 contrast).
- **Modals**: center dialog with focus trap, `Esc` to close, return focus on close. Toasts top-right or bottom-center, `role=status`/`alert`.
- **Forms**: label above input, helper/error below, `autocomplete` attributes, validation on blur + submit.
- **Tables**: sticky header, sortable columns, row hover, empty/loading states, responsive (card-collapse on mobile).
- **Performance**: skeleton screens, lazy images (`loading=lazy`), avoid layout shift (reserve aspect-ratio).
- **A11y**: semantic HTML, ARIA only when semantics are missing, skip-links, `prefers-reduced-motion`, `prefers-color-scheme`.

## Desktop (Electron / native)

- **Density**: higher information density than web. Multiple panes, resizable columns, persistent sidebars.
- **Windowing**: title bar (custom or native), window controls, menubar, command palette (Cmd/Ctrl+K).
- **Keyboard**: extensive shortcuts with discoverability (tooltips, cheatsheet modal). Mnemonics on Windows/Linux.
- **Navigation**: sidebar tree/rail + tabs (document-style), breadcrumbs, back/forward.
- **Modals/dialogs**: native-feeling dialogs, non-blocking toasts in a corner.
- **System integration**: tray icon, global shortcuts, native notifications, drag-drop, deep links, auto-update.
- **Settings**: rich preferences panel, search within settings, reset to defaults.
- **Pointer**: hover affordances, right-click context menus, multi-select with Shift/Cmd.
- **Responsive**: handle small windows gracefully (min size, collapse sidebars, responsive density).

## Shared rules (all platforms)

- Same primary action, same color semantics, same status icons, same empty/loading/error copy structure.
- Respect system dark mode and accessibility preferences automatically; offer manual override.
- Touch targets scale: mobile larger, desktop smaller — but never below platform minimums.
- Animations match the platform's *feel* (iOS spring, M3 emphasized, web/web subtle, desktop snappy) while reusing duration/easing tokens where possible.
