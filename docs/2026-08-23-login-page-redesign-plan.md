# Ventra Auth Page Redesign

## Goal

Replace the existing centered `/login` placeholder with a Ventra-branded,
responsive authentication surface inspired by the referenced Dribbble split
layout. The page remains client-only and provides sign-in and sign-up demo
states without implying a real authentication provider.

## Decisions

- Keep `/login` and the existing Back to Ventra behavior.
- Use a desktop two-column layout: auth task on the left, event-led visual panel
  on the right.
- Support `sign-in` and `sign-up` modes in one page.
- Include a demo `Continue with Google` action plus email/password forms.
- Provide a visible visual exploration selector with `event`, `city`, and
  `signal` variants; `event` is the default.
- Hide the visual panel on narrow screens so the form remains the primary task.
- Reuse existing Ventra tokens, fonts, logo, event data, and local imagery.
- Show local success feedback after valid form or social submission; no backend,
  session, OAuth, or persistence is added.

## Implementation Order

1. Add typed auth modes, visual modes, and behavior tests first.
2. Implement the auth form and split-screen visual panel.
3. Pass a deterministic featured event from `App` into `/login`.
4. Update `DESIGN.md` and `README.md` for the new auth surface.
5. Run full tests, build, lint, browser checks, and the Impeccable detector.

## Acceptance Criteria

- Sign-in and sign-up transitions expose the correct fields and copy.
- Email validation, required fields, keyboard focus, and live status feedback
  work without a backend.
- The three visual variants switch through accessible pressed-state controls.
- Desktop shows a balanced split layout; mobile hides the visual panel without
  horizontal overflow.
- Existing reservation routing still reaches `/login`, and Back to Ventra
  returns to the discovery page.
