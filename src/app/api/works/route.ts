/**
 * ============================================================================
 * ARCHITECTURE LOGS PROXY (GHOST CMS)
 * ============================================================================
 * @file route.ts
 * @description
 * Acts as a secure proxy to fetch blog posts from the Ghost CMS backend.
 * By running this through a Next.js API route instead of the client, it ensures:
 * 1. The Ghost Content API Key is never exposed to the browser.
 * 2. Bypass strict CORS policies.
 * 3. Leverage Next.js server-side caching.
 * ============================================================================
 */

import { NextResponse } from 'next/server';

// [PERFORMANCE]: Incremental Static Regeneration (ISR)
// Next.js will cache the results of this API call for 3600 seconds (1 hour).
// When users open the "Works" app, it loads instantly from the cache without 
// having to wait for the Ghost database to query every single time.
export const revalidate = 3600; 

/**
 * Handles the GET request to fetch Ghost CMS Posts.
 * @returns {NextResponse} JSON containing an array of Ghost Post objects.
 */
export async function GET() {
  try {
    const ghostUrl = process.env.GHOST_API_URL;
    const ghostKey = process.env.GHOST_CONTENT_API_KEY;

    if (!ghostUrl || !ghostKey) {
      throw new Error('Ghost API credentials missing in .env.local');
    }

    // [DATA PIPELINE]: Explicitly append `include=tags` to the URL payload. 
    // This allows the frontend "Works" App to display categorization badges 
    // under each post title. 
    const fetchUrl = `${ghostUrl}/ghost/api/content/posts/?key=${ghostKey}&include=tags&fields=id,title,url,feature_image,custom_excerpt&limit=all`;
      
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Ghost API returned ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({ posts: data.posts }, { status: 200 });

  } catch (error) {
    console.error('-> GHOST API ERROR:', error);
    return NextResponse.json({ error: 'Failed to load architecture logs.' }, { status: 500 });
  }
}