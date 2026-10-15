# Security and compliance readiness checklist

This repository is currently an arcade demo. This checklist documents review work only; it does not enable deposits, wagering, payouts, wallet signatures, or blockchain transactions.

## Verified repository state (2026-10-15)

- [x] Static GitHub Pages frontend with fictional arcade credits.
- [x] TON Connect is display-only; the frontend does not request signatures or submit transactions.
- [x] Optional Cloudflare Worker scaffold is marked demo-only and is not deployed.
- [x] `GET /health` explicitly reports `paymentsEnabled: false`.
- [x] `/api/payments/*` and `/api/transactions/*` return a disabled response.
- [x] D1 schema stores demo race results only; it has no real balance, deposit, or payout ledger.
- [x] D1 database ID remains a placeholder in `wrangler.toml`.

## Current limitations to address before any regulated product is considered

### Legal and operational review
- [ ] Obtain independent legal advice for every jurisdiction where the product may be available.
- [ ] Confirm the scope, conditions, and validity of any claimed authorization with qualified counsel.
- [ ] Determine applicable licensing, age assurance, geolocation, consumer-protection, privacy, tax, recordkeeping, and responsible-gaming requirements.
- [ ] Establish documented support, complaints, dispute, incident-response, and account-closure processes.
- [ ] Obtain independent security review before any production use.

### Age assurance and privacy
- [ ] Do not treat a self-declared “I am 18+” checkbox or a proof-of-human credential as age verification.
- [ ] Verify that the selected World ID product actually supports an age attribute for the intended region and use case; confirm provider documentation and contractual eligibility.
- [ ] Define server-side verification, proof freshness/replay protections, failure handling, and a privacy-preserving data-retention policy.
- [ ] Collect the minimum necessary data; never store biometric data or identity documents unless a reviewed, lawful provider flow specifically requires it.
- [ ] Keep access decisions on a trusted server; browser-only flags and localStorage are not security controls.

### Application security
- [ ] Add a documented threat model and security ownership.
- [ ] Use server-side authorization for any sensitive action; never trust client-provided balances, race outcomes, wallet ownership, or payment status.
- [ ] Define rate limits, abuse monitoring, secure error handling, and audit-log retention.
- [ ] Review CORS, origin validation, request size limits, input validation, and database access patterns.
- [ ] Keep secrets out of source control and browser code; rotate any secret that is ever exposed.
- [ ] Add automated tests for validation, duplicate requests, replay attempts, outages, and authorization failures.
- [ ] Configure backups, recovery procedures, dependency updates, and deployment rollback.

### Demo-only testing
- [ ] Test only with fictional credits and mock transaction fixtures.
- [ ] Test duplicate event handling, malformed payloads, timeouts, and service outages without contacting a blockchain or moving funds.
- [ ] Confirm that no test can create a redeemable balance or be mistaken for a real payment.
- [ ] Recheck that payment and transaction endpoints remain disabled after every change.

## Explicit non-goals for this repository checklist

This document does not implement or provide a build plan for real-money betting flows, deposit monitoring, payment confirmation, wagering balances, payouts, or smart-contract interaction. Keep the current payment and blockchain routes disabled. Any future regulated product requires separate professional legal, compliance, and security review before implementation is considered.

## Safe next steps in this repository

1. Add clear arcade-demo labeling and explain that credits have no monetary value.
2. Improve privacy and security documentation for the existing demo.
3. Add automated tests that assert payment and blockchain endpoints remain disabled.
4. Review and test the existing demo API without deploying it or adding secrets.
