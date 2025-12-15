function setCors(req, res) {
  const origin = process.env.CORS_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
}

async function getEvents({ fullnodeUrl, account, eventHandleStruct, field, start, limit }) {
  const base = String(fullnodeUrl).replace(/\/$/, "");
  const struct = encodeURIComponent(eventHandleStruct);
  const url = new URL(`${base}/accounts/${account}/events/${struct}/${field}`);
  if (start != null) url.searchParams.set("start", String(start));
  if (limit != null) url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err = new Error(`Fullnode error ${res.status}: ${txt}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function getSamplePayments({ merchant, amount, token }) {
  const now = Date.now();
  const items = [0, 1, 2].map((i) => {
    const txHash = `proof_${now - i * 60000}`;
    return {
      id: `preview_${now}_${i}`,
      txHash,
      settlement: "preview",
      token,
      amount: String(amount),
      merchant,
      payer: "0xAGENT",
      function: null,
      verified_at: new Date(now - i * 60000).toISOString(),
    };
  });

  return items;
}

module.exports = async (req, res) => {
  setCors(req, res);
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET,OPTIONS");
    res.end("Method Not Allowed");
    return;
  }

  const SERVICE_MODE = (process.env.SERVICE_MODE || "preview").toLowerCase();
  const CHAIN_ID = process.env.CHAIN_ID || "movement_testnet";

  const FULLNODE_URL = process.env.FULLNODE_URL || "https://full.testnet.movementinfra.xyz/v1";

  const PRICE_AMOUNT = process.env.PRICE_AMOUNT || "1000";
  const TOKEN_TYPE = process.env.USDC_TOKEN || "deo::usdc::USDC";

  const DEO_PACKAGE_ADDRESS = process.env.DEO_PACKAGE_ADDRESS || "0xDEO";
  const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || "0xMERCHANT";

  if (SERVICE_MODE === "preview") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        mode: "preview",
        chain_id: CHAIN_ID,
        items: getSamplePayments({
          merchant: MERCHANT_ADDRESS,
          amount: PRICE_AMOUNT,
          token: TOKEN_TYPE,
        }),
      })
    );
    return;
  }

  let payer;
  let start;
  let limit;
  try {
    const url = new URL(req.url, "http://localhost");
    payer = url.searchParams.get("payer") || process.env.PAYER_ADDRESS || process.env.TREASURY_ADDRESS || null;
    start = url.searchParams.get("start");
    limit = url.searchParams.get("limit");
  } catch {
    payer = process.env.PAYER_ADDRESS || process.env.TREASURY_ADDRESS || null;
    start = null;
    limit = null;
  }

  if (!payer) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "missing_payer" }));
    return;
  }

  const eventHandleStruct = `${DEO_PACKAGE_ADDRESS}::treasury::Treasury`;
  const field = "payment_events";
  const expectedFunction = `${DEO_PACKAGE_ADDRESS}::treasury::pay_merchant`;

  try {
    const events = await getEvents({
      fullnodeUrl: FULLNODE_URL,
      account: payer,
      eventHandleStruct,
      field,
      start: start != null ? start : undefined,
      limit: limit != null ? limit : "25",
    });

    const items = (Array.isArray(events) ? events : []).map((e) => {
      const data = e?.data || {};
      const paymentId = data.payment_id != null ? String(data.payment_id) : null;
      const version = e?.version != null ? String(e.version) : null;
      const seq = e?.sequence_number != null ? String(e.sequence_number) : null;

      return {
        id: paymentId != null ? paymentId : `${payer}:${seq || "?"}`,
        tx_version: version,
        sequence_number: seq,
        settlement: "final",
        token: TOKEN_TYPE,
        amount: String(data.amount || ""),
        merchant: String(data.merchant || ""),
        payer: String(data.payer || payer),
        function: expectedFunction,
        settled_at: data.settled_at != null ? String(data.settled_at) : null,
      };
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        mode: "chain",
        chain_id: CHAIN_ID,
        payer,
        items,
      })
    );
  } catch {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "chain_unavailable" }));
  }
};
