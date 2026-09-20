# AntLabs — personal start page builder

Build an app where you sign up, add all the accounts and sites you use often, pick a theme, and get a personal start page you can use as your browser homepage — hosted at a link and downloadable as a single file.

## One thing up front

No website can set itself as your browser's homepage automatically — browsers block that for security. So the app gives you the link plus short, copy-ready instructions for Chrome, Safari, Edge and Firefox, and a "copy link" button. That is as close to one-click as browsers allow.

## What gets built

**Accounts and sign-in**
- Sign up and log in with email + password, and with Google.
- Everything you save is tied to your account and stays there.

**Your links**
- Add entries for Instagram, YouTube, Facebook, LinkedIn, X/Twitter, GitHub, plus any custom website.
- Multiple accounts per platform (e.g. three Instagram profiles), each with its own label.
- Known platforms get their logo automatically; custom sites get their site icon.
- Reorder by drag, edit, delete, and optionally group links into sections.

**Your page**
- A profile bit at the top: display name, tagline, optional photo.
- Two themes to choose from:
  - Icon grid dashboard — tiles with logos, like a browser start page.
  - Link-in-bio list — stacked buttons under your name and photo.
- Light/dark option and a live preview while you edit.

**Publishing**
- Press Create and you get a public page at a personal address like `/p/your-name`.
- Also a Download button that saves the same page as one self-contained HTML file you can open offline or set as a local homepage.
- Re-publishing updates the live page; the link never changes.

**Pages in the app**
- Home / landing — what AntLabs is, with sign-up call to action.
- Sign in / sign up.
- Dashboard — manage links, profile, theme, preview, publish.
- Public start page — `/p/:slug`, fast and shareable.
- Setup help — how to make it your browser homepage.

## Technical notes

- Lovable Cloud for auth (email/password + Google) and data.
- Tables: `profiles` (display name, slug, tagline, avatar, theme, published state) and `links` (user, platform, label, url, order, group). Row-level security so each person only touches their own rows; the public page reads only published profiles.
- Slug uniqueness enforced at the database level.
- The public page is a server-rendered route so it loads instantly and previews nicely when shared.
- Download builds the same markup as a standalone HTML string with inline styles, served from a server function.
- All URLs validated and escaped before rendering; no raw user HTML.
- Each route gets its own title and description.

## Not in this first version

- Custom domains per user, click analytics, and browser-extension install. Easy to add later if you want them.
