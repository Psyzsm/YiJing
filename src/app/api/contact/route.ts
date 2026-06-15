/**
 * ============================================================================
 * SECURE CONTACT VAULT & TRANSMISSION ROUTER
 * ============================================================================
 * @file route.ts
 * @description
 * The master endpoint for the Contact App. It employs a 3 Layer bot filter
 * (Rate Limiting -> Honeypot -> Altcha PoW) before routing the request to either
 * unlock secure links or transmit an SMTP email via Nodemailer.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyAltcha } from '@/lib/altcha';

export const runtime = 'nodejs';
export const revalidate = 0;

// ----------------------------------------------------------------------
// RATE LIMITER
// ----------------------------------------------------------------------
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS = 10; 
const WINDOW_MS = 15 * 60 * 1000; // 15 Minutes

// [MEMORY MANAGEMENT]: Garbage Collector
// If a botnet spams this endpoint with rotating IPs, the Map will grow infinitely 
// and crash the Node.js process (OOM Error). This GC routine clears expired IPs from RAM.
if (process.env.NODE_ENV !== 'development') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of rateLimitMap.entries()) {
      const valid = timestamps.filter(time => now - time < WINDOW_MS);
      if (valid.length === 0) rateLimitMap.delete(ip);
      else rateLimitMap.set(ip, valid);
    }
  }, WINDOW_MS);
}

export async function POST(req: Request) {
  try {
    // Reverse proxies (like Cloudflare/Caddy) overwrite the real IP. 
    // We must read the x-forwarded-for header.
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();

    // LAYER 1: RATE LIMITER
    if (process.env.NODE_ENV !== 'development') {
      const requestLog = rateLimitMap.get(ip) || [];
      const recentRequests = requestLog.filter(time => now - time < WINDOW_MS);
      if (recentRequests.length >= MAX_REQUESTS) {
        return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
      }
      recentRequests.push(now);
      rateLimitMap.set(ip, recentRequests);
    }

    const body = await req.json();
    const { action, name, email, message, altchaPayload, honeypot } = body;

    // LAYER 2: HONEYPOT
    // [SECURITY]: Invisible CSS field. If a dumb bot auto-fills this field, 
    // This will silently return a 200 Success so the bot stops trying, but the payload gets dropped.
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ message: 'Success' }, { status: 200 }); 
    }

    // LAYER 3: CRYPTOGRAPHIC VERIFICATION
    if (!verifyAltcha(altchaPayload)) {
      return NextResponse.json({ error: 'Proof of work verification failed.' }, { status: 401 });
    }

    // ----------------------------------------------------------------------
    // SECURE ROUTER
    // ----------------------------------------------------------------------

    // Action: 'unlock' -> Decrypts and returns personal links
    if (action === 'unlock') {
      return NextResponse.json({ 
        linkedin: process.env.LINKEDIN_URL || 'https://linkedin.com',
        github: process.env.GITHUB_URL || 'https://github.com'
      }, { status: 200 });
    }

    // Action: 'send' -> Dispatches the payload via SMTP
    if (action === 'send') {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, 
        auth: {
          user: process.env.SMTP_USER, 
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Portfolio Vault" <${process.env.SMTP_USER}>`, 
        to: process.env.DESTINATION_EMAIL, 
        replyTo: email, 
        subject: `New Transmission from ${name}`, 
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e4e7e6; border-radius: 8px;">
            <h2 style="color: #111313; border-bottom: 2px solid #fc2403; padding-bottom: 10px;">New Transmission</h2>
            <p style="color: #49504f;"><strong>From:</strong> ${name} (<a href="mailto:${email}" style="color: #3b82f6;">${email}</a>)</p>
            <div style="background-color: #f2f3f3; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #181b1a; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

  } catch (error) {
    console.error('-> API ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}