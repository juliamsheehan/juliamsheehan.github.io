# Archive of My Own

**Current version: 15** (shown under the title inside the app)

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
Fic text is stored in a separate **private** repo, never in this one. In the app, go to Aa ⚙ → GitHub sync and paste a fine-grained access token with Contents read and write access to that repo only, then tap **Connect & load library**. The repo and branch are built in.

## Version history
- **15:** Fixed collections on iPhone: checkboxes now show their tick, the Collections popup loads every collection first, picking a collection no longer gets undone by sync, and a new collection can be created and filled from the same popup.
- **14:** Fixed the duplicate check wrongly flagging new fics as "already in your library". The popup now shows both the saved and the new title.
- **13:** The repo (`juliamsheehan/ArchiveOfMyOwn`) and branch (`main`) are built in, so setting up a new device only needs the access token.
- **12:** Clear error messages when the repo name is wrong (it must be written as `owner/repo`), the branch is missing, or the token is rejected. Previously a wrong repo name just showed "0 works".
- **11:** The library list now fills itself from GitHub on every open, so every work is always visible. New uploads are saved to GitHub and then removed from the device (works are streamed). Downloads are optional. The app reloads itself when a new version is deployed.
- **10:** Remove all downloads button, safer storage handling, and app version label.
- **9 and earlier:** GitHub sync, duplicate check, shared collections, and streaming.

When you deploy a new version, check that the version number under the app title matches the number above.
