const productEl = document.getElementById("product");
const proofEl = document.getElementById("proof");

const btnRequest = document.getElementById("btnRequest");
const btnGen = document.getElementById("btnGen");
const btnVerify = document.getElementById("btnVerify");
const btnRetry = document.getElementById("btnRetry");

const statusOut = document.getElementById("statusOut");
const out = document.getElementById("out");
const challengeOut = document.getElementById("challengeOut");
const verifyOut = document.getElementById("verifyOut");
const receiptOut = document.getElementById("receiptOut");
const paymentsOut = document.getElementById("paymentsOut");

const curlCatalog = document.getElementById("curlCatalog");
const curlPaid = document.getElementById("curlPaid");
const curlVerify = document.getElementById("curlVerify");
const curlReceipt = document.getElementById("curlReceipt");
const curlPayments = document.getElementById("curlPayments");

let products = [];
let lastChallengeHeader = "";
let lastFacilitator = "";

function parseChallenge(header) {
  const params = {};
  const re = /(\w+)="([^"]+)"/g;
  let m;
  while ((m = re.exec(String(header || ""))) !== null) params[m[1]] = m[2];
  return params;
}

async function fetchJsonSafe(path, init) {
  const res = await fetch(path, init);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: res.status, headers: res.headers, body };
}

function selectedProduct() {
  const idx = Number(productEl.value || 0);
  return products[idx] || null;
}

function setCurlSnippets() {
  const base = location.origin;
  const p = selectedProduct();
  const path = (p && p.path) || "/weather";

  curlCatalog.textContent = `curl -s ${base}/catalog`;
  curlPaid.textContent = `curl -i ${base}${path}`;
  curlVerify.textContent = `curl -s ${base}/verify?txHash=<proof>`;
  curlReceipt.textContent = `curl -s ${base}/receipt?txHash=<proof>`;
  curlPayments.textContent = `curl -s ${base}/payments`;
}

async function requestPaid(proof) {
  const p = selectedProduct();
  const method = (p && p.method) || "GET";
  const path = (p && p.path) || "/weather";

  const headers = {};
  if (proof) {
    headers["X-Payment-Proof"] = proof;
    headers["Authorization"] = `x402 ${proof}`;
  }

  const res = await fetchJsonSafe(path, { method, headers });
  out.textContent = JSON.stringify({ status: res.status, body: res.body }, null, 2);

  lastChallengeHeader = res.headers.get("www-authenticate") || "";
  challengeOut.textContent = lastChallengeHeader || "(none)";
  const params = parseChallenge(lastChallengeHeader);
  lastFacilitator = params.facilitator || "";

  return res;
}

async function verifyProof(proof) {
  if (!proof) {
    verifyOut.textContent = JSON.stringify({ ok: false, error: "missing_proof" }, null, 2);
    return;
  }
  const res = await fetchJsonSafe(`/verify?txHash=${encodeURIComponent(proof)}`);
  verifyOut.textContent = JSON.stringify(res.body, null, 2);
}

async function loadReceiptAndPayments(proof) {
  if (!proof) return;

  const receipt = await fetchJsonSafe(`/receipt?txHash=${encodeURIComponent(proof)}`).catch(() => ({
    body: { ok: false, error: "unavailable" },
  }));
  receiptOut.textContent = JSON.stringify(receipt.body, null, 2);

  const payer = receipt && receipt.body && receipt.body.receipt && receipt.body.receipt.payer;
  const paymentsPath = payer ? `/payments?payer=${encodeURIComponent(payer)}` : "/payments";
  const payments = await fetchJsonSafe(paymentsPath).catch(() => ({
    body: { ok: false, error: "unavailable" },
  }));
  paymentsOut.textContent = JSON.stringify(payments.body, null, 2);

  const base = location.origin;
  curlReceipt.textContent = `curl -s ${base}/receipt?txHash=${proof}`;
  curlPayments.textContent = payer ? `curl -s ${base}/payments?payer=${payer}` : `curl -s ${base}/payments`;
}

async function init() {
  setCurlSnippets();

  const [st, cat] = await Promise.all([
    fetchJsonSafe("/status").catch(() => ({ body: { error: "unavailable" } })),
    fetchJsonSafe("/catalog").catch(() => ({ body: { error: "unavailable" } })),
  ]);

  statusOut.textContent = JSON.stringify(st.body, null, 2);

  products = Array.isArray(cat && cat.body && cat.body.products) ? cat.body.products : [];
  if (!products.length) {
    products = [{ id: "weather.premium", name: "Premium Weather Feed", method: "GET", path: "/weather", price: {} }];
  }

  productEl.innerHTML = "";
  products.forEach((p, i) => {
    const opt = document.createElement("option");
    const price = p && p.price && p.price.amount && p.price.token ? ` — ${p.price.amount} ${p.price.token}` : "";
    opt.value = String(i);
    opt.textContent = `${p.name || p.id} — ${p.method || "GET"} ${p.path || ""}${price}`;
    productEl.appendChild(opt);
  });

  productEl.addEventListener("change", () => {
    setCurlSnippets();
  });

  setCurlSnippets();
}

btnRequest.addEventListener("click", async () => {
  verifyOut.textContent = "(none)";
  receiptOut.textContent = "(none)";
  paymentsOut.textContent = "(none)";
  await requestPaid();
});

btnGen.addEventListener("click", async () => {
  const proof = `proof_${Date.now()}`;
  proofEl.value = proof;

  if (lastFacilitator) {
    await fetch(lastFacilitator, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash: proof }),
    }).catch(() => undefined);
  }

  await verifyProof(proof);
});

btnVerify.addEventListener("click", async () => {
  await verifyProof(proofEl.value);
});

btnRetry.addEventListener("click", async () => {
  const proof = proofEl.value;
  await requestPaid(proof);
  await verifyProof(proof);
  await loadReceiptAndPayments(proof);
});

init().catch(() => undefined);
