import Head from "next/head";
import Script from "next/script";

const CLIENT_ALGO = `1. Fetch catalog and select a product.
2. Call the premium endpoint.
3. If response is 402:
   - parse WWW-Authenticate (x402)
   - submit the required on-chain payment
   - obtain the tx hash as proof
4. Optionally call /verify to check fast/final acceptance.
5. Retry the premium endpoint with X-Payment-Proof.
6. Fetch /receipt for a normalized audit record.
7. Use /payments for history.`;

const SERVER_ALGO = `Premium endpoint:
- If no proof:
  - respond 402 + WWW-Authenticate: x402 ...
- If proof present:
  - validate the proof (fast or final)
  - respond 200 with the premium payload`;

const IMAGE_PROMPTS = `1) "Bright fintech landing page hero illustration of an autonomous AI agent negotiating a paid API request, minimal gradient background, glassmorphism, clean vector style, high resolution"

2) "Diagram-like illustration showing HTTP 402 challenge, blockchain settlement proof, and receipt generation, white background, soft gradients, modern enterprise SaaS style"

3) "Abstract depiction of Movement blockchain finality with fast and final settlement layers, purple and cyan gradients, clean geometric shapes"

4) "Three-panel use-case illustration: paid data API, paid inference, paid automation tools, coherent brand palette, minimal vector icons"`;

export default function StandardPage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DEO — Service Standard</title>
        <link rel="stylesheet" href="/site.css" />
      </Head>

      <div className="wrap">
        <div className="nav">
          <a className="brand" href="/">
            <div className="logo" aria-hidden="true"></div>
            <div className="brandTitle">
              <strong>DEO</strong>
              <span>Service standard</span>
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
            <a className="btn primary" href="/examples#playground">
              Open Playground
            </a>
          </div>
        </div>

        <div className="hero">
          <div className="card">
            <div className="sectionTitle">Service Standard</div>
            <div className="h1">A minimal, reusable payment handshake for HTTP.</div>
            <p className="lead">
              DEO defines a small set of endpoints that let any client discover pricing, receive an HTTP 402 challenge,
              produce an on-chain proof, and retry the original request with a verifiable authorization. The goal is a
              consistent integration surface that works for agents and traditional SDKs.
            </p>

            <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn primary" href="#endpoints">
                Standard endpoints
              </a>
              <a className="btn" href="#handshake">
                402 handshake
              </a>
              <a className="btn" href="#live">
                Live service output
              </a>
            </div>

            <div className="section" style={{ marginTop: 10 }}>
              <div className="pill">Discoverable pricing</div>
              <div className="pill">Proof-based access</div>
              <div className="pill">Fast or final settlement</div>
              <div className="pill">Receipts and audit history</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <img className="heroArt" src="/assets/deo-endpoints.svg" alt="DEO standard endpoints diagram" />
          </div>
        </div>

        <div id="endpoints" className="section">
          <div className="sectionTitle">Standard endpoints</div>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Purpose</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="k">GET /status</span>
                  </td>
                  <td>Service configuration snapshot (chain, pricing, contract addresses).</td>
                  <td>Useful for diagnostics and client bootstrapping.</td>
                </tr>
                <tr>
                  <td>
                    <span className="k">GET /catalog</span>
                  </td>
                  <td>Product discovery (price and access policy).</td>
                  <td>
                    Returns an <span className="k">x402</span> challenge header template and request examples.
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="k">GET/POST /verify</span>
                  </td>
                  <td>Proof verifier (tx hash → accept/reject).</td>
                  <td>
                    Responds with <span className="k">fast</span> for pending transactions, <span className="k">final</span> for
                    finalized ones.
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="k">GET/POST /receipt</span>
                  </td>
                  <td>Returns a normalized receipt object for a proof.</td>
                  <td>Receipts are designed for auditing, analytics, and support workflows.</td>
                </tr>
                <tr>
                  <td>
                    <span className="k">GET /payments</span>
                  </td>
                  <td>Payment history.</td>
                  <td>In chain mode, reads on-chain events. In preview mode, returns representative history.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div id="handshake" className="section">
          <div className="sectionTitle">HTTP 402 handshake</div>
          <div className="grid2">
            <div className="card">
              <div className="sectionTitle">The challenge</div>
              <p className="lead">
                A premium endpoint answers unauthenticated requests with <span className="k">402 Payment Required</span> plus{" "}
                <span className="k">WWW-Authenticate</span> describing the payment requirements and the facilitator used for
                verification.
              </p>
              <hr />
              <div className="k">Example challenge header</div>
              <pre style={{ marginTop: 10 }}>
                <code id="challengeOut">(loading...)</code>
              </pre>
              <div className="muted" style={{ marginTop: 10 }}>
                Clients can attach proofs via <span className="k">X-Payment-Proof</span> or{" "}
                <span className="k">Authorization: x402 &lt;proof&gt;</span>.
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <img className="heroArt" src="/assets/deo-flow.svg" alt="402 challenge to proof to unlock flow" />
            </div>
          </div>
        </div>

        <div className="section">
          <div className="grid2">
            <div className="card">
              <div className="sectionTitle">Client algorithm (recommended)</div>
              <pre>
                <code>{CLIENT_ALGO}</code>
              </pre>
            </div>

            <div className="card">
              <div className="sectionTitle">Server algorithm (recommended)</div>
              <pre>
                <code>{SERVER_ALGO}</code>
              </pre>
              <div className="muted" style={{ marginTop: 10 }}>
                DEO keeps the verification policy centralized so every premium endpoint can share one trust rule.
              </div>
            </div>
          </div>
        </div>

        <div id="live" className="section">
          <div className="sectionTitle">Live service output</div>
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
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Image prompts (optional)</div>
          <div className="card">
            <div className="muted" style={{ lineHeight: 1.7 }}>
              If you want additional marketing visuals beyond the included SVG diagrams, these prompts are designed to work
              well with modern image generation models.
            </div>
            <hr />
            <pre>
              <code>{IMAGE_PROMPTS}</code>
            </pre>
          </div>
        </div>

        <div className="footer">
          DEO is designed to be composable: the standard endpoints are small, and the premium endpoints remain fully custom.
        </div>
      </div>

      <Script src="/js/standard.js" strategy="afterInteractive" />
    </>
  );
}
