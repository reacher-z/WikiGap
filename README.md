# WikiGap

**Research prototype for exploring complementary information across Wikipedia language editions.**

[Paper](https://arxiv.org/abs/2505.24195) · [Bundled article data](json/) · [Original development notes](docs/development-notes.md)

WikiGap surfaces information from Chinese, French, and Russian Wikipedia alongside an English article. The paper studies this interface with 21 participants; see the paper for the study design, results, and limitations.

This repository contains a Manifest V3 Chrome extension, version 0.4. Its active content script loads **precomputed, bundled facts for selected articles**. It does not run a live multilingual fact-discovery pipeline, and it does not support arbitrary Wikipedia pages. The public snapshot is not a packaged Chrome Web Store release.

> Before installing: this prototype records some interactions and selected text in page-origin local storage. Use a dedicated test browser profile and non-sensitive browsing. Read [Permissions and interaction logs](#permissions-and-interaction-logs); hiding the panel is not a privacy switch.

## Try the bundled demo

No Python server, npm build, model download, or API key is needed for the checked-in extension.

1. Get the repository:

   ```sh
   git clone https://github.com/reacher-z/WikiGap.git
   cd WikiGap
   ```

2. In a dedicated Chrome test profile, open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**. Select the repository directory containing `manifest.json`, not `json/`. See [Chrome's official instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked-extension).
3. Open [English Wikipedia: Poutine](https://en.wikipedia.org/wiki/Poutine). Reload the article after installing or reloading the extension.
4. Look for the WikiGap panel with All, Chinese, French, and Russian tabs. Use those tabs to filter facts, the search field to search displayed text, and a fact's source link to inspect the corresponding language edition. Matching article passages can be underlined when they still match the bundled text.
5. When finished, disable/remove the extension in `chrome://extensions` and close affected Wikipedia tabs. Treat any exported interaction logs as potentially sensitive.

The panel reads `json/Poutine.json` for a page titled `Poutine - Wikipedia`. [Biryani](https://en.wikipedia.org/wiki/Biryani) and [Oolong](https://en.wikipedia.org/wiki/Oolong) also have bundled fixtures. Exact page titles matter: redirects, translated titles, and Wikipedia edits can affect loading or text alignment.

## What is included

- [`manifest.json`](manifest.json) loads [`content.js`](content.js), [`styles.css`](styles.css), [`background.js`](background.js), and the toolbar popup. The other `contentScript*.js` files are not selected by this manifest.
- [`json/`](json/) contains 26 title-matching article fixtures, plus five alternate/older files whose names are not normal article titles. These are bundled research examples, not live Wikipedia snapshots.
- [`popup.html`](popup.html) / [`popup.js`](popup.js) provide toolbar controls. Prefer the in-page language tabs for the demo; the popup's enable control only changes panel visibility in the active content script.
- [`options.html`](options.html) / [`options.js`](options.js) and [`onboardingPage.html`](onboardingPage.html) are checked in, but the manifest does not register an options page. Do not rely on the popup's options button to open it.
- [`quiz_questions/`](quiz_questions/) contains study materials; it is not loaded by the extension's content script.

## Permissions and interaction logs

The manifest requests `storage`, `tabs`, `activeTab`, and `scripting`, with host access and content-script matching for `*://*.wikipedia.org/*`. That is broader than the English demo pages above. Review the manifest before loading it.

The active content script records events such as language-tab changes, fact/source clicks, highlighted-passage clicks, and text selections. Events may contain the page title, timestamp, selected text or fact text, source URL, and selection geometry. They are stored under the **`wikigap_logs`** key in the Wikipedia page origin's `localStorage`, not a private extension-only log store. Do not assume that other scripts running in that page origin cannot access it.

The panel's **Logs** button initiates a JSON download and then immediately removes that local-storage key. Confirm the downloaded file before relying on it as a saved record. The inspected export path does not upload logs to a server. Settings use `chrome.storage.sync`, so browser sync behavior may apply to preferences.

Bundled facts are loaded from extension resources, but the demo still loads Wikipedia pages and a Google Fonts stylesheet for Material Icons. Source links also navigate to other Wikipedia pages; this is not an entirely offline application.

Hiding the panel does **not** remove the text-selection listener or reliably disable logging. After disabling the extension and closing affected tabs, existing page-origin logs may remain. If you want to delete only this prototype's saved log, reopen the relevant Wikipedia origin with the extension disabled and run the following in that page's DevTools console:

```js
localStorage.removeItem('wikigap_logs');
```

This deletes that key for the current origin, not previously downloaded JSON files. Do not clear all browser/site data merely to remove this log. Do not commit participant logs or publish them without appropriate consent and review.

## Troubleshooting and limitations

- **No panel:** select the correct unpacked directory, check Chrome's extension errors, and reload a supported article. Initialization expects Wikipedia's `body.mediawiki` and `#content` elements.
- **No facts:** the title must map to `json/<article title>.json`, whose top-level key must match the title. The active script falls back to empty arrays on missing data; it does not query an LLM or call the background script's mock-fact handler.
- **Some passages are not underlined:** alignment uses exact bundled sentences; the current article can differ. The loader caps entries at 40 per language, and rendering skips entries without aligned sentences. A fact counter is not a count of independently verified current facts.
- **Icons are missing:** the stylesheet from Google Fonts may be unavailable. The language names and source-link text remain useful.
- **Settings do not persist or behave as expected:** this is a research snapshot; the popup and options controls are not a production-ready settings contract. Reload the page for a fresh demo and do not use the enable toggle as a logging control.

Source links are provided for inspection, not a guarantee that every extracted or translated statement is current or correct. The repository currently has no LICENSE file; public availability alone does not grant an unrestricted reuse license. Check code and Wikipedia-content reuse requirements before redistribution.

## Check the local artifacts

With Node.js 18 or later:

```sh
node tools/verify-fixtures.mjs
```

This dependency-free check validates manifest-referenced files, JavaScript syntax, bundled JSON structure, and the real `fetchFacts()` loader in an isolated VM using local fixtures. It also checks a supported and an unsupported article. It makes no network requests, does not access browser data, and does not install the extension. It is not a live Chrome or current-Wikipedia end-to-end test.

## Citation

```bibtex
@misc{wang2025wikigap,
  title={WikiGap: Promoting Epistemic Equity by Surfacing Knowledge Gaps Between English Wikipedia and other Language Editions},
  author={Zining Wang and Yuxuan Zhang and Dongwook Yoon and Nicholas Vincent and Farhan Samir and Vered Shwartz},
  year={2025},
  eprint={2505.24195},
  archivePrefix={arXiv},
  primaryClass={cs.HC},
  url={https://arxiv.org/abs/2505.24195}
}
```
