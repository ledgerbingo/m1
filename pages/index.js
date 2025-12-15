import Head from "next/head";

export default function HomePage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DEO — Everyday Wallet on Movement</title>
        <link rel="stylesheet" href="/site.css" />
      </Head>

      <div className="wrap">
        <div className="nav">
          <a className="brand" href="/">
            <div className="logo" aria-hidden="true"></div>
            <div className="brandTitle">
              <strong>DEO</strong>
              <span>Everyday wallet</span>
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
            <div className="sectionTitle">DEO</div>
            <div className="h1">A modern wallet for everyday payments.</div>
            <p className="lead">
              Send and receive with Web2 simplicity. You keep your keys. Movement L1 handles settlement and receipts
              under the hood.
            </p>

            <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn primary" href="/app">
                Open wallet
              </a>
              <a className="btn" href="/security">
                How security works
              </a>
            </div>

            <div
              className="section"
              style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              <div className="pill">Non-custodial</div>
              <div className="pill">Send &amp; receive</div>
              <div className="pill">Activity &amp; receipts</div>
              <div className="pill">Built on Movement</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <img
              className="heroArt"
              src="/assets/deo-hero.svg"
              alt="DEO illustration"
            />
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">What you can do</div>
          <div className="grid3">
            <div className="card">
              <div className="k">Send</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Transfer MOVE to any address in seconds using your own wallet.
              </div>
            </div>
            <div className="card">
              <div className="k">Receive</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Share your address to receive payments. No account sign-up.
              </div>
            </div>
            <div className="card">
              <div className="k">Track activity</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                See transfers and on-chain details in a friendly activity feed.
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Designed for trust</div>
          <div className="grid3">
            <div className="card">
              <div className="k">Non-custodial</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Your private keys stay in your wallet. DEO never takes custody of funds.
              </div>
            </div>
            <div className="card">
              <div className="k">On-chain receipts</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Transactions settle on Movement L1. Activity is verifiable and auditable.
              </div>
            </div>
            <div className="card">
              <div className="k">Simple by default</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Web3 complexity is kept out of the way, with transparency available when you need it.
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Get started</div>
          <div className="grid2">
            <div className="card">
              <div className="k">Open the wallet</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Connect a wallet extension and start sending or receiving immediately.
              </div>
              <div className="section">
                <a className="btn primary" href="/app">
                  Go to /app
                </a>
              </div>
            </div>
            <div className="card">
              <div className="k">Learn the basics</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Read about non-custodial safety and common wallet best practices.
              </div>
              <div className="section">
                <a className="btn" href="/security">
                  Security
                </a>
                <a className="btn" href="/support">
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">For developers</div>
          <div className="card">
            <div className="k">Integrate DEO into products and services</div>
            <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
              Developer documentation and the protocol playground live under <span className="k">/developers</span>.
            </div>
            <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn primary" href="/developers">
                Open developer docs
              </a>
              <a className="btn" href="/developers/examples#playground">
                Playground
              </a>
            </div>
          </div>
        </div>

        <div className="footer">
          DEO is non-custodial. Always verify addresses before sending. Transactions are final once submitted on-chain.
        </div>
      </div>
    </>
  );
}
