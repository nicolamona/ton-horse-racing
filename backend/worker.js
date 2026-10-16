const ALLOWED_ORIGIN = "https://nicolamona.github.io";
const MAX_BODY_BYTES = 16 * 1024;
const WALLET_ADDRESS_PATTERN = /^[-_a-zA-Z0-9:]{20,100}$/;
const RACE_ID_PATTERN = /^[a-zA-Z0-9_-]{8,80}$/;
const HORSE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

function json(data, status = 200, origin = ALLOWED_ORIGIN, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      vary: "Origin",
      ...extraHeaders
    }
  });
}

function validOrigin(request) {
  const origin = request.headers.get("Origin");
  // Missing Origin is allowed for non-browser clients. This is not authentication.
  return !origin || origin === ALLOWED_ORIGIN;
}

function methodNotAllowed(allow) {
  return json({ error: "method_not_allowed" }, 405, ALLOWED_ORIGIN, { allow });
}

function isHorseNumber(value) {
  return Number.isInteger(value) && HORSE_NUMBERS.includes(value);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!validOrigin(request)) {
      return json({ error: "origin_not_allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": ALLOWED_ORIGIN,
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type",
          "access-control-max-age": "86400",
          "x-content-type-options": "nosniff",
          "vary": "Origin"
        }
      });
    }

    // Financial and blockchain transaction endpoints stay disabled regardless
    // of storage configuration, request method, or body.
    if (
      url.pathname === "/api/payments" ||
      url.pathname.startsWith("/api/payments/") ||
      url.pathname === "/api/transactions" ||
      url.pathname.startsWith("/api/transactions/")
    ) {
      return json({
        enabled: false,
        error: "payments_and_blockchain_transactions_are_disabled"
      }, 403);
    }

    if (url.pathname === "/health") {
      if (request.method !== "GET") return methodNotAllowed("GET, OPTIONS");
      return json({
        ok: true,
        mode: "demo-only",
        paymentsEnabled: false,
        storageConfigured: Boolean(env?.DB)
      });
    }

    if (url.pathname !== "/api/races") {
      return json({ error: "not_found" }, 404);
    }

    if (request.method !== "GET" && request.method !== "POST") {
      return methodNotAllowed("GET, POST, OPTIONS");
    }

    if (!env?.DB) return json({ error: "demo_database_not_configured" }, 503);

    if (request.method === "GET") {
      const requestedLimit = Number(url.searchParams.get("limit"));
      const limit = Number.isFinite(requestedLimit) && requestedLimit !== 0
        ? Math.min(50, Math.max(1, Math.trunc(requestedLimit)))
        : 20;
      const walletAddress = url.searchParams.get("walletAddress") || "";
      if (!WALLET_ADDRESS_PATTERN.test(walletAddress)) {
        return json({ error: "valid_wallet_address_required" }, 400);
      }

      try {
        const { results } = await env.DB.prepare(
          "SELECT race_id, selected_horse, winner_horse, created_at FROM demo_races WHERE wallet_address = ? ORDER BY created_at DESC LIMIT ?"
        ).bind(walletAddress, limit).all();
        return json({ mode: "demo-only", walletAddress, races: results || [] });
      } catch {
        return json({ error: "race_read_failed" }, 500);
      }
    }

    const contentType = request.headers.get("Content-Type") || "";
    if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
      return json({ error: "application_json_required" }, 415);
    }

    const declaredLength = Number(request.headers.get("Content-Length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return json({ error: "request_body_too_large" }, 413);
    }

    let rawBody;
    try {
      rawBody = await request.text();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return json({ error: "request_body_too_large" }, 413);
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "json_object_required" }, 400);
    }

    const raceId = typeof body.raceId === "string" ? body.raceId.trim() : "";
    const walletAddress = typeof body.walletAddress === "string" ? body.walletAddress.trim() : "";
    const selectedHorse = body.selectedHorse;
    const winnerHorse = body.winnerHorse;

    if (!RACE_ID_PATTERN.test(raceId)) return json({ error: "invalid_race_id" }, 400);
    if (!WALLET_ADDRESS_PATTERN.test(walletAddress)) {
      return json({ error: "valid_wallet_address_required" }, 400);
    }
    if (!isHorseNumber(selectedHorse) || !isHorseNumber(winnerHorse)) {
      return json({ error: "horse_must_be_between_1_and_8" }, 400);
    }

    try {
      await env.DB.prepare(
        "INSERT INTO demo_races (race_id, wallet_address, selected_horse, winner_horse) VALUES (?, ?, ?, ?)"
      ).bind(raceId, walletAddress, selectedHorse, winnerHorse).run();
    } catch (error) {
      if (String(error).toLowerCase().includes("unique")) {
        return json({ ok: true, duplicate: true, mode: "demo-only" });
      }
      return json({ error: "race_save_failed" }, 500);
    }

    return json({ ok: true, mode: "demo-only", saved: true }, 201);
  }
};
