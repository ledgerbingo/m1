const legacyHandler = require("../../server/legacy-api/weather");

export default async function handler(req, res) {
  return legacyHandler(req, res);
}
