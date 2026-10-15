# Final source-level security audit — TON Horse Racing

**Review date:** 2026-10-15  
**Reviewed ref:** security-readiness-prep (source snapshot ac7454bb96cea2a0654e6fe95d1ea6b5d14557c7, before this audit document was added)  
**Classification:** preparation review; not a penetration test, formal audit, legal opinion, or production-readiness certification.

## Executive conclusion

The repository is a static arcade demo with fictional credits. The reviewed Worker scaffold deliberately disables payment and transaction routes, and its D1 schema contains demo race history only. The current code is **not ready for real deposits, real-money wagering, payouts, or real-asset balances**. Keep all financial routes disabled. The existing open PR is a review vehicle, not authorization to merge or deploy.

## Scope and evidence

Reviewed the branch tree and source for: index.html; game-logic.mjs and game-logic.test.mjs; backend/worker.js and worker.test.js; backend/schema.sql and migrations/0001_demo_races.sql; backend/package.json; backend/wrangler.toml; scripts/check-frontend.mjs; GitHub Actions workflows; TON Connect manifest; README and preparation/operations/endpoint/checklist documentation. Read-only repository and Actions metadata were queried. The optional Worker and D1 deployment were not accessed or tested live.

This is source-level analysis of the current branch, not a claim that every historical Git object, external dependency artifact, deployed runtime, account setting, or public endpoint has been exhaustively scanned. No independent secret-scanner, software-composition-analysis service, browser automation suite, or penetration-testing tool was run in this review.

## Findings and disposition

### Critical for any real-asset launch — unresolved, intentionally out of scope

1. **Client-controlled credits and outcomes.** Browser localStorage is user-controlled; users can edit fictional balances and history. The browser generates race progress and winner outcomes. The Worker accepts client-submitted selected/winner horse claims. These properties are acceptable only for clearly labeled entertainment data; they cannot back a valuable balance, contest result, payout, or financial ledger. Future real operations require a server-authoritative race engine and ledger, not a frontend patch.
2. **No TON deposit verifier or accounting ledger.** There is no implemented chain transaction verifier, finality policy, deposit monitor, invoice matcher, real balance table, payout path, or reconciliation process. The architecture is documented separately in TON_DEPOSIT_ARCHITECTURE.md; it is not implemented.
3. **No authenticated user identity or authorization for demo history.** A wallet address supplied by a request is a grouping label, not proof of control. GET history is not private or access-controlled by wallet ownership. Do not use this API for sensitive user data.
4. **No request rate limiting or abuse controls in the Worker.** Origin checks and CORS do not authenticate clients and can be bypassed by non-browser callers. Apply reviewed provider-level limits before exposing the API more broadly.
5. **Legal, regulatory, and user-protection gates remain open.** Qualified counsel and compliance professionals must assess each intended jurisdiction and product model. Independent security review is required before any production financial use.

### High — resolve before public API expansion or production consideration

6. **Third-party frontend script supply-chain exposure.** index.html loads TON Connect UI 2.0.9 from unpkg without Subresource Integrity. The version is explicit, but a compromised or changed CDN response could execute in the page origin. Before expanding wallet capabilities, consider a reviewed self-hosted, integrity-pinned asset strategy, dependency update policy, and browser regression tests. Do not add wallet signing or transaction methods as part of this preparation.
7. **GitHub Actions supply-chain pinning.** Workflow actions use major-version tags (for example, actions/checkout@v4 and actions/deploy-pages@v4), not immutable full commit SHAs. Review and pin actions to verified full SHAs with an update process before treating CI as a hardened release control.
8. **Branch protection is not enabled.** The repository branch listing reports protected=false for main and security-readiness-prep. Configure required review/status checks and restrict direct pushes in GitHub settings if authorized. Passing CI alone is not a merge gate while branch rules are absent.
9. **No live integration or browser E2E coverage.** Tests use a mock D1 binding; no live Worker/D1, real browser, wallet-provider, or TON testnet transaction integration was exercised. Those tests remain pending and must be separately approved and isolated.

