# Betfair Stream API to Websocket Proxy

![VIBE CODING](https://img.shields.io/badge/warning-VIBE_CODING-orange?logo=claude)  ![GitHub Release](https://img.shields.io/github/v/release/savostin/betfair_stream_proxy.rs)



A small Rust service that accepts browser WebSocket connections and proxies messages to/from the Betfair Exchange Stream API.

The upstream Betfair stream transport (per [docs](docs/ExchangeStreamAPI-March2018.pdf)) is **TLS TCP** with **CRLF-delimited JSON**:

- client sends: `{json}\r\n`
- server responds: `{json}\r\n`

This proxy is intentionally a **raw passthrough**: the browser client is responsible for sending the Betfair `authentication` message.

## Requirements

- Rust toolchain

## Run (dev)

```bash
cargo run
```

- Health: `http://127.0.0.1:8080/healthz`
- WebSocket: `ws://127.0.0.1:8080/ws`

## Optional GUI

Build with GUI support:

```bash
cargo build --release --features gui
```

Run with a tray icon:

```bash
./target/release/betfair_stream_proxy --gui
```

macOS note: launching the raw binary from Finder will open Terminal. To launch as a proper GUI app (no Terminal window), build and create an app bundle:

```bash
cargo build --release --features gui
scripts/macos-bundle.sh target/release/betfair_stream_proxy dist
open dist/betfair_stream_proxy.app
```

## Configuration

All options are available as CLI flags or environment variables (see `--help`). Key env vars:

- `BIND` (default `127.0.0.1:8080`)
- `BETFAIR_HOST` (default `stream-api.betfair.com`)
- `BETFAIR_PORT` (default `443`)
- `ALLOWED_ORIGINS` (comma-separated list; empty allows all)
- `UPSTREAM_CONNECT_TIMEOUT_MS` (default `10000`)
- `FIRST_MESSAGE_TIMEOUT_MS` (default `10000`)
- `WS_MAX_MESSAGE_BYTES` (default `1048576`)
- `WS_SEND_TIMEOUT_MS` (default `5000`)

Logging:

- `RUST_LOG=info` (default)

## Build (release)

```bash
cargo build --release
./target/release/betfair_stream_proxy
```

## CI/CD

- CI runs on every Pull Request and on pushes to `main`.
- Release artifacts are built and published when you push a tag matching `v*` (for example `v1.0.1`).

Suggested release flow:

```bash
scripts/release.sh
```
