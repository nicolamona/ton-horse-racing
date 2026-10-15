import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.js";

const ORIGIN = "https://nicolamona.github.io";
const WALLET = "EQC1234567890abcdefghijklmnopqrstuvwxyz";
const VALID_RACE = {
  raceId: "race_demo_0001",
  walletAddress: WALLET,
  selectedHorse: 2,
  winnerHorse: 1
};

async function call(path, {
  method = "GET",
  origin = ORIGIN,
  body,
  contentType = "application/json"
} = {}, env = {}) {
  const headers = new Headers();
  if (origin !== null) headers.set("Origin", origin);
  if (body !== undefined && contentType) headers.set("Content-Type", contentType);
  const hasBody = body !== undefined && method !== "GET" && method !== "HEAD";
  const requestBody = !hasBody
    ? undefined
    : typeof body === "string" ? body : JSON.stringify(body);
  const request = new Request("https://demo-api.invalid" + path, {
    method,
    headers,
    body: requestBody
  });
  return worker.fetch(request, env);
}

function mockDb({ all, run } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      calls.push({ sql });
      return {
        bind(...values) {
          calls[calls.length - 1].values = values;
          return {
            async all() {
              if (all instanceof Error) throw all;
              return { results: all ?? [] };
            },
            async run() {
              if (run instanceof Error) throw run;
              return run ?? { success: true };
            }
          };
        }
      };
    }
  };
}

test("health endpoint identifies demo-only mode and disabled payments", async () => {
  const response = await call("/health");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.mode, "demo-only");
  assert.equal(body.paymentsEnabled, false);
  assert.equal(body.storageConfigured, false);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("health endpoint rejects unsupported methods", async () => {
  const response = await call("/health", { method: "POST", body: {} });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, OPTIONS");
  assert.deepEqual(await response.json(), { error: "method_not_allowed" });
});

test("payment endpoints stay disabled with configured storage", async () => {
  for (const path of ["/api/payments", "/api/payments/deposit"]) {
    for (const method of ["GET", "POST", "DELETE"]) {
      const response = await call(path, { method, body: { amount: 1 } }, { DB: {} });
      assert.equal(response.status, 403, path + " " + method);
      assert.equal((await response.json()).enabled, false);
    }
  }
});

test("transaction endpoints stay disabled with configured storage", async () => {
  for (const path of ["/api/transactions", "/api/transactions/send"]) {
    for (const method of ["GET", "POST", "DELETE"]) {
      const response = await call(path, { method, body: { amount: 1 } }, { DB: {} });
      assert.equal(response.status, 403, path + " " + method);
      assert.equal((await response.json()).error, "payments_and_blockchain_transactions_are_disabled");
    }
  }
});

test("unknown routes return 404 even if demo storage is absent", async () => {
  const response = await call("/api/unknown");
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "not_found" });
});

test("race endpoint fails closed when demo storage is absent", async () => {
  const response = await call("/api/races?walletAddress=" + WALLET);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "demo_database_not_configured" });
});

test("unapproved browser origin is rejected", async () => {
  const response = await call("/health", { origin: "https://example.invalid" });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "origin_not_allowed" });
});

test("missing Origin is accepted but does not constitute authentication", async () => {
  const response = await call("/health", { origin: null });
  assert.equal(response.status, 200);
});

test("CORS preflight is answered without enabling payments", async () => {
  const response = await call("/api/payments/deposit", { method: "OPTIONS" });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
});

test("POST races requires application/json", async () => {
  const response = await call("/api/races", {
    method: "POST",
    body: JSON.stringify(VALID_RACE),
    contentType: "text/plain"
  }, { DB: mockDb() });
  assert.equal(response.status, 415);
  assert.deepEqual(await response.json(), { error: "application_json_required" });
});

test("malformed JSON is rejected cleanly", async () => {
  const response = await call("/api/races", {
    method: "POST",
    body: "{invalid",
    contentType: "application/json"
  }, { DB: mockDb() });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_json" });
});

