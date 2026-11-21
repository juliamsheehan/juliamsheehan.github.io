# Archive of My Own

A personal, password-protected library app for reading AO3 fics when archiveofourown.org is down.

**Open the app:** https://juliamsheehan.github.io/ArchiveOfMyOwn/

> The folder name is case-sensitive. Type it exactly as `ArchiveOfMyOwn`, with capital A, O, M and O, and a `/` at the end. Phone keyboards often auto-correct it to lowercase, which gives a 404. Use this link or the Home Screen icon instead of typing it.

## Install on a phone
1. Open the link above in Safari (iPhone) or Chrome (Android).
2. Open the share menu (iPhone) or the three-dot menu (Android) and choose **Add to Home Screen**.
3. Open the app from the new icon.

## Files in this folder
- `index.html` is the whole app.
- `sw.js` caches the app so it opens without internet.
- `manifest.webmanifest` and `icon-*.png` give it a name and icon on the home screen.

## GitHub sync
Fic text is stored in a separate **private** repo, never in this one. In the app, go to Aa ⚙ → GitHub sync and enter that private repo's name (`owner/repo`), the branch (`main`) and a fine-grained access token with Contents read and write access to that repo only.
