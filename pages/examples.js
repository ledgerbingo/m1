import Head from "next/head";
import Script from "next/script";

const AGENT_ALGO = `1. Call premium endpoint.
2. If 402: parse WWW-Authenticate (x402).
3. Submit on-chain payment and obtain tx hash.
4. Verify with /verify (fast or final).
5. Retry premium endpoint with X-Payment-Proof.
6. Fetch /receipt for a normalized audit record.
7. Use /payments for history.`;

export default function ExamplesPage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DEO — Examples &amp; Playground</title>
        <link rel="stylesheet" href="/site.css" />
      </Head>

      <div className="wrap">
        <div className="nav">
          <a className="brand" href="/">
            <div className="logo" aria-hidden="true"></div>
            <div className="brandTitle">
              <strong>DEO</strong>
              <span>Examples &amp; playground</span>
            </div>
          </a>
          <div className="navLinks">
            <a className="pill" href="/">
              Home
            </a>
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
            <a className="btn primary" href="#playground">
              Try the flow
            </a>
          </div>
        </div>

        <div className="hero">
          <div className="card">
            <div className="sectionTitle">Examples</div>
            <div className="h1">Run the x402 flow end-to-end.</div>
            <p className="lead">
              This playground demonstrates the DEO handshake: request a premium endpoint, receive a 402 challenge, produce a
              proof (a Movement transaction hash in chain mode), verify it, then retry and receive the premium response.
            </p>
            <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn primary" href="#playground">
                Open playground
              </a>
              <a className="btn" href="#recipes">
                CLI recipes
              </a>
              <a className="btn" href="#patterns">
                Integration patterns
              </a>
            </div>
            <div className="section" style={{ marginTop: 10 }}>
              <div className="pill">402 challenge</div>
              <div className="pill">Proof verification</div>
              <div className="pill">Receipts</div>
              <div className="pill">Payment history</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <img className="heroArt" src="/assets/deo-cases.svg" alt="DEO examples illustration" />
          </div>
        </div>

        <div id="playground" className="section">
          <div className="sectionTitle">Playground</div>

          <div className="grid2">
            <div className="card">
              <div className="k">Product</div>
              <div className="muted" style={{ marginTop: 8 }}>
                Loaded from <span className="k">GET /catalog</span>.
              </div>
              <div style={{ height: 12 }}></div>
              <select id="product" className="input"></select>

              <div style={{ height: 12 }}></div>
              <div className="k">Proof (tx hash)</div>
              <div className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                In preview mode, any string can act as a proof. In chain mode, paste a real transaction hash.
              </div>
              <div style={{ height: 10 }}></div>
              <input id="proof" className="input" placeholder="tx hash / proof" />

              <div style={{ height: 14 }}></div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn primary" id="btnRequest">
                  Request (no proof)
                </button>
                <button className="btn" id="btnGen">
                  Generate preview proof
                </button>
                <button className="btn" id="btnVerify">
                  Verify proof
                </button>
                <button className="btn" id="btnRetry">
                  Retry with proof
                </button>
              </div>

              <div style={{ height: 14 }}></div>
              <div className="k">Service snapshot</div>
              <pre style={{ marginTop: 10 }}>
                <code id="statusOut">(loading...)</code>
              </pre>
            </div>

            <div className="card">
              <div className="k">HTTP response</div>
              <pre style={{ marginTop: 10 }}>
                <code id="out">Click “Request (no proof)”.</code>
              </pre>

              <div style={{ height: 14 }}></div>
              <div className="k">WWW-Authenticate</div>
              <pre style={{ marginTop: 10 }}>
                <code id="challengeOut">(none)</code>
              </pre>

              <div style={{ height: 14 }}></div>
              <div className="k">Verifier result</div>
              <pre style={{ marginTop: 10 }}>
                <code id="verifyOut">(none)</code>
              </pre>
            </div>
          </div>

          <div className="grid2 section">
            <div className="card">
              <div className="k">Receipt</div>
              <pre style={{ marginTop: 10 }}>
                <code id="receiptOut">(none)</code>
              </pre>
            </div>

            <div className="card">
              <div className="k">Payments</div>
              <pre style={{ marginTop: 10 }}>
                <code id="paymentsOut">(none)</code>
              </pre>
            </div>
          </div>

          <div className="section">
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <img className="heroArt" src="/assets/deo-flow.svg" alt="402 challenge to proof to unlock flow" />
            </div>
          </div>
        </div>

        <div id="recipes" className="section">
          <div className="sectionTitle">CLI recipes</div>

          <div className="grid2">
            <div className="card">
              <div className="k">Discover pricing</div>
              <pre style={{ marginTop: 10 }}>
                <code id="curlCatalog">(loading...)</code>
              </pre>
            </div>

            <div className="card">
              <div className="k">Call a paid endpoint (expect 402)</div>
              <pre style={{ marginTop: 10 }}>
                <code id="curlPaid">(loading...)</code>
              </pre>
            </div>
          </div>

          <div className="grid2 section">
            <div className="card">
              <div className="k">Verify a proof</div>
              <pre style={{ marginTop: 10 }}>
                <code id="curlVerify">(loading...)</code>
              </pre>
            </div>

            <div className="card">
              <div className="k">Receipt and history</div>
              <pre style={{ marginTop: 10 }}>
                <code id="curlReceipt">(loading...)</code>
              </pre>
              <div style={{ height: 10 }}></div>
              <pre>
                <code id="curlPayments">(loading...)</code>
              </pre>
            </div>
          </div>
        </div>

        <div id="patterns" className="section">
          <div className="sectionTitle">Integration patterns</div>

          <div className="grid3">
            <div className="card">
              <div className="k">Paid data APIs</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Market data, weather, proprietary datasets, or internal services. Agents discover a price in{" "}
                <span className="k">/catalog</span> and can programmatically retry after paying.
              </div>
            </div>

            <div className="card">
              <div className="k">Paid inference</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Meter LLM calls, embeddings, or vision models with the same handshake. Receipts provide per-call auditing
                for billing and support.
              </div>
            </div>

            <div className="card">
              <div className="k">Paid actions</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Automation tools and agent execution. Payment proof becomes a universal authorization primitive for
                sensitive operations.
              </div>
            </div>
          </div>

          <div className="section">
            <div className="card">
              <div className="k">Agent algorithm</div>
              <pre style={{ marginTop: 10 }}>
                <code>{AGENT_ALGO}</code>
              </pre>
            </div>
          </div>
        </div>

        <div className="footer">
          Tip: Open <a href="/standard">Service Standard</a> for a live spec view of endpoints and JSON responses.
        </div>
      </div>

      <Script src="/js/examples.js" strategy="afterInteractive" />
    </>
  );
}
