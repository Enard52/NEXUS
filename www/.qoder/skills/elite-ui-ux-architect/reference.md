# Component & State Reference

## Reusable Components

Design and reuse production-ready components:

### Interactive Controls
- Buttons (primary, secondary, ghost, icon, FAB)
- Inputs (text, number, password, search, multiline)
- Selects and Dropdowns
- Toggles, Checkboxes, Radio Buttons
- Sliders and Range Inputs
- Date/Time Pickers
- File Upload

### Navigation
- Navigation Bars (top, bottom)
- Sidebars and Drawers
- Tabs and Segmented Controls
- Breadcrumbs
- Pagination

### Data Display
- Cards (content, media, action)
- Tables and Data Grids
- Charts and Graphs
- Lists (simple, complex, grouped)
- Badges and Tags
- Avatars

### Feedback & Overlays
- Dialogs and Modals
- Bottom Sheets
- Tooltips and Popovers
- Toasts and Snackbars
- Notifications
- Progress Indicators (linear, circular, steps)

### Layout
- Accordions and Collapsibles
- Dividers
- Skeleton Screens
- Empty States
- Error Boundaries

## State Patterns

Every component must account for these states:

### Interaction States
- Default / Resting
- Hover
- Pressed / Active
- Focused (with visible focus ring)
- Disabled
- Loading
- Selected

### Page-Level States
- **Loading**: Use skeleton screens that match the content layout. Avoid spinners for full-page loads.
- **Empty**: Provide illustration, explanation, and primary action. Never show a blank screen.
- **Error**: Show what went wrong, why, and how to recover. Include retry action.
- **Success**: Confirm the action and guide to next step.
- **Offline**: Indicate connectivity loss, show cached content where possible, queue actions.
- **Partial Data**: Handle gracefully with placeholders for missing sections.

### Form States
- Pristine (untouched)
- Dirty (modified)
- Validating
- Valid
- Invalid (with inline error message)
- Submitting
- Submitted

## Motion Guidelines

- Use motion to communicate, not decorate
- Entry: 200-300ms ease-out
- Exit: 150-200ms ease-in
- Transitions: 200-400ms ease-in-out
- Avoid motion for purely aesthetic purposes
- Respect `prefers-reduced-motion`
- Never block user interaction during animation

## Responsive Breakpoints

| Breakpoint | Target |
|------------|--------|
| < 480px | Mobile portrait |
| 480-768px | Mobile landscape / Small tablet |
| 768-1024px | Tablet |
| 1024-1440px | Laptop / Desktop |
| > 1440px | Large desktop / Ultra-wide |

### Responsive Patterns
- Stack columns on mobile, use grid on desktop
- Convert sidebars to bottom sheets or drawers on mobile
- Replace hover interactions with tap/long-press on touch
- Scale typography: mobile 14-16px body, desktop 16-18px body
- Ensure minimum touch target 44x44px on mobile

## Design Token Naming Convention

```
{category}-{property}-{variant}-{state}

Examples:
color-background-primary-default
color-text-secondary-disabled
spacing-padding-md
radius-card-lg
shadow-elevation-2
typography-heading-xl
```
