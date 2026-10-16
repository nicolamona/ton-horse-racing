/**
 * TON deposit verification boundary — TEST FIXTURES ONLY.
 *
 * This module does not query TON, authenticate a provider, persist to a database,
 * credit a balance, or enable a payment endpoint. It validates a normalized
 * candidate supplied by a future independently reviewed adapter.
 */
const TERMINAL_STATUSES = new Set(["confirmed_uncredited", "rejected", "manual_review"]);

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIntegerString(value) {
  return typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value);
}

function safeSnapshot(candidate) {
  return {
    network: candidate.network,
    recipient: candidate.recipient,
    transactionHash: candidate.transactionHash,
    logicalTime: candidate.logicalTime ?? null,
    amountNanotons: candidate.amountNanotons,
    inbound: candidate.inbound,
    successful: candidate.successful,
    bounced: candidate.bounced,
    finalized: candidate.finalized,
    observedAt: candidate.observedAt ?? null,
    source: candidate.source ?? "test-fixture"
  };
}

/**
 * In-memory store for deterministic unit tests only. It is neither durable nor
 * suitable for financial use. Uniqueness key is deliberately network + recipient
 * + transaction hash; production must confirm the chain-specific identity tuple.
 */
export function createFixtureStore() {
  const records = new Map();

  return {
    get size() {
      return records.size;
    },
    get(key) {
      const record = records.get(key);
      return record ? structuredClone(record) : null;
    },
    insertIfAbsent(key, record) {
      if (records.has(key)) return { inserted: false, record: structuredClone(records.get(key)) };
      records.set(key, structuredClone(record));
      return { inserted: true, record: structuredClone(record) };
    },
    list() {
      return [...records.values()].map((record) => structuredClone(record));
    }
  };
}

function result(status, reason, candidate, duplicate = false) {
  return {
    status,
    reason,
    duplicate,
    credited: false,
    record: safeSnapshot(candidate)
  };
}

/**
 * Validate a normalized fixture. This function is intentionally not wired into
 * worker.js or any user-facing route. "confirmed_uncredited" means only that
 * fixture fields passed these checks; it is NOT cryptographic chain verification.
 */
export function verifyDepositFixture({ candidate, invoice, config, store }) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { status: "manual_review", reason: "candidate_missing_or_invalid", duplicate: false, credited: false };
  }
  if (!invoice || typeof invoice !== "object" || !config || typeof config !== "object" || !store) {
    return result("manual_review", "verification_context_missing", candidate);
  }

  const requiredStrings = [
    candidate.network, candidate.recipient, candidate.transactionHash,
    invoice.id, invoice.network, invoice.recipient
  ];
  if (!requiredStrings.every(nonEmptyString) ||
      !isIntegerString(candidate.amountNanotons) ||
      typeof candidate.inbound !== "boolean" ||
      typeof candidate.successful !== "boolean" ||
      typeof candidate.bounced !== "boolean" ||
      typeof candidate.finalized !== "boolean") {
    return result("manual_review", "malformed_candidate", candidate);
  }

  if (candidate.network !== config.network || invoice.network !== config.network) {
    return result("rejected", "wrong_network", candidate);
  }
  if (candidate.recipient !== config.recipient || invoice.recipient !== config.recipient ||
      candidate.recipient !== invoice.recipient) {
    return result("rejected", "wrong_recipient", candidate);
  }
  if (!candidate.inbound) return result("rejected", "not_inbound", candidate);
  if (candidate.bounced || !candidate.successful) return result("rejected", "failed_or_bounced", candidate);
  if (!candidate.finalized) return result("pending_confirmation", "not_finalized", candidate);
  if (candidate.amountNanotons !== invoice.amountNanotons ||
      !isIntegerString(invoice.amountNanotons)) {
    return result("rejected", "amount_mismatch", candidate);
  }
  if (invoice.expiresAt && (!Number.isFinite(Date.parse(invoice.expiresAt)) ||
      Date.parse(invoice.expiresAt) <= Date.now())) {
    return result("rejected", "invoice_expired", candidate);
  }

  const key = [candidate.network, candidate.recipient, candidate.transactionHash].join(":");
  const record = {
    ...safeSnapshot(candidate),
    invoiceId: invoice.id,
    status: "confirmed_uncredited",
    reason: "fixture_checks_passed",
    credited: false
  };
  const saved = store.insertIfAbsent(key, record);
  if (!saved.inserted) {
    return {
      status: saved.record.status,
      reason: "duplicate_transaction",
      duplicate: true,
      credited: false,
      record: saved.record
    };
  }

  return {
    status: "confirmed_uncredited",
    reason: "fixture_checks_passed_not_chain_verified",
    duplicate: false,
    credited: false,
    record: saved.record
  };
}

export const DEPOSIT_STATUSES = Object.freeze([
  "observed",
  "pending_confirmation",
  "confirmed_uncredited",
  "rejected",
  "expired",
  "manual_review"
]);
