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

function sampleItems(address) {
  const now = Date.now();
  const me = address || "0xYOU";
  return [
    {
      id: `preview_${now}_0`,
      direction: "received",
      amount: String(2.5 * 1e8),
      counterparty: "0xA11CE",
      timestamp: String(now - 2 * 60 * 1000),
      status: "preview",
      txHash: `preview_rx_${now}`,
    },
    {
      id: `preview_${now}_1`,
      direction: "sent",
      amount: String(0.75 * 1e8),
      counterparty: "0xB0B",
      timestamp: String(now - 9 * 60 * 1000),
      status: "preview",
      txHash: `preview_tx_${now}`,
    },
    {
      id: `preview_${now}_2`,
      direction: "received",
      amount: String(1.2 * 1e8),
      counterparty: "0xC4R0L",
      timestamp: String(now - 25 * 60 * 1000),
      status: "preview",
      txHash: `preview_rx2_${now}`,
    },
    {
      id: `preview_${now}_3`,
      direction: "sent",
      amount: String(0.1 * 1e8),
      counterparty: "0xD4VE",
      timestamp: String(now - 2 * 60 * 60 * 1000),
      status: "preview",
      txHash: `preview_tx2_${now}`,
    },
    {
      id: `preview_${now}_4`,
      direction: "received",
      amount: String(0.05 * 1e8),
      counterparty: me,
      timestamp: String(now - 7 * 60 * 60 * 1000),
      status: "preview",
      txHash: `preview_misc_${now}`,
    },
  ];
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

function computeStart(counter, limit) {
  try {
    const c = BigInt(counter || "0");
    const l = BigInt(limit);
    if (c <= l) return "0";
    return String(c - l);
  } catch {
    return null;
  }
}

function versionToBigInt(v) {
  try {
    return BigInt(v);
  } catch {
    return BigInt(0);
  }
}

async function getTransactionByVersion({ fullnodeUrl, version }) {
  const base = String(fullnodeUrl).replace(/\/$/, "");
  const url = new URL(`${base}/transactions/by_version/${version}`);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err = new Error(`Fullnode error ${res.status}: ${txt}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function enrichCounterparty(tx, direction) {
  const sender = tx?.sender ? String(tx.sender) : "";
  const payload = tx?.payload || null;

  if (direction === "received") {
    return sender;
  }

  if (direction === "sent") {
    const fn = payload?.function ? String(payload.function) : "";
    const args = Array.isArray(payload?.arguments) ? payload.arguments : [];
    if (fn.endsWith("0x1::aptos_account::transfer") && args[0]) return String(args[0]);
    if (fn.endsWith("0x1::coin::transfer") && args[0]) return String(args[0]);
  }

  return "";
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

  if (SERVICE_MODE === "preview") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        mode: "preview",
        address: address || null,
        items: sampleItems(address || null),
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

  const coinType = process.env.NATIVE_COIN_TYPE || "0x1::aptos_coin::AptosCoin";
  const coinStoreType = `0x1::coin::CoinStore<${coinType}>`;

  try {
    const coinStore = await getResource({ fullnodeUrl: FULLNODE_URL, account: address, resourceType: coinStoreType });

    const depositCounter = coinStore?.data?.deposit_events?.counter || "0";
    const withdrawCounter = coinStore?.data?.withdraw_events?.counter || "0";

    const limit = 12;
    const depositStart = computeStart(depositCounter, limit);
    const withdrawStart = computeStart(withdrawCounter, limit);

    const [deposits, withdraws] = await Promise.all([
      getEvents({
        fullnodeUrl: FULLNODE_URL,
        account: address,
        eventHandleStruct: coinStoreType,
        field: "deposit_events",
        start: depositStart,
        limit,
      }).catch(() => []),
      getEvents({
        fullnodeUrl: FULLNODE_URL,
        account: address,
        eventHandleStruct: coinStoreType,
        field: "withdraw_events",
        start: withdrawStart,
        limit,
      }).catch(() => []),
    ]);

    const mapped = [];

    (Array.isArray(deposits) ? deposits : []).forEach((e) => {
      mapped.push({
        id: `dep:${e?.version || "?"}:${e?.sequence_number || "?"}`,
        direction: "received",
        amount: String(e?.data?.amount || ""),
        tx_version: e?.version != null ? String(e.version) : null,
        status: "final",
      });
    });

    (Array.isArray(withdraws) ? withdraws : []).forEach((e) => {
      mapped.push({
        id: `wd:${e?.version || "?"}:${e?.sequence_number || "?"}`,
        direction: "sent",
        amount: String(e?.data?.amount || ""),
        tx_version: e?.version != null ? String(e.version) : null,
        status: "final",
      });
    });

    mapped.sort((a, b) => {
      const av = versionToBigInt(a.tx_version);
      const bv = versionToBigInt(b.tx_version);
      if (bv > av) return 1;
      if (bv < av) return -1;
      return 0;
    });

    const items = mapped.slice(0, limit);

    const txs = await Promise.all(
      items.map(async (it) => {
        if (!it.tx_version) return null;
        try {
          return await getTransactionByVersion({ fullnodeUrl: FULLNODE_URL, version: it.tx_version });
        } catch {
          return null;
        }
      })
    );

    const enriched = items.map((it, i) => {
      const tx = txs[i];
      const txHash = tx?.hash ? String(tx.hash) : "";
      const timestamp = tx?.timestamp != null ? String(tx.timestamp) : null;
      const counterparty = enrichCounterparty(tx, it.direction);
      return {
        ...it,
        txHash: txHash || null,
        timestamp,
        counterparty: counterparty || null,
      };
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        mode: "chain",
        address,
        items: enriched,
      })
    );
  } catch {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "chain_unavailable" }));
  }
}
