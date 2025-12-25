# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Betfair Stream Proxy UI (React + Vite)

  Single-page app for:

  - Setting Betfair **Application Key**
  - Logging in to Betfair SSO to obtain a **session token**
  - Fetching the next **100 Horse Racing WIN** markets (`listMarketCatalogue`)
  - Subscribing to the selected market via the local WebSocket proxy and rendering live state updates

  ## Prerequisites

  - The Rust proxy is running (from the repo root):
    - WebSocket endpoint: `ws://127.0.0.1:8080/ws`

  ## Run (dev)

  ```bash
  cd ui
  npm install
  npm run dev
  ```

  Open `http://localhost:5173`.

  ## Important notes

  - **CORS**: browsers cannot call Betfair Identity/API directly.
    - In dev, this app can use Vite proxies configured in [vite.config.ts](vite.config.ts).
    - When served by the Rust proxy (recommended), the Rust server provides the same-origin reverse proxies:
      - `POST /bf-identity/api/login` → `https://identitysso.betfair.com/api/login`
      - `POST /bf-api/exchange/betting/rest/v1.0/listMarketCatalogue/` → `https://api.betfair.com/...`
  - **Streaming**: the UI speaks Betfair Stream API JSON over the local WebSocket proxy; switching markets sends a new `marketSubscription` request (replacing the previous subscription).
import reactDom from 'eslint-plugin-react-dom'
