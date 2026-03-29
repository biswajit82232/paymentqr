# Payment QR (PWA)

Static web app: save UPI IDs in Settings, create amount QR codes, share or download a branded image.

**Repository:** [github.com/biswajit82232/paymentqr](https://github.com/biswajit82232/paymentqr)

## Deploy on GitHub Pages

1. Push this folder to the repo (all files: `index.html`, `sw.js`, `manifest.webmanifest`, `icons/`, `qrcodejs.min.js`, etc.).
2. In the repo: **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, branch **main** (or **master**), folder **`/ (root)`**.
4. Save. After a minute, open: **`https://biswajit82232.github.io/paymentqr/`** (project site for this repo).

Open that URL once **while online** so the service worker can cache files. After that, **Payment QR**, **Settings**, and the last cached **QR** flow work **offline** (creating a *new* QR still needs you to reach the home page offline with cached assets; `sessionStorage` for the QR screen lasts for that browser tab).

## Icons

Regenerate placeholder icons:

```bash
npm install
npm run icons
```

## Local preview

```bash
npm start
```

Then open `http://localhost:3456`.

## PWA updates

After you change app files, bump the `CACHE` name in `sw.js` (e.g. `bph-pwa-v4`) so phones pick up the new version.
