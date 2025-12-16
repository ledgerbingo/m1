async function readJsonBody(req) {
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function setCors(req, res) {
  const origin = process.env.CORS_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, X-Payment-Proof, Content-Type"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
}

function getProof(req, body) {
  const direct = req.headers["x-payment-proof"];
  if (direct) return String(direct);

  const auth = req.headers["authorization"];
  if (auth) {
    const m = String(auth).match(/^x402\s+(.+)$/i);
    if (m) return m[1];
  }

  if (req.method === "GET") {
    try {
      const url = new URL(req.url, "http://localhost");
      return url.searchParams.get("txHash") || url.searchParams.get("proof") || null;
    } catch {
      return null;
    }
  }

  return body?.txHash || body?.proof || null;
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

function normalize(v) {
  return String(v || "").toLowerCase();
}

function typeTagMatches(expected, actual) {
  const exp = normalize(expected);
  const act = normalize(actual);
  if (!exp || !act) return false;
  if (exp === act) return true;

  if (!exp.startsWith("0x")) {
    const expSuffix = exp.split("::").slice(-2).join("::");
    const actSuffix = act.split("::").slice(-2).join("::");
    return expSuffix === actSuffix;
  }

  return false;
}

function parseRecipientAmount(payload) {
  const args = payload?.arguments || [];
  return {
    recipient: String(args[0] || ""),
    amount: String(args[1] || ""),
  };
}

function buildReceiptFromTx(tx, {
  expectedPayFunction,
  merchantAddress,
  priceAmount,
  tokenType,
}) {
  if (!tx || typeof tx !== "object") return { ok: false, reason: "bad_tx" };

  if (tx.type === "pending_transaction") {
    const payload = tx.payload;
    if (!payload || payload.type !== "entry_function_payload") {
      return { ok: false, reason: "not_entry_function" };
    }

    const fn = payload.function;

    if (fn === expectedPayFunction) {
      const { recipient, amount } = parseRecipientAmount(payload);
      if (normalize(recipient) !== normalize(merchantAddress)) return { ok: false, reason: "wrong_merchant" };
      if (String(amount) !== String(priceAmount)) return { ok: false, reason: "wrong_amount" };

      return {
        ok: true,
        settlement: "fast",
        payer: tx.sender || null,
        txHash: tx.hash || null,
        function: fn,
        merchant: recipient,
        amount,
        token: tokenType,
      };
    }

    if (fn === "0x1::coin::transfer") {
      const type0 = payload.type_arguments?.[0];
      if (!type0) return { ok: false, reason: "missing_token" };
      if (!typeTagMatches(tokenType, type0)) return { ok: false, reason: "wrong_token" };

      const { recipient, amount } = parseRecipientAmount(payload);
      if (normalize(recipient) !== normalize(merchantAddress)) return { ok: false, reason: "wrong_merchant" };
      if (String(amount) !== String(priceAmount)) return { ok: false, reason: "wrong_amount" };

      return {
        ok: true,
        settlement: "fast",
        payer: tx.sender || null,
        txHash: tx.hash || null,
        function: fn,
        merchant: recipient,
        amount,
        token: type0,
      };
    }

    return { ok: false, reason: "unsupported_function" };
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

  const fn = payload.function;

  if (fn === expectedPayFunction) {
    const { recipient, amount } = parseRecipientAmount(payload);
    if (normalize(recipient) !== normalize(merchantAddress)) return { ok: false, reason: "wrong_merchant" };
    if (String(amount) !== String(priceAmount)) return { ok: false, reason: "wrong_amount" };

    return {
      ok: true,
      settlement: "final",
      payer: tx.sender || null,
      txHash: tx.hash || null,
      function: fn,
      merchant: recipient,
      amount,
      token: tokenType,
    };
  }

  if (fn === "0x1::coin::transfer") {
    const type0 = payload.type_arguments?.[0];
    if (!type0) return { ok: false, reason: "missing_token" };
    if (!typeTagMatches(tokenType, type0)) return { ok: false, reason: "wrong_token" };

    const { recipient, amount } = parseRecipientAmount(payload);
    if (normalize(recipient) !== normalize(merchantAddress)) return { ok: false, reason: "wrong_merchant" };
    if (String(amount) !== String(priceAmount)) return { ok: false, reason: "wrong_amount" };

    return {
      ok: true,
      settlement: "final",
      payer: tx.sender || null,
      txHash: tx.hash || null,
      function: fn,
      merchant: recipient,
      amount,
      token: type0,
    };
  }

  return { ok: false, reason: "unsupported_function" };
}

module.exports = async (req, res) => {
  setCors(req, res);
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET,POST,OPTIONS");
    res.end("Method Not Allowed");
    return;
  }

  let body = {};
  if (req.method === "POST") {
    try {
      body = await readJsonBody(req);
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "invalid_json" }));
      return;
    }
  }

  const CHAIN_ID = process.env.CHAIN_ID || "movement_testnet";
  const FULLNODE_URL = process.env.FULLNODE_URL || "https://full.testnet.movementinfra.xyz/v1";

  const PRICE_AMOUNT = process.env.PRICE_AMOUNT || "1000";
  const TOKEN_TYPE = process.env.USDC_TOKEN || "deo::usdc::USDC";

  const DEO_PACKAGE_ADDRESS = process.env.DEO_PACKAGE_ADDRESS || "0xDEO";
  const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || "0xMERCHANT";

  const SERVICE_MODE = (process.env.SERVICE_MODE || "preview").toLowerCase();

  const proof = getProof(req, body);
  if (!proof) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "missing_proof" }));
    return;
  }

  if (SERVICE_MODE === "preview") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        mode: "preview",
        receipt: {
          txHash: proof,
          chain_id: CHAIN_ID,
          settlement: "preview",
          token: TOKEN_TYPE,
          amount: String(PRICE_AMOUNT),
          merchant: MERCHANT_ADDRESS,
          verified_at: new Date().toISOString(),
        },
      })
    );
    return;
  }

  const expectedPayFunction = `${DEO_PACKAGE_ADDRESS}::treasury::pay_merchant`;

  try {
    const tx = await getTxByHash(FULLNODE_URL, proof);
    const verdict = buildReceiptFromTx(tx, {
      expectedPayFunction,
      merchantAddress: MERCHANT_ADDRESS,
      priceAmount: PRICE_AMOUNT,
      tokenType: TOKEN_TYPE,
    });

    const includeTx = (() => {
      if (req.method !== "GET") return false;
      try {
        const url = new URL(req.url, "http://localhost");
        return url.searchParams.get("include") === "tx";
      } catch {
        return false;
      }
    })();

    if (!verdict.ok) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "proof_invalid", reason: verdict.reason }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        mode: "chain",
        receipt: {
          txHash: proof,
          chain_id: CHAIN_ID,
          settlement: verdict.settlement,
          token: verdict.token || TOKEN_TYPE,
          amount: String(verdict.amount || PRICE_AMOUNT),
          merchant: verdict.merchant || MERCHANT_ADDRESS,
          payer: verdict.payer || null,
          function: verdict.function || null,
          verified_at: new Date().toISOString(),
        },
        tx: includeTx ? tx : undefined,
      })
    );
  } catch {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "verification_failed" }));
  }
};
