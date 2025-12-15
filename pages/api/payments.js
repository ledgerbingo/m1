const legacyHandler = require("../../server/legacy-api/payments");

export default async function handler(req, res) {
  return legacyHandler(req, res);
}
