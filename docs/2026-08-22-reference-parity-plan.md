# Reference Parity Pass Plan

## Purpose

Bring the `inviting-baseline` comparison branch closer to the supplied Ventra reference captures while preserving its previous landing-page composition and existing event interactions.

## Reference Areas

- Use the cobalt route-mark logo, Ventra lockup, numbered navigation, and `Create a plan` action from the current header reference.
- Use the current hero hierarchy and wording while keeping the existing animated event panel beside it.
- Add the three-dot `A little time well spent.` proof treatment and route-style event-card sequence/category labels.
- Fit the current `Share something` create section language and station layout around the existing inline create form.
- Keep the existing dark footer, detail dialog, login route, upload flow, and mobile behavior working.

## Chunks

1. Port the reference header lockup and navigation geometry.
2. Align hero copy, route proof, and featured event framing.
3. Add route-style event card metadata without changing the event data contract.
4. Reshape the create section around the existing form and current wording.
5. Verify tests, lint, build, detector, and responsive overflow in the live preview.

## Acceptance Criteria

- The supplied logo, wording, and visual treatments are recognizable in the comparison branch.
- The previous landing page still owns the overall page structure and interactions.
- Existing event expansion, creation, upload, reservation, and carousel behavior remain functional.
- Desktop and narrow preview widths contain text and media without unintended horizontal overflow.

## Verification Notes

- `npm test`: 8 files and 13 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Impeccable detector: no findings for the changed UI targets.
- Live preview: `http://127.0.0.1:5177/`.
