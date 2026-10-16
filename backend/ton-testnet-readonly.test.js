import test from "node:test";
import assert from "node:assert/strict";
import { inspectTestnetTransactions, validateTestnetAddress } from "./ton-testnet-readonly.js";

const ADDRESS = "EQC1234567890123456789012345678901234567890";

test("accepts a plausible TON address string without trimming it", () => {
  assert.equal(validateTestnetAddress(ADDRESS), true);
  assert.equal(validateTestnetAddress(` ${ADDRESS}`), false);
  assert.equal(validateTestnetAddress(""), false);
});

test("queries the fixed TON Testnet endpoint using GET and returns read-only metadata", async () => {
  let calledUrl;
  let calledOptions;
  const fetchImpl = async (url, options) => {
    calledUrl = new URL(url);
    calledOptions = options;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        result: [
          { transaction_id: { hash: "abc123", lt: "42" }, utime: 1700000000 },
          { transaction_id: { hash: "def456", lt: "43" }, utime: 1700000001 }
        ]
      })
    };
  };

  const result = await inspectTestnetTransactions({
    address: ADDRESS,
    fetchImpl,
    apiKey: "test-key"
  });

  assert.equal(calledUrl.origin, "https://testnet.toncenter.com");
  assert.equal(calledUrl.pathname, "/api/v2/getTransactions");
  assert.equal(calledUrl.searchParams.get("address"), ADDRESS);
  assert.equal(calledUrl.searchParams.get("limit"), "10");
  assert.equal(calledOptions.method, "GET");
  assert.equal(calledOptions.headers["X-API-Key"], "test-key");
  assert.equal(result.network, "testnet");
  assert.equal(result.readOnly, true);
  assert.equal(result.count, 2);
  assert.deepEqual(result.transactions[0], {
    hash: "abc123",
    logicalTime: "42",
    unixTime: 1700000000
  });
  assert.equal("credited" in result, false);
  assert.equal("amount" in result.transactions[0], false);
});

test("rejects invalid addresses before making a request", async () => {
  let called = false;
  await assert.rejects(
    inspectTestnetTransactions({
      address: "bad",
      fetchImpl: async () => {
        called = true;
        throw new Error("must not be called");
      }
    }),
    TypeError
  );
  assert.equal(called, false);
});

test("rejects unsuccessful provider responses", async () => {
  await assert.rejects(
    inspectTestnetTransactions({
      address: ADDRESS,
      fetchImpl: async () => ({ ok: false, status: 503 })
    }),
    /HTTP 503/
  );
});

test("rejects unexpected provider payloads", async () => {
  await assert.rejects(
    inspectTestnetTransactions({
      address: ADDRESS,
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: false, result: [] })
      })
    }),
    /unexpected response/
  );
});
