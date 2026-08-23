# Inviting Baseline Preview Plan

## Purpose

Create a comparison branch from the previous Ventra landing page and carry over only the visual elements approved from the current redesign: the Ventra color tokens, typography, and footer treatment. Preserve the previous landing page's composition and interactions so the comparison isolates visual language rather than becoming another full redesign.

## Scope

- Base branch: `frontend-migration`.
- New branch: `inviting-baseline`.
- Preserve the previous split hero, animated event hero behavior, browse cards, How It Works section, create interface, detail dialog, upload flow, and login route.
- Replace brand text with `Ventra` where it is visible.
- Port the current Ventra logo, wording, cobalt, tangerine, leaf, paper, ink, font, focus, and shadow tokens.
- Port the current footer structure and treatment without importing the route-board sections.
- Keep the current route-board branch untouched.

## Chunks

1. Add the plan and inspect the baseline source.
2. Port tokens, fonts, and Ventra naming into the baseline shell.
3. Rebuild only the footer using the approved current treatment.
4. Run tests, lint, build, and the Impeccable detector.
5. Start a separate preview server on port `5177` and report the comparison URL.

## Acceptance Criteria

- The page still reads as the previous landing page in layout and interaction.
- The colors and font voices match the current Ventra redesign.
- The footer matches the current Ventra footer treatment and uses Ventra branding.
- No route-board-specific hero, browse, or transfer layout is copied into this branch.
- Desktop and mobile styles do not introduce overflow or clipped text.
- `npm test`, `npm run lint`, `npm run build`, and the Impeccable detector pass.

## Verification Notes

- `npm test`: 8 files and 13 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Impeccable detector: no findings for the changed UI targets.
- Preview: `http://127.0.0.1:5177/` on the `inviting-baseline` branch.
