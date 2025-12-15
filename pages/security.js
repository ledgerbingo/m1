import Head from "next/head";

export default function SecurityPage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DEO — Security</title>
        <link rel="stylesheet" href="/site.css" />
      </Head>

      <div className="wrap">
        <div className="nav">
          <a className="brand" href="/">
            <div className="logo" aria-hidden="true"></div>
            <div className="brandTitle">
              <strong>DEO</strong>
              <span>Security</span>
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
            <a className="btn primary" href="/app">
              Open App
            </a>
          </div>
        </div>

        <div className="hero">
          <div className="card">
            <div className="sectionTitle">Security</div>
            <div className="h1">Your keys stay with you.</div>
            <p className="lead">
              DEO is a non-custodial wallet experience. You connect with a wallet extension and sign transactions locally.
              DEO does not store your private keys.
            </p>

            <div className="section" style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div className="pill">Non-custodial</div>
              <div className="pill">On-chain settlement</div>
              <div className="pill">Receipts &amp; auditability</div>
              <div className="pill">Open network</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <img className="heroArt" src="/assets/deo-flow.svg" alt="Flow diagram" />
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">What DEO does (and does not do)</div>
          <div className="grid2">
            <div className="card">
              <div className="k">Does</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                - Help you connect a wallet to send and receive
                <br />
                - Display activity and receipts
                <br />
                - Verify payments and proofs for paid services
              </div>
            </div>

            <div className="card">
              <div className="k">Does not</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                - Hold your funds
                <br />
                - Store your private keys
                <br />
                - Reverse transactions on your behalf
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Best practices</div>
          <div className="grid3">
            <div className="card">
              <div className="k">Verify addresses</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Always double-check recipient addresses before sending.
              </div>
            </div>
            <div className="card">
              <div className="k">Use official wallets</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Install reputable wallet extensions and keep them updated.
              </div>
            </div>
            <div className="card">
              <div className="k">Keep backups</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Store recovery phrases offline. Never share them.
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          Questions? Visit <a href="/support">Support</a>.
        </div>
      </div>
    </>
  );
}
