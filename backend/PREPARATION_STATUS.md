# Preparation status — demo only

Last reviewed: 2026-10-15

## Current state verified from repository configuration

- The frontend is a static arcade demo; fictional credits and local history are stored in browser `localStorage`.
- TON Connect is display-only in the reviewed frontend: it reads the public account address and does not request signatures or submit transactions.
- GitHub Pages has a successful deployment workflow. This verifies publication of the static site only; it does not verify a deployed API.
- The optional Cloudflare Worker is a demo-only scaffold and is not known to be deployed.
- The D1 schema stores demo race history only; it contains no balance, deposit, or payout ledger.
- The frontend uses a small tested game-rules module for fictional reward calculation and finish-order completion. Third-place rewards retain quarter-unit precision so balances remain valid after reload.
- `backend/wrangler.toml` still contains `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
- The Worker reports `paymentsEnabled: false` and rejects payment/transaction route families with HTTP 403.
- The GitHub branch listing reports `protected: false` for both `main` and `security-readiness-prep`. Configure and verify branch protection and required status checks in repository settings before relying on CI as an enforced merge gate.

## Automated checks and evidence

- Run locally with Node.js 18 or newer: `cd backend && npm test`.
- The suite documented in this branch contains 38 automated tests: 24 backend/HTTP tests and 14 demo game-rule tests.
- Latest inspected pull-request workflow: [run 38822413185](https://github.com/nicolamona/ton-horse-racing/actions/runs/38822413185). GitHub Actions reports success; both the test step and frontend syntax/demo-only guard step completed successfully.
- Earlier successful PR run recorded in the PR description: [run 38822355065](https://github.com/nicolamona/ton-horse-racing/actions/runs/38822355065).
- The workflow covers demo-only health, blocked financial routes, CORS origin behavior, preflight, route/method handling, malformed JSON, JSON type validation, body size, race ID and wallet-address formats, horse number validation, parameterized SQL, duplicate IDs, and generic database error responses.
- These are CI results for the referenced commits, not a local re-run of the current post-documentation head and not proof of production safety. The workflow does not run on documentation-only changes outside its configured path filters, so confirm a relevant CI run after any code/test/workflow change.
- No browser E2E, live Worker/D1 integration, TON testnet transaction test, independent secret scan, or software-composition-analysis scan was executed in this review.

## Risks and limits

- A public wallet address submitted by a browser is not proof of wallet ownership.
- The demo API accepts client-submitted race outcomes; they are not authoritative.
- Browser `localStorage` is user-controlled and must never be treated as a trusted balance or ledger.
- CORS is not authentication and does not prevent non-browser clients from calling an endpoint.
- No rate limiter, wallet-ownership proof, server-authoritative race engine, deposit monitor, real-balance ledger, payout service, or blockchain transaction verifier is implemented.
- The address format check is a basic input-shape check, not full TON address validation.
- Browser-level end-to-end testing has not been executed; automated game tests cover the extracted pure rules, not the full animation/DOM/localStorage lifecycle.
- The backend test suite does not require third-party npm dependencies, but the frontend loads TON Connect UI 2.0.9 from an external CDN without Subresource Integrity. GitHub Actions use major-version tags rather than immutable full commit SHAs.
- No dedicated automated secret/history scan or dependency/license vulnerability scan was executed; do not interpret absence of a finding in a source-level review as a clean scanner report.

## Audit and operational documentation

- [FINAL_SECURITY_AUDIT.md](./FINAL_SECURITY_AUDIT.md): source-level findings, severity, evidence boundaries, and residual risks.
- [ENDPOINT_AUDIT.md](./ENDPOINT_AUDIT.md): route-by-route endpoint findings.
- [TON_DEPOSIT_ARCHITECTURE.md](./TON_DEPOSIT_ARCHITECTURE.md): design-only TON transaction verification, idempotency, ledger, reconciliation, and future test strategy; no deposit functionality implemented.
- [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md): monitoring, incident handling, backups, recovery, and rollback guidance.
- [READINESS_CHECKLIST.md](./READINESS_CHECKLIST.md): security, legal, privacy, and operational gates.

## Required gates

Keep payment and blockchain transaction routes disabled. Do not interpret this document as authorization or a deployment plan for deposits, wagering, balances, or payouts. Before any future regulated-product consideration, obtain independent legal advice for every target jurisdiction and an independent security review. Verify licensing, eligibility and age assurance, privacy and retention, consumer protection, dispute handling, audit obligations, monitoring, incident response, rate limiting, backup restoration, immutable action pinning, branch protection, browser E2E, live demo API integration, and testnet-only transaction cases.
