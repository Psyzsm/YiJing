/**
 * ============================================================================
 * ALTCHA CRYPTOGRAPHIC VERIFIER
 * ============================================================================
 * @file altcha.ts
 * @description
 * Validates the Proof-of-Work (PoW) payload submitted by the client. 
 * This ensures the client actually spent computational cycles solving the 
 * SHA-256 challenge, effectively blocking automated botnets from bypassing 
 * the Contact Vault.
 * ============================================================================
 */

import crypto from 'crypto';

/**
 * Parses and verifies an Altcha payload string.
 * @param {string | undefined} altchaPayload - The raw, Base64-encoded JSON payload from the client.
 * @returns {boolean} True if the cryptographic signature and PoW hash are valid.
 */
export function verifyAltcha(altchaPayload: string | undefined): boolean {
  if (!altchaPayload) return false;

  try {
    const hmacKey = process.env.ALTCHA_HMAC_KEY || 'default_dev_key';
    
    // [DATA PARSING]: The payload is sent as a Base64 string. We must decode 
    // it back into a readable JSON object to access the signature and challenge.
    const base64Str = String(altchaPayload).replace(/-/g, '+').replace(/_/g, '/');
    const payloadStr = Buffer.from(base64Str, 'base64').toString('utf8');
    const payload = JSON.parse(payloadStr);

    // [SECURITY - LAYER 1]: Signature Check
    // We re-sign the challenge using our private HMAC key. If it doesn't match 
    // the signature in the payload, the client tampered with the challenge 
    // (e.g., trying to submit an artificially easy puzzle).
    const expectedSignature = crypto.createHmac('sha256', hmacKey).update(payload.challenge).digest('hex');
    if (payload.signature !== expectedSignature) return false;

    // [SECURITY - LAYER 2]: Proof of Work Math Check
    // We verify that the salt combined with the client's submitted 'number' 
    // actually hashes into the required challenge string.
    const expectedChallenge = crypto.createHash('sha256').update(payload.salt + String(payload.number)).digest('hex');
    if (payload.challenge !== expectedChallenge) return false;

    return true; // Vault Unlocked!
  } catch (error) {
    console.error("-> ALTCHA VERIFICATION ERROR:", error);
    return false;
  }
}