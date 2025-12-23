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

## Test client

Open [test-client.html](test-client.html) in a browser, set the WebSocket URL, connect, then send:

1) `authentication` (must be first)
2) `marketSubscription` and/or `orderSubscription`

Note: the HTML test client sends JSON without CRLF; the proxy handles upstream CRLF framing.
