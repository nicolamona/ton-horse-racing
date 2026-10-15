# Endpoint security audit — TON Horse Racing demo

Review scope: source-level review of `backend/worker.js`, `backend/schema.sql`, `backend/wrangler.toml`, and the related tests on the preparation branch. This is not a penetration test or evidence of a live Worker deployment.

## Route inventory

| Route | Allowed behavior | Current guardrails | Limitations / follow-up |
| --- | --- | --- | --- |
| `GET /health` | Returns demo-only mode, payments disabled, and whether DB binding exists | Rejects unsupported methods with 405; no-store and nosniff headers | Health response does not prove D1 health or external service availability |
| `GET /api/races` | Lists demo race history for a supplied wallet-address-shaped label | Requires DB; validates address shape; clamps result limit to 1–50; parameterized SQL; generic 500 on storage errors | Address is not authenticated; no per-user authorization; no rate limit; address check is not canonical TON validation |
| `POST /api/races` | Stores a demo race claim | Requires DB and JSON object; 16 KiB body cap; validates race ID/address/horse numbers; parameterized SQL; duplicate ID is idempotent; generic storage errors | Client chooses race ID, wallet label, selected horse, and winner; results are untrusted demo claims, not verified outcomes |
| `/api/payments` and descendants | Disabled | Returns 403 independent of DB binding, method, or request body | Keep disabled; tests must cover these routes in regression suite |
| `/api/transactions` and descendants | Disabled | Returns 403 independent of DB binding, method, or request body | Keep disabled; tests must cover these routes in regression suite |
| `OPTIONS` | CORS preflight | Returns 204 and only advertises GET/POST/OPTIONS | Preflight is not authorization |
| Unknown path | 404 | Fails closed before database checks | Monitor repeated malformed/unknown requests at the hosting layer |

## Security observations

- **CORS is not authentication.** Requests without an Origin header are allowed for non-browser clients; an attacker can call the API outside a browser. Do not rely on the origin check for authorization.
- **No rate limiting is implemented in the Worker.** Add provider-level limits or a reviewed rate-limiting mechanism before exposing a public API, even for demo storage.
- **Demo race history is client-authored.** It must not be shown as a verified competition result or used to award value.
- **Wallet addresses are public identifiers, not identity proofs.** Do not use the supplied address as an authorization token.
- **D1 queries in the reviewed endpoints use bound parameters.** Keep this pattern for future queries.
- **Errors are generic at the API boundary.** The Worker does not intentionally return database exception details. Avoid logging request bodies, full wallet addresses, secrets, or personal data.
- **No private keys, seed phrases, deposit monitor, financial ledger, payout service, or blockchain verifier belongs in this demo API.**
- **No live deployment evidence was found in the repository configuration.** The D1 identifier remains a placeholder in `wrangler.toml`.

- The frontend's fictional game rules are covered by `../game-logic.test.mjs`, including amount validation, all eight reward places, quarter-unit third-place rewards, net results, and completion of a unique eight-horse finish order.

## Acceptance checks

1. `cd backend && npm test` passes with Node.js 18+ (latest push and PR CI: 38 passed, 0 failed).
2. The GitHub Actions run for the pull request completes successfully.
3. Payment and transaction routes remain HTTP 403 with and without a DB binding.
4. Unknown paths return 404; unsupported methods return 405.
5. Malformed and oversized input is rejected without uncaught exceptions.
6. The PR diff contains no credentials or private key material.
7. No Worker deployment or frontend publication is triggered by this preparation branch.

## Open risks

- No authenticated identity or per-user authorization for demo history.
- No rate limiting or abuse controls in the Worker.
- Race results are not independently generated or verified.
- No live D1/Worker integration test; current tests use mocks.
- Branch protection is not enabled on `main` at the time of review.
- External TON Connect CDN dependency and browser runtime behavior need separate frontend/browser testing.
