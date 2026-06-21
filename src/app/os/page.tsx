/**
 * ============================================================================
 * PORTFOLIO OS - MASTER DESKTOP ENGINE
 * ============================================================================
 * @file page.tsx
 * @description
 * The master rendering engine for the Desktop UI. This file acts as the Window 
 * Manager (comparable to Hyprland or Windows DWM). It tracks window coordinates, 
 * stacking order (z-index), minimize/maximize states, and dynamically falls 
 * back to a full-screen mobile app paradigm on smaller devices.
 * ============================================================================
 */

"use client";
import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import { MinimizeIcon, MaximizeIcon, CloseIcon, StartIcon } from "@/components/icons"; 
import { APPS, type AppConfig } from "@/config/apps";
import { THEME, siteConfig } from "@/config/site";

// ----------------------------------------------------------------------
// TYPESCRIPT INTERFACES (THE API CONTRACTS)
// ----------------------------------------------------------------------

/**
 * Tracks the specific DOM and physics state of a single application window.
 */
interface WindowState {
  isOpen?: boolean;
  isMinimized?: boolean;
  isMaximized?: boolean;
  isClosing?: boolean;
  /** Ensures the most recently clicked window renders on top of the stack */
  zIndex?: number;
}

interface AppWindowProps {
  app: AppConfig;
  state: WindowState;
  isActive: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
}

