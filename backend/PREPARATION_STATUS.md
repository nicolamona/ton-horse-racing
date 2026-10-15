# Preparation status — demo only

Last reviewed: 2026-10-15

## Current state

- The frontend is a static arcade demonstration with fictional credits stored in the browser.
- TON Connect is display-only; the frontend does not request wallet signatures or submit transactions.
- The optional Cloudflare Worker is a demo-only scaffold and is not deployed.
- The D1 schema stores demo race results only.
- The Worker explicitly reports `paymentsEnabled: false` and rejects `/api/payments/*` and `/api/transactions/*`.
- The D1 database ID in `wrangler.toml` is a placeholder. Do not deploy the Worker until the demo configuration is intentionally completed and reviewed.

## Safe work prepared

- A dependency-free Node.js test suite checks that payment and transaction routes stay disabled, the health endpoint reports demo-only mode, unknown routes fail closed without storage, and an unapproved origin is rejected.
- Run the suite from this directory with Node.js 18 or newer: `npm test`.
- These tests cover selected guardrails; they are not a complete security audit and do not verify a live deployment.

## Before any future production consideration

A claimed approval alone is not a technical release gate. Obtain independent legal advice for each target jurisdiction and a qualified, independent security review. Confirm licensing and eligibility, age-assurance requirements, privacy/data-retention rules, consumer protection, dispute handling, operational monitoring, incident response, and audit obligations with qualified professionals.

Do not interpret this document as authorization or a deployment plan for deposits, wagering, balances, or payouts. This repository remains demo-only; keep payment and blockchain transaction routes disabled. Any future regulated product must undergo a separate professional review and an explicitly scoped implementation process before any production decision.

## Known technical limitations to keep visible

- A public wallet address submitted by the browser is not proof of wallet ownership.
- The demo API accepts client-submitted race outcomes; these must not be treated as authoritative or as evidence of a real result.
- Browser localStorage is user-controlled and must never be treated as a trusted balance or ledger.
- CORS is not authentication and does not prevent non-browser clients from calling an endpoint.
- No deposit monitor, real-balance ledger, payout service, or blockchain transaction verifier is implemented here.
