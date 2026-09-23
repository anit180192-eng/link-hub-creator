# First-time usability improvements

## Goal
Make the first visit self-explanatory and let a new user create and publish a useful start page with one link, without changing existing accounts or published addresses.

## Homepage
- Lead with “personal browser start page” and the requested concrete example.
- Change the primary action to **Create my free start page** and open registration directly; keep a separate **Sign in** action.
- Put a compact interactive finished-page example in the first screen on desktop and immediately below the introduction on mobile. Visitors can switch between Home and one example links tab with compact folders.
- Mark all sample names and links as examples, remove the unverified customer wording, remove the empty ad area, and move PIN, browser setup, and download details below the essential three-step path.

## Registration
- Let homepage and `/auth` open explicitly in account-creation or sign-in mode.
- Preserve Google and email authentication, including the current post-login redirect to the builder.
- Keep email-confirmation messaging clear when confirmation is required.

## First-run builder
- Detect an empty profile and show a short dismissible three-step guide connected to real actions: add one link, optionally organise it, then publish.
- Ensure every new or previously empty profile has a default **Links** tab and **My links** folder, without changing populated profiles.
- Make **Add your first link** the dominant empty-state action. Ask only for URL and optional display name; infer a sensible name from the website when blank.
- Add brief contextual explanations for profile, tab, and folder controls while the guide is active. Keep appearance, clocks, PIN, Premium, and support outside the guide.
- After publishing, show the real address with **Open my page** and **How to set it as my browser start page**.

## Verification
- Check desktop and mobile homepage layout and interactive example tabs.
- Test direct registration-state routing and the unauthenticated redirect path.
- Exercise the empty-builder add-link and publish controls as far as the available account access permits; clearly report any authenticated steps that cannot be verified.
- Confirm existing published-page, address, and PIN code paths remain unchanged and the automated build stays clean.
