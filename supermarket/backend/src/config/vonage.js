const { Vonage } = require('@vonage/server-sdk');
const { Verify } = require('@vonage/verify');

const credentials = {
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
};

const vonage = new Vonage(credentials);
const verify = vonage.verify;

module.exports = verify;