# Ventra design: photo-first

Event photography carries the interface. Most screens open on a full-bleed photo with the title set over it, and a light panel slides up over the bottom of the photo to hold the controls. The prototype for every screen, on desktop and phone, is the "Photo-first" rows of the Ventra design canvas.

This covers the app pages under `src/pages/`. The landing page at `/` keeps its own Figma styles (`--rd-*` tokens and `src/App.css`).

## Layout

- **Photo header.** Full-bleed image, dark scrim top and bottom (`.scrim-hero`), white text anchored to the bottom. The site header sits on top of it.
- **Sheet.** The content panel after a photo header overlaps it by 32px on phones and 48px on desktop, with 28px and 40px top corners (`Sheet` in `components/ui.tsx`).
- **Width.** Content sits in a 1320px container with 16px, 24px or 40px side padding by breakpoint.
- **Detail screens** (event, ticket, manage) put the main information on the left and an action card on the right. Below 900px or so they stack.

## Navigation

- From `md` up, a frosted glass pill (`.glass`) in the header holds Browse, My tickets, Hosting, Check-in, and Admin (admins only). The current page shows as a white pill.
- On phones the header keeps only the logo and account button. A frosted tab bar floats at the bottom (`MobileTabBar`). Detail screens hide it and show their own bottom action bar instead.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `ink` | `#17231f` | Text, primary buttons, dark backgrounds |
| `paper` | `#f4f6f2` | Page and sheet background |
| `cream` | `#fffdf7` | Text on dark buttons, frosted cards |
| `cobalt` | `#2148d8` | Links and focus rings |
| `tangerine` | `#f36c42` | "Few left" badges |
| `lime` | `#e4efc9` | Ready, live and success states |
| `danger` | `#bf4438` | Destructive actions and errors |

Status pills: ready and live use lime, issuing uses `#fbe6c8`, cancelled uses `#f8dcd6`, draft and used use white.

## Type

- Display: Archivo Black, for page titles and titles over photos. Sizes use `clamp()` so a 84px desktop title drops to about 36px on a phone.
- Interface: DM Sans.
- Ticket codes: Space Mono.

## Components

- `.pill` buttons are fully rounded, at least 52px tall, in `pill-dark`, `pill-light`, `pill-soft`, `pill-danger` and `pill-danger-soft`.
- `.chip` filters use `aria-pressed`. `.segmented` tab groups use `aria-selected`.
- `.field` inputs are 52px tall with 16px corners. Errors set `aria-invalid` and show a message linked with `aria-describedby`.
- Photo tiles are 3:4 on desktop and 4:3 on phones, with the date in a glass chip and the title over a bottom scrim.

## Accessibility

- Every interactive element is a real button, link or input, at least 44px tall.
- White text only sits on photos behind a scrim.
- Focus rings are cobalt on light backgrounds and leaf green (`.on-photo`) on photos.
- `prefers-reduced-motion` removes the image zoom and spinner motion.
