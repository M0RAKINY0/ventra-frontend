# Ventra Frontend

The Ventra web app for finding events, reserving tickets, and running events on the night. It talks to the Ventra API in `ticketflow-source` and uses the photo-first design described in `DESIGN.md`. The same pages work on phones and desktops.

The home page at `/` is the Figma landing page (`src/pages/LandingPage.tsx`, with sections in `src/components/hero` and `src/components/home`, styled by `src/App.css`). It still runs on the demo events in `src/data/events.ts`. Browse with live events is at `/events`.

## What it does

- Browse published events with search, category and date filters.
- Reserve up to 10 tickets of one type without an account, using a name and email, then show each QR code at the door.
- Open a reservation from the link in the ticket email (`/reservations/:id?token=...`). No login needed.
- Optionally sign in from the event page, the confirmation, or the reservation page. A guest reservation then saves to the account and shows under My tickets as well as in the email.
- Open an event from its shareable link, `/e/:slug`. Organizers copy that link from the event page or from Hosting. `/events/:id` still works.
- Get ticket links sent again at `/find-tickets`, for guests who lost the email. The page answers the same way for every address.
- Sign up with email and a 6-digit code, log in with email or Google, and sign out.
- Reset a forgotten password by email (`/forgot-password`, then `/reset-password` from the emailed link).
- Change your name or password at `/account`.
- Create draft events, add ticket types, publish, and cancel (Hosting).
- See reservation totals per event and per ticket type, page through attendees, and export them as CSV (Hosting, Sales and Attendees tabs).
- Check people in by scanning ticket QR codes with the camera, or by pasting the code.
- Admins can change user roles and cancel any event.

Ventra doesn't take payments. Reserving holds your spots. Sales figures are the price of reserved tickets, not money collected.

`/terms` and `/privacy` exist but still show a draft notice. Their text lives in `src/content/legal.ts`.

The slug link, ticket recovery, password reset, sales, attendees and CSV export need the `backend-completion` branch of the API.

## Run it

Start the API first (see `ticketflow-source/README.md`). It needs PostgreSQL, Redis, and a `.env` with `FRONTEND_ORIGINS=http://localhost:5173`. Then:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173/`. In development, Vite forwards `/api` requests to `http://localhost:4000`, so the Better Auth session cookie works without CORS changes. Set `VENTRA_API_PROXY_TARGET` to point the proxy somewhere else.

For a production build served from a different origin than the API, set `VITE_API_URL` at build time and add the frontend origin to the API's `FRONTEND_ORIGINS`. The API builds ticket email links from the first origin in that list, and password reset only works from origins on it.

### Checkout bot check

The API verifies a Cloudflare Turnstile token before it holds tickets. Set `VITE_TURNSTILE_SITE_KEY` at build time to the site key that pairs with the API's `TURNSTILE_SECRET_KEY`. The event page then shows the widget with action `checkout` and sends its token as `turnstileToken`. Every attempt uses a fresh token.

Leave the variable unset in development. No widget shows and no token goes out, which the API accepts only when it has no Turnstile secret and isn't in production mode.

### Hosting

`vercel.json` sends every path to `index.html`, so links like `/e/my-event` and the emailed reset and ticket links open directly. Another static host needs the same fallback.

## Checks

```bash
npm test
npm run lint
npm run build
```

## Structure

- `src/lib/api.ts` is the typed API client. Errors come back as `ApiError` with the API's `code`.
- `src/lib/auth.ts` wraps the Better Auth endpoints under `/api/v1/auth`.
- `src/lib/session.tsx` loads the signed-in user from `/api/v1/me`.
- `src/lib/router.tsx` is a small history router. Routes live in `src/App.tsx`.
- `src/lib/datetime.ts` converts between event-local wall-clock times and UTC.
- `src/components/shell.tsx` has the photo header, glass navigation, and the phone tab bar.
- `src/pages/` has one file per screen.
- `src/components/hosting/` has the Sales and Attendees tabs of the manage event screen.
- `src/components/ShareLink.tsx` is the copyable event link.
- `public/events/` holds category photos used when an event has no cover image.

Camera scanning uses the browser's `BarcodeDetector`, which Chrome on Android supports. Browsers without it, including Safari and Firefox, show a paste box instead.
