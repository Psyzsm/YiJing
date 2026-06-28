/**
 * ============================================================================
 * YÌJÌNG TEMPLATE: MASTER CONFIGURATION (EXAMPLE)
 * ============================================================================
 * @file yijing.config.example.ts
 * @description
 * This is the template configuration file. 
 * RENAME THIS FILE TO `yijing.config.ts` before running or deploying.
 * * Fill in the fields below to customize the entire OS and Mind Map. The 
 * underlying engine will automatically generate the UI based on the inputted data.
 * ============================================================================
 */

export const yijingConfig = {
  // ----------------------------------------------------------------------
  // 1. GLOBAL SITE METADATA
  // ----------------------------------------------------------------------
  site: {
    title: "Your Name | Portfolio", // Defines the browser tab title
    description: "A brief description of who you are and what you do for SEO.", // Meta description
    url: "https://yourdomain.com/", // Your actual production URL
    theme: "ink-wash", // The default active theme
    // Determines what loads on the root domain ("/") vs sub-routes
    // Options: "mindmap-root" (Default) | "os-root"
    routingMode: "mindmap-root"
  },

  // ----------------------------------------------------------------------
  // 2. DESKTOP APPLICATIONS (OS ENVIRONMENT)
  // ----------------------------------------------------------------------
  os: {
    // [CUSTOM APPS]: Build your own windows! 
    // Create as many apps as you want. The engine will auto-generate the UI for you.
    // Types available: "text" | "list" | "iframe" | "link"
    customApps: [
      {
        id: "about",
        type: "text",
        title: "About Me",
        icon: "User", // Finds the exact SVG from Lucide React: https://lucide.dev/icons/
        header: "Hello, world!",
        content: [
          "Write your first paragraph here. The engine will automatically wrap this in the correct Tailwind CSS typography classes.",
          "Write your second paragraph here. You can add as many strings to this array as you need to tell your story."
        ]
      },
      {
        id: "skills",
        type: "list",
        title: "Skills",
        icon: "Cpu",
        categories: [
          { 
            name: "Frontend", 
            items: ['React', 'Next.js', 'Tailwind CSS'] 
          },
          { 
            name: "Backend & Infrastructure", 
            items: ['Node.js', 'Python', 'Docker', 'Linux'] 
          }
        ]
      },
      // Example of how to embed external media (Spotify, YouTube, Maps)
      {
        id: "beats",
        type: "iframe",
        title: "Playlist",
        icon: "Music",
        url: "https://open.spotify.com/embed/playlist/YOUR_PLAYLIST_ID" // Must be an embed-friendly URL
      },
      // Example of a static CTA link (perfect for source code or resume links)
      {
        id: "source",
        type: "link",
        title: "Source Code",
        icon: "github",
        header: "Yìjìng OS",
        content: "This digital environment is built on the open-source Yìjìng template. If you would like to deploy your own instance of this desktop portfolio, the source code and documentation are freely available.",
        buttonText: "VIEW REPOSITORY",
        url: "https://github.com/Psyzsm/Yijing"
      }
    ],

    // [SYSTEM APPS]: Complex pre-built apps with backend APIs.
    // Set to 'true' to enable them, 'false' to hide them from the OS completely.
    systemApps: {
      enableWorks: true,    // Requires Ghost CMS environment variables in .env.local
      enableContact: true,  // Requires Altcha and SMTP environment variables in .env.local
      enableMindmap: true   // Toggles the Mind Map launcher app on the desktop
    }
  },

  // ----------------------------------------------------------------------
  // 3. DIGITAL GARDEN (PHYSICS MIND MAP)
  // ----------------------------------------------------------------------
  mindmap: {
    enabled: true, // If false, the OS desktop loads directly instead of the map
    
    // [UI DEFAULTS]
    // defaultStyle: "ink" | "geometric"
    // defaultPhysics: "locked" | "unlocked"
    defaultStyle: "ink",
    defaultPhysics: "locked",

    // The center node of the digital garden
    rootNode: { id: "root", name: "Your Name" },
    
    // Level 1: Main branches (e.g., OS, Blog, Socials)
    projects: [
      { id: "os", name: "Portfolio OS", url: "/os" },
      { id: "github", name: "GitHub", url: "https://github.com/yourusername" }
    ],
    
    // Level 2: Tools or sub-projects (Must link back to a project via 'parent')
    tools: [
      { id: "react", name: "React", parent: "os" },
      { id: "nextjs", name: "Next.js", parent: "os", url: "https://nextjs.org" }
    ],
    
    // Level 3: Deeper concepts (Must link back to a tool via 'parent')
    concepts: [
      { id: "frontend", name: "Frontend", parent: "react" },
      { id: "ssr", name: "Server-Side Rendering", parent: "nextjs" }
    ],
    
    // Custom Links: Draw physics tethers between any two nodes that aren't strict parent/child
    customLinks: [
      { source: "react", target: "nextjs" }
    ]
  }
};