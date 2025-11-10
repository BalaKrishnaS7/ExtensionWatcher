# ExtensionWatcher (Chrome MV3)

A small Chrome Manifest V3 extension providing a popup UI and helper libraries. This repository contains the extension source that can be loaded as an unpacked extension in Chrome / Chromium-based browsers for local testing and development.

## What this contains

Top-level files and folders (brief purpose):

- `manifest.json` — Chrome extension manifest (MV3). Controls permissions, popup, icons, scripts, etc.
- `popup.html` — Popup UI markup shown when the extension icon is clicked.
- `popup.css` — Styles for the popup UI.
- `popup.js` — Popup UI logic.
- `fonts/` — Optional webfonts used by the popup UI.
- `icons/` — Extension icon assets.
- `lib/` — Third-party libraries used by the extension (includes `jszip.min.js`).
- `.qodo/` — Project-specific metadata/workflows (not part of extension runtime).

> Note: The repository root path for this README is the `chrome_Mv3` folder. This README documents that extension package.

## Quick start — load the extension locally

1. Open Chrome or a Chromium-based browser.
2. Go to chrome://extensions (or open Extensions from the menu).
3. Enable "Developer mode" (toggle in the top-right).
4. Click "Load unpacked" and select this folder (`chrome_Mv3`).
5. The extension should appear in the list and its icon will show in the toolbar. Click the icon to open the popup UI.

## Usage

- Open the popup by clicking the extension icon in the toolbar.
- The popup UI (`popup.html` + `popup.js`) contains the user-facing controls and behaviour. Use DevTools (right-click popup → Inspect) to debug the popup.

If the extension includes functionality that reads/writes files or packages data (the `lib/jszip.min.js` library is included), you may see options in the popup that trigger file downloads or ZIP creation.

## Development notes

- Manifest V3: this extension uses Chrome MV3. Any background work should be implemented with service worker-based background scripts or event-driven APIs supported by MV3.
- No build step present: the files in the folder appear to be ready-to-load assets (HTML/CSS/JS). If you add bundling, update this README with build steps and add a `package.json`.
- Third-party libs: `lib/jszip.min.js` is bundled locally. Keep library versions updated if you change behaviour that depends on those libraries.

## Files of interest

- `manifest.json`: check `name`, `version`, `permissions`, `action`/`popup` entries, and background/service_worker fields (if present). If you plan to publish the extension, update `manifest.json` fields such as description, icons, and permissions to match best practices.

## Manifest details

The extension manifest was inspected and the key values are listed below (directly taken from `manifest.json` in this folder):

- name: `xtnMonitor`
- version: `3.0`
- manifest_version: `3`
- description: `Monitors installed extensions for permissions and risks.`
- action.default_popup: `popup.html`
- icons: `icons/logo16.png`, `icons/logo48.png`, `icons/logo128.png`
- permissions: `management`, `storage`
- host_permissions:
  - `https://chrome-stats.com/`
  - `https://lh3.googleusercontent.com/`

Notes:
- No background/service_worker field is defined in the manifest — this extension currently uses only a popup UI (no persistent background worker).
- The extension requests the `management` permission which allows querying and interacting with other installed extensions. Treat this permission carefully when publishing and document why it is required.

- `popup.js`: main UI logic. For faster iteration, use popup DevTools and console logs.

## Troubleshooting

- If the extension fails to load:
  - Open chrome://extensions and view the error shown for the extension; it usually points to missing fields or syntax errors in `manifest.json`.
  - Ensure all referenced files (icons, popup files, service worker) exist at the specified paths in the manifest.
- If popup doesn't display expected behavior:
  - Right-click the popup and choose "Inspect" to open the popup DevTools and check console errors.

## Assumptions made

- The extension is intended for local development and testing (unpacked). If you want to publish to the Chrome Web Store, additional steps and reviews are required.
- No external build system present. If you add one (Webpack, Rollup, etc.), include build instructions and a `package.json`.


## License

This project is licensed under the MIT License. Full text below.

MIT License

Copyright (c) 2025 BalaKrishnaS7

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

