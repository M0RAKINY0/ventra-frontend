# Ventra Frontend

The Ventra web app for finding events, reserving tickets, and running events on the night. It talks to the Ventra API in `ticketflow-source` and uses the photo-first design described in `DESIGN.md`. The same pages work on phones and desktops.

The home page at `/` is the Figma landing page (`src/pages/LandingPage.tsx`, with sections in `src/components/hero` and `src/components/home`, styled by `src/App.css`). It still runs on the demo events in `src/data/events.ts`. Browse with live events is at `/events`.

## What it does

- Browse published events with search, category and date filters.
- Reserve one ticket per reservation, then show its QR code at the door.
- Sign up with email and a 6-digit code, log in with email or Google, and sign out.
- Create draft events, add ticket types, publish, and cancel (Hosting).
- Check people in by scanning ticket QR codes with the camera, or by pasting the code.
- Admins can change user roles and cancel any event.

Ventra doesn't take payments. Reserving holds a spot.

## Run it

Start the API first (see `ticketflow-source/README.md`). It needs PostgreSQL, Redis, and a `.env` with `FRONTEND_ORIGINS=http://localhost:5173`. Then:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173/`. In development, Vite forwards `/api` requests to `http://localhost:4000`, so the Better Auth session cookie works without CORS changes. Set `VENTRA_API_PROXY_TARGET` to point the proxy somewhere else.

For a production build served from a different origin than the API, set `VITE_API_URL` at build time and add the frontend origin to the API's `FRONTEND_ORIGINS`.

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
- `public/events/` holds category photos used when an event has no cover image.

Camera scanning uses the browser's `BarcodeDetector`, which Chrome on Android supports. Browsers without it, including Safari and Firefox, show a paste box instead.
