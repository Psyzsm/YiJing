/**
 * ============================================================================
 * OS APPLICATION INJECTION REGISTRY
 * ============================================================================
 * @file SystemApps.tsx
 * @description
 * Contains the isolated UI components that get injected into the draggable 
 * Desktop Window containers. Each app manages its own data fetching, loading 
 * states, and API interactions.
 * ============================================================================
 */

"use client";
import React, { useState, useEffect } from "react";
import { WorksIcon, MindmapIcon } from "@/components/icons";
import 'altcha';
import { yijingConfig } from "../../yijing.config";

// ----------------------------------------------------------------------
// 1. ALTCHA WIDGET (WEB COMPONENT)
// ----------------------------------------------------------------------
export function AltchaWidget({ challengeurl, hidefooter }: { challengeurl: string, hidefooter?: boolean }) {
  const [mounted, setMounted] = useState(false);
  
  // [HYDRATION FIX]: Custom Web Components (<altcha-widget>) are not native to React. 
  // If the Next.js server tries to render this, it will throw a hydration mismatch error.
  // setTimeout ensures the component ONLY mounts on the client's browser.
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return <div className="w-full h-[76px] bg-charcoal-200/50 rounded-lg animate-pulse border-2 border-charcoal-300" />;
  
  // @ts-expect-error - Custom Web Components are not in standard React DOM types.
  return <altcha-widget challenge={challengeurl} hidefooter={hidefooter ? "true" : undefined}></altcha-widget>;
}

