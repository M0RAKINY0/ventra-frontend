# Remove Event Labels and Adjust How It Works Copy Plan

## Purpose

Correct the latest visual interpretation without disturbing the existing rounded card treatment or event interactions.

## Changes

1. Remove category badges such as `Markets` and `Film` from event cards and event detail dialogs.
2. Remove category text from the animated hero metadata while retaining the event city.
3. Reverse the added How It Works wrapper padding, border, and background treatment.
4. Add a small inset to the text overlay rendered on each How It Works image so its title and label do not hug the top-left corner.

## Verification

- Add regression assertions that event category badges and hero category metadata are not rendered.
- Run the focused tests, full test suite, production build, lint, and the Impeccable detector.
- Check the live preview for restored carousel geometry, readable overlay spacing, and no horizontal overflow.
