# TON verifier prototype status

**Scope: isolated unit-test prototype only. No real deposits.**

## Implemented

- `ton-verifier.js` evaluates normalized candidate and invoice fixtures.
- It checks the expected network and recipient, inbound/success/bounce flags, a finalized flag, exact integer nanotons, and invoice expiration.
- It records accepted fixtures as `confirmed_uncredited`; non-finalized fixtures remain `pending_confirmation`; inconsistent fixtures are rejected; malformed or incomplete context fails to `manual_review`.
- A deterministic in-memory fixture store deduplicates by network + recipient + transaction hash and returns an existing record for a replay.
- The result explicitly includes `credited: false`. No balance update or game integration exists.
- `ton-verifier.test.js` tests normal and negative paths, duplicate handling, and defensive copies.

## Critical limitations

This is **not proof of a TON transaction**. The function receives normalized fields from its caller and cannot prove that those fields match the blockchain. It does not call a TON API or node, validate cryptographic inclusion/finality proofs, normalize canonical TON addresses, persist records durably, or safely handle concurrent distributed workers. The in-memory store is for tests only.

The prototype is not imported by `worker.js`, does not create endpoints, and does not change the existing HTTP 403 blocks for `/api/payments/*` and `/api/transactions/*`.

## Next engineering gate

Before a separately authorized testnet read-only adapter is considered:

1. Select and document a TON data provider or independently operated node/indexer, its network identity, limits, outage behavior, and trust model.
2. Define canonical account/transaction identifiers and validate transaction inclusion/finality using a documented TON-specific method; do not treat provider booleans alone as cryptographic proof.
3. Replace the in-memory fixture store with a reviewed test-only persistence design only after concurrency and uniqueness constraints are specified.
4. Add adapter contract tests with mocked provider responses, timeouts, malformed payloads, pagination/re-scan, and provider disagreement.
5. Keep testnet-only configuration explicit and fail closed if network/provider configuration is missing or points at mainnet.
6. Keep all financial routes disabled and keep the verifier disconnected from credits, balances, wagers, and payouts.

No wallet signing, transaction broadcast, private keys, seed phrases, mainnet calls, real funds, deployment, or financial endpoint enablement are part of this prototype.