interface TaskbarTabProps {
  app: AppConfig;
  state: WindowState;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export default function Desktop() {
  // [STATE MANAGEMENT]: A dictionary holding the state of all applications. 
  // Utilizing an object mapping (Record) instead of an Array for O(1) direct state lookups.
  const [windowStates, setWindowStates] = useState<Record<string, WindowState>>({});
  
  // [STATE MANAGEMENT]: The master Z-Index counter. Instead of re-calculating arrays, 
  // simply just increment this integer and apply it to the focused window.
  const [topZIndex, setTopZIndex] = useState(10); 
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  
  // [RESPONSIVE ARCHITECTURE]: Tracks if the user is on a phone to swap UI paradigms.
  const [isMobile, setIsMobile] = useState(false);

  // [LIFECYCLE]: Bind a resize listener to dynamically adapt the OS environment 
  // without requiring a hard page refresh.
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768); 
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /** Utility function to merge new properties into a specific window's state object */
  const updateWindow = (id: string, updates: Partial<WindowState>) => 
    setWindowStates(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));

  /** * [UX ENGINEERING]: The Stacking Context Manager. 
   * Bumps the global topZIndex by 1, and assigns it to the target window so it pops to the front.
   */
  const bringToFront = (id: string) => {
    setTopZIndex(prev => {
      const newZ = prev + 1;
      updateWindow(id, { zIndex: newZ });
      return newZ;
    }); 
  };

  const openApp = (id: string) => {
    setTopZIndex(prev => {
      const newZ = prev + 1;
      updateWindow(id, { isOpen: true, isMinimized: false, isClosing: false, zIndex: newZ });
      return newZ;
    });
    setIsStartMenuOpen(false); 
  };

  const handleTaskbarClick = (id: string) => {
    const state = windowStates[id];
    // If minimized, restore it and bring to front
    if (state?.isMinimized) {
      setTopZIndex(prev => {
        const newZ = prev + 1;
        updateWindow(id, { isMinimized: false, zIndex: newZ });
        return newZ;
      });
    } 
    // If the window is opened but under other windows, move it to the front
    else if (state?.zIndex !== topZIndex) {
      bringToFront(id);
    } 
    // If the window is already the active top window, minimize it
    else {
      updateWindow(id, { isMinimized: true });
    }
  };

  /**
   * [LIFECYCLE & ANIMATION]: 
   * Instead of immediately unmounting the React component (causes a flash),
   * setting `isClosing` to trigger CSS fade-out animations, wait 200ms, and THEN unmount.
   */
  const closeApp = (id: string) => {
    updateWindow(id, { isClosing: true });
    setTimeout(() => updateWindow(id, { isOpen: false, isClosing: false, isMinimized: false, isMaximized: false }), 200);
  };

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-desktop-bg bg-cover bg-center font-sans select-none">
      {/* Click-away overlay to close the start menu */}
      {isStartMenuOpen && <div className="absolute inset-0 z-40" onClick={() => setIsStartMenuOpen(false)} />}
      
      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center bg-antique-50/60 backdrop-blur-md text-[12px] tracking-widest text-charcoal-950 font-bold z-50 border-b border-charcoal-300 uppercase">
        {siteConfig.title}
      </div>

      {/* Desktop Grid Area */}
      <div className={`absolute top-8 left-0 right-0 z-10 ${isMobile ? 'bottom-0' : 'bottom-12'}`} id="desktop-bounds">
        <div className={`relative w-full h-full pt-6 px-6 flex flex-row flex-wrap md:flex-col content-start ${THEME.desktop.gridGap}`}>
          {APPS.map((app) => (
            <div key={app.id} className={`flex flex-col items-center gap-2 cursor-pointer group ${THEME.desktop.appContainer}`} onClick={() => openApp(app.id)}>
              <button className={`${THEME.desktop.appButton} rounded-2xl bg-antique-50/60 backdrop-blur-md flex items-center justify-center shadow-sm border-2 border-charcoal-300 text-charcoal-800 transition-all duration-200 group-hover:scale-105 group-hover:border-blush-500 group-hover:text-blush-500 group-active:scale-95`}>
                <app.icon className={THEME.desktop.appIcon} />
              </button>
              <span className={`${THEME.desktop.appText} text-charcoal-950 font-bold text-center bg-antique-50/50 px-2.5 py-0.5 rounded backdrop-blur-md shadow-sm`}>
                {app.title}
              </span>
            </div>
          ))}
        </div>

        {/* ---------------------------------------------------------------------- */}
        {/* WINDOW RENDERING ENGINE (MOBILE VS DESKTOP ROUTER)                     */}
        {/* ---------------------------------------------------------------------- */}
        {APPS.map((app) => {
          const state = windowStates[app.id];
          if (!state?.isOpen) return null; 
          
          // [RESPONSIVE ARCHITECTURE]: If loaded on a phone, bypass react-rnd entirely 
          // and mount the full-screen Mobile fallback component.
          if (isMobile) {
            return <MobileAppView key={app.id} app={app} state={state} onClose={() => closeApp(app.id)} />;
          }

          return (
            <AppWindow 
              key={app.id} 
              app={app} 
              state={state} 
              isActive={state.zIndex === topZIndex} 
              onClose={() => closeApp(app.id)}
              onMinimize={() => updateWindow(app.id, { isMinimized: true })}
              onMaximize={() => {
                bringToFront(app.id);
                updateWindow(app.id, { isMaximized: !state.isMaximized });
              }}
              onFocus={() => bringToFront(app.id)}
            />
          );
        })}
      </div>

      {/* Taskbar & Start Menu (Hidden on Mobile) */}
      {!isMobile && (
        <>
          <div className={`absolute left-3 bottom-14 w-64 bg-antique-50/90 backdrop-blur-2xl border-2 border-charcoal-300 rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-2 transition-all duration-200 origin-bottom-left ${isStartMenuOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}>
            <div className="text-xs font-bold text-charcoal-600 tracking-wider mb-1 px-2">APPLICATIONS</div>
            {APPS.map((app) => (
              <button key={app.id} onClick={() => openApp(app.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-charcoal-200/50 hover:border-blush-500 border-2 border-transparent transition-colors text-charcoal-950 font-bold text-[13px] text-left">
                <app.icon className="w-5 h-5" /> {app.title}
              </button>
            ))}
          </div>

          <div className={`absolute bottom-0 left-0 right-0 ${THEME.taskbar.height} bg-antique-50/80 backdrop-blur-xl flex items-center px-4 border-t-2 border-charcoal-300 z-50`}>
            <div onClick={() => setIsStartMenuOpen(!isStartMenuOpen)} className={`mr-4 transition-all duration-200 cursor-pointer flex items-center justify-center w-9 h-9 rounded-lg ${isStartMenuOpen ? 'text-blush-500 bg-charcoal-200/60 shadow-inner' : 'text-charcoal-950 hover:text-blush-500 hover:bg-charcoal-100/40'}`}>
              <StartIcon className="w-6 h-6 -translate-x-[1px]" />
            </div>
            
            <div className="flex gap-2 flex-1 h-8">
              {APPS.map((app) => windowStates[app.id]?.isOpen && (
                <TaskbarTab 
                  key={app.id} 
                  app={app} 
                  state={windowStates[app.id]} 
                  isActive={windowStates[app.id].zIndex === topZIndex && !windowStates[app.id].isMinimized} 
                  onClick={() => handleTaskbarClick(app.id)} 
                  onClose={() => closeApp(app.id)} 
                />
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-charcoal-950 ml-4"><Clock /></div>
          </div>
        </>
      )}
    </main>
  );
}

// ----------------------------------------------------------------------
// DESKTOP UI COMPONENTS
// ----------------------------------------------------------------------

/**
 * Mobile App View
 * Mounts a full-screen, non-draggable variant of the application container 
 * specifically tailored for thumb-navigation on mobile devices.
 */
function MobileAppView({ app, state, onClose }: { app: AppConfig, state: WindowState, onClose: () => void }) {
  return (
    <div className={`absolute inset-0 flex flex-col bg-antique-50/95 backdrop-blur-3xl transition-all duration-200 z-50 ${state.isClosing ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`} style={{ zIndex: (state.zIndex || 50) + 100 }}>
      <div className="px-5 py-4 flex items-center gap-3 border-b-2 border-charcoal-300 shadow-sm bg-charcoal-200/50">
        <app.icon className="w-6 h-6 text-charcoal-950" />
        <span className="text-[18px] text-charcoal-950 font-bold">{app.title}</span>
      </div>
      <div className="flex-1 overflow-y-auto pb-24">{app.content}</div>
      <div className="absolute bottom-0 left-0 right-0 px-5 pt-8 pb-8 bg-gradient-to-t from-antique-50 via-antique-50 to-transparent">
        <button onClick={onClose} className="w-full py-4 bg-charcoal-900 hover:bg-blush-500 text-antique-50 rounded-xl font-bold tracking-widest text-[14px] shadow-xl border-2 border-charcoal-950 flex items-center justify-center gap-2">
          <CloseIcon className="w-5 h-5" /> GO BACK
        </button>
      </div>
    </div>
  );
}

/**
 * System Clock
 * [MEMORY MANAGEMENT]: Maintained in its own isolated component. Since setInterval 
 * triggers a re-render every 1 second, this isolates the component and prevents  
 * the entire Desktop from re-rendering 60 times a minute.
 */
function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  return <div className="text-[12px] font-bold tracking-wider w-max whitespace-nowrap bg-charcoal-200/50 border border-charcoal-300 px-3 py-1.5 rounded-full shadow-sm text-center">{time}</div>;
}

/**
 * Draggable OS Window Wrapper
 * Extends the `react-rnd` library to inject custom titlebar, controls, 
 * and dynamic z-index focusing.
 */
function AppWindow({ app, state, isActive, onClose, onMinimize, onMaximize, onFocus }: AppWindowProps) {
  // [PERFORMANCE]: Disables CSS transitions *while* dragging to prevent framerate dropping.
  const [isInteracting, setIsInteracting] = useState(false);
  
  return (
    <Rnd
      default={{ x: 120, y: 80, width: 400, height: 280 }}
      size={state.isMaximized ? { width: '100%', height: '100%' } : undefined}
      position={state.isMaximized ? { x: 0, y: 0 } : undefined}
      disableDragging={state.isMaximized}
      enableResizing={!state.isMaximized}
      minWidth={300} minHeight={200} bounds="parent" dragHandleClassName="win-titlebar"
      onDragStart={() => { setIsInteracting(true); onFocus(); }} onDragStop={() => setIsInteracting(false)}
      onResizeStart={() => { setIsInteracting(true); onFocus(); }} onResizeStop={() => setIsInteracting(false)}
      style={{ zIndex: state.zIndex || 10 }}
      className={`absolute rounded-xl overflow-hidden flex flex-col backdrop-blur-2xl ${!isInteracting ? 'transition-all duration-200 ease-in-out' : ''} ${(state.isMinimized || state.isClosing) ? 'opacity-0 pointer-events-none scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'} ${isActive ? 'bg-antique-50/80 border-2 border-blush-500 shadow-xl' : 'bg-antique-50/60 border-2 border-charcoal-300 shadow-lg'}`}
    >
      <div className="flex flex-col h-full" onMouseDown={onFocus}>
        <div className="win-titlebar bg-charcoal-200/50 px-3 py-2 flex items-center justify-between border-b-2 border-charcoal-300 cursor-move">
          <span className="text-[13px] text-charcoal-950 font-bold tracking-wide flex items-center gap-2"><app.icon className={THEME.window.titlebarIcon} /> {app.title}</span>
          <div className="flex items-center gap-2">
            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-charcoal-300/50 text-charcoal-800 transition-colors" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onMinimize(); }}><MinimizeIcon className={THEME.window.controlIcon} /></button>
            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-charcoal-300/50 text-charcoal-800 transition-colors" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onMaximize(); }}><MaximizeIcon className={THEME.window.controlIcon} /></button>
            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-blush-500/20 text-charcoal-800 hover:text-blush-500 transition-colors" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onClose(); }}><CloseIcon className={THEME.window.controlIcon} /></button>
          </div>
        </div>
        {app.content}
      </div>
    </Rnd>
  );
}

function TaskbarTab({ app, state, isActive, onClick, onClose }: TaskbarTabProps) {
  return (
    <div className={`flex items-center rounded-lg border-2 transition-all duration-200 h-full ${state.isMinimized ? 'bg-charcoal-100/30 border-charcoal-200 text-charcoal-700' : isActive ? 'bg-antique-50/95 border-blush-500 text-blush-600 shadow-sm' : 'bg-antique-50/70 border-charcoal-300 text-charcoal-950'}`}>
      <button onClick={onClick} className="px-3 flex items-center gap-2 cursor-pointer h-full text-[13px] font-bold"><app.icon className={THEME.taskbar.appIcon} /> {app.title}</button>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-8 flex items-center justify-center opacity-50 hover:opacity-100 hover:bg-blush-100 hover:text-blush-600 rounded-r-md transition-all cursor-pointer h-full border-l border-transparent"><CloseIcon className="w-2.5 h-2.5" /></button>
    </div>
  );
}