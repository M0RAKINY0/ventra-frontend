# Product

<!-- impeccable:product-schema 1 -->

## Platform

web (responsive, phone and desktop)

## Stack

delegated: Vite + React + TypeScript with Tailwind CSS v4 and lucide-react icons.
Data comes from the Ventra API (`ticketflow-source`, Express + Prisma + Better Auth).

## Users

People looking for a social event to go to in their city, and the organizers who
run those events and check people in at the door. Admins manage roles and can
cancel any event.

## Product Purpose

Find an event, reserve a spot, and get in with a QR code. Organizers create
drafts, add ticket types, publish, and scan tickets on the night.

## Positioning

Photo-first: the event's own photography is the main content on every screen.
The interface stays out of the way on frosted panels.

## Capabilities and Constraints

- One reservation holds up to 10 tickets. The API accepts several ticket
  types per reservation, and the event page sends one type at a time.
  Reservations send an `Idempotency-Key` so a retry can't double-book.
- Guests reserve with a name and email and no account. Their ticket email
  links to `/reservations/:id?token=...`, which shows every QR code.
  Signed-in `USER` accounts reserve under their account. Admin accounts
  can't reserve.
- Signing in is optional at every step. A guest who signs in afterwards can
  save the reservation to their account, so the tickets live in both the
  email and My tickets.
- There are no payments. Prices are informational.
- Sign-up requires a 6-digit email code before the first sign-in.
- Drafts are editable. Published events lock their details and ticket types.
- Cancelling an event leaves ticket rows as they were. The UI treats tickets for
  a cancelled event as void.
- Cover images are HTTPS links. There's no upload endpoint yet. Events without a
  cover fall back to local category photos in `public/events/`.
- No password reset or profile editing yet. The API doesn't support them.

## Brand Commitments

- The product label is `Ventra`.
- Headlines keep the existing voice: "Find a plan you will be glad you made.",
  "Keep your next plan close.", "Make room for a good plan."

## Product Principles

- Let the event photo carry the screen. Controls sit on frosted panels.
- Tell people what happened, in plain words, after every action.
- Keep actions reachable with a thumb on phones: bottom tab bar and bottom
  action bars.
- Treat the API as the authority for permissions, inventory and ticket status.

## Accessibility & Inclusion

Keyboard access, visible focus, 44px minimum touch targets, labelled inputs with
linked error messages, readable contrast for text on photos (always over a
scrim), reduced-motion support, and layouts that hold at 320px wide.
