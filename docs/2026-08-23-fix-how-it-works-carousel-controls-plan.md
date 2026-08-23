# Fix How It Works Carousel Controls Plan

## Purpose

Restore working navigation for the How Ventra Works image carousel after the cards began fitting exactly within the track.

## Root Cause

The local carousel CSS removes the upstream trailing space from the final card wrapper. With three cards sized to the available desktop width, the scroll container reports no overflow and disables both arrow controls.

## Changes

1. Preserve card widths and add a trailing margin after the final guide card so the track has a real scroll range.
2. Keep the right control enabled while the browser has not produced measurable dimensions, then let the resize measurement determine its final state.
3. Add accessible labels to the previous and next controls.

## Verification

- Add a regression assertion for an enabled, named next control.
- Run focused and full tests, production build, lint, and the Impeccable detector.
- Reproduce the interaction in the live preview and confirm the scroll position changes after pressing the next control.
