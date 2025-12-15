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
  const FULLNODE_URL = process.env.FULLNODE_URL || "https://full.testnet.movementinfra.xyz/v1";

  const PRICE_AMOUNT = process.env.PRICE_AMOUNT || "1000";
  const USDC_TOKEN = process.env.USDC_TOKEN || "deo::usdc::USDC";

  const DEO_PACKAGE_ADDRESS = process.env.DEO_PACKAGE_ADDRESS || "0xDEO";
  const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || "0xMERCHANT";

  const SERVICE_MODE = (process.env.SERVICE_MODE || "preview").toLowerCase();

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      service: "DEO",
      mode: SERVICE_MODE,
      time: new Date().toISOString(),
      chain: {
        chain_id: CHAIN_ID,
        fullnode_url: FULLNODE_URL,
      },
      commerce: {
        token: USDC_TOKEN,
        amount: String(PRICE_AMOUNT),
        merchant_address: MERCHANT_ADDRESS,
      },
      contracts: {
        deo_package_address: DEO_PACKAGE_ADDRESS,
        pay_function: `${DEO_PACKAGE_ADDRESS}::treasury::pay_merchant`,
      },
      endpoints: {
        status: `${baseUrl}/status`,
        catalog: `${baseUrl}/catalog`,
        weather: `${baseUrl}/weather`,
        verify: `${baseUrl}/verify`,
        receipt: `${baseUrl}/receipt`,
        payments: `${baseUrl}/payments`,
      },
    })
  );
}
