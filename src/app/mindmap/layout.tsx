/**
 * ============================================================================
 * DIGITAL GARDEN (MINDMAP) ROOT LAYOUT
 * ============================================================================
 * @file layout.tsx
 * @description
 * Defines the React Server Component (RSC) boundary for the Mindmap app.
 * By keeping this separate from the /os layout, it ensures that the heavy 
 * D3.js and Canvas physics engines are only loaded when the user actually 
 * enters the Digital Garden environment.
 * ============================================================================
 */

import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Portfolio OS",
  description: "Mindmap and system architecture logs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* [TYPOGRAPHY]: antialiased ensures smooth font rendering across macOS and Windows */}
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}