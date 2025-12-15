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
  const [st, cat] = await Promise.all([
    fetchJsonSafe("/status"),
    fetchJsonSafe("/catalog"),
  ]);

  const statusEl = document.getElementById("statusOut");
  const catalogEl = document.getElementById("catalogOut");
  const challengeEl = document.getElementById("challengeOut");

  statusEl.textContent = JSON.stringify(st.body, null, 2);
  catalogEl.textContent = JSON.stringify(cat.body, null, 2);
  challengeEl.textContent = String((cat && cat.body && cat.body.challenge_header) || "(missing)");
}

init().catch(() => undefined);
