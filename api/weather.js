function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function setCors(req, res) {
  const origin = process.env.CORS_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, X-Payment-Proof, Content-Type"
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    "WWW-Authenticate"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
}

function build402Header({ chainId, token, amount, facilitator }) {
  return (
    `x402 chain_id="${chainId}" ` +
    `token="${token}" ` +
    `amount="${amount}" ` +
    `facilitator="${facilitator}"`
  );
}

function getProof(req) {
  const direct = req.headers["x-payment-proof"];
  if (direct) return String(direct);

  const auth = req.headers["authorization"];
  if (!auth) return null;
  const m = String(auth).match(/^x402\s+(.+)$/i);
  return m ? m[1] : null;
}

async function getTxByHash(fullnodeUrl, txHash) {
  const url = `${String(fullnodeUrl).replace(/\/$/, "")}\/transactions\/by_hash\/${txHash}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err = new Error(`Fullnode error ${res.status}: ${txt}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function isTxAcceptableForDemo(tx, { expectedFunction, merchantAddress, priceAmount }) {
  if (!tx || typeof tx !== "object") return { ok: false, reason: "bad_tx" };

  if (tx.type === "pending_transaction") {
    return { ok: true, optimistic: true };
  }

  if (tx.type !== "user_transaction") {
    return { ok: false, reason: `unexpected_type:${tx.type}` };
  }

  if (tx.success !== true) {
    return { ok: false, reason: "tx_failed" };
  }

  const payload = tx.payload;
  if (!payload || payload.type !== "entry_function_payload") {
    return { ok: false, reason: "not_entry_function" };
  }

  if (payload.function !== expectedFunction) {
    return { ok: false, reason: `wrong_function:${payload.function}` };
  }

  const args = payload.arguments || [];
  const merchant = (args[0] || "").toLowerCase();
  const amount = String(args[1] || "");

  if (merchant !== merchantAddress.toLowerCase()) {
    return { ok: false, reason: "wrong_merchant" };
  }
  if (amount !== String(priceAmount)) {
    return { ok: false, reason: "wrong_amount" };
  }

  return { ok: true, optimistic: false };
}

function getMockWeather() {
  return {
    premium: true,
    city: "Lisbon",
    temperature_c: 22,
    condition: "Clear",
    provider: "mock",
  };
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

  const CHAIN_ID = process.env.CHAIN_ID || "movement_testnet";
  const FULLNODE_URL = process.env.FULLNODE_URL || "https://full.testnet.movementinfra.xyz/v1";

  const USDC_TOKEN = process.env.USDC_TOKEN || "deo::usdc::USDC";
  const PRICE_AMOUNT = process.env.PRICE_AMOUNT || "1000";

  const DEO_PACKAGE_ADDRESS = process.env.DEO_PACKAGE_ADDRESS || "0xDEO";
  const EXPECTED_FUNCTION = `${DEO_PACKAGE_ADDRESS}::treasury::pay_merchant`;
  const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || "0xMERCHANT";

  const DEMO_MODE = (process.env.DEMO_MODE || "chain").toLowerCase();

  const proof = getProof(req);
  if (!proof) {
    const facilitator = `${getBaseUrl(req)}/verify`;
    res.statusCode = 402;
    res.setHeader(
      "WWW-Authenticate",
      build402Header({ chainId: CHAIN_ID, token: USDC_TOKEN, amount: PRICE_AMOUNT, facilitator })
    );
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Payment required",
        scheme: "x402",
        hint: "Send X-Payment-Proof: <txHash> after paying on-chain",
      })
    );
    return;
  }

  if (DEMO_MODE === "mock") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ...getMockWeather(), settlement: "mock", txHash: proof }));
    return;
  }

  try {
    const tx = await getTxByHash(FULLNODE_URL, proof);
    const verdict = isTxAcceptableForDemo(tx, {
      expectedFunction: EXPECTED_FUNCTION,
      merchantAddress: MERCHANT_ADDRESS,
      priceAmount: PRICE_AMOUNT,
    });

    if (!verdict.ok) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid payment proof", reason: verdict.reason }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ...getMockWeather(),
        provider: "demo",
        settlement: verdict.optimistic ? "optimistic" : "final",
        txHash: proof,
      })
    );
  } catch (e) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "verification_failed", detail: e.message }));
  }
};