### Medium — demo limitations / hardening opportunities

10. **Address validation is shape-only.** The Worker regex is not full TON address parsing or normalization. This is not sufficient for transaction verification.
11. **Demo race IDs are caller-generated.** A unique constraint and duplicate response prevent duplicate storage of the same race ID, but do not prove a race happened, ensure ownership, or prevent a caller from inventing another ID.
12. **Operational visibility is incomplete.** The Worker has generic error responses but no application-level structured audit events, alerts, rate-limit telemetry, or demonstrated backup/restore. The D1 identifier in wrangler.toml remains a placeholder, and the repository evidence does not establish a deployed Worker or configured D1 database.
13. **Dependency and secret scanning are incomplete.** backend/package.json has no third-party npm dependencies and the tests use Node's built-in runner. However, the frontend relies on an external CDN script. No dedicated automated secret scan, history scan, SCA/license scan, or vulnerability database scan was run in this review. No production credentials should be added to source control; rotate any credential found exposed by a separate scan.

## Controls observed in the reviewed branch

- Payment route families /api/payments and /api/transactions return HTTP 403 before database access, independently of environment flags.
- The Worker has a body-size limit, JSON/object checks, numeric horse validation, parameterized SQL, bounded history query limit, and generic database error responses.
- D1 demo schema stores race history only; it does not contain a real balance, deposit, or payout ledger.
- The frontend labels itself as a demo and says fictional credits have no monetary value. The static guard test checks these labels and rejects known wallet signing/transaction method calls.
- TON Connect usage observed in index.html reads and displays a public wallet address; no transaction signing or sending call was observed in the reviewed file.
- The Wrangler D1 ID is a placeholder, not a production database identifier.
- The deployment workflow runs on pushes to main or manual dispatch, not on pushes to the preparation branch. Do not merge this PR until its diff is approved; never use manual dispatch to publish unapproved content.

## Test and CI evidence

Latest inspected pull-request workflow: https://github.com/nicolamona/ton-horse-racing/actions/runs/38822413185  
Result: completed successfully. The workflow's test command and frontend syntax/demo-only guard step both completed successfully.

The repository's current test suite is documented as 38 automated tests: 24 Worker HTTP/mock-database tests and 14 game-rule tests. The latest workflow evidence says success; the test step output was not independently re-executed in a local checkout during this review. The run's successful conclusion is CI evidence, not proof of production safety.

Separate earlier run recorded in the PR description: https://github.com/nicolamona/ton-horse-racing/actions/runs/38822355065

## Required next actions before any real-asset proposal

- [ ] Complete dedicated secret/history scan and dependency/SCA/license review; record tool versions, scope, and results.
- [ ] Pin GitHub Actions to verified immutable SHAs and establish dependency update ownership.
- [ ] Configure and verify branch protection, required checks, and reviewed deployment permissions.
- [ ] Add browser E2E tests for animation, localStorage, profile switching, reset behavior, wallet connection UI, and error cases.
- [ ] Add a threat model and independently reviewed authorization, rate limiting, and privacy controls before any public user-data API.
- [ ] Implement TON verification, atomic idempotent ledger, reconciliation, alerting, and restore-tested backups only in a separate, explicitly authorized project phase; use testnet fixtures first.
- [ ] Obtain independent application security assessment and qualified jurisdiction-specific legal/compliance advice.
- [ ] Require explicit written owner approval after reviews; keep all financial routes disabled until then.

## Files changed by this audit continuation

- backend/TON_DEPOSIT_ARCHITECTURE.md — design-only architecture for future TON transaction verification, idempotency, ledger handling, reconciliation, test cases, and production gates. No transaction code was added.
- backend/FINAL_SECURITY_AUDIT.md — this source-level finding register, evidence limits, and residual-risk checklist.

No deployment, database migration, data deletion, public-site modification, payment enablement, or merge was performed by this audit continuation.