test("null and array JSON bodies are rejected instead of throwing", async () => {
  for (const body of ["null", "[]", "42", "\"text\""]) {
    const response = await call("/api/races", {
      method: "POST",
      body,
      contentType: "application/json"
    }, { DB: mockDb() });
    assert.equal(response.status, 400, body);
    assert.deepEqual(await response.json(), { error: "json_object_required" });
  }
});

test("oversized JSON request body is rejected", async () => {
  const response = await call("/api/races", {
    method: "POST",
    body: { ...VALID_RACE, extra: "x".repeat(17 * 1024) }
  }, { DB: mockDb() });
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "request_body_too_large" });
});

test("invalid race IDs are rejected", async () => {
  const response = await call("/api/races", {
    method: "POST",
    body: { ...VALID_RACE, raceId: "x" }
  }, { DB: mockDb() });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_race_id" });
});

test("invalid wallet addresses are rejected", async () => {
  const response = await call("/api/races", {
    method: "POST",
    body: { ...VALID_RACE, walletAddress: "short" }
  }, { DB: mockDb() });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "valid_wallet_address_required" });
});

test("horse positions must be integer numbers from 1 through 8", async () => {
  for (const selectedHorse of [0, 9, -1, 1.5, "1", null]) {
    const response = await call("/api/races", {
      method: "POST",
      body: { ...VALID_RACE, selectedHorse }
    }, { DB: mockDb() });
    assert.equal(response.status, 400, String(selectedHorse));
    assert.deepEqual(await response.json(), { error: "horse_must_be_between_1_and_8" });
  }
});

test("valid demo race is saved with parameterized SQL", async () => {
  const db = mockDb();
  const response = await call("/api/races", { method: "POST", body: VALID_RACE }, { DB: db });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, mode: "demo-only", saved: true });
  assert.match(db.calls[0].sql, /VALUES \(\?, \?, \?, \?\)/);
  assert.deepEqual(db.calls[0].values, [
    VALID_RACE.raceId,
    VALID_RACE.walletAddress,
    VALID_RACE.selectedHorse,
    VALID_RACE.winnerHorse
  ]);
});

test("duplicate race IDs return an idempotent demo response", async () => {
  const db = mockDb({ run: new Error("UNIQUE constraint failed") });
  const response = await call("/api/races", { method: "POST", body: VALID_RACE }, { DB: db });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, duplicate: true, mode: "demo-only" });
});

test("database write errors return a generic error without exposing details", async () => {
  const db = mockDb({ run: new Error("private database detail") });
  const response = await call("/api/races", { method: "POST", body: VALID_RACE }, { DB: db });
  assert.equal(response.status, 500);
  const responseText = await response.text();
  assert.deepEqual(JSON.parse(responseText), { error: "race_save_failed" });
  assert.doesNotMatch(responseText, /private database detail/);
});

test("GET races validates wallet address and clamps the limit", async () => {
  const db = mockDb({ all: [{ race_id: "race_demo_0001" }] });
  const response = await call("/api/races?walletAddress=" + WALLET + "&limit=999", {}, { DB: db });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.mode, "demo-only");
  assert.equal(body.walletAddress, WALLET);
  assert.equal(body.races.length, 1);
  assert.deepEqual(db.calls[0].values, [WALLET, 50]);
});

test("GET races rejects invalid wallet address", async () => {
  const response = await call("/api/races?walletAddress=short", {}, { DB: mockDb() });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "valid_wallet_address_required" });
});

test("database read errors return a generic error without exposing details", async () => {
  const db = mockDb({ all: new Error("private database detail") });
  const response = await call("/api/races?walletAddress=" + WALLET, {}, { DB: db });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "race_read_failed" });
});

test("unsupported methods on race endpoint return 405", async () => {
  const response = await call("/api/races", { method: "DELETE" }, { DB: mockDb() });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, POST, OPTIONS");
  assert.deepEqual(await response.json(), { error: "method_not_allowed" });
});
