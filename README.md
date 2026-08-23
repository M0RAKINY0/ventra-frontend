# Ventra Frontend

Ventra Frontend is the client-only Vite + React + TypeScript event-discovery app. This `inviting-baseline` branch keeps the previous landing-page composition while applying the current Ventra logo, voice, palette, typography, and footer treatment for visual comparison. It presents local demo plans, opens event details, explains the browse-to-create journey, lets a user publish an event with an image preview, and includes a split-screen `/login` experience with sign-in and sign-up demo states. New events live in memory and intentionally reset on refresh.

## Stack

- Vite, React, TypeScript
- Tailwind CSS v4 and shadcn/ui primitives
- Aceternity animated testimonials, expandable-card, Apple cards carousel, and file-upload foundations
- Motion for interaction transitions
- Oxlint and Vitest for checks

## Run It

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173/` by default.

## Checks

```bash
npm test
npm run lint
npm run build
```

## Product Structure

- `src/types/events.ts` contains the event and draft contracts.
- `src/types/auth.ts` contains the auth mode and visual preview mode contracts.
- `src/data/events.ts` contains the five seeded demo events and three how-it-works steps.
- `src/components/events/` contains the extracted event primitives and feature adapters, including the shared create form and compact wheel pickers.
- `src/components/auth/` contains the reusable auth form and event-led visual panel used by `/login`.
- `src/components/ui/` contains shadcn and Aceternity-derived primitives.
- `public/events/` contains local demo photography so the experience does not depend on a remote image service.
- `DESIGN.md` records the visual system used by this comparison branch.

Event details open from the full browse-card surface and use a shared blurred dialog. The Reserve event action routes to `/login`; authentication is intentionally not connected yet. The auth page supports sign-in and sign-up modes, a clearly labeled demo Google action, native email validation with inline feedback, and three visual preview treatments without creating sessions or persisting credentials. The How it works cards remain static while their Apple carousel track stays horizontally navigable. The `Put it on the map` section renders the reusable create form inline, while the header and hero shortcuts open the same form in a drawer. The hero media stack stays contained inside its white frame, and the create form pairs related fields to keep the interface compact.

## Image Upload

The create form accepts one JPEG, PNG, or WebP image up to 5 MB. Dates and times are selected with compact iOS-inspired wheel controls rather than typed manually; the date month wheel shows each available month once and keeps its selected day linked. The preview uses a local object URL, supports replacement and removal, and is owned by the in-memory event after publish. There is no backend or persistent storage in this slice.

## Comparison Branch

The `inviting-baseline` branch is intentionally separate from the `redesign` route-board branch. It is a preview branch for evaluating the current Ventra colors, fonts, and footer on the earlier landing-page layout; it is not intended to merge the two page structures automatically.
