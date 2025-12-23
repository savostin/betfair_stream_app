# betfair_stream_proxy

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
- Release artifacts are built and published when you push a tag matching `v*` (for example `v0.1.0`).

Suggested release flow:

```bash
git tag v0.1.0
git push origin v0.1.0
```
