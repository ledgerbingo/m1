const legacyHandler = require("../../api/verify");

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  return legacyHandler(req, res);
}
