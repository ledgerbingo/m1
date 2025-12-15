function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function setCors(req, res) {
  const origin = process.env.CORS_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
}

function build402Header({ chainId, token, amount, facilitator }) {
  return `x402 chain_id="${chainId}" token="${token}" amount="${amount}" facilitator="${facilitator}"`;
}

export default async function handler(req, res) {
  setCors(req, res);
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET,OPTIONS");
    res.end("Method Not Allowed");
    return;
  }

  const baseUrl = getBaseUrl(req);

  const CHAIN_ID = process.env.CHAIN_ID || "movement_testnet";
  const PRICE_AMOUNT = process.env.PRICE_AMOUNT || "1000";
  const USDC_TOKEN = process.env.USDC_TOKEN || "deo::usdc::USDC";

  const SERVICE_MODE = (process.env.SERVICE_MODE || "preview").toLowerCase();

  const facilitator = `${baseUrl}/verify`;
  const challenge = build402Header({
    chainId: CHAIN_ID,
    token: USDC_TOKEN,
    amount: PRICE_AMOUNT,
    facilitator,
  });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      service: "DEO",
      mode: SERVICE_MODE,
      products: [
        {
          id: "weather.premium",
          name: "Premium Weather Feed",
          method: "GET",
          path: "/weather",
          price: { amount: String(PRICE_AMOUNT), token: USDC_TOKEN },
        },
      ],
      challenge_header: challenge,
      examples: {
        request: `curl -i ${baseUrl}/weather`,
        authorized_request: `curl -i ${baseUrl}/weather -H "X-Payment-Proof: <proof>"`,
      },
    })
  );
}
