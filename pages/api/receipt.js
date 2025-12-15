const legacyHandler = require("../../api/receipt");

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  return legacyHandler(req, res);
}
