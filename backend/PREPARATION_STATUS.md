# Preparation status — demo only

Last reviewed: 2026-10-15

## Current state verified from repository configuration

- The frontend is a static arcade demo; fictional credits and local history are stored in browser `localStorage`.
- TON Connect is display-only in the reviewed frontend: it reads the public account address and does not request signatures or submit transactions.
- GitHub Pages has a successful deployment workflow. This verifies publication of the static site only; it does not verify a deployed API.
- The optional Cloudflare Worker is a demo-only scaffold and is not known to be deployed.
- The D1 schema stores demo race history only; it contains no balance, deposit, or payout ledger.
- `backend/wrangler.toml` still contains `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
- The Worker reports `paymentsEnabled: false` and rejects payment/transaction route families with HTTP 403.
- The main branch was observed without branch protection or required status checks. Review repository settings before relying on CI as an enforced merge gate.

## Automated checks

- Run locally with Node.js 18 or newer: `cd backend && npm test`.
- The suite now covers demo-only health, blocked financial routes, CORS origin behavior, preflight, route/method handling, malformed JSON, JSON type validation, body size, race ID and wallet-address formats, horse number validation, parameterized SQL, duplicate IDs, and generic database error responses.
- GitHub Actions runs the tests for relevant changes on `main` and `security-readiness-prep`, and for pull requests touching backend/workflow files.
- CI results must be read from the linked run and must not be inferred from a local commit. The expanded suite has to complete successfully before this branch can be considered validated.
- These checks are selected guardrails, not a complete security audit or live deployment verification.

## Risks and limits

- A public wallet address submitted by a browser is not proof of wallet ownership.
- The demo API accepts client-submitted race outcomes; they are not authoritative.
- Browser `localStorage` is user-controlled and must never be treated as a trusted balance or ledger.
- CORS is not authentication and does not prevent non-browser clients from calling an endpoint.
- No rate limiter, wallet-ownership proof, server-authoritative race engine, deposit monitor, real-balance ledger, payout service, or blockchain transaction verifier is implemented.
- The address format check is a basic input-shape check, not full TON address validation.
- No dependency installation is required for the Node built-in test suite; the frontend still loads TON Connect UI from an external CDN.

## Operational and production gates

- See [ENDPOINT_AUDIT.md](./ENDPOINT_AUDIT.md) for route-by-route findings.
- See [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) for monitoring, incident handling, backups, recovery, and rollback guidance.
- Keep payment and blockchain transaction routes disabled. Do not interpret this document as authorization or a deployment plan for deposits, wagering, balances, or payouts.
- Before any future regulated-product consideration, obtain independent legal advice for every target jurisdiction and a qualified independent security review. Verify licensing, eligibility and age assurance, privacy and retention, consumer protection, dispute handling, audit obligations, monitoring, and incident response with qualified professionals.
