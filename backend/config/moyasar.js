const axios = require("axios");

const MOYASAR_API_URL = "https://api.moyasar.com/v1/payments";

function getMoyasarAuthHeader() {
  const secretKey = process.env.MOYASAR_SECRET_KEY;

  if (!secretKey) {
    throw new Error("MOYASAR_SECRET_KEY is missing");
  }

  const token = Buffer.from(`${secretKey}:`).toString("base64");

  return {
    Authorization: `Basic ${token}`
  };
}

module.exports = {
  axios,
  MOYASAR_API_URL,
  getMoyasarAuthHeader
};