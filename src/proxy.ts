/**
 * ============================================================================
 * FRAMEWORK-LEVEL TRAFFIC DIRECTOR (REVERSE PROXY)
 * ============================================================================
 * @file proxy.ts
 * @description
 * Acts as an internal traffic controller before Next.js processes the request.
 * Instead of configuring Nginx/Caddy rules on the VPS to route subdomains,
 * this function reads the incoming 'Host' header and dynamically rewrites the 
 * URL to serve either the /os or /mindmap environments.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { yijingConfig } from '../yijing.config';

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const routingMode = yijingConfig.site.routingMode || 'mindmap-root';

  // [ROUTING ARCHITECTURE]: EXPLICIT BYPASS 1
  // immediately release /api routes so backend serverless functions 
  // (like Altcha and SMTP) execute natively without getting trapped in the rewrite loop.
  if (url.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

// [ROUTING ARCHITECTURE]: EXPLICIT BYPASS 2
  // Allows direct folder access so local testing can still occur 
  // (e.g., localhost:3000/os) without the need to configure local DNS spoofing.
  if (url.pathname.startsWith('/os') || url.pathname.startsWith('/mindmap')) {
    return NextResponse.next();
  }

  // [ROUTING ARCHITECTURE]: LOCALHOST BYPASS
  // If a developer runs this locally (localhost or 127.0.0.1), bypass strict domain routing
  // and default them to the Mindmap. They can use the bypass above to test /os.
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL(`/mindmap`, request.url));
    }
    return NextResponse.next();
  }

  // --- ROUTING MODE: OS ON ROOT ---
  if (routingMode === 'os-root') {
    if (hostname.startsWith('mindmap.')) {
      return NextResponse.rewrite(new URL(`/mindmap${url.pathname}`, request.url));
    }
    // Default: Root domain serves the OS
    return NextResponse.rewrite(new URL(`/os${url.pathname}`, request.url));
  }

  // --- ROUTING MODE: MINDMAP ON ROOT (Default) ---
  // 1. If the user is on the portfolio subdomain, serve the Desktop OS
  if (hostname.startsWith('portfolio.')) {
    return NextResponse.rewrite(new URL(`/os${url.pathname}`, request.url));
  }
  // 2. Otherwise (Root Domain), serve the Mindmap
  return NextResponse.rewrite(new URL(`/mindmap${url.pathname}`, request.url));
}

// [PERFORMANCE]: The matcher ensures this middleware only runs on actual page 
// requests, entirely bypassing static assets (images, CSS, JS bundles) to save CPU cycles.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets).*)',
  ],
};