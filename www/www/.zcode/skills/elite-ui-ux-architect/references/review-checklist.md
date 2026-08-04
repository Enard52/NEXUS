# Internal Review Checklist

Run silently before presenting any design. Revise until every applicable check passes. Do not expose this process unless the user asks.

## Consistency
- [ ] Brand color, logo, and wordmark used correctly (see brand-guidelines.md)
- [ ] One type family (+ optional display), scale respected, no rogue sizes
- [ ] Color comes from semantic tokens, not raw hex
- [ ] Icon set consistent (stroke, corners, size, optical alignment)
- [ ] Components reused — no one-off variants that duplicate an existing component
- [ ] Navigation pattern consistent across the flow
- [ ] Motion duration/easing matches tokens

## Cross-platform & system compliance
- [ ] iOS version respects HIG (nav, sheets, 44pt targets, Dynamic Type, safe area)
- [ ] Android version respects Material 3 (nav bar/rail/drawer, sheets, 48dp targets, font scale)
- [ ] Web is keyboard-first and responsive
- [ ] Desktop is dense, windowed, shortcut-rich
- [ ] All versions share brand/tokens/components but feel native

## Accessibility (WCAG AA)
- [ ] Body text ≥ 4.5:1, large/UI ≥ 3:1 contrast
- [ ] Keyboard path reaches every action; visible focus ring
- [ ] Touch targets ≥ 44pt (iOS) / 48dp (Android)
- [ ] No color-only communication (icon + text + color)
- [ ] Labels present; icon-only buttons have aria-labels
- [ ] Respects dark mode, reduced motion, increased contrast

## Responsive
- [ ] Breakpoints defined; behavior stated at each
- [ ] No overflow, overlap, or broken layout at any size
- [ ] Typography and spacing scale sensibly down to the smallest supported width

## Scalability & developer feasibility
- [ ] Layout is implementable with the chosen stack (no impossible CSS)
- [ ] Token references provided (not raw values)
- [ ] Components map 1:1 to code; variants × states complete
- [ ] Animations are realistic and respect reduced-motion
- [ ] Accommodates future content (longer text, more items, new sections)

## Information hierarchy & interaction
- [ ] One clear primary action per screen
- [ ] Visual hierarchy leads the eye to the primary action
- [ ] Progressive disclosure used for advanced/secondary options
- [ ] Whitespace intentional; layout uncluttered
- [ ] Errors prevented (input constraints, confirmations on destructive actions)
- [ ] Immediate feedback for every action

## States coverage
- [ ] Empty state designed (specific copy + CTA)
- [ ] Loading state designed (skeleton/spinner, non-blocking)
- [ ] Error state designed (inline + full-page)
- [ ] Offline state designed (stale data + queue + reconnect)
- [ ] No-permission / no-data variants handled
