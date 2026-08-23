# Ventra Comparison Design System

This comparison branch applies Ventra's current visual language, logo, and voice to the previous landing-page composition. It stays compact, bright, and editorial rather than importing the route-board layout from the current redesign branch.

## Product Signal

Ventra should feel like a living city guide: clear enough to scan quickly, warm enough to make a plan feel inviting, and direct enough that the next action is never ambiguous.

## Brand Voice

- The lockup uses the cobalt route mark, `Ventra`, and the utility tag `A city guide`.
- Hero language is warm and local: `Find a plan you will be glad you made.`
- Section language uses direct invitations: `Plans worth leaving the house for.`, `Three easy moves to a good plan.`, and `Make your next good idea easy to find.`
- Actions use the current product vocabulary: `Browse`, `Create a plan`, `Share a plan`, and `Keep browsing`.
- Navigation and section labels stay unnumbered so the page reads as an invitation rather than a sequence of steps.

## Color Tokens

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#eef1eb` | Cool paper canvas behind the page |
| `foreground` | `#17231f` | Ink text and the dark how-it-works band |
| `primary` | `#2148d8` | Primary actions, links, and focus rings |
| `accent` | `#f36c42` | Editorial signal, selected state, and category emphasis |
| `secondary` | `#e4efc9` | Leaf-green supporting surfaces and status |
| `muted` | `#dfe6dd` | Quiet surfaces and control backgrounds |
| `muted-foreground` | `#5e6f68` | Supporting copy and metadata |
| `border` | `#cad6cb` | Dividers, card edges, and input boundaries |
| `destructive` | `#bf4438` | Inline validation errors |

## Type

- Display: `Archivo Black`, with `Arial Black` fallback.
- Interface: `DM Sans`, with `Segoe UI` fallback.
- Utility labels: `Space Mono`, with `Cascadia Mono` fallback.
- Display headings use a compact negative tracking value and tight line height. Body text uses generous line height for scanning.
- Type size is responsive through layout constraints, not viewport-scaled text.

## Geometry

- Primary radius: `5.6px` (`0.35rem`).
- Event cards use `9px` to preserve a slightly softer frame around photography.
- Buttons and inputs use `6px` to `7px` radii.
- The How It Works cards keep their rounded frames, while overlay copy uses a `40px` inset so titles do not hug the image corner. The track keeps a trailing scroll affordance so its arrow controls remain usable.
- Page sections are full-width bands with constrained inner shells. Cards are reserved for repeated event items, dialogs, and the drawer.
- Media uses stable aspect ratios so loading states and event switching do not resize the layout.
- The featured-event panel keeps the previous rotated media stack and gives it a generous warm-white frame.
- Wheel pickers use a fixed compact height and centered selection band so changing values cannot resize the create form.

## Components

### `EventMedia`

Owns stable image sizing, alt text, and local or object URL sources.

### `EventMeta`

Renders date, time, venue, city, and optional price as a consistent icon-led list.

### `EventBadge`

The category badge primitive remains available for future surfaces, but discovery cards and event detail views intentionally omit category labels.

### `EventActions`

Keeps the primary card action consistent and uses an icon plus a short command label.

### `AnimatedEventHero`

An adapter over Aceternity `AnimatedTestimonials`. It maps `Event` data to the existing content contract and adds controlled active state, autoplay, pause-on-hover/focus, arrow-key navigation, indicators, metadata, and reduced-motion support.

### `ExpandableEventCard`

An event version of the Aceternity standard expandable card pattern. The full card surface is a keyboard-accessible detail trigger, while the actual content lives in one shared dialog with outside-click, Escape, focusable close controls, a soft blurred backdrop, and mobile-safe sizing.

### `HowItWorksCarousel`

Uses the Aceternity Apple cards carousel track with three static local step cards. The track is horizontally scrollable and its controls remeasure after responsive layout and image loading; cards never open a second view.

### `LoginPage`

Provides the `/login` destination for reservation intent until authentication is connected. It keeps the return path obvious and reports that login is demo-only when the placeholder form is submitted.

### `CreateEventDrawer`

Uses shadcn Sheet primitives and the shared `CreateEventForm`. The form owns draft state, field validation, preview URL lifecycle, replacement, removal, and publish handoff in both the inline create surface and the drawer.

### `CreateEventForm`

Keeps the inline and drawer versions identical. Category and price share a
compact basics row, while date and time share a timing row on wider surfaces;
both groups collapse to one column on mobile and narrow drawer widths.

### `Footer`

The footer uses the current Ventra treatment: an ink background, tangerine route mark, muted utility links, and a small coordinate label. It is a full-width band with one constrained row and remains readable when the row stacks on narrow screens.

### `WheelColumn`

Provides the compact iOS-inspired vertical picker primitive. Its selected row sits inside a quiet center band, adjacent values fade into the background, and the column supports snap scrolling plus Arrow, Home, and End keyboard movement.

### `ScrollableDatePicker` and `ScrollableTimePicker`

Compose three linked wheel columns for dates (`weekday`, `day`, `month`) and times (`hour`, `minute`, `AM/PM`). The month column is deduplicated to one option per available month and maps back to the nearest valid date while preserving the selected day when possible. They format directly into the existing event draft strings without adding manual text inputs or changing the publish contract.

## Motion

- Hero transitions use short opacity, scale, and position changes.
- Event cards lift by `4px` on hover.
- Drawer and detail dialogs use short, reversible entrances.
- Autoplay pauses on hover and focus.
- `prefers-reduced-motion: reduce` removes autoplay and compresses animated transitions.
- Wheel movement uses native scroll snapping and compact transitions so it remains usable with reduced motion enabled.

## Accessibility

- Semantic headings and section landmarks are used throughout the route.
- Controls have visible focus rings, accessible labels, and familiar icons.
- Hero arrows and indicators support keyboard navigation.
- Detail dialogs support Escape, outside click, and a focusable close button.
- Browse event cards open from their full surface and expose a keyboard activation path.
- Reserve event routes to the login destination without pretending to complete authentication.
- The create form keeps validation inline and the upload surface supports keyboard activation through the dropzone control.
- Date and time wheels expose listbox options with selected state and keyboard movement; no manual date or time text fields are required.
- Mobile layouts keep the page and dialog within the viewport width; horizontal overflow is limited to the intentionally scrollable Apple card track.

## Imagery

The five local PNGs in `public/events` are deterministic demo assets generated for this slice. They are intentionally free of embedded text and logos so they can be replaced with real event photography without changing component contracts.
