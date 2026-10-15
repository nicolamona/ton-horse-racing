import test from "node:test";
import assert from "node:assert/strict";
import { isValidDemoAmount, isValidDemoBalance, calculateReward, calculateNet, completeFinishOrder } from "./game-logic.mjs";

test("demo amounts accept whole and half units from one upward", () => {
  for (const amount of [1, 1.5, 2, 50, 1000]) assert.equal(isValidDemoAmount(amount), true);
});

test("demo balances accept quarter-unit precision produced by third-place rewards", () => {
  for (const balance of [0, 0.25, 0.75, 999.25, 1000]) assert.equal(isValidDemoBalance(balance), true);
});

test("demo balances reject negative, non-finite, and unsupported precision", () => {
  for (const balance of [-0.25, NaN, Infinity, 0.1]) assert.equal(isValidDemoBalance(balance), false);
});

test("demo amounts reject non-finite, sub-minimum, and non-half values", () => {
  for (const amount of [0, 0.5, -1, 1.1, NaN, Infinity, -Infinity]) {
    assert.equal(isValidDemoAmount(amount), false, String(amount));
  }
});

test("first-place demo reward is three times the assigned amount", () => {
  assert.equal(calculateReward(50, 1), 150);
});

test("second-place demo reward is twice the assigned amount", () => {
  assert.equal(calculateReward(50, 2), 100);
});

test("third-place demo reward follows the existing half-times rule", () => {
  assert.equal(calculateReward(50, 3), 25);
});

test("places four through eight receive no demo reward", () => {
  for (let place = 4; place <= 8; place++) assert.equal(calculateReward(50, place), 0);
});

test("third-place reward preserves the exact half multiplier at quarter-unit precision", () => {
  assert.equal(calculateReward(1.5, 3), 0.75);
  assert.equal(calculateNet(0.75, 1.5), -0.75);
});

test("reward calculator rejects invalid amount or place", () => {
  assert.throws(() => calculateReward(0.5, 1), RangeError);
  assert.throws(() => calculateReward(10, 0), RangeError);
  assert.throws(() => calculateReward(10, 9), RangeError);
  assert.throws(() => calculateReward(10, 1.5), RangeError);
});

test("net demo result is reward minus assigned amount", () => {
  assert.equal(calculateNet(150, 50), 100);
  assert.equal(calculateNet(25, 50), -25);
  assert.equal(calculateNet(0, 50), -50);
});

test("finish order preserves known finishers and sorts unfinished horses by progress", () => {
  assert.deepEqual(
    completeFinishOrder([0.2, 1, 0.7, 0.3, 0.9, 0.4, 0.8, 0.1], [1, 4]),
    [1, 4, 6, 2, 5, 3, 0, 7]
  );
});

test("finish order contains every horse exactly once", () => {
  const order = completeFinishOrder([0.2, 0.4, 0.1, 0.3, 0.9, 0.7, 0.8, 0.5], [4, 5, 5, -1, 99]);
  assert.equal(order.length, 8);
  assert.deepEqual([...order].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test("finish order rejects invalid progress input", () => {
  assert.throws(() => completeFinishOrder([1, 2], []), TypeError);
  assert.throws(() => completeFinishOrder([0, 0, 0, 0, 0, 0, 0, NaN], []), TypeError);
});
