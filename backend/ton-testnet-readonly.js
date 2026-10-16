/**
 * Read-only TON Testnet transaction inspector.
 *
 * Safety boundary:
 * - Queries the public TON Center TESTNET API only.
 * - Does not sign, submit, or broadcast transactions.
 * - Does not classify transactions as deposits or update any balances.
 * - Provider output is informational and is not an independent proof of finality.
 *
 * Usage:
 *   node backend/ton-testnet-readonly.js <testnet-wallet-address>
 * Optional: set TONCENTER_TESTNET_API_KEY to avoid anonymous rate limits.
 */

const TESTNET_ENDPOINT = "https://testnet.toncenter.com/api/v2/getTransactions";
const ADDRESS_PATTERN = /^[A-Za-z0-9_:\-]{20,100}$/;

export function validateTestnetAddress(address) {
  return typeof address === "string" &&
    address.trim() === address &&
    ADDRESS_PATTERN.test(address);
}

export async function inspectTestnetTransactions({
  address,
  fetchImpl = globalThis.fetch,
  apiKey = process.env.TONCENTER_TESTNET_API_KEY
} = {}) {
  if (!validateTestnetAddress(address)) {
    throw new TypeError("A valid TON wallet address is required.");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }

  const url = new URL(TESTNET_ENDPOINT);
  url.searchParams.set("address", address);
  url.searchParams.set("limit", "10");
  url.searchParams.set("archival", "false");

  const headers = { accept: "application/json" };
  if (typeof apiKey === "string" && apiKey.trim()) {
    headers["X-API-Key"] = apiKey.trim();
  }

  const response = await fetchImpl(url, {
    method: "GET",
    headers,
    redirect: "error"
  });
  if (!response || !response.ok) {
    throw new Error(`TON Testnet provider returned HTTP ${response?.status ?? "unknown"}.`);
  }

  const payload = await response.json();
  if (!payload || payload.ok !== true || !Array.isArray(payload.result)) {
    throw new Error("TON Testnet provider returned an unexpected response.");
  }

  // Deliberately expose only basic transaction identifiers and timestamps.
  // Never infer a deposit, credit a balance, or treat provider output as finality.
  return {
    network: "testnet",
    readOnly: true,
    count: payload.result.length,
    transactions: payload.result.map((tx) => ({
      hash: typeof tx?.transaction_id?.hash === "string" ? tx.transaction_id.hash : null,
      logicalTime: typeof tx?.transaction_id?.lt === "string" ? tx.transaction_id.lt : null,
      unixTime: Number.isInteger(tx?.utime) ? tx.utime : null
    }))
  };
}

async function main() {
  const address = process.argv[2];
  if (!address) {
    console.error("Usage: node backend/ton-testnet-readonly.js <testnet-wallet-address>");
    process.exitCode = 2;
    return;
  }

  try {
    const result = await inspectTestnetTransactions({ address });
    console.log(JSON.stringify(result, null, 2));
    console.error("Read-only inspection only. No deposit verification or balance credit occurred.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "TON Testnet query failed.");
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
