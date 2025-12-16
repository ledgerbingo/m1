import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

function shortAddr(addr) {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function getWalletProvider() {
  if (typeof window === "undefined") return null;
  const w = window;
  return w.razor || w.nightly || null;
}

async function fetchJsonSafe(path) {
  const res = await fetch(path);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { ok: res.ok, status: res.status, body };
}

async function discoverNativeMoveCoinType(fullnodeUrl) {
  const base = String(fullnodeUrl || "").replace(/\/$/, "");
  if (!base) return null;

  const url = new URL(`${base}/accounts/0x1/resources`);
  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const resources = await res.json().catch(() => null);
  if (!Array.isArray(resources)) return null;

  for (const r of resources) {
    const t = r?.type != null ? String(r.type) : "";
    if (!t.startsWith("0x1::coin::CoinInfo<")) continue;
    const sym = r?.data?.symbol != null ? String(r.data.symbol) : "";
    if (sym.toUpperCase() !== "MOVE") continue;
    const lt = t.indexOf("<");
    const gt = t.lastIndexOf(">");
    if (lt < 0 || gt < 0 || gt <= lt + 1) continue;
    return t.slice(lt + 1, gt);
  }

  return null;
}

function formatMoveAmount(octas) {
  const n = Number(octas);
  if (!Number.isFinite(n)) return "";
  const v = n / 1e8;
  return v.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function txTimeLabel(ts) {
  if (!ts) return "";
  const n = Number(ts);
  if (!Number.isFinite(n)) return "";
  const ms = n > 1e14 ? Math.round(n / 1000) : n;
  return new Date(ms).toLocaleString();
}

export default function AppPage() {
  const [status, setStatus] = useState(null);
  const [walletAvailable, setWalletAvailable] = useState(false);
  const [address, setAddress] = useState("");
  const [connectBusy, setConnectBusy] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [message, setMessage] = useState("");

  const [activity, setActivity] = useState([]);
  const [activityBusy, setActivityBusy] = useState(false);
  const [balanceBusy, setBalanceBusy] = useState(false);
  const [balanceValue, setBalanceValue] = useState(null);
  const [nativeCoinType, setNativeCoinType] = useState("");

  const chainLabel = useMemo(() => {
    const id = status?.chain?.chain_id;
    return id ? String(id) : "";
  }, [status]);

  useEffect(() => {
    setWalletAvailable(!!getWalletProvider());

    fetchJsonSafe("/status")
      .then((r) => {
        if (r?.body) setStatus(r.body);
      })
      .catch(() => undefined);
  }, []);

  async function refreshActivity(addr) {
    setActivityBusy(true);
    try {
      const q = addr ? `?address=${encodeURIComponent(addr)}` : "";
      const r = await fetchJsonSafe(`/api/activity${q}`);
      const items = Array.isArray(r?.body?.items) ? r.body.items : [];
      setActivity(items);
    } catch {
      setActivity([]);
    } finally {
      setActivityBusy(false);
    }
  }

  async function refreshBalance(addr) {
    setBalanceBusy(true);
    try {
      if (!addr) {
        setBalanceValue(null);
        return;
      }
      const q = `?address=${encodeURIComponent(addr)}`;
      const r = await fetchJsonSafe(`/api/balance${q}`);
      const v = r?.body?.value != null ? String(r.body.value) : null;
      const ct = r?.body?.coin_type != null ? String(r.body.coin_type) : "";
      if (ct && ct.includes("::")) setNativeCoinType(ct);
      setBalanceValue(v);
    } catch {
      setBalanceValue(null);
    } finally {
      setBalanceBusy(false);
    }
  }

  useEffect(() => {
    refreshActivity(address || "").catch(() => undefined);
    refreshBalance(address || "").catch(() => undefined);
  }, [address]);

  async function onConnect() {
    setMessage("");
    const wallet = getWalletProvider();
    if (!wallet) {
      setMessage("No wallet detected. Install a Movement wallet extension (Razor or Nightly).");
      return;
    }

    setConnectBusy(true);
    try {
      const connected = (await wallet.connect?.()) || null;
      const addrFromConnect = connected?.address;
      const acct = (await wallet.account?.()) || null;
      const addr = addrFromConnect || acct?.address || "";
      if (!addr) {
        setMessage("Connected, but could not read wallet address.");
        return;
      }
      setAddress(addr);
      await refreshBalance(addr);
      await refreshActivity(addr);
    } catch (e) {
      setMessage(String(e?.message || "Unable to connect wallet"));
    } finally {
      setConnectBusy(false);
    }
  }

  async function onCopyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setMessage("Address copied.");
    } catch {
      setMessage("Unable to copy address.");
    }
  }

  async function onSend() {
    setMessage("");

    const wallet = getWalletProvider();
    if (!wallet) {
      setMessage("Wallet not detected.");
      return;
    }

    if (!address) {
      setMessage("Connect your wallet first.");
      return;
    }

    const to = String(sendTo || "").trim();
    if (!to) {
      setMessage("Enter a recipient address.");
      return;
    }

    const amtFloat = Number(String(sendAmount || "").trim());
    if (!Number.isFinite(amtFloat) || amtFloat <= 0) {
      setMessage("Enter a valid amount.");
      return;
    }

    const octas = Math.round(amtFloat * 1e8);
    if (!Number.isFinite(octas) || octas <= 0) {
      setMessage("Amount too small.");
      return;
    }

    if (typeof wallet.signAndSubmitTransaction !== "function") {
      setMessage("Your wallet does not support signAndSubmitTransaction.");
      return;
    }

    let coinType = nativeCoinType;
    if (!coinType) {
      const fullnodeUrl = status?.chain?.fullnode_url;
      if (fullnodeUrl) {
        try {
          const discovered = await discoverNativeMoveCoinType(fullnodeUrl);
          if (discovered) {
            coinType = discovered;
            setNativeCoinType(discovered);
          }
        } catch {
          coinType = "";
        }
      }
    }

    if (!coinType) {
      setMessage("Unable to resolve native MOVE coin type.");
      return;
    }

    setSendBusy(true);
    try {
      const tx = {
        type: "entry_function_payload",
        function: "0x1::coin::transfer",
        type_arguments: [coinType],
        arguments: [to, String(octas)],
      };

      const pending = await wallet.signAndSubmitTransaction(tx);
      const hash = pending?.hash || pending?.txHash || pending?.transactionHash || "";
      setMessage(hash ? `Sent. Tx: ${hash}` : "Sent.");
      setSendTo("");
      setSendAmount("");
      await refreshBalance(address);
      await refreshActivity(address);
    } catch (e) {
      setMessage(String(e?.message || "Send failed"));
    } finally {
      setSendBusy(false);
    }
  }

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DEO — Wallet</title>
        <link rel="stylesheet" href="/site.css" />
      </Head>

      <div className="wrap">
        <div className="nav">
          <a className="brand" href="/">
            <div className="logo" aria-hidden="true"></div>
            <div className="brandTitle">
              <strong>DEO</strong>
              <span>Wallet</span>
            </div>
          </a>
          <div className="navLinks">
            <a className="pill" href="/app">
              App
            </a>
            <a className="pill" href="/security">
              Security
            </a>
            <a className="pill" href="/support">
              Support
            </a>
            <a className="pill" href="/developers">
              Developers
            </a>
          </div>
        </div>

        <div className="hero">
          <div className="card">
            <div className="sectionTitle">Your wallet</div>
            <div className="h1" style={{ fontSize: 44 }}>
              Send and receive with Web2 simplicity.
            </div>
            <p className="lead">
              Non-custodial by default. Settlement and receipts live on Movement L1, but the experience stays simple.
            </p>

            <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn primary" onClick={onConnect} disabled={connectBusy}>
                {address ? "Wallet connected" : connectBusy ? "Connecting…" : "Connect wallet"}
              </button>
              {address ? (
                <button className="btn" onClick={onCopyAddress}>
                  Copy address
                </button>
              ) : null}
            </div>

            <div className="section" style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div className="pill">{walletAvailable ? "Wallet detected" : "No wallet detected"}</div>
              {chainLabel ? <div className="pill">Network: {chainLabel}</div> : null}
              {address ? <div className="pill">{shortAddr(address)}</div> : null}
            </div>

            {message ? (
              <div className="section">
                <div className="muted" style={{ lineHeight: 1.7 }}>
                  {message}
                </div>
              </div>
            ) : null}
          </div>

          <div className="card">
            <div className="sectionTitle">Balance</div>
            <div className="h1" style={{ fontSize: 44, marginTop: 6 }}>
              {address ? (balanceBusy ? "Loading…" : balanceValue != null ? `${formatMoveAmount(balanceValue)} MOVE` : "—") : "—"}
            </div>
            <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
              {address ? "Your on-chain MOVE balance." : "Connect your wallet to view your balance."}
            </div>

            <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn"
                onClick={() => {
                  refreshBalance(address).catch(() => undefined);
                  refreshActivity(address).catch(() => undefined);
                }}
                disabled={!address || balanceBusy || activityBusy}
              >
                Refresh
              </button>
            </div>

            <div className="section">
              <div className="k">Recent activity</div>
              <div className="muted" style={{ marginTop: 8 }}>
                {activityBusy ? "Loading…" : activity.length ? `${activity.length} items` : "No activity yet"}
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="grid2">
            <div className="card">
              <div className="sectionTitle">Send</div>
              <div className="k">To</div>
              <div style={{ height: 8 }}></div>
              <input
                className="input"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="0x… recipient address"
              />

              <div style={{ height: 12 }}></div>
              <div className="k">Amount (MOVE)</div>
              <div style={{ height: 8 }}></div>
              <input
                className="input"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
              />

              <div style={{ height: 14 }}></div>
              <button className="btn primary" onClick={onSend} disabled={sendBusy}>
                {sendBusy ? "Sending…" : "Send"}
              </button>

              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Amounts are submitted as on-chain MOVE transfers.
              </div>
            </div>

            <div className="card">
              <div className="sectionTitle">Receive</div>
              <div className="k">Your address</div>
              <div style={{ height: 8 }}></div>
              <div className="muted" style={{ lineHeight: 1.7 }}>
                {address ? address : "Connect your wallet to reveal your address."}
              </div>

              <div style={{ height: 14 }}></div>
              <button className="btn" onClick={onCopyAddress} disabled={!address}>
                Copy
              </button>

              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Share your address to receive payments.
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Activity</div>
          <div className="card">
            {activityBusy ? (
              <div className="muted">Loading…</div>
            ) : activity.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {activity.slice(0, 12).map((it) => {
                  const dir = it.direction ? String(it.direction) : "";
                  const amount = it.amount != null ? String(it.amount) : "";
                  const counterparty = it.counterparty ? String(it.counterparty) : "";
                  const ts = it.timestamp || it.time || null;
                  return (
                    <div
                      key={String(it.id || it.txHash || Math.random())}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: 12,
                        border: "1px solid rgba(11,16,32,0.10)",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.72)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div className="k" style={{ textTransform: "capitalize" }}>
                          {dir || "Transfer"}
                        </div>
                        <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
                          {counterparty ? shortAddr(counterparty) : ""}
                        </div>
                        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                          {it.txHash ? shortAddr(String(it.txHash)) : ""} {ts ? `• ${txTimeLabel(ts)}` : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="k">{amount ? `${formatMoveAmount(amount)} MOVE` : ""}</div>
                        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                          {it.status ? String(it.status) : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="muted">No activity yet.</div>
            )}
          </div>
        </div>

        <div className="footer">
          DEO is a consumer wallet experience. Developer protocol pages live under <a href="/developers">/developers</a>.
        </div>
      </div>
    </>
  );
}
