# Browser Homepage refresh

## What will change
- Rename the product from **AntLabs** to **Browser Homepage** across visible text, downloaded pages, and page metadata.
- Rework the first screen so the purpose is immediate: collect important links, publish one personal start page, and use it whenever a browser opens.
- Place the complete Google/email sign-in and account-creation form in a dedicated panel on the right side of the first screen; signed-in users see a direct dashboard action instead.
- Add recognizable social and website logos plus a small example start-page preview so visitors can understand the result at a glance.
- Add an interactive **Set as homepage** guide that detects Windows or Mac, lets the visitor choose their browser, and opens focused visual steps. Keep manual confirmation because browsers block websites from changing homepage settings automatically.
- Update the standalone setup page to use the same operating-system-aware guidance and clearer language.

## Technical details
- Extract the existing authentication form into a reusable panel used by both `/` and `/auth`, preserving email confirmation and Google sign-in behavior.
- Create reusable browser setup data and a guided dialog with OS detection, browser selection, numbered visual setting cues, and copy-ready instructions.
- Keep all existing publishing, downloadable HTML, stored profiles, and links unchanged.
- Verify desktop and mobile layouts, authentication panel behavior, setup dialog interaction, and route metadata.
