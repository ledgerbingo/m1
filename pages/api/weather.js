const legacyHandler = require("../../api/weather");

export default async function handler(req, res) {
  return legacyHandler(req, res);
}
