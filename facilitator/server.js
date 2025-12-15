const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const CHAIN_ID = process.env.CHAIN_ID || "movement_testnet";
const FULLNODE_URL = process.env.FULLNODE_URL || "http://127.0.0.1:8080/v1";

const USDC_TOKEN = process.env.USDC_TOKEN || "deo::usdc::USDC";
const PRICE_AMOUNT = process.env.PRICE_AMOUNT || "1000";

const FACILITATOR_URL = process.env.FACILITATOR_URL || `http://localhost:${PORT}`;

const EXPECTED_MODULE_ADDRESS = process.env.DEO_PACKAGE_ADDRESS || "0xDEO";
const EXPECTED_FUNCTION = `${EXPECTED_MODULE_ADDRESS}::treasury::pay_merchant`;
const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || "0xMERCHANT";

function build402Header() {
  return (
    `x402 chain_id="${CHAIN_ID}" ` +
    `token="${USDC_TOKEN}" ` +
    `amount="${PRICE_AMOUNT}" ` +
    `facilitator="${FACILITATOR_URL}"`
  );
}

function getProof(req) {
  const direct = req.header("X-Payment-Proof");
  if (direct) return direct;

  const auth = req.header("Authorization");
  if (!auth) return null;
  const m = auth.match(/^x402\s+(.+)$/i);
  return m ? m[1] : null;
}

async function getTxByHash(txHash) {
  const url = `${FULLNODE_URL.replace(/\/$/, "")}\/transactions\/by_hash\/${txHash}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err = new Error(`Fullnode error ${res.status}: ${txt}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function isTxAcceptableForDemo(tx) {
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

  if (payload.function !== EXPECTED_FUNCTION) {
    return { ok: false, reason: `wrong_function:${payload.function}` };
  }

  const args = payload.arguments || [];
  const merchant = (args[0] || "").toLowerCase();
  const amount = String(args[1] || "");

  if (merchant !== MERCHANT_ADDRESS.toLowerCase()) {
    return { ok: false, reason: "wrong_merchant" };
  }
  if (amount !== String(PRICE_AMOUNT)) {
    return { ok: false, reason: "wrong_amount" };
  }

  return { ok: true, optimistic: false };
}

app.get("/weather", async (req, res) => {
  const proof = getProof(req);
  if (!proof) {
    res
      .status(402)
      .set("WWW-Authenticate", build402Header())
      .json({
        error: "Payment required",
        scheme: "x402",
        hint: "Send X-Payment-Proof: <txHash> after paying on-chain",
      });
    return;
  }

  try {
    const tx = await getTxByHash(proof);
    const verdict = isTxAcceptableForDemo(tx);
    if (!verdict.ok) {
      res.status(401).json({ error: "Invalid payment proof", reason: verdict.reason });
      return;
    }

    res.json({
      premium: true,
      city: "Lisbon",
      temperature_c: 22,
      condition: "Clear",
      settlement: verdict.optimistic ? "optimistic" : "final",
      txHash: proof,
    });
  } catch (e) {
    res.status(502).json({ error: "verification_failed", detail: e.message });
  }
});

app.post("/verify", async (req, res) => {
  const txHash = req.body?.txHash;
  if (!txHash) {
    res.status(400).json({ error: "missing_txHash" });
    return;
  }

  try {
    const tx = await getTxByHash(txHash);
    const verdict = isTxAcceptableForDemo(tx);
    res.json({ ok: verdict.ok, optimistic: !!verdict.optimistic, reason: verdict.reason || null, tx });
  } catch (e) {
    res.status(502).json({ ok: false, error: "verification_failed", detail: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`x402 facilitator listening on ${FACILITATOR_URL}`);
  console.log(`Fullnode: ${FULLNODE_URL}`);
  console.log(`Expected function: ${EXPECTED_FUNCTION}`);
  console.log(`Merchant: ${MERCHANT_ADDRESS}, Amount: ${PRICE_AMOUNT}, Token: ${USDC_TOKEN}`);
});
