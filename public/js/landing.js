async function fetchJsonSafe(path) {
  const res = await fetch(path);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: res.status, body };
}

async function init() {
  const base = location.origin;
  document.getElementById("curlPaid").textContent = `curl -i ${base}/weather`;
  document.getElementById("curlRetry").textContent = `curl -i ${base}/weather -H "X-Payment-Proof: <proof>"`;

  const [st, cat] = await Promise.all([
    fetchJsonSafe("/status").catch(() => ({ body: { error: "unavailable" } })),
    fetchJsonSafe("/catalog").catch(() => ({ body: { error: "unavailable" } })),
  ]);

  document.getElementById("statusOut").textContent = JSON.stringify(st.body, null, 2);
  document.getElementById("catalogOut").textContent = JSON.stringify(cat.body, null, 2);
}

init().catch(() => undefined);
