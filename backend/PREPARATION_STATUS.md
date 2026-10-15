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
- The GitHub branch listing reported `protected: false` for both `main` and `security-readiness-prep`. Configure and verify branch protection and required status checks in repository settings before relying on CI as an enforced merge gate.

## TON verifier prototype — fixture-only

- `backend/ton-verifier.js` validates normalized test fixtures and records a pending, rejected, manual-review, or confirmed-but-uncredited result in an in-memory fixture store.
- `backend/ton-verifier.test.js` covers valid fixtures, wrong network/recipient, outbound/failed/bounced transactions, unfinalized transactions, integer nanotons, expired invoices, malformed input, and duplicate transaction handling.
- This is **not a blockchain verifier**: it trusts supplied fixture fields, has no TON provider/node integration, no cryptographic proof/finality validation, no durable database, and no balance/ledger integration.
- The fixture store is volatile and must never be used for real deposits. The module is not wired into `worker.js` or any API route.
- Payment and transaction route families remain disabled with HTTP 403. No wallet signing, transaction submission, mainnet access, or real funds are involved.

## Automated checks and evidence

- Run with Node.js 18 or newer: `cd backend && npm test`.
- The previous suite contained 38 automated tests (24 backend/HTTP mock-D1 tests and 14 demo game-rule tests). The verifier prototype adds 13 unit tests, for 51 total expected tests once CI confirms the branch head.
- Relevant CI evidence for the preceding documentation-only commit: [run 38822921818](https://github.com/nicolamona/ton-horse-racing/actions/runs/38822921818). Check the latest run after code/test changes before treating the new tests as passing.
- These are CI results for their referenced commits, not proof of production safety. The workflow does not verify a live Worker/D1 deployment or real TON transactions.
- No browser E2E, live Worker/D1 integration, TON testnet transaction test, independent secret scan, or software-composition-analysis scan was executed in the source review.

## Risks and limits

- Browser `localStorage` is user-controlled; client-submitted race outcomes are not authoritative.
- A public wallet address submitted by a browser is not proof of wallet ownership.
- CORS is not authentication and does not prevent non-browser clients from calling an endpoint.
- No rate limiter, wallet-ownership proof, server-authoritative race engine, real-balance ledger, payout service, or production blockchain transaction verifier is implemented.
- The address format check is a basic input-shape check, not full TON address validation.
- The frontend loads TON Connect UI 2.0.9 from an external CDN without Subresource Integrity. GitHub Actions use major-version tags rather than immutable full commit SHAs.
- No dedicated automated secret/history scan or dependency/license vulnerability scan was executed.

## Audit and operational documentation

- [FINAL_SECURITY_AUDIT.md](./FINAL_SECURITY_AUDIT.md): source-level findings, severity, evidence boundaries, and residual risks.
- [ENDPOINT_AUDIT.md](./ENDPOINT_AUDIT.md): route-by-route endpoint findings.
- [TON_DEPOSIT_ARCHITECTURE.md](./TON_DEPOSIT_ARCHITECTURE.md): design-only TON transaction verification, idempotency, ledger, reconciliation, and future test strategy.
- [TON_VERIFIER_STATUS.md](./TON_VERIFIER_STATUS.md): scope and limitations of the fixture-only verifier prototype.
- [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md): monitoring, incident handling, backups, recovery, and rollback guidance.
- [READINESS_CHECKLIST.md](./READINESS_CHECKLIST.md): security, legal, privacy, and operational gates.

## Required gates

Keep payment and blockchain transaction routes disabled. Do not interpret this document as authorization or a deployment plan for deposits, wagering, balances, or payouts. Before any future regulated-product consideration, obtain independent legal advice for every target jurisdiction and an independent security review. Verify licensing, eligibility and age assurance, privacy and retention, consumer protection, dispute handling, audit obligations, monitoring, incident response, rate limiting, backup restoration, immutable action pinning, branch protection, browser E2E, live demo API integration, and separately approved testnet-only transaction cases.
