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

export const siteConfig = {
  title: "{{ AUTHOR_NAME }} | {{ SITE_TAGLINE }}",
  description: "Portfolio of a {{ ROLE_OR_MAJOR }} specializing in {{ FOCUS_AREA_1 }}, {{ FOCUS_AREA_2 }}, and {{ FOCUS_AREA_3 }}.",
  
  // [SEO]: OpenGraph data ensures rich previews when the portfolio is shared 
  // on LinkedIn, X/Twitter, Discord, or iMessage.
  openGraph: {
    title: "{{ AUTHOR_NAME }} | {{ OG_TITLE_SUFFIX }}",
    description: "Interactive portfolio detailing my {{ FOCUS_AREA_1 }}, {{ FOCUS_AREA_2 }}, and {{ FOCUS_AREA_3 }} builds.",
    url: "https://{{ YOUR_DOMAIN }}/",
    siteName: "{{ AUTHOR_NAME }} Portfolio",
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