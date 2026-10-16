# Final handoff — TON Horse Racing preparation

**Reviewed:** 2026-10-16  
**Branch:** `security-readiness-prep`  
**Pull request:** #1 — https://github.com/nicolamona/ton-horse-racing/pull/1  
**Scope:** source-level preparation and demo safety only.

## Current disposition

**Not activated. Not production-ready for financial use. Do not deploy financial functionality.**

- The browser game uses fictional/demo credits and client-controlled race outcomes.
- The optional Worker is a demo scaffold; its D1 ID is still a placeholder.
- `/api/payments` and `/api/transactions` route families return HTTP 403 regardless of environment flags and before database access.
- `backend/ton-verifier.js` checks normalized test fixtures only. It is not connected to a TON node/provider, does not prove a blockchain transaction, does not persist durable records, and cannot credit balances.
- `backend/ton-testnet-readonly.js` is a separate, opt-in command-line inspector that queries only the TON Center TESTNET transaction-history endpoint. It reports basic transaction identifiers/timestamps only. It is not wired into the Worker or game, does not verify deposits, does not establish independent finality, and cannot modify balances.
- `backend/ton-mainnet-readonly.js` is a separate, opt-in command-line history inspector for the TON Center MAINNET endpoint. It reports provider-supplied transaction identifiers, timestamps, and basic inbound-message fields. It performs no signing, submission, broadcasting, durable deduplication, deposit verdict, persistence, or balance modification. Its address check is basic input hygiene, not full TON address canonicalization, and provider output is not independent proof of finality.
- No wallet signing, transaction submission, real balance ledger, or mainnet financial operation is implemented by this preparation.
- The preparation PR remains open as a draft and has not been merged. Do not merge or deploy as an implicit approval.

## Read-only Testnet inspector

Requires Node.js 18 or newer. Run locally with a wallet address intended for TON Testnet:

```sh
node backend/ton-testnet-readonly.js <testnet-wallet-address>
```

An optional `TONCENTER_TESTNET_API_KEY` environment variable can be supplied for provider access/rate limits. Do not put API keys in source control. The script uses a fixed `https://testnet.toncenter.com` endpoint and has no signing, submission, deposit-crediting, or database code. Provider results are informational.

## Read-only Mainnet history inspector

Requires Node.js 18 or newer. Run locally with the wallet address whose recent history you want to inspect:

```sh
node backend/ton-mainnet-readonly.js <mainnet-wallet-address>
```

An optional `TONCENTER_MAINNET_API_KEY` environment variable can be supplied for provider access/rate limits. Do not put API keys in source control. The script uses a fixed `https://toncenter.com` endpoint and a GET request. It is a read-only history view, not a deposit validator: it does not establish finality, prove wallet ownership, decide whether a payment should be accepted, detect duplicates durably, or credit balances. No live Mainnet request has been run as part of this change.

## Automated checks

The repository test command is:

```sh
cd backend
npm test
```

GitHub Actions run [38827690498](https://github.com/nicolamona/ton-horse-racing/actions/runs/38827690498) completed successfully for the pull-request merge ref associated with the current PR snapshot (merge commit `36be34446387293e1dc730c25d5075834d04f69b`, including head `3a8db0f4e3c62d28a734cc18e7d20fd62b29caec`). The log reports **62 tests, 62 passed, 0 failed**. The frontend syntax and demo-only guard step also passed. This is CI evidence for the tested PR merge snapshot, not proof of production safety or live integration.

## Verified limitations / remaining review

- No live Worker/D1 integration or browser end-to-end test was run.
- Neither read-only inspector has been confirmed against its live provider in this change; no blockchain transaction was queried.
- No transaction was independently verified for finality or deposit purposes.
- No independent secret/history scan or dependency/SCA/license scan was completed.
- Branch protection and required checks are not confirmed as enabled; prior repository metadata reported both relevant branches unprotected.
- No dedicated rate limiter, authenticated user identity, wallet-ownership proof, server-authoritative race engine, or real-asset ledger exists.
- The external TON Connect UI CDN asset has no Subresource Integrity pin.
- Legal, compliance, and independent security reviews have not been completed.

## Safe completion criteria for this preparation branch

- [x] Inspect CI for the current PR merge snapshot: run 38827690498 succeeded (62/62 tests; frontend syntax/demo-only guards passed). Re-run after any further code changes.
- [ ] Complete independent secret/history and dependency scans; record scope and results.
- [ ] Pin GitHub Actions to verified immutable commit SHAs.
- [ ] Configure required review/status checks and deployment permissions in repository settings.
- [ ] Add browser E2E coverage for demo UI, history, reload, and error paths.
- [ ] Keep financial endpoints blocked and wallet transaction/signing methods absent.
- [ ] Record every unresolved finding; do not describe fixture tests as chain verification.

This handoff is a status record, not an activation checklist for handling real funds. No deployment, merge, financial enablement, or blockchain transaction was performed.
