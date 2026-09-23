# Remove weather and add seven-day most visited links

## Changes
- Remove the weather card and all weather editing controls from the dashboard interface.
- Keep Favourite links directly below the clock area.
- Add a “Most visited · last 7 days” section beside Recently opened.
- Store timestamped link opens privately in this browser, scoped to each page, and automatically discard entries older than seven days.
- Rank links by open count, with recent activity breaking ties; show an honest empty state until links are opened.
- Count only links opened through Landing Page Builder because normal browser history is not accessible to websites.
- Preserve existing pages, links, favourites, clocks, publishing, PIN protection, and recent-link behavior.

## Verification
- Confirm favourites, most visited, and recents render cleanly on desktop and mobile.
- Confirm repeated opens change the seven-day ranking and old events are ignored.
- Confirm the app checks pass with no new errors.
