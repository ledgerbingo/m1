function setCors(req, res) {
  const origin = process.env.CORS_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
}

function toOne(v) {
  if (Array.isArray(v)) return v[0] || "";
  return v || "";
}

async function getResource({ fullnodeUrl, account, resourceType }) {
  const base = String(fullnodeUrl).replace(/\/$/, "");
  const type = encodeURIComponent(resourceType);
  const url = new URL(`${base}/accounts/${account}/resource/${type}`);

  const res = await fetch(url.toString());
  if (res.status === 404) return null;
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err = new Error(`Fullnode error ${res.status}: ${txt}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export default async function handler(req, res) {
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
  const FULLNODE_URL = process.env.FULLNODE_URL || "https://full.testnet.movementinfra.xyz/v1";

  const address = String(toOne(req.query?.address)).trim();

  const coinType = process.env.NATIVE_COIN_TYPE || "0x1::aptos_coin::AptosCoin";
  const coinStoreType = `0x1::coin::CoinStore<${coinType}>`;

  if (SERVICE_MODE === "preview") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        mode: "preview",
        address: address || null,
        coin_type: coinType,
        decimals: 8,
        value: String(12.345 * 1e8),
      })
    );
    return;
  }

  if (!address) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "missing_address" }));
    return;
  }

  try {
    const coinStore = await getResource({ fullnodeUrl: FULLNODE_URL, account: address, resourceType: coinStoreType });

    const value = coinStore?.data?.coin?.value != null ? String(coinStore.data.coin.value) : "0";

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        mode: "chain",
        address,
        coin_type: coinType,
        decimals: 8,
        value,
      })
    );
  } catch {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "chain_unavailable" }));
  }
}
