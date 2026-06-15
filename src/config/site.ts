/**
 * ============================================================================
 * GLOBAL SITE CONFIGURATION & THEME ENGINE
 * ============================================================================
 * @file site.ts
 * @description
 * Centralized source of truth for SEO metadata and strict Tailwind UI constraints.
 * Keeping these hardcoded values out of the React components ensures design 
 * consistency and allows for easy global updates.
 * ============================================================================
 */

import { yijingConfig } from "../../yijing.config"; 

export const siteConfig = {
  title: yijingConfig.site.title,
  description: yijingConfig.site.description,
  // [SEO]: OpenGraph data ensures rich previews when the portfolio is shared 
  // on LinkedIn, X/Twitter, Discord, or iMessage.
openGraph: {
    title: yijingConfig.site.title,
    description: yijingConfig.site.description,
    url: yijingConfig.site.url,
    siteName: yijingConfig.site.title,
  }
};

// [DESIGN SYSTEM]: Standardized Tailwind measurements for the OS UI.
export const THEME = {
  desktop: {
    appContainer: "w-20",      
    appButton: "w-16 h-16",    
    appIcon: "w-7 h-7",        
    appText: "text-[12px]",    
    gridGap: "gap-4",          
  },
  taskbar: {
    height: "h-11",            
    appIcon: "w-4 h-4",        
    sysIcon: "w-4 h-4",        
  },
  window: {
    titlebarIcon: "w-4 h-4",   
    controlIcon: "w-3.5 h-3.5" 
  }
};