# Restore profiles, tabs, folders, and links

## Changes
- Restore the hierarchy: Account → Profile → Home/tabs → folders → links.
- Keep Personal, Work, and similar items as profiles, each with its own published address.
- Restore adding, selecting, renaming, and deleting tabs inside the selected profile.
- Add saved folder records so empty folders persist without forcing the user to add a link.
- Let each link be assigned to a folder within the currently selected tab.
- Add Sign out at the bottom-left of the editor.
- Preserve existing profiles, tabs, links, favourites, publishing, PIN protection, and addresses.

## Technical details
- Add an owner-protected `page_folders` table linked to the existing profile and tab records.
- Backfill folder records from existing links without moving or deleting data.
- Update the editor to read and manage those saved folders.

## Verification
- Check profile switching, tab creation/selection, empty folder creation, folder-specific links, favourites, and sign-out placement.
- Confirm automatic checks pass.
