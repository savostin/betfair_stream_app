# Betfair API Gateway Design (Rust-owned auth)

## Goals
- Provide **full Betfair API coverage** (all params/filters) without creating one command per endpoint.
- Keep the **session token inside Rust**; UI never receives or stores it.
- Embed the **AppKey into the app** (build-time configuration).
- Maintain security hygiene: avoid leaking secrets in logs/events.

## Non-goals
- A fully typed Rust+TypeScript SDK for every Betfair method (can be added later if needed).

## Proposed Public Interface (Tauri commands)

### Auth
- `auth_login(username: string, password: string) -> { ok: true } | { ok: false, error }`
- `auth_logout() -> { ok: true }`
- `auth_status() -> { isLoggedIn: boolean }`

Notes:
- `auth_login` stores the session token in Rust state.
- UI should treat auth as a boolean gate; token should never cross the boundary.

### Generic JSON-RPC
- `betfair_rpc(service: 'betting' | 'account' | 'heartbeat', method: string, params: unknown) -> unknown`

Implementation details:
- `params` is received as `serde_json::Value`.
- Method names are validated against an allowlist per service.
- Rust injects headers:
  - `X-Application: <embedded app key>`
  - `X-Authentication: <session token from Rust state>`

This gives immediate support for:
- **Betting**: `listMarketCatalogue`, `listMarketBook`, `placeOrders`, `cancelOrders`, etc.
- **Account**: `getAccountFunds`, `getAccountDetails`, `getDeveloperAppKeys`, etc.
- **Heartbeat**: `keepAlive`
- Any filter shapes Betfair supports, because params are not constrained.

**IMPORTANT - Do not create specific handler commands:**
- ❌ **BAD**: Creating `get_account_funds`, `list_markets`, `place_order` Tauri commands
- ✅ **GOOD**: All API calls use `betfair_rpc` from TypeScript
- Keep Rust side lean and generic; implement logic in TypeScript
- Only create specific handlers for complex business logic that combines multiple API calls or requires server-side state management

**TypeScript pattern:**
```typescript
// src/lib/betfair.ts
export async function getAccountFunds(): Promise<AccountFunds> {
  return await tauriInvoke<AccountFunds>('betfair_rpc', {
    args: { 
      service: 'account', 
      method: 'getAccountFunds', 
      params: { wallet: 'UK' } 
    },
  })
}
```

## Allowlist Strategy
- Maintain a single source of truth for allowed methods per service.
- Reject unknown methods early with a clear error.
- Prefer allowlisting to avoid UI accidentally calling unsupported/unsafe methods.

## Error Normalization
Return a stable error envelope from Rust:
- `kind`: `network | auth | betfair | invalid_request | internal`
- `message`: user-safe message key (UI i18n key)
- `details`: optional debug details (never include token/appkey)

Goal: UI can display consistent localized errors without parsing random strings.

## AppKey Embedding
Supported approaches:
1. Build-time env var (recommended): CI injects `BETFAIR_APP_KEY`.
2. Bundled config file: shipped with app resources.

Security note:
- Any embedded key can be extracted from a distributed client. Treat it as "non-secret" from an attacker perspective.

## Streaming Integration
- Prefer Rust-owned stream socket authenticated with the stored token.
- Emit Stream updates as Tauri events (e.g. `betfair_stream_mcm`).
- UI reuses existing reducer to build market state.

## Testing Strategy (pragmatic)
- Unit test: allowlist validation + request envelope generation.
- Integration test (optional): mock Betfair endpoints or run against a sandbox if available.
