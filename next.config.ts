/**
 * ============================================================================
 * NEXT.JS COMPILER & DOCKER CONFIGURATION
 * ============================================================================
 * @file next.config.ts
 * @description
 * Standard framework configuration with specific optimizations for deploying 
 * inside an isolated Docker container on an Oracle VPS.
 * ============================================================================
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // [DOCKER PIPELINE]: 'standalone' mode automatically traces imports and bundles 
  // ONLY the necessary files required for production into a single micro-folder. 
  // This drastically reduces the Docker image size and cold-start times.
  output: "standalone",
  
  // [CORS / DEV]: Allows custom local testing domains (configured via 
  // /etc/hosts) to connect to the Next.js dev server without triggering security blocks.
  allowedDevOrigins: [
    'portfolio.website.local',
    'website.local'
  ],
};

export default nextConfig;