# Task Roadmap

## In Progress
- [x] Wire AdSense publisher ID (ca-pub-7242078241100237) into ads-config; auto-ads active on published pages. Ad slot ID still optional for manual placement.

## Done
- [x] Folders/categories for links
- [x] Edit existing links
- [x] Username choice + uniqueness
- [x] Midnight Teal & Champagne theme
- [x] World clocks (up to 5)
- [x] Logo-only link display
- [x] Ad area on builder page
- [x] Sitemap + robots.txt
- [x] "Set as landing page" guide inside dashboard
- [x] Brand footer "Built with Landing Page Builder by AuruNex"
- [x] Rename to "Landing Page Builder"

## Current
- [x] Redesign generated landing pages as a warm Swiss-editorial personal hub
- [x] Rework generated pages into a compact executive dashboard
- [x] Improve the live preview and compact logo-only links

## Move to your own Supabase ("Landing Page Builder") — switching this project, fresh start (no data import; user OK losing test data) — COMPLETE
- [x] Setup script for the new project (tables, access rules, photo storage)
- [x] User creates Supabase project + runs setup script
- [x] Remove Lovable Cloud from this project (permanent), then connect own Supabase
- [x] Switch Google sign-in to own Google keys; set site URL + redirect URLs
- [x] Verify sign-up, dashboard, publish, public page, photo upload

## Homepage rework (Sep 22)
- [x] Homepage preview uses the real page layout (sample "Shreya" page)
- [x] Explain the product clearly; free (download) vs account (personal link) comparison
- [x] Privacy section: 6-digit PIN + trusted devices (marked Coming soon)
- [x] Landing Page Builder logo in browser tab + on every app page
- [ ] Guest builder: build without account, download HTML only (next)
- [x] PIN protection + trusted devices for personal links

## Builder improvements (Sep 22)
- [x] Land on the page builder right after sign-in (Google + email confirmation)
- [x] Landing Page Builder logo on builder, published pages and downloads
- [x] Multiple pages per account, each with its own link (Personal, Office, …)
- [x] Light / dark / match-device theme switcher on every app page (published pages keep their navy look)
- [x] Page layout choice (dashboard / single column) and Dark page switch actually change the published page, preview and download

## Compact profile workspace redesign (Sep 23)
- [x] Stage A: sample-only Modular Midnight Canvas editor and interactive start-page preview
- [x] Stage A refinement: Neo-Classical Home with editable identity, picture/initials, clocks, profile-wide favourites, seven-day most visited, local recents and prominent publishing
- [x] Stage B: additive tabs/folders migration, existing-data backfill, editing, publishing, PIN and export integration
- [x] Stage C: browser-local recents, favourites and optional Home widgets
- [x] Remove weather and add browser-local seven-day most-visited links
- [x] Correct editor hierarchy to profiles → Home/tabs → saved folders → links, including empty folders and bottom-left sign-out
- [x] Match the Home greeting to its lead clock timezone and make homepage sample tabs interactive
- [ ] Review the staged preview before any production publish

## First-time usability (Sep 23)
- [x] Simplify homepage and add first-screen interactive example
- [x] Open registration directly from the primary CTA
- [x] Add default tab/folder and guided one-link first run
- [x] Add post-publish open/setup actions
- [x] Verify desktop, mobile, and available account-flow behaviour (authenticated fresh-account flow unavailable with external auth)

## Dashboard control organisation (Sep 23)
- [x] Move profile switching to the top-right and keep Preview as the only primary top action
- [x] Group Appearance, PIN & access, Publish, and tab management in the left panel
- [x] Show bookmark import only while adding a tab and keep tab rename contextual

## One-time guided tour (Sep 23)
- [x] Add responsive spotlight steps for profiles, tabs, canvas, tab creation, PIN access, preview, and publishing
- [x] Add Back, Next, Skip, and Finish controls
- [x] Save completion to the signed-in account so the tour does not return on other browsers