// ----------------------------------------------------------------------
// 2. CONTACT APP (STATE MACHINE & SECURE PIPELINE)
// ----------------------------------------------------------------------
export function ContactAppContent() {
  const [step, setStep] = useState<"locked" | "unlocking" | "unlocked" | "sending" | "success">("locked");
  const [errorMsg, setErrorMsg] = useState("");
  
  const [honeypot, setHoneypot] = useState("");
  const [savedPayload, setSavedPayload] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const altchaPayload = formData.get('altcha') as string;

    if (!altchaPayload) return setErrorMsg("Please complete the verification checkbox.");
    setStep("unlocking");

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock', altchaPayload, honeypot })
      });
      const data = await response.json().catch(() => ({})); 
      if (!response.ok) throw new Error(data.error || 'Verification failed.');
      
      setSavedPayload(altchaPayload); 
      setStep("unlocked");
      
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Verification failed. Please try again.");
      setStep("locked");
      
      const widget = document.querySelector('altcha-widget');
      if (widget && 'reset' in widget && typeof widget.reset === 'function') {
        (widget.reset as () => void)();
      }
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "sending" || step === "success") return; 
    setErrorMsg("");
    const formData = new FormData(e.target as HTMLFormElement);
    setStep("sending");

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', name: formData.get('name'), email: formData.get('email'), message: formData.get('message'), altchaPayload: savedPayload, honeypot })
      });
      const data = await response.json().catch(() => ({})); 
      if (!response.ok) throw new Error(data.error || 'Failed to send.');
      setStep("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Transmission failed. Please try again.");
      setStep("unlocked");
    }
  };

  return (
    <div className="p-5 text-[14px] text-charcoal-900 leading-relaxed flex-1 overflow-y-auto font-medium flex flex-col h-full">
      {(step === "locked" || step === "unlocking") && (
        <div className="flex flex-col flex-1">
          <h3 className="text-[16px] font-bold mb-4 text-charcoal-950">Secure Comms Protocol</h3>
          <form onSubmit={handleUnlock} className="flex flex-col items-center justify-center flex-1 bg-charcoal-100/30 border-2 border-charcoal-300 border-dashed rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-charcoal-200 text-charcoal-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h4 className="text-charcoal-950 font-bold mb-1">Vault Locked</h4>
              <p className="text-[11px] text-charcoal-700 max-w-[250px]">Direct contact links and messaging forms are hidden from automated scrapers.</p>
            </div>
            <input type="text" name="website_url" autoComplete="off" className="absolute opacity-0 -z-10 w-0 h-0" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} />
            <div className="mb-4"><AltchaWidget challengeurl="/api/altcha-challenge" hidefooter={true} /></div>
            {errorMsg && <p className="text-[11px] text-blush-500 font-bold mb-3">{errorMsg}</p>}
            <button type="submit" disabled={step === "unlocking"} className="px-6 py-2 bg-charcoal-900 hover:bg-blush-500 text-antique-50 rounded font-bold text-[12px] shadow-md transition-colors disabled:opacity-50">
              {step === "unlocking" ? "DECRYPTING..." : "UNLOCK VAULT"}
            </button>
          </form>
        </div>
      )}

      {(step === "unlocked" || step === "sending") && (
        <div className="flex flex-col flex-1 animate-in fade-in duration-500">
          <div className="mb-5 pb-5 border-b-2 border-charcoal-300 border-dashed">
            <h3 className="text-[16px] font-bold mb-3 text-charcoal-950">Connect</h3>
            <div className="flex gap-3">
              <a href={process.env.NEXT_PUBLIC_LINKEDIN_URL || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-charcoal-200/50 hover:bg-blush-500 hover:text-antique-50 text-charcoal-950 rounded-lg font-bold border border-charcoal-300 transition-colors shadow-sm text-[12px]">🔗 LinkedIn</a>
              <a href={process.env.NEXT_PUBLIC_GITHUB_URL || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-charcoal-200/50 hover:bg-blush-500 hover:text-antique-50 text-charcoal-950 rounded-lg font-bold border border-charcoal-300 transition-colors shadow-sm text-[12px]">💻 GitHub</a>
            </div>
          </div>
          <h3 className="text-[16px] font-bold mb-4 text-charcoal-950">Direct Message</h3>
          <form onSubmit={handleSendEmail} className="flex flex-col gap-4 flex-1">
            <input type="text" name="website_url" autoComplete="off" className="absolute opacity-0 -z-10 w-0 h-0" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-charcoal-600 uppercase tracking-wider mb-1">Name</label>
                <input type="text" name="name" required className="w-full px-3 py-2 bg-antique-50/50 border-2 border-charcoal-300 rounded-lg focus:border-blush-500 focus:outline-none transition-colors text-[13px] text-charcoal-950 shadow-sm" placeholder="John Doe" />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-charcoal-600 uppercase tracking-wider mb-1">Email</label>
                <input type="email" name="email" required className="w-full px-3 py-2 bg-antique-50/50 border-2 border-charcoal-300 rounded-lg focus:border-blush-500 focus:outline-none transition-colors text-[13px] text-charcoal-950 shadow-sm" placeholder="john@example.com" />
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-[11px] font-bold text-charcoal-600 uppercase tracking-wider mb-1">Message</label>
              <textarea name="message" required className="w-full flex-1 min-h-[80px] px-3 py-2 bg-antique-50/50 border-2 border-charcoal-300 rounded-lg focus:border-blush-500 focus:outline-none transition-colors text-[13px] text-charcoal-950 shadow-sm resize-none" placeholder="Hey Jack, I'm reaching out about..."></textarea>
            </div>
            {errorMsg && <p className="text-[12px] text-blush-500 font-bold text-right">{errorMsg}</p>}
            <div className="flex items-center justify-end mt-2">
              <button type="submit" disabled={step === "sending"} className="px-6 py-2.5 bg-charcoal-900 hover:bg-blush-500 active:bg-blush-600 text-antique-50 rounded-lg font-bold text-[13px] tracking-wide shadow-md transition-all disabled:opacity-50">
                {step === "sending" ? "TRANSMITTING..." : "SEND MESSAGE"}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === "success" && (
        <div className="flex-1 flex flex-col items-center justify-center bg-green-50/50 border-2 border-green-200 rounded-xl p-6 text-center animate-in fade-in duration-500">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 shadow-sm border border-green-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h4 className="text-charcoal-950 font-bold mb-1">Transmission Secure</h4>
          <p className="text-[12px] text-charcoal-700">Your message has been delivered to my inbox. I will be in touch shortly.</p>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. WORKS APP (GHOST CMS INTEGRATION)
// ----------------------------------------------------------------------
interface GhostPost {
  id: string; title: string; url: string; feature_image: string | null; tags?: { id: string; name: string }[];
}

export function WorksAppContent() {
  const [posts, setPosts] = useState<GhostPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // [ASYNC DATA FETCHING]: Contacts the Next.js proxy route to fetch data
  // without exposing the raw Ghost API keys to the browser network tab.
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/works');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPosts(data.posts || []);
      } catch (err) {
        console.error(err);
        setError("Unable to establish connection to the architecture database.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
      <div className="mb-2 px-1">
        <h3 className="text-[16px] font-bold text-charcoal-950">Architecture Logs</h3>
        <p className="text-[11px] text-charcoal-600 tracking-wide uppercase">Technical Case Studies & Deployments</p>
      </div>

      {/* [UX ENGINEERING]: Skeleton Loaders
          Provides visual feedback while data is fetching, preventing 
          the app window from looking broken or frozen during latency. */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-3 bg-charcoal-100/30 border-2 border-charcoal-200 border-dashed rounded-xl animate-pulse">
              <div className="w-24 h-16 bg-charcoal-200/50 rounded-md"></div>
              <div className="flex-1 py-1">
                <div className="w-3/4 h-3 bg-charcoal-200/50 rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-charcoal-200/50 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="p-4 bg-blush-50/50 border border-blush-200 rounded-xl text-center"><p className="text-[12px] font-bold text-blush-500">{error}</p></div>}

      {!isLoading && !error && posts.map((post) => (
        <a key={post.id} href={post.url} target="_blank" rel="noreferrer" className="flex flex-row items-center gap-4 p-3 bg-antique-50/60 border-2 border-charcoal-300 rounded-xl hover:border-blush-500 hover:shadow-md hover:bg-white transition-all cursor-pointer group">
          <div className="w-24 h-16 shrink-0 rounded-md overflow-hidden border border-charcoal-200 bg-charcoal-100 flex items-center justify-center">
            {post.feature_image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={post.feature_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : <WorksIcon className="w-6 h-6 text-charcoal-400" />}
          </div>
          <div className="flex flex-col flex-1 gap-1.5 min-w-0">
            <h4 className="text-[13px] font-bold text-charcoal-950 group-hover:text-blush-500 transition-colors leading-snug line-clamp-2">{post.title}</h4>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {post.tags.slice(0, 3).map(tag => (
                  <span key={tag.id} className="text-[9px] font-bold text-charcoal-600 bg-charcoal-200/50 px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">{tag.name}</span>
                ))}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------
// 4. MINDMAP APP (SYSTEM BRIDGE)
// ----------------------------------------------------------------------
export function MindmapAppContent() {
  // Default to "/" for SSR to prevent hydration mismatch errors
  const [mindmapPath, setMindmapPath] = useState("/");

  useEffect(() => {
    // [PROXY BYPASS]: If the user is on the portfolio subdomain, the Next.js
    // middleware forces all relative "/" traffic back to the portfolio. 
    // instead dynamically strip the subdomain to escape back to the root domain.
    if (window.location.hostname.startsWith("portfolio.")) {
      setMindmapPath(`${window.location.protocol}//${window.location.hostname.replace("portfolio.", "")}`);
    } else {
      // If it is the demo.psyzsm.com or localhost, respect the config file
      setMindmapPath(yijingConfig.site.routingMode === "os-root" ? "/mindmap" : "/");
    }
  }, []);

  return (
    <div className="p-6 flex flex-col h-full items-center justify-center text-center bg-antique-50/30">
      <div className="w-16 h-16 bg-charcoal-200/50 rounded-2xl flex items-center justify-center shadow-inner border border-charcoal-300 mb-4">
        <MindmapIcon className="w-8 h-8 text-charcoal-800" />
      </div>
      <h3 className="text-[18px] font-bold text-charcoal-950 mb-2 tracking-wide">Digital Garden</h3>
      <p className="text-[13px] text-charcoal-700 mb-8 max-w-[85%] leading-relaxed font-medium">
        Ready to explore the rest of the ecosystem? This will close the desktop environment and launch the interactive node graph.
      </p>
      <a 
        href={mindmapPath} 
        className="px-6 py-2.5 bg-charcoal-900 hover:bg-blush-500 active:bg-blush-600 text-antique-50 rounded-lg font-bold text-[12px] tracking-widest transition-all shadow-md flex items-center gap-2"
      >
        LAUNCH MIND MAP
      </a>
    </div>
  );
}