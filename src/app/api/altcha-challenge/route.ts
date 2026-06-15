/**
 * ============================================================================
 * ALTCHA PROOF-OF-WORK GENERATOR
 * ============================================================================
 * @file route.ts
 * @description
 * Generates cryptographic challenges for the client to solve. Using Altcha 
 * instead of Google reCAPTCHA to maintain a strict zero tracking, privacy first 
 * infrastructure. Bots fail because they cannot compute the SHA-256 hash fast 
 * enough without burning compute resources.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

// [ENGINEERING NOTE]: This route is fully dynamic. If Next.js caches 
// this response, every visitor gets the same challenge, thus defeating the purpose of the PoW.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0; 

/**
 * Handles the GET request to generate a new cryptographic challenge.
 * @returns {NextResponse} JSON containing { algorithm, challenge, salt, signature, maxnumber }
 */
export async function GET(req: Request) {
  console.log("=== [1/2] ALTCHA CHALLENGE GENERATION STARTED ===", req.url);
  try {
    const hmacKey = process.env.ALTCHA_HMAC_KEY || 'default_dev_key';
    const salt = crypto.randomBytes(16).toString('hex');
    
    // [DIFFICULTY TUNING]: maxnumber determines how many iterations the client 
    // might have to guess. 50,000 takes a modern browser ~100-300ms to solve.
    const maxnumber = 50000;
    const secretNum = Math.floor(Math.random() * maxnumber);

    // 1. Generate the hash the client needs to match
    const challenge = crypto.createHash('sha256').update(salt + String(secretNum)).digest('hex');
    
    // 2. Sign the challenge with our private HMAC key.
    // [SECURITY]: Prevents malicious clients from generating their own 
    // easy challenges and submitting them to the verification endpoint.
    const signature = crypto.createHmac('sha256', hmacKey).update(challenge).digest('hex');

    const responseData = { algorithm: 'SHA-256', challenge, salt, signature, maxnumber };
    
    console.log("-> Target Secret Number:", secretNum);
    console.log("-> Generated Challenge Hash:", challenge);
    console.log("=== GENERATION SUCCESSFUL ===\n");
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  } catch (error) {
    console.error('-> GENERATION ERROR:', error);
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
  }
}