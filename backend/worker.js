const ALLOWED_ORIGIN = "https://nicolamona.github.io";

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "vary": "Origin"
    }
  });
}

function validOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === ALLOWED_ORIGIN;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || ALLOWED_ORIGIN;

    if (!validOrigin(request)) return json({ error: "origin_not_allowed" }, 403, ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": ALLOWED_ORIGIN,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
        "vary": "Origin"
      }
    });

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, mode: "demo-only", paymentsEnabled: false, storageConfigured: Boolean(env.DB) });
    }

    if (url.pathname.startsWith("/api/payments") || url.pathname.startsWith("/api/transactions")) {
      return json({ enabled: false, error: "payments_and_blockchain_transactions_are_disabled" }, 403);
    }

    if (!env.DB) return json({ error: "demo_database_not_configured" }, 503);

    if (url.pathname === "/api/races" && request.method === "GET") {
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
      const { results } = await env.DB.prepare(
        "SELECT race_id, selected_horse, winner_horse, created_at FROM demo_races ORDER BY created_at DESC LIMIT ?"
      ).bind(limit).all();
      return json({ mode: "demo-only", races: results || [] });
    }

    if (url.pathname === "/api/races" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
      const raceId = typeof body.raceId === "string" ? body.raceId.trim() : "";
      const selectedHorse = Number(body.selectedHorse);
      const winnerHorse = Number(body.winnerHorse);

      if (!/^[a-zA-Z0-9_-]{8,80}$/.test(raceId)) return json({ error: "invalid_race_id" }, 400);
      if (![1,2,3,4,5,6,7,8].includes(selectedHorse) || ![1,2,3,4,5,6,7,8].includes(winnerHorse)) {
        return json({ error: "horse_must_be_between_1_and_8" }, 400);
      }

      try {
        await env.DB.prepare(
          "INSERT INTO demo_races (race_id, selected_horse, winner_horse) VALUES (?, ?, ?)"
        ).bind(raceId, selectedHorse, winnerHorse).run();
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) {
          return json({ ok: true, duplicate: true, mode: "demo-only" });
        }
        return json({ error: "race_save_failed" }, 500);
      }
      return json({ ok: true, mode: "demo-only", saved: true }, 201);
    }

    return json({ error: "not_found" }, 404);
  }
};
