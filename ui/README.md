# UI (React + Vite)

This folder contains the frontend for the Tauri desktop app.

The UI does not call Betfair over HTTP directly. It talks to the Rust backend via Tauri `invoke()` and receives stream updates via Tauri events.

## Dev

Run the UI dev server, then run the Tauri app from the repo root:

```bash
npm run dev
cd ..
cargo tauri dev
```

## Build

Build the web assets (release bundling runs this via the Rust build script):

```bash
npm install
npm run build
```
