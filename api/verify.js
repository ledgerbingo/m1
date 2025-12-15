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

function isTxAcceptableForAccess(
  tx,
  { expectedPayFunction, merchantAddress, priceAmount, tokenType, allowAptTransfer }
) {
  if (!tx || typeof tx !== "object") return { ok: false, reason: "bad_tx" };

  const optimistic = tx.type === "pending_transaction";

  if (!optimistic) {
    if (tx.type !== "user_transaction") {
      return { ok: false, reason: `unexpected_type:${tx.type}` };
    }

    if (tx.success !== true) {
      return { ok: false, reason: "tx_failed" };
    }
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
    return { ok: true, optimistic };
  }

  if (fn === "0x1::coin::transfer") {
    const type0 = payload.type_arguments?.[0];
    if (!type0) return { ok: false, reason: "missing_token" };
    if (!typeTagMatches(tokenType, type0)) return { ok: false, reason: "wrong_token" };

    const { recipient, amount } = parseRecipientAmount(payload);
    if (normalize(recipient) !== normalize(merchantAddress)) return { ok: false, reason: "wrong_merchant" };
    if (String(amount) !== String(priceAmount)) return { ok: false, reason: "wrong_amount" };
    return { ok: true, optimistic };
  }

  if (allowAptTransfer && fn === "0x1::aptos_account::transfer") {
    const { recipient, amount } = parseRecipientAmount(payload);
    if (normalize(recipient) !== normalize(merchantAddress)) return { ok: false, reason: "wrong_merchant" };
    if (String(amount) !== String(priceAmount)) return { ok: false, reason: "wrong_amount" };
    return { ok: true, optimistic };
  }

  return { ok: false, reason: "unsupported_function" };
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

module.exports = async (req, res) => {
  setCors(req, res);
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST" && req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET,POST,OPTIONS");
    res.end("Method Not Allowed");
    return;
  }

  const FULLNODE_URL = process.env.FULLNODE_URL || "https://full.testnet.movementinfra.xyz/v1";
  const PRICE_AMOUNT = process.env.PRICE_AMOUNT || "1000";

  const TOKEN_TYPE = process.env.USDC_TOKEN || "deo::usdc::USDC";
  const ALLOW_APT_TRANSFER = String(process.env.ALLOW_APT_TRANSFER || "").toLowerCase() === "true";

  const DEO_PACKAGE_ADDRESS = process.env.DEO_PACKAGE_ADDRESS || "0xDEO";
  const EXPECTED_FUNCTION = `${DEO_PACKAGE_ADDRESS}::treasury::pay_merchant`;
  const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || "0xMERCHANT";

  const SERVICE_MODE = (process.env.SERVICE_MODE || "preview").toLowerCase();

  let txHash;
  if (req.method === "GET") {
    try {
      const url = new URL(req.url, "http://localhost");
      txHash = url.searchParams.get("txHash");
    } catch {
      txHash = null;
    }
  } else {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "invalid_json" }));
      return;
    }
    txHash = body?.txHash;
  }

  if (!txHash) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "missing_txHash" }));
    return;
  }

  if (SERVICE_MODE === "preview") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, mode: "preview", proof: txHash }));
    return;
  }

  try {
    const tx = await getTxByHash(FULLNODE_URL, txHash);
    const verdict = isTxAcceptableForAccess(tx, {
      expectedPayFunction: EXPECTED_FUNCTION,
      merchantAddress: MERCHANT_ADDRESS,
      priceAmount: PRICE_AMOUNT,
      tokenType: TOKEN_TYPE,
      allowAptTransfer: ALLOW_APT_TRANSFER,
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: verdict.ok,
        mode: verdict.optimistic ? "fast" : "final",
        reason: verdict.ok ? undefined : verdict.reason,
      })
    );
  } catch (e) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "verification_failed" }));
  }
};
