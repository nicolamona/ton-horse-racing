/**
 * Read-only TON Mainnet transaction-history inspector.
 *
 * Safety boundary:
 * - Queries the fixed public TON Center MAINNET API only.
 * - Uses GET requests; never signs, submits, or broadcasts transactions.
 * - Reports observations only; it does not decide whether a payment is a valid deposit.
 * - Does not persist records, deduplicate durably, or change any game balance.
 * - Provider responses are not an independent proof of finality.
 *
 * Usage:
 *   node backend/ton-mainnet-readonly.js <mainnet-wallet-address>
 * Optional: set TONCENTER_MAINNET_API_KEY for provider access/rate limits.
 */

const MAINNET_ENDPOINT = "https://toncenter.com/api/v2/getTransactions";
const ADDRESS_PATTERN = /^[A-Za-z0-9_:\-]{20,100}$/;

export function validateMainnetAddress(address) {
  // Basic input hygiene only; this is not full TON address canonicalization.
  return typeof address === "string" &&
    address.trim() === address &&
    ADDRESS_PATTERN.test(address);
}

export async function inspectMainnetTransactions({
  address,
  fetchImpl = globalThis.fetch,
  apiKey = process.env.TONCENTER_MAINNET_API_KEY
} = {}) {
  if (!validateMainnetAddress(address)) {
    throw new TypeError("A plausible TON Mainnet wallet address is required.");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }

  const url = new URL(MAINNET_ENDPOINT);
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
    throw new Error(`TON Mainnet provider returned HTTP ${response?.status ?? "unknown"}.`);
  }

  const payload = await response.json();
  if (!payload || payload.ok !== true || !Array.isArray(payload.result)) {
    throw new Error("TON Mainnet provider returned an unexpected response.");
  }

  // Keep this as a neutral history view; no deposit verdict or balance effects.
  return {
    network: "mainnet",
    readOnly: true,
    source: "toncenter",
    count: payload.result.length,
    transactions: payload.result.map((tx) => {
      const message = tx?.in_msg;
      return {
        hash: typeof tx?.transaction_id?.hash === "string" ? tx.transaction_id.hash : null,
        logicalTime: typeof tx?.transaction_id?.lt === "string" ? tx.transaction_id.lt : null,
        unixTime: Number.isInteger(tx?.utime) ? tx.utime : null,
        inbound: message ? {
          source: typeof message.source === "string" ? message.source : null,
          destination: typeof message.destination === "string" ? message.destination : null,
          valueNanoTon: typeof message.value === "string" && /^\d+$/.test(message.value)
            ? message.value
            : null
        } : null
      };
    })
  };
}

async function main() {
  const address = process.argv[2];
  if (!address) {
    console.error("Usage: node backend/ton-mainnet-readonly.js <mainnet-wallet-address>");
    process.exitCode = 2;
    return;
  }

  try {
    const result = await inspectMainnetTransactions({ address });
    console.log(JSON.stringify(result, null, 2));
    console.error("Read-only history only. This does not validate a deposit or credit any balance.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "TON Mainnet query failed.");
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
