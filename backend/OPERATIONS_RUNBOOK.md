# Operations runbook — TON Horse Racing demo

This runbook is for the static arcade demo and the optional demo-only Worker. It is not an instruction to deploy financial features.

## 1. Service inventory

- **Static frontend:** GitHub Pages at https://nicolamona.github.io/ton-horse-racing/
- **Frontend deployment:** GitHub Actions workflow `.github/workflows/deploy.yml`, triggered by pushes to `main` or manual dispatch.
- **Optional API:** Cloudflare Worker scaffold under `backend/`; repository evidence says it is not deployed.
- **Optional database:** Cloudflare D1 scaffold. `backend/wrangler.toml` contains a placeholder database ID and must not be treated as configured.
- **External dependency:** TON Connect UI is loaded from a third-party CDN. Wallet connection is intended to be read-only.

## 2. Routine checks

### Static demo
1. Open the GitHub Pages URL in a current browser.
2. Confirm the page identifies itself as an arcade demo with no real money.
3. Test a race, each reward position using controlled test data where available, the displayed balance, reset control, and recent history.
4. Check browser console/network errors if wallet UI or animation does not load.
5. Confirm the wallet connection only displays the public address and does not request signatures or send transactions.

### Automated backend checks
Run from the repository root. The test command also runs the pure game-rule tests in `game-logic.test.mjs`:

```sh
cd backend
node --version
npm test
```

Use Node.js 18 or newer. The suite uses Node's built-in test runner and does not require third-party test dependencies. The current CI run covers 37 tests; this does not replace browser-level end-to-end testing. Also inspect the GitHub Actions run attached to the PR; a local pass is not a substitute for the required CI result.

### Optional Worker health
Only if an authorized operator has separately deployed the demo Worker, request `GET /health` from an approved test client. Expect `mode: "demo-only"`, `paymentsEnabled: false`, and a boolean `storageConfigured`. A healthy response does not prove the D1 schema is correct or the service is secure.

## 3. Logs and privacy

- Do not log seed phrases, private keys, authentication credentials, request bodies, or unnecessary personal data.
- Avoid recording full wallet addresses unless there is a documented operational need and retention policy.
- Prefer counts, timestamps, route names, response status, and redacted correlation identifiers.
- Do not include credentials or sensitive request details in screenshots, CI output, issue comments, or incident reports.
- CORS responses are not evidence of identity or authorization.

## 4. Incident response

1. Record the UTC timestamp, affected URL/route, status code, impact, and relevant non-sensitive request identifier.
2. Preserve minimal logs needed to diagnose the issue, applying the data-retention policy.
3. If the public demo is unstable, stop further releases and identify the last known-good commit and deployment run.
4. Keep payment and transaction routes disabled; do not try to recover by enabling a feature flag or changing environment variables.
5. For suspected secret exposure, revoke/rotate the affected credential through its provider, review access logs, and remove the secret from future code. Do not paste the secret into chat or issue trackers.
6. Document cause, impact, remediation, and follow-up tests. Escalate security or legal concerns to the designated qualified professional.

## 5. Recovery and rollback

- **Static frontend:** use GitHub Pages deployment history and the associated commit SHA to identify the last known-good release. A rollback must be a reviewed revert commit or an approved redeployment of a known-good commit; do not force-push `main`.
- **Worker/D1:** no deployment or backup has been verified for this repository. Before any authorized demo deployment, document the exact Worker version, D1 migration state, backup method, restore test, and responsible operator.
- **Database recovery:** back up only demo data needed for continuity; protect exports, restrict access, and verify restored schema/data integrity before use. Never store or restore real balances in this demo.
- **Validation after recovery:** rerun `npm test`, check `GET /health` if applicable, confirm payment/transaction endpoints remain blocked, and check the public demo without connecting any transaction flow.

## 6. Release control

- Work in a separate branch and PR.
- Require successful GitHub Actions checks and a human diff review.
- Check for credentials and confirm the payment/transaction guardrails before merge.
- The observed `main` branch did not have branch protection or required status checks at audit time; configure these in repository settings if authorized.
- The Pages workflow publishes static files on pushes to `main`; do not merge until the change is intentionally approved.
- Do not deploy the Worker while the D1 database ID is a placeholder.
- This demo-only runbook does not authorize deposits, wagering, payouts, or any other financial operations.
