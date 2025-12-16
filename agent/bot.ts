import {
  AptosAccount as MovementAccount,
  AptosClient as MovementClient,
  HexString,
  TxnBuilderTypes,
  BCS,
} from "movement-sdk";

const API_URL = process.env.API_URL || "http://localhost:3000/weather";
const FULLNODE_URL = process.env.FULLNODE_URL || "http://127.0.0.1:8080/v1";

const SERVICE_MODE = (process.env.SERVICE_MODE || "preview").toLowerCase();

const PRIVATE_KEY_HEX = process.env.AGENT_PRIVATE_KEY;
if (SERVICE_MODE !== "preview" && !PRIVATE_KEY_HEX) {
  throw new Error("Missing AGENT_PRIVATE_KEY (hex string, 64 bytes) in env");
}

const DEO_PACKAGE_ADDRESS = process.env.DEO_PACKAGE_ADDRESS || "0xDEO";
const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || "0xMERCHANT";

function parseX402Authenticate(header: string) {
  // Example: x402 chain_id="movement_testnet" token="..." amount="1000" facilitator="http://..."
  const params: Record<string, string> = {};
  const re = /(\w+)="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(header)) !== null) {
    params[m[1]] = m[2];
  }
  return params;
}

async function fetchWeather(proof?: string) {
  const headers: Record<string, string> = {};
  if (proof) {
    headers["X-Payment-Proof"] = proof;
    headers["Authorization"] = `x402 ${proof}`;
  }

  const res = await fetch(API_URL, { headers });
  return res;
}

async function submitPayMerchantTx(
  client: MovementClient,
  account: MovementAccount,
  merchant: string,
  amount: string
) {
  const entryFunction = new TxnBuilderTypes.EntryFunction(
    TxnBuilderTypes.ModuleId.fromStr(`${DEO_PACKAGE_ADDRESS}::treasury`),
    new TxnBuilderTypes.Identifier("pay_merchant"),
    [],
    [
      BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(merchant)),
      BCS.bcsSerializeUint64(BigInt(amount)),
    ]
  );

  const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(entryFunction);
  const rawTxn = await client.generateRawTransaction(account.address(), payload, {
    maxGasAmount: 2000n,
    gasUnitPrice: 100n,
  });

  const bcsTxn = MovementClient.generateBCSTransaction(account, rawTxn);
  const pending = await client.submitSignedBCSTransaction(bcsTxn);
  return pending.hash as string;
}

async function main() {
  const client = new MovementClient(FULLNODE_URL);
  const account = PRIVATE_KEY_HEX
    ? new MovementAccount(new HexString(PRIVATE_KEY_HEX).toUint8Array())
    : null;

  if (account) {
    console.log(`Agent address: ${account.address().hex()}`);
  }

  const first = await fetchWeather();
  if (first.status !== 402) {
    const body = await first.text();
    console.log(`Unexpected status ${first.status}: ${body}`);
    return;
  }

  const auth = first.headers.get("www-authenticate") || "";
  console.log(`Got 402 with WWW-Authenticate: ${auth}`);

  const params = parseX402Authenticate(auth);
  const amount = params["amount"];
  if (!amount) throw new Error("x402 header missing amount");

  const facilitator = params["facilitator"];

  let proof: string;
  if (SERVICE_MODE === "preview") {
    proof = `proof_${Date.now()}`;
    if (facilitator) {
      await fetch(facilitator, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: proof }),
      }).catch(() => undefined);
    }
  } else {
    if (!account) throw new Error("AGENT_PRIVATE_KEY required for chain mode");
    console.log(
      `Paying merchant=${MERCHANT_ADDRESS} amount=${amount} via ${DEO_PACKAGE_ADDRESS}::treasury::pay_merchant`
    );
    proof = await submitPayMerchantTx(client, account, MERCHANT_ADDRESS, amount);
    console.log(`Submitted tx: ${proof}`);
  }

  const retry = await fetchWeather(proof);
  const json = await retry.json().catch(async () => ({ raw: await retry.text() }));
  console.log(`Retry status=${retry.status}`);
  console.log(JSON.stringify(json, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
