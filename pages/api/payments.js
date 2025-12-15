const legacyHandler = require("../../api/payments");

export default async function handler(req, res) {
  return legacyHandler(req, res);
}
