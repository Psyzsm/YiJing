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
// Define a strict but fully optional interface for the OS Configuration.
// If an end-user accidentally deletes the entire "skills" block from their 
// yijing.config.ts file, this ensures the React compiler simply skips it 
// instead of throwing a fatal undefined error and crashing the website.
interface SafeOSConfig {
  about?: {
    title: string;
    icon: string;
    header: string;
    paragraphs: string[];
  };
  skills?: {
    title: string;
    icon: string;
    categories: { name: string; items: string[] }[];
  };
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

  // 1. Compile the "About" App
  if (os?.about) {
    generatedApps.push({
      id: "about",
      title: os.about.title,
      icon: getIconRenderer(os.about.icon),
      content: (
        <div className="p-5 text-[13px] text-charcoal-900 leading-relaxed flex-1 overflow-y-auto font-medium">
          <h3 className="text-[16px] font-bold mb-3 text-charcoal-950">{os.about.header}</h3>
          {os.about.paragraphs.map((text: string, i: number) => (
            <p key={i} className="mb-3">{text}</p>
          ))}
        </div>
      )
    });
  }

  // 2. Compile the "Skills" App
  if (os?.skills) {
    generatedApps.push({
      id: "skills",
      title: os.skills.title,
      icon: getIconRenderer(os.skills.icon),
      content: (
        <div className="p-5 text-[13px] text-charcoal-900 leading-relaxed flex-1 overflow-y-auto font-medium">
          {os.skills.categories.map((cat: { name: string; items: string[] }, i: number) => (
            <div key={i} className="mb-5">
              <h4 className="text-[11px] font-bold text-charcoal-600 tracking-wider mb-2 uppercase">{cat.name}</h4>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((item: string) => (
                  <span key={item} className="px-2 py-1 bg-charcoal-200/50 border border-charcoal-300 rounded-md text-[11px] text-charcoal-950 font-bold">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    });
  }

  // ----------------------------------------------------------------------
  // [FEATURE FLAGS]
  // ----------------------------------------------------------------------
  // System apps execute complex API calls. Allowing users to disable them 
  // entirely via the config file if they don't want to set up Ghost CMS or SMTP.
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