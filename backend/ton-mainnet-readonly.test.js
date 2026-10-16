import test from "node:test";
import assert from "node:assert/strict";
import {
  inspectMainnetTransactions,
  validateMainnetAddress
} from "./ton-mainnet-readonly.js";

const ADDRESS = "EQC1234567890123456789012345678901234567890";

test("accepts a plausible address string and rejects malformed input", () => {
  assert.equal(validateMainnetAddress(ADDRESS), true);
  assert.equal(validateMainnetAddress(` ${ADDRESS}`), false);
  assert.equal(validateMainnetAddress("bad"), false);
  assert.equal(validateMainnetAddress(""), false);
});

test("queries the fixed TON Mainnet endpoint with GET and returns observations only", async () => {
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
        result: [{
          transaction_id: { hash: "hash-example", lt: "42" },
          utime: 1700000000,
          in_msg: {
            source: "sender-address",
            destination: ADDRESS,
            value: "1500000000"
          }
        }]
      })
    };
  };

  const result = await inspectMainnetTransactions({
    address: ADDRESS,
    fetchImpl,
    apiKey: "test-key"
  });

  assert.equal(calledUrl.origin, "https://toncenter.com");
  assert.equal(calledUrl.pathname, "/api/v2/getTransactions");
  assert.equal(calledUrl.searchParams.get("address"), ADDRESS);
  assert.equal(calledUrl.searchParams.get("limit"), "10");
  assert.equal(calledOptions.method, "GET");
  assert.equal(calledOptions.redirect, "error");
  assert.equal(calledOptions.headers["X-API-Key"], "test-key");
  assert.equal(result.network, "mainnet");
  assert.equal(result.readOnly, true);
  assert.equal(result.count, 1);
  assert.deepEqual(result.transactions[0], {
    hash: "hash-example",
    logicalTime: "42",
    unixTime: 1700000000,
    inbound: {
      source: "sender-address",
      destination: ADDRESS,
      valueNanoTon: "1500000000"
    }
  });
  assert.equal("credited" in result, false);
  assert.equal("depositValid" in result, false);
});

test("rejects invalid addresses before making a request", async () => {
  let called = false;
  await assert.rejects(
    inspectMainnetTransactions({
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
    inspectMainnetTransactions({
      address: ADDRESS,
      fetchImpl: async () => ({ ok: false, status: 502 })
    }),
    /HTTP 502/
  );
});

test("rejects unexpected provider payloads", async () => {
  await assert.rejects(
    inspectMainnetTransactions({
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
