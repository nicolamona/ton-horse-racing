import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.js";

const ORIGIN = "https://nicolamona.github.io";

async function call(path, { method = "GET", origin = ORIGIN, body } = {}, env = {}) {
  const headers = new Headers();
  if (origin !== null) headers.set("Origin", origin);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  const request = new Request("https://demo-api.invalid" + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return worker.fetch(request, env);
}

test("health endpoint clearly identifies demo-only mode and disabled payments", async () => {
  const response = await call("/health");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.mode, "demo-only");
  assert.equal(body.paymentsEnabled, false);
});

test("payment routes remain blocked even when storage is configured", async () => {
  const response = await call("/api/payments/deposit", { method: "POST", body: { amount: 1 } }, { DB: {} });
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.enabled, false);
  assert.equal(body.error, "payments_and_blockchain_transactions_are_disabled");
});

test("transaction routes remain blocked even when storage is configured", async () => {
  const response = await call("/api/transactions/send", { method: "POST", body: { amount: 1 } }, { DB: {} });
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.enabled, false);
  assert.equal(body.error, "payments_and_blockchain_transactions_are_disabled");
});

test("unknown routes fail closed when demo storage is absent", async () => {
  const response = await call("/api/unknown");
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "demo_database_not_configured" });
});

test("requests from an unapproved browser origin are rejected", async () => {
  const response = await call("/health", { origin: "https://example.invalid" });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "origin_not_allowed" });
});
