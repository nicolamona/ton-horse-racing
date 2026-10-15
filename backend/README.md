# Demo API (optional)

This is a **demo-only** Cloudflare Worker API scaffold. It does not handle money or blockchain activity.

## Included

- `GET /health`: health check and explicit `paymentsEnabled: false`.
- `GET /api/races?walletAddress=...&limit=20`: list demo races grouped by the supplied public wallet address.
- `POST /api/races`: store a demo race with a public wallet address (horse numbers 1–8; duplicate race IDs are idempotent).
- `/api/payments/*` and `/api/transactions/*`: deliberately disabled.
- D1 schema stores a public wallet address only as a grouping label for demo history; it stores no balances or transaction records.
- The browser keeps a separate local history for each connected address, plus a separate guest history.

## Important

GitHub Pages hosts only the static frontend. This Worker is **not deployed yet** and requires your own Cloudflare account and D1 database. The configuration contains a placeholder database ID. Do not deploy until that ID has been replaced and the schema has been applied.

## Setup when you're ready

1. Create a Cloudflare Worker named `ton-horse-racing-demo-api`.
2. Create a D1 database named `ton-horse-racing-demo`.
3. Replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.toml`.
4. Apply `schema.sql` to the D1 database.
5. Deploy the Worker with Wrangler from this directory.
6. Test `GET /health`, then test demo race history with non-sensitive sample data.
7. Configure the frontend API URL only after the Worker is deployed and tested.

**Identity limitation:** a public address sent by a browser is not proof that the sender controls that wallet. Do not treat server-side records as authenticated or private until a proper wallet-ownership proof and authorization layer is implemented. This scaffold intentionally does not request signatures or perform blockchain transactions.

No private keys, seed phrases, deposits, payouts, or real-money balances belong in this project. The connected wallet remains optional and display-only.
