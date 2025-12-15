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

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const FULLNODE_URL = process.env.FULLNODE_URL || "https://full.testnet.movementinfra.xyz/v1";
  const PRICE_AMOUNT = process.env.PRICE_AMOUNT || "1000";

  const DEO_PACKAGE_ADDRESS = process.env.DEO_PACKAGE_ADDRESS || "0xDEO";
  const EXPECTED_FUNCTION = `${DEO_PACKAGE_ADDRESS}::treasury::pay_merchant`;
  const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || "0xMERCHANT";

  const DEMO_MODE = (process.env.DEMO_MODE || "chain").toLowerCase();

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "invalid_json" }));
    return;
  }

  const txHash = body?.txHash;
  if (!txHash) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "missing_txHash" }));
    return;
  }

  if (DEMO_MODE === "mock") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, optimistic: true, mode: "mock", txHash }));
    return;
  }

  try {
    const tx = await getTxByHash(FULLNODE_URL, txHash);
    const verdict = isTxAcceptableForDemo(tx, {
      expectedFunction: EXPECTED_FUNCTION,
      merchantAddress: MERCHANT_ADDRESS,
      priceAmount: PRICE_AMOUNT,
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: verdict.ok, optimistic: !!verdict.optimistic, reason: verdict.reason || null, tx }));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "verification_failed", detail: e.message }));
  }
};
