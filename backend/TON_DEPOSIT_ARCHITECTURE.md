# TON deposit architecture — future design only

**Status: DOCUMENTATION ONLY.** Nothing in this document enables deposits, creates a wallet, accepts a payment, credits a balance, or authorizes wagering. The current application must remain demo-only until separately approved after technical and legal review.

## 1. Trust boundaries

- The browser and its TON Connect session are untrusted inputs. A connected address, wallet callback, transaction hash, amount, memo, or screenshot is not proof that a deposit occurred.
- Never request, receive, log, or store a user's seed phrase or private key. TON Connect should remain read-only until a separately reviewed wallet interaction is needed.
- A backend verifier must obtain transaction data independently from a configured TON data provider or a self-operated, monitored TON node/indexer. Provider choice, redundancy, service limits, and trust assumptions must be documented before implementation.
- Keep demo credits and records in a separate namespace/schema from any future real-asset ledger. Never convert a demo record into a real balance.

## 2. Transaction identification and verification

For every deposit candidate, the backend should:

1. Assign an internal invoice/deposit ID using a cryptographically secure server-side generator. Bind it to the expected network (testnet or mainnet), intended recipient, expected asset type, and expiration/status policy. Never accept a client-chosen invoice as authoritative.
2. Fetch the transaction from the independently configured TON data source and verify it belongs to the intended network and destination account. Validate canonical address forms and compare normalized raw addresses, not display strings alone.
3. Identify the transaction with a stable chain identity. Store at least network, destination account, transaction hash, logical time (lt), block/shard/masterchain context when supplied, sender, inbound message hash when supplied, amount in integer nanotons, payload/comment bytes or a safe digest, observed time, and provider/source metadata. Do not use floating-point TON values.
4. Verify the transaction is included in a block that the provider reports as finalized/accepted according to a documented TON-specific confirmation policy. Validate the relevant masterchain/block linkage using provider-supported proof or an independently operated verifier. Do not treat a wallet UI callback, broadcast acknowledgement, pending transaction, or unverified webhook as confirmation.
5. Verify the inbound message is successful and matches the expected recipient and supported transfer type. Reject bounced, failed, outbound-only, wrong-network, wrong-recipient, unsupported-token, malformed, expired, underpaid, or otherwise inconsistent transactions. If jettons are ever considered, implement their transfer notification and token-contract verification as a separate reviewed scope; do not interpret a jetton amount as native TON.
6. Match the transaction to an unexpired internal invoice. If using a shared recipient address, require a unique server-generated invoice identifier in the supported payload/comment and verify it byte-for-byte; the comment alone is not proof of payment. Prefer a dedicated deposit address or a reviewed contract flow if reliable attribution cannot be achieved.
7. Persist the observed transaction and verification evidence before attempting a credit. A temporary provider failure must leave it pending, not confirmed or credited.

A production implementation must document the chosen provider's exact finality semantics, proof verification, rate limits, outage behavior, and independent cross-check strategy. This file intentionally does not prescribe unverified provider-specific API calls.

## 3. Idempotency and atomic ledger

Use a dedicated real-deposit ledger only after explicit authorization. Enforce database uniqueness on a canonical chain identity, at minimum (network, destination_account, transaction_hash) and/or the protocol-appropriate account plus logical-time identity; also enforce a unique internal invoice and unique credit-ledger reference. Confirm the correct identity tuple against the selected TON data source before implementation.

Use a transactionally safe state transition such as:

observed -> pending_confirmation -> confirmed_uncredited -> credited

Terminal/review states may include rejected, expired, underpaid, and manual_review. A provider outage is not a rejection and must not erase evidence.

The state change to credited, ledger entry insertion, and balance update must happen in one database transaction (or a rigorously designed transactional outbox/ledger flow). The credit amount must be derived from verified chain data and server-side invoice terms, never from a browser-supplied amount. Repeated webhooks, retries, worker restarts, concurrent requests, and replayed messages must converge on the same record and must never create a second credit. A duplicate should return the existing status without a second ledger mutation.

Prefer an append-only ledger with immutable deposit/credit references and compensating entries for corrections. Do not edit or delete historical financial entries to resolve discrepancies. Separate operator adjustments, require dual authorization, and audit every action.

## 4. Reconciliation procedure

Run scheduled reconciliation independently of the user-facing request path:

1. Fetch chain transactions for each configured deposit account over an overlapping time window, using persisted cursors/checkpoints. Re-scan a safety overlap to cover indexing delays and recover missed events.
2. Upsert candidates by stable chain identity under uniqueness constraints; never credit during a blind import.
3. Compare verified chain transactions, invoices, deposit states, ledger entries, and balance aggregates.
4. Classify discrepancies: chain transaction with no invoice; invoice with no transaction; pending beyond SLA; confirmed but uncredited; credited without valid confirmed evidence; duplicate identity; amount/recipient/network mismatch; provider disagreement; missing or stale checkpoint; ledger/balance aggregate mismatch.
5. Automatically retry only safe, idempotent read/verification work. Put unexplained discrepancies and any credited-without-evidence case into a restricted manual-review queue. Never auto-credit an ambiguous match.
6. Alert an operator with redacted identifiers and severity, retain an immutable audit trail, record disposition and reviewer, and require a second authorized reviewer for financial corrections.
7. Record reconciliation run ID, range/checkpoint, provider health, counts per state, discrepancies, and completion time. Alert on missed runs, lag, provider disagreement, unusual deposit rates, and any invariant violation.
8. Periodically restore backups in an isolated environment and reconcile the restored ledger against retained evidence.

Define service-level thresholds, retention, alert routing, and operator ownership before any production implementation. Reconciliation does not replace transaction verification.

## 5. Test strategy before implementation

Use TON testnet and controlled fixtures only, with no mainnet funds. Tests must cover valid finalized inbound transfers; pending/unfinalized transfers; failed, bounced, malformed and wrong-network transactions; wrong recipient; unsupported asset; expired or mismatched invoice; insufficient/excess amount policy; duplicate transaction under concurrent workers; replayed webhook; provider timeout/rate limit/outage; stale checkpoints; provider disagreement; restart between verification and credit; database failure during credit; and reconciliation detection of missing, duplicate, or inconsistent ledger entries.

Prove with integration tests that the same transaction can create at most one ledger credit under concurrency and retry. Testnet evidence is not proof of mainnet readiness. Keep all current /api/payments/* and /api/transactions/* routes disabled in every environment until separate explicit authorization.

## 6. Required production gates

- Independent security review and threat model, including provider compromise, webhook spoofing, replay, race conditions, insider abuse, and database restore.
- Reviewed provider/node architecture, finality policy, canonical address parsing, supported message types, monitoring, and outage/failover behavior.
- Dedicated real ledger, atomic accounting invariants, idempotency constraints, access controls, append-only audit events, and tested reconciliation.
- Secret management for server-side provider credentials only; least privilege, rotation, and no secrets in browser bundles or logs. No user seed phrases or private keys.
- Tested backup encryption, access restrictions, restore drills, incident response, key/provider rotation, and rollback procedures.
- Qualified legal/compliance review for each target jurisdiction, including licensing, age assurance, geolocation, consumer protection, privacy, recordkeeping, taxation, disputes, and responsible-gambling obligations where applicable.
- Explicit written product-owner authorization after technical and legal review, followed by a separately reviewed implementation PR and controlled testnet validation.

Until every gate is satisfied, this remains a design document and no deposit, wager, conversion, balance credit, or withdrawal may be enabled.
