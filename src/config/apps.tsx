/**
 * ============================================================================
 * OS APP INJECTION FACTORY
 * ============================================================================
 * @file apps.tsx
 * @description
 * This file acts as the translation layer between the user's static configuration
 * (yijing.config.ts) and the React rendering engine. It dynamically compiles 
 * raw strings and arrays into renderable JSX components.
 * ============================================================================
 */

"use client";
import React from "react";
import { getIconRenderer } from "@/components/icons";
import { ContactAppContent, WorksAppContent, SourceAppContent, MindmapAppContent } from "@/components/SystemApps";
import { yijingConfig } from "../../yijing.config";

export interface AppConfig {
  id: string;
  title: string;
  icon: React.ElementType; 
  content: React.ReactNode;
}

// ----------------------------------------------------------------------
// [DEFENSIVE PROGRAMMING & TYPE SAFETY]
// ----------------------------------------------------------------------
interface BaseApp {
  id: string;
  title: string;
  icon: string;
  type: "text" | "list" | "iframe";
}

interface TextApp extends BaseApp {
  type: "text";
  header?: string;
  content: string[];
}

interface ListApp extends BaseApp {
  type: "list";
  categories: { name: string; items: string[] }[];
}

interface IframeApp extends BaseApp {
  type: "iframe";
  url: string;
}

type CustomApp = TextApp | ListApp | IframeApp;

interface SafeOSConfig {
  customApps?: CustomApp[];
  systemApps?: {
    enableWorks?: boolean;
    enableContact?: boolean;
    enableSource?: boolean;
    enableMindmap?: boolean;
  };
}

const buildApps = (): AppConfig[] => {
  const generatedApps: AppConfig[] = [];
  
  // Cast the raw user config through the Defensive Interface
  const os = (yijingConfig.os as unknown) as SafeOSConfig;

  // ----------------------------------------------------------------------
  // 1. DYNAMIC PARSER ENGINE (Compiles Custom Apps)
  // ----------------------------------------------------------------------
  if (os?.customApps && Array.isArray(os.customApps)) {
    os.customApps.forEach((app) => {
      let appContent: React.ReactNode = null;

      // Type 1: Text App (Like 'About' or 'Philosophy')
      if (app.type === "text") {
        appContent = (
          <div className="p-5 text-[13px] text-charcoal-900 leading-relaxed flex-1 overflow-y-auto font-medium">
            {app.header && <h3 className="text-[16px] font-bold mb-3 text-charcoal-950">{app.header}</h3>}
            {app.content?.map((text: string, i: number) => (
              <p key={i} className="mb-3">{text}</p>
            ))}
          </div>
        );
      } 
      
      // Type 2: List App (Like 'Skills' or 'Tech Stack')
      else if (app.type === "list") {
        appContent = (
          <div className="p-5 text-[13px] text-charcoal-900 leading-relaxed flex-1 overflow-y-auto font-medium">
            {app.categories?.map((cat, i: number) => (
              <div key={i} className="mb-5">
                <h4 className="text-[11px] font-bold text-charcoal-600 tracking-wider mb-2 uppercase">{cat.name}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items?.map((item: string) => (
                    <span key={item} className="px-2 py-1 bg-charcoal-200/50 border border-charcoal-300 rounded-md text-[11px] text-charcoal-950 font-bold">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      } 
      
      // Type 3: Iframe App (Like Spotify 'Radio' or YouTube)
      else if (app.type === "iframe") {
        appContent = (
          <div className="w-full h-full flex flex-col bg-charcoal-950">
            <iframe 
              src={app.url} 
              className="w-full h-full border-0" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
            />
          </div>
        );
      }

      // Inject the compiled React Node into the final OS Array
      if (appContent) {
        generatedApps.push({
          id: app.id,
          title: app.title,
          icon: getIconRenderer(app.icon),
          content: appContent
        });
      }
    });
  }

  // ----------------------------------------------------------------------
  // 2. SYSTEM APPS (Hardcoded logic blocks)
  // ----------------------------------------------------------------------
  if (os?.systemApps?.enableWorks) {
    generatedApps.push({ id: "works", title: "Works", icon: getIconRenderer('works'), content: <WorksAppContent /> });
  }
  if (os?.systemApps?.enableContact) {
    generatedApps.push({ id: "contact", title: "Contact", icon: getIconRenderer('contact'), content: <ContactAppContent /> });
  }
  if (os?.systemApps?.enableSource) {
    generatedApps.push({ id: "source", title: "Source", icon: getIconRenderer('source'), content: <SourceAppContent /> });
  }
  if (os?.systemApps?.enableMindmap) {
    generatedApps.push({ id: "mindmap", title: "Mind Map", icon: getIconRenderer('mindmap'), content: <MindmapAppContent /> });
  }

  return generatedApps;
};

export const APPS = buildApps();