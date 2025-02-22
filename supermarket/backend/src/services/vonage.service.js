const { Vonage } = require('@vonage/server-sdk');
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.VONAGE_API_KEY;
const apiSecret = process.env.VONAGE_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error('Vonage API credentials are missing');
  process.exit(1);
}

const vonage = new Vonage({
  apiKey,
  apiSecret
}, {
  timeout: 10000 // 10 seconds timeout
});

/**
 * Sends a verification SMS to the provided phone number
 * @param {string} phoneNumber - The phone number to send the verification SMS to
 * @returns {Promise<string>} The request ID for the verification
 * @throws {Error} If the SMS sending fails
 */
exports.sendVerificationSMS = async (phoneNumber) => {
  try {
    const response = await vonage.verify.start({
      number: phoneNumber,
      brand: process.env.VONAGE_BRAND_NAME || 'LemonCart'
    });

    if (!response.request_id) {
      throw new Error('No request ID received from Vonage');
    }

    return response.request_id;
  } catch (error) {
    console.error('Vonage SMS error:', error);
    throw new Error('Failed to send verification SMS');
  }
};

/**
 * Checks if the provided verification code is valid
 * @param {string} requestId - The request ID from the verification SMS
 * @param {string} code - The verification code to check
 * @returns {Promise<boolean>} Whether the code is valid
 * @throws {Error} If the verification check fails
 */
exports.checkVerificationCode = async (requestId, code) => {
  try {
    const response = await vonage.verify.check(requestId, code);
    return response.status === '0';
  } catch (error) {
    console.error('Vonage verification error:', error);
    throw new Error('Failed to verify code');
  }
};