import Head from "next/head";

export default function DevelopersHomePage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DEO — Developers</title>
        <link rel="stylesheet" href="/site.css" />
      </Head>

      <div className="wrap">
        <div className="nav">
          <a className="brand" href="/developers">
            <div className="logo" aria-hidden="true"></div>
            <div className="brandTitle">
              <strong>DEO</strong>
              <span>Developers</span>
            </div>
          </a>
          <div className="navLinks">
            <a className="pill" href="/">
              Home
            </a>
            <a className="pill" href="/app">
              App
            </a>
            <a className="pill" href="/developers/standard">
              Standard
            </a>
            <a className="pill" href="/developers/examples">
              Examples
            </a>
            <a className="pill" href="/status">
              Status
            </a>
            <a className="btn primary" href="/developers/examples#playground">
              Open Playground
            </a>
          </div>
        </div>

        <div className="hero">
          <div className="card">
            <div className="sectionTitle">Build with DEO</div>
            <div className="h1">A simple payments handshake for HTTP.</div>
            <p className="lead">
              DEO exposes a small set of endpoints for discovery, proof verification, receipts, and history.
            </p>

            <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn primary" href="/developers/standard">
                Read the standard
              </a>
              <a className="btn" href="/developers/examples#playground">
                Try the flow
              </a>
            </div>

            <div className="section" style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div className="pill">HTTP 402 challenge</div>
              <div className="pill">Movement settlement</div>
              <div className="pill">Fast or final verify</div>
              <div className="pill">Receipts + history</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <img className="heroArt" src="/assets/deo-endpoints.svg" alt="DEO standard endpoints diagram" />
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Quick links</div>
          <div className="grid3">
            <div className="card">
              <div className="k">Service Standard</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Endpoint specs, handshake details, and live examples.
              </div>
              <div className="section">
                <a className="btn primary" href="/developers/standard">
                  Open Standard
                </a>
              </div>
            </div>

            <div className="card">
              <div className="k">Examples</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Interactive playground to run the request → 402 → proof → retry flow.
              </div>
              <div className="section">
                <a className="btn primary" href="/developers/examples#playground">
                  Open Playground
                </a>
              </div>
            </div>

            <div className="card">
              <div className="k">Consumer app</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                A Web2-style non-custodial wallet experience built on Movement.
              </div>
              <div className="section">
                <a className="btn" href="/app">
                  Open App
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          Developer routes live under <span className="k">/developers</span>.
        </div>
      </div>
    </>
  );
}
