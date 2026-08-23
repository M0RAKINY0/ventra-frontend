# Navigation and Section Cleanup Plan

## Purpose

Apply the latest Ventra visual corrections without changing the existing page structure or event interactions.

## Changes

1. Remove numeric prefixes from the primary navigation and section labels while keeping the navigation destinations and readable labels.
2. Remove the create-section callout row shown in the supplied reference, including its icon and supporting label, while preserving the create form and its action.
3. Remove event card sequence numbers so categories and titles carry the visual hierarchy.
4. Use the display font for event category badges and hero event metadata so category labels align with event-title typography.
5. Add horizontal and vertical breathing room around the How It Works carousel while preserving its rounded cards and intentional horizontal scrolling.

## Verification

- Add a regression assertion that event cards no longer render sequence markers.
- Run the focused test, full test suite, production build, lint, and the Impeccable detector.
- Inspect the running desktop and mobile layouts for spacing, overflow, and preserved navigation behavior.
