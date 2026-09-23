# Compact profile workspace redesign

## Direction

Build the selected **Modular Midnight Canvas** direction with the existing Midnight Champagne palette (`#08151F`, `#122633`, `#1B3543`, `#E3C581`, `#69C9C0`, `#F4F5F2`) and Space Grotesk + DM Sans. Keep controls compact, use solid colours, restrained motion, visible focus states and radii of 8px or less.

Use the product hierarchy consistently:

```text
Account
└── Profile (the existing page/workspace and published address)
    ├── Home tab
    └── User tabs
        └── Folders
            └── Links
```

Existing “pages” become Profiles in the interface; no competing profile system or second login concept will be introduced.

## Stage A — reviewable interactive workspace

- Add a preview-only workspace using clearly labelled sample content. It will not read, overwrite or seed real user data.
- Build the compact editor shell: profile selector, saved-state indicator, Preview, Publish, light/dark control and account menu.
- Add stable horizontal tabs, with mobile horizontal scrolling. Tab selection filters the visible folders and never opens links.
- Show the selected tab in a central canvas that closely matches the finished page: compact identity header, search, three/two/one-column content flow and 40–44px link rows.
- Add contextual controls only where needed: Add tab, Add folder, Add link, item menus and a right-hand settings drawer for the selected link, folder or widget.
- Make the two-field link flow work in the sample: URL plus display name, with advanced fields collapsed.
- Include responsive and keyboard states, empty/loading/saving/error examples, and an unsaved-change warning.
- Keep the selected prototype’s composition, replacing its generic page-section imagery with the actual profile/tab/folder/link product model.

## Stage B — connect existing accounts and content

### Safe data changes

- Add profile tabs and folders as new records, each owned indirectly through its existing profile/page.
- Add optional folder placement and favourite status to links while retaining the existing `group_name`, order, page ID and link ID during transition.
- For every existing profile/page, create **Home** and **My Links** tabs.
- Convert each existing folder name into a folder under **My Links** and attach its links in their current order. Put ungrouped links into a neutral folder without changing link content.
- Keep every existing profile/page ID, slug, published address, theme, photo, clocks, publish state and PIN setting unchanged.
- Use owner-only access rules for editing. Public tab/folder/link reads follow the parent profile’s existing published and PIN rules. No account may enumerate another account’s private profiles.
- Keep the migration additive and reversible; do not delete the old folder-name field during this phase.

### Working editor

- Replace the long dashboard with the new visual workspace and connect profile, tab, folder and link actions.
- Support create, rename, reorder, move, duplicate and delete through compact menus. Add pointer drag-and-drop where practical and equivalent keyboard/menu actions everywhere.
- Keep URL and display name as the initial Add link fields; infer a useful name from the address where possible and prefill the active profile, tab and folder.
- Move profile details, appearance, PIN/security, trusted browsers, export and browser setup into a Settings drawer.
- Show Saving, Saved and Error states. Preserve local edits during background refreshes and block navigation when unsaved edits remain.
- Preserve current publishing semantics: changing stored content updates an already-published profile, so the interface will say this plainly rather than calling it a draft.

### Shared generated page

- Reuse the same profile header, tabs, search, folder panels and compact link rows for the editor canvas and `/p/:slug` wherever practical.
- Keep profile switching owner-only. Public visitors see only the profile represented by the current published address.
- Preserve PIN gates and trusted-browser behaviour before any protected content is returned.
- Update standalone HTML export with tab navigation and compact folders. Export will omit browser-local recent activity and clearly mark network-dependent widgets.

## Stage C — useful Home tab

- Add modest, independently hideable Home widgets: local clock/date, existing world clocks, favourites, optional weather and **Recently opened here**.
- Store recent links only in browser storage, separated by signed-in account and profile, capped at 10 unique valid links, newest first.
- Record only links opened through this product. Remove stale entries for deleted links and provide Clear and Hide controls with the exact explanation: “Links opened from this page in this browser.”
- If browser storage is unavailable, hide or disable recents without breaking the page.
- Weather accepts a city and requests device location only after an explicit action. It shows loading, unavailable and retry states; without a configured provider it shows an honest setup state and never fabricated data.
- Update the homepage’s embedded preview to the completed interface. Wider marketing changes and monetisation remain outside this phase.

## Validation

- Test profile/tab context after reload, all move/reorder alternatives, unsaved-change protection, save-state feedback and published-update wording.
- Verify existing links, ordering, addresses, PIN access, trusted browsers and downloadable HTML before and after migration.
- Test editor/public visual parity at desktop, medium and mobile sizes, including scrolling tabs and one-column folders.
- Verify keyboard navigation, labelled controls, focus visibility, empty/loading/error states and WCAG AA contrast in light and dark modes.
- Verify recent activity never crosses account/profile boundaries and never appears in server responses or export files.
- Keep all work in preview; do not publish automatically.
