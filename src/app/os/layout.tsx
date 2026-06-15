/**
 * ============================================================================
 * OS DESKTOP ROOT LAYOUT
 * ============================================================================
 * @file layout.tsx
 * @description
 * Defines the React Server Component (RSC) boundary for the OS environment.
 * Imports the global site configuration to inject SEO and OpenGraph metadata
 * dynamically before handing off the rendering pipeline to the Client component.
 * ============================================================================
 */

import type { Metadata } from "next";
import "@/app/globals.css";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    ...siteConfig.openGraph,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}