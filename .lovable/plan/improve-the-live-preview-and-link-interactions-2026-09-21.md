# Improve the live preview and link interactions

## What will change
- Rebuild the builder preview as a properly scaled browser-like canvas instead of squeezing the page into a narrow card.
- Add desktop and mobile preview controls plus an expand action, while keeping the preview live as profile, clock, folder, and link settings change.
- Present logo-only links as compact square tiles in a dedicated row inside their folder, so they no longer consume a full link-card width.
- Add purposeful interaction to the finished page: clearer hover/focus feedback, animated link arrows, tactile logo tiles, and accessible keyboard focus states.
- Keep the current executive dashboard styling, page order, colors, downloadable page, and published page behavior.

## Technical details
- Use a scaled fixed-width preview canvas so its internal responsive layout matches the real published page.
- Apply the same mixed full-link and compact-logo layout in the React page and standalone downloaded HTML.
- Verify the builder preview, published page, desktop/mobile layouts, and current build status.
