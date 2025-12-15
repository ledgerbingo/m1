import Head from "next/head";

export default function SupportPage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DEO — Support</title>
        <link rel="stylesheet" href="/site.css" />
      </Head>

      <div className="wrap">
        <div className="nav">
          <a className="brand" href="/">
            <div className="logo" aria-hidden="true"></div>
            <div className="brandTitle">
              <strong>DEO</strong>
              <span>Support</span>
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
            <div className="sectionTitle">Support</div>
            <div className="h1">Help when you need it.</div>
            <p className="lead">
              DEO is non-custodial. You control your wallet, and transactions are final once submitted on-chain.
            </p>

            <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn primary" href="#faq">
                FAQ
              </a>
              <a className="btn" href="/security">
                Security basics
              </a>
              <a className="btn" href="/developers">
                Developer docs
              </a>
            </div>
          </div>

          <div className="card">
            <div className="sectionTitle">Contact</div>
            <div className="muted" style={{ lineHeight: 1.7 }}>
              If you’re integrating DEO into a product or need help debugging an endpoint, use the developer pages.
              <br />
              <br />
              For consumer support, add your preferred contact method here (email, chat, or helpdesk).
            </div>
          </div>
        </div>

        <div id="faq" className="section">
          <div className="sectionTitle">FAQ</div>
          <div className="grid2">
            <div className="card">
              <div className="k">I sent to the wrong address. Can you reverse it?</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                No. On-chain transfers are irreversible. Always verify addresses before sending.
              </div>
            </div>
            <div className="card">
              <div className="k">Why is my balance not showing?</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Make sure your wallet is connected and you are on the correct network. If the network is unavailable,
                balances and activity may temporarily fail to load.
              </div>
            </div>
            <div className="card">
              <div className="k">What wallet should I use?</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Use a reputable Movement/Aptos wallet extension. Keep it updated and never share recovery phrases.
              </div>
            </div>
            <div className="card">
              <div className="k">Where can I see receipts?</div>
              <div className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
                Receipts and history appear in the App activity feed. Developers can also use the /receipt endpoint.
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          Need developer endpoints? Visit <a href="/developers">/developers</a>.
        </div>
      </div>
    </>
  );
}
