# Make the redesigned workspace fully functional

## Goal
Turn the approved workspace design into the real signed-in Landing Page Builder. Every visible control will either perform its stated action or be removed. Public links remain viewable without signing in; editing remains account-only.

## What will work

### Account pages and navigation
- Load the signed-in account’s real Personal, Office, and other pages instead of sample data.
- Keep every existing page ID, published address, link, photo, layout, PIN setting, and trusted browser.
- Create, switch, rename, and delete pages, with the existing ten-page limit and one-page minimum.
- Send signed-in users to the redesigned workspace at `/dashboard`; keep `/workspace-preview` as a non-production design reference or redirect it after verification.

### Identity and photos
- Make **Edit name & picture** open a working panel for display name, introduction, private page name, and photo.
- Upload photos to the account-owned private avatar area with the existing 5 MB validation.
- Show initials automatically when no photo exists.
- Save each photo to its specific page under the signed-in account, so it appears after signing in on another browser.

### Appearance and matching output
- Make **Appearance** open real layout and light/dark controls.
- Apply changes immediately to the editor canvas and save them to that page.
- Use the same shared presentation for the editor preview, public `/p/...` page, and downloaded HTML wherever the format allows.
- Verify both layouts and both colour modes on desktop and mobile.

### Tabs, folders, links, and Home
- Persist tabs for each page and preserve current folders and links through an additive backfill.
- Make add/rename/delete tab, folder, and link actions work.
- Make favourite and logo-only settings real; favourites from every tab populate Home.
- Keep recently opened links local to each browser, remove stale entries, and provide Clear.
- Remove duplicate links and repeated identity/header content from the presentation.
- Save clocks and the user-entered weather city; do not invent weather data or request location without an explicit action.

### Security, publishing, and export
- Connect **Security** to the existing account PIN and trusted-browser system.
- Make **Publish / Update live page** save pending edits, publish the selected page, retain its address, and give clear success or error feedback.
- Keep public pages accessible to signed-out visitors; PIN-protected pages continue through the existing PIN gate.
- Make copy link, open link, unpublish, and HTML download actions functional.
- Remove placeholder menu items and buttons that have no completed action.

## Data safety
- Use additive database changes only for tabs, favourites, and Home settings.
- Backfill existing pages into a Home tab and preserve `group_name` folders and link ordering.
- Keep current PIN, trusted-browser, avatar, publishing, and public-page security rules unchanged.
- Apply account ownership rules to all new saved data.

## Verification
- Test every visible control in the signed-in editor: pages, identity/photo, appearance, clocks/weather, tabs, folders, links, favourites, logo-only, security, publish/unpublish, copy/open, and export.
- Open a published page while signed out and confirm it works; confirm editing redirects to sign-in.
- Check desktop and mobile layouts for the editor and public output, including initials fallback and long names.
- Confirm no console/runtime errors and a successful build.
- Keep production unchanged until you review the completed preview and publish it yourself.
