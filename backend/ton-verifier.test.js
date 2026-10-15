import test from "node:test";
import assert from "node:assert/strict";
import { createFixtureStore, verifyDepositFixture, DEPOSIT_STATUSES } from "./ton-verifier.js";

const config = { network: "testnet", recipient: "0:recipient-test-address" };
const invoice = {
  id: "invoice_test_0001",
  network: "testnet",
  recipient: config.recipient,
  amountNanotons: "1250000000"
};
const candidate = {
  network: "testnet",
  recipient: config.recipient,
  transactionHash: "fixture_tx_hash_00000001",
  logicalTime: "123456",
  amountNanotons: "1250000000",
  inbound: true,
  successful: true,
  bounced: false,
  finalized: true,
  observedAt: "2026-10-15T12:00:00.000Z",
  source: "unit-test-fixture"
};

function verify(overrides = {}, invoiceOverrides = {}, configOverrides = {}, store = createFixtureStore()) {
  return {
    result: verifyDepositFixture({
      candidate: { ...candidate, ...overrides },
      invoice: { ...invoice, ...invoiceOverrides },
      config: { ...config, ...configOverrides },
      store
    }),
    store
  };
}

test("valid fixture is recorded confirmed-but-uncredited", () => {
  const { result, store } = verify();
  assert.equal(result.status, "confirmed_uncredited");
  assert.equal(result.credited, false);
  assert.equal(result.duplicate, false);
  assert.equal(store.size, 1);
  assert.equal(store.list()[0].invoiceId, invoice.id);
});

test("valid fixture result explicitly disclaims chain verification", () => {
  const { result } = verify();
  assert.equal(result.reason, "fixture_checks_passed_not_chain_verified");
});

test("wrong network is rejected", () => {
  assert.equal(verify({ network: "mainnet" }).result.reason, "wrong_network");
  assert.equal(verify({}, {}, { network: "mainnet" }).result.reason, "wrong_network");
});

test("wrong recipient is rejected", () => {
  assert.equal(verify({ recipient: "0:attacker" }).result.reason, "wrong_recipient");
  assert.equal(verify({}, { recipient: "0:other" }).result.reason, "wrong_recipient");
});

test("outbound, failed, and bounced transactions are rejected", () => {
  assert.equal(verify({ inbound: false }).result.reason, "not_inbound");
  assert.equal(verify({ successful: false }).result.reason, "failed_or_bounced");
  assert.equal(verify({ bounced: true }).result.reason, "failed_or_bounced");
});

test("unfinalized transaction remains pending and is not stored", () => {
  const { result, store } = verify({ finalized: false });
  assert.equal(result.status, "pending_confirmation");
  assert.equal(result.credited, false);
  assert.equal(store.size, 0);
});

test("amount mismatch is rejected without floating-point conversion", () => {
  assert.equal(verify({ amountNanotons: "1250000001" }).result.reason, "amount_mismatch");
  assert.equal(verify({ amountNanotons: "1.25" }).result.reason, "malformed_candidate");
});

test("expired invoice is rejected", () => {
  const { result, store } = verify({}, { expiresAt: "2000-01-01T00:00:00.000Z" });
  assert.equal(result.status, "rejected");
  assert.equal(result.reason, "invoice_expired");
  assert.equal(store.size, 0);
});

test("malformed candidate enters manual review", () => {
  const { result, store } = verify({ amountNanotons: 1250000000 });
  assert.equal(result.status, "manual_review");
  assert.equal(result.reason, "malformed_candidate");
  assert.equal(store.size, 0);
});

test("missing context fails closed", () => {
  const result = verifyDepositFixture({ candidate, invoice, config, store: null });
  assert.equal(result.status, "manual_review");
  assert.equal(result.credited, false);
});

test("same transaction is idempotent and never credits twice", () => {
  const store = createFixtureStore();
  const first = verify({}, {}, {}, store).result;
  const second = verify({}, {}, {}, store).result;
  assert.equal(first.status, "confirmed_uncredited");
  assert.equal(second.status, "confirmed_uncredited");
  assert.equal(second.duplicate, true);
  assert.equal(second.reason, "duplicate_transaction");
  assert.equal(second.credited, false);
  assert.equal(store.size, 1);
});

test("different transaction hashes are recorded separately", () => {
  const store = createFixtureStore();
  verify({}, {}, {}, store);
  verify({ transactionHash: "fixture_tx_hash_00000002" }, {}, {}, store);
  assert.equal(store.size, 2);
});

test("store returns defensive copies", () => {
  const store = createFixtureStore();
  verify({}, {}, {}, store);
  const listed = store.list();
  listed[0].status = "credited";
  assert.equal(store.list()[0].status, "confirmed_uncredited");
});

test("documented statuses include pending and manual review", () => {
  assert.ok(DEPOSIT_STATUSES.includes("pending_confirmation"));
  assert.ok(DEPOSIT_STATUSES.includes("manual_review"));
});
