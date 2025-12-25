# Architecture: Current vs Target

## Current (Rust proxy + browser UI)
- Rust server:
  - Serves the built UI (`ui/dist`) at `http://127.0.0.1:8080/`.
  - Exposes WS endpoint `/ws` which is a passthrough to Betfair Stream API (TLS TCP + CRLF JSON framing).
  - Exposes HTTP reverse proxies for Betfair Identity + Betting API.
- UI:
  - Stores AppKey + session token (today) and calls proxy endpoints.
  - Connects to local WS proxy and sends Stream API `authentication` messages.

Strengths:
- Simple web debugging.
- UI and proxy are already working.

Pain points:
- Secrets live in the UI (session token).
- Localhost server/ports and proxy routes are extra moving parts.
- Packaging is "service + UI" instead of a single app.

## Target (Proper Tauri v2 app)
- No localhost HTTP server required for normal operation.
- Rust core owns:
  - Login + session token lifecycle
  - Betfair API requests
  - Stream API connection + subscriptions
- UI owns:
  - Rendering and UX only
  - Calls `invoke()` for API requests
  - Listens to Tauri events for stream updates

### Why this target fits desktop + future mobile
- Avoids port binding and CORS on mobile.
- Centralizes secrets and networking in one Rust layer.
- UI stays reusable (same React code) with a different transport.

## Migration principle
Prefer an API boundary that is:
- Stable for the UI (generic JSON-RPC + events)
- Secure by default (token never crosses boundary)
- Flexible (full param/filter support without adding a command per endpoint)
