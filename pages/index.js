import Head from "next/head";
import Script from "next/script";

export default function HomePage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DEO — Autonomous Payments for AI Agents</title>
        <link rel="stylesheet" href="/site.css" />
      </Head>

      <div className="wrap">
        <div className="nav">
          <a className="brand" href="/">
            <div className="logo" aria-hidden="true"></div>
            <div className="brandTitle">
              <strong>DEO</strong>
              <span>Autonomous payments for agents</span>
            </div>
          </a>
          <div className="navLinks">
            <a className="pill" href="/standard">
              Service Standard
            </a>
            <a className="pill" href="/examples">
              Examples
            </a>
            <a className="pill" href="/catalog">
              Catalog
            </a>
            <a className="pill" href="/status">
              Status
            </a>
            <a className="btn primary" href="/examples#playground">
              Open Playground
            </a>
          </div>
        </div>

        <div className="hero">
          <div className="card">
            <div className="sectionTitle">DEO</div>
            <div className="h1">Paid endpoints that feel instant for agents.</div>
            <p className="lead">
              DEO standardizes a simple handshake for pay-per-call APIs: the server issues an HTTP 402 challenge, the
              client produces an on-chain proof, and the request is retried with verifiable authorization.
            </p>

            <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn primary" href="/standard">
                Read the standard
              </a>
              <a className="btn" href="/examples#playground">
                Try the playground
              </a>
            </div>

            <div
              className="section"
              style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              <div className="pill">HTTP 402 challenge</div>
              <div className="pill">Movement settlement proof</div>
              <div className="pill">Fast or final verification</div>
              <div className="pill">Receipts + history</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <img
              className="heroArt"
              src="/assets/deo-hero.svg"
              alt="DEO illustration showing agent, service, and Movement settlement"
            />
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">DEO in 30 seconds</div>
          <div className="grid3">
            <div className="card">
              <div className="k">1) Challenge</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Premium endpoints respond with <span className="k">402 Payment Required</span> and a machine-readable{" "}
                <span className="k">WWW-Authenticate</span> header that describes price, token, and verifier.
              </div>
            </div>
            <div className="card">
              <div className="k">2) Proof</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                The client submits an on-chain payment (or authorization action) and uses the resulting transaction hash
                as a proof.
              </div>
            </div>
            <div className="card">
              <div className="k">3) Unlock</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Retry the original request with <span className="k">X-Payment-Proof</span>. The service verifies and
                returns the premium response immediately, plus receipts and history endpoints for auditing.
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Flow</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <img className="heroArt" src="/assets/deo-flow.svg" alt="HTTP 402 to proof to unlock diagram" />
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Live service snapshot</div>
          <div className="grid2">
            <div className="card">
              <div className="k">GET /status</div>
              <pre style={{ marginTop: 10 }}>
                <code id="statusOut">(loading...)</code>
              </pre>
              <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className="btn" href="/status">
                  Open JSON
                </a>
                <a className="btn" href="/standard#live">
                  See on the Standard page
                </a>
              </div>
            </div>

            <div className="card">
              <div className="k">GET /catalog</div>
              <pre style={{ marginTop: 10 }}>
                <code id="catalogOut">(loading...)</code>
              </pre>
              <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className="btn" href="/catalog">
                  Open JSON
                </a>
                <a className="btn" href="/examples#recipes">
                  Copy CLI recipes
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Start with curl</div>
          <div className="grid2">
            <div className="card">
              <div className="k">Call a paid endpoint (expect 402)</div>
              <pre style={{ marginTop: 10 }}>
                <code id="curlPaid">(loading...)</code>
              </pre>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                The 402 response includes a challenge header that tells clients what proof is required.
              </div>
            </div>
            <div className="card">
              <div className="k">Retry with a proof</div>
              <pre style={{ marginTop: 10 }}>
                <code id="curlRetry">(loading...)</code>
              </pre>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                After payment, provide the tx hash via <span className="k">X-Payment-Proof</span>. Use{" "}
                <span className="k">/receipt</span> for a normalized audit record.
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Where to go next</div>
          <div className="grid2">
            <div className="card">
              <div className="k">Service Standard</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                The generalized DEO specification with live outputs from <span className="k">/status</span> and{" "}
                <span className="k">/catalog</span>.
              </div>
              <div className="section">
                <a className="btn primary" href="/standard">
                  Open Service Standard
                </a>
              </div>
            </div>
            <div className="card">
              <div className="k">Examples &amp; Playground</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Run the request → 402 → proof → retry flow. Inspect receipts and payment history.
              </div>
              <div className="section">
                <a className="btn primary" href="/examples#playground">
                  Open Playground
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          DEO is designed for composability: premium endpoints remain custom, while pricing discovery and verification are
          standardized.
        </div>
      </div>

      <Script src="/js/landing.js" strategy="afterInteractive" />
    </>
  );
}
