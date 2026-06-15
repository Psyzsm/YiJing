/**
 * ============================================================================
 * MINDMAP RENDERING ENGINE (CANVAS & PHYSICS)
 * ============================================================================
 * @file page.tsx
 * @description
 * Master graphics engine for the Digital Garden. This component bridges 
 * React's declarative state with a 60 FPS imperative Canvas loop. Utilizing
 * D3.js for force-directed graph physics, while overriding standard 
 * rendering and event handling to achieve a Ink-Wash UI.
 * ============================================================================
 */

"use client";

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { forceCollide } from 'd3-force';
import type { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { INK_PATHS } from '@/components/nodeArt';
import { graphData, type MyNode, type MyLink } from '@/config/mindmap';
import { yijingConfig } from "../../../yijing.config";

// ----------------------------------------------------------------------
// TYPESCRIPT INTERFACES
// ----------------------------------------------------------------------

interface D3ForceLink<L> {
  distance: (fn: (link: L) => number) => D3ForceLink<L>;
}

interface D3ForceManyBody<N> {
  strength: (fn: (node: N) => number) => D3ForceManyBody<N>;
}

/**
 * Tracks the state of a single "ink ripple" animation
 */
interface Ripple {
  startTime: number;
  startRotation: number;
}

/**
 * Tracks the global animation state of a specific node across the 60 FPS loop.
 * [MEMORY MANAGEMENT]: Maintained in a mutable Map ref rather than React state 
 * to prevent forcing React re-renders 60 times a second.
 */
interface AnimState {
  hoverTimer: number;    
  ripples: Ripple[];     
  mountTime: number;     
  lastTime: number; 
  muteTimer: number; 
}

// [PERFORMANCE OPTIMIZATION]: Dynamically imports the heavy force-graph library 
// strictly on the client side (ssr: false). The server environment lacks DOM 
// and Canvas APIs, which would cause hydration failures if rendered server-side.
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
) as unknown as React.ComponentType<{
  ref?: React.Ref<ForceGraphMethods<NodeObject<MyNode>, LinkObject<MyNode, MyLink>> | undefined>;
  graphData: { nodes: MyNode[]; links: MyLink[] };
  nodeLabel?: string | ((node: MyNode) => string);
  autoPauseRedraw?: boolean;
  enableNodeDrag?: boolean;
  nodeCanvasObject?: (node: MyNode, ctx: CanvasRenderingContext2D, globalScale: number) => void;
  linkCanvasObject?: (link: MyLink, ctx: CanvasRenderingContext2D, globalScale: number) => void;
  d3AlphaDecay?: number;
}>;

const getLinkId = (node: unknown): string => {
  if (typeof node === 'object' && node !== null && 'id' in node) {
    return String((node as Record<string, unknown>).id);
  }
  return String(node);
};

// [ANIMATION MATH]: Custom easing function for smooth organic scaling.
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// [ACCESSIBILITY (a11y) ALGORITHM]: Converts a Hex color to relative luminance (0 to 1).
// Determines if a dynamically extracted color requires dark text for WCAG readability.
const getLuminance = (hex: string) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
  
  const [R, G, B] = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

export default function MindMap() {
  const fgRef = useRef<ForceGraphMethods<NodeObject<MyNode>, LinkObject<MyNode, MyLink>> | undefined>(undefined);
  const animRef = useRef<Map<string, AnimState>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null); 

  const dragNodeRef = useRef<MyNode | null>(null);
  const dragStartTime = useRef<number>(0);

  const [useSVGs, setUseSVGs] = useState(yijingConfig.mindmap.defaultStyle === "ink");
  const [enableDrag, setEnableDrag] = useState(yijingConfig.mindmap.defaultPhysics === "unlocked");
  
  // Initializes system default theme parameters.
  const [themeColors, setThemeColors] = useState({ dominant: '#fc2403', dark: '#111313', light: '#fdf3e8', muted: '#71717a' });

  // [DOM & CANVAS STATE SYNCHRONIZATION]
  // Next.js injects CSS asynchronously; variables may not exist on frame 1.
  // This lightweight polling interval ensures the 60 FPS Canvas loop remains perfectly 
  // synchronized with the dynamically extracted CSSOM theme variables.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const syncColors = () => {
      const rootStyle = getComputedStyle(document.documentElement);
      const dom = rootStyle.getPropertyValue('--color-sys-dominant').trim();
      
      if (dom) {
        setThemeColors({
          dominant: dom,
          dark: rootStyle.getPropertyValue('--color-sys-dark').trim() || '#111313',
          light: rootStyle.getPropertyValue('--color-sys-light').trim() || '#fdf3e8',
          muted: rootStyle.getPropertyValue('--color-sys-muted').trim() || '#71717a',
        });
      }
    };

    syncColors(); 
    const intervalId = setInterval(syncColors, 250); 
    
    return () => clearInterval(intervalId);
  }, []);

  // ----------------------------------------------------------------------
  // GEOMETRY PRE-COMPILATION
  // ----------------------------------------------------------------------
  // [PERFORMANCE OPTIMIZATION]: Converts SVG string paths into native Path2D objects 
  // strictly once on mount. Executing this computation inside the 60 FPS render loop 
  // triggers garbage collection stutters and blocks the main UI thread.
  const compiledPaths = useMemo(() => {
    const paths: Record<string, Path2D> = {};
    if (typeof window !== 'undefined' && INK_PATHS) {
      Object.keys(INK_PATHS).forEach(key => {
        paths[key] = new Path2D(INK_PATHS[key].pathData);
      });
    }
    return paths;
  }, []);

  // [COMPLEX GRAPHICS]: Utilizes DOMMatrix to pre-calculate translation, rotation, 
  // and scaling operations for every ink splat layer prior to graph initialization.
  const unifiedPaths = useMemo(() => {
    if (typeof window === 'undefined' || !INK_PATHS) return {};
    const paths: Record<string, Path2D> = {};

    graphData.nodes.forEach(node => {
      const unified = new Path2D();
      const baseRadius = 14 + (Math.sqrt(node.val) * 7);

      node.splats.forEach(splat => {
         const icon = INK_PATHS[splat.key];
         if (!icon) return;

         let matrix = new DOMMatrix();

         const shiftX = splat.offsetX * baseRadius * 0.4;
         const shiftY = splat.offsetY * baseRadius * 0.4;
         matrix = matrix.translate(shiftX, shiftY);
         matrix = matrix.rotate(splat.rotation);

         const targetDiameter = baseRadius * 3.2;
         const scaleFactor = targetDiameter / icon.width;
         matrix = matrix.scale(scaleFactor, scaleFactor);
         matrix = matrix.translate(-icon.width / 2, -icon.height / 2);
         matrix = matrix.scale(icon.scaleX, icon.scaleY);
         
         if (icon.translateY) {
             matrix = matrix.translate(0, -icon.translateY / Math.abs(icon.scaleY));
         }

         unified.addPath(new Path2D(icon.pathData), matrix);
      });

      paths[node.id] = unified;
    });

    return paths;
  }, []);

  const getRadius = useCallback((node: MyNode) => {
    return 14 + (Math.sqrt(node.val) * 7); 
  }, []);

  // ----------------------------------------------------------------------
  // PHYSICS ENGINE TUNING
  // ----------------------------------------------------------------------
  useEffect(() => {
    const initPhysics = () => {
      if (fgRef.current) {
        const fg = fgRef.current;
        // 1. Collision Force: Prevents nodes from overlapping.
        fg.d3Force('collide', forceCollide((node: MyNode) => getRadius(node) + 15).iterations(3));
        
        // 2. Link Force: Pushes interconnected nodes apart dynamically based on radius.
        const linkForce = fg.d3Force('link') as unknown as D3ForceLink<MyLink>;
        if (linkForce) {
          linkForce.distance((link: MyLink) => {
            const r1 = typeof link.source === 'object' ? getRadius(link.source as MyNode) : 20;
            const r2 = typeof link.target === 'object' ? getRadius(link.target as MyNode) : 20;
            return r1 + r2 + 50; 
          });
        }
        
        // 3. Charge Force: General repulsion to spread the graph outward.
        const chargeForce = fg.d3Force('charge') as unknown as D3ForceManyBody<MyNode>;
        if (chargeForce) {
          chargeForce.strength(() => -1000); 
        }
        fg.d3ReheatSimulation();
      } else {
        setTimeout(initPhysics, 50);
      }
    };
    initPhysics();
  }, [getRadius]);

  const hoverNodeRef = useRef<MyNode | null>(null);
  const highlightNodes = useRef<Set<string>>(new Set());
  const highlightLinks = useRef<Set<MyLink>>(new Set());
  const neighbors = useRef(new Map<string, string[]>());

  useEffect(() => {
    graphData.links.forEach(link => {
      const a = getLinkId(link.source);
      const b = getLinkId(link.target);
      if (!neighbors.current.has(a)) neighbors.current.set(a, []);
      if (!neighbors.current.has(b)) neighbors.current.set(b, []);
      neighbors.current.get(a)?.push(b);
      neighbors.current.get(b)?.push(a);
    });
  }, []);

  const handleNodeHover = useCallback((node: MyNode | null) => {
    hoverNodeRef.current = node ?? null;
    const newNodes = new Set<string>();
    const newLinks = new Set<MyLink>();

    if (node) {
      newNodes.add(node.id);
      (neighbors.current.get(node.id) ?? []).forEach(id => newNodes.add(id));
      graphData.links.forEach(link => {
        const s = getLinkId(link.source);
        const t = getLinkId(link.target);
        if (s === node.id || t === node.id) newLinks.add(link);
      });
    }

    highlightNodes.current = newNodes;
    highlightLinks.current = newLinks;
  }, []);

  const handleNodeClick = useCallback((node: MyNode) => {
    if (node.url) {
      window.open(node.url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // ----------------------------------------------------------------------
  // CUSTOM POINTER INTERACTION
  // ----------------------------------------------------------------------
  // [EVENT HIJACKING & UX ENGINEERING]: Standard react-force-graph implementations 
  // intercept drag events to pan the camera. This overrides the 'mousedown' event 
  // in the capture phase to block camera panning when interacting directly with a node.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const blockD3Pan = (e: MouseEvent | TouchEvent) => {
      if (!fgRef.current) return;
      
      let clientX, clientY;
      if ('touches' in e && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as MouseEvent).clientX;
          clientY = (e as MouseEvent).clientY;
      }

      const rect = container.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      const graphCoords = fgRef.current.screen2GraphCoords(mouseX, mouseY);

      let isHit = false;
      for (let i = graphData.nodes.length - 1; i >= 0; i--) {
          const node = graphData.nodes[i];
          if (node.x === undefined || node.y === undefined) continue;
          
          const dx = node.x - graphCoords.x;
          const dy = node.y - graphCoords.y;
          
          if (Math.sqrt(dx * dx + dy * dy) <= getRadius(node) * 1.6) {
              isHit = true;
              break;
          }
      }

      if (isHit || dragNodeRef.current) {
          e.stopImmediatePropagation();
          e.stopPropagation();
      }
    };

    container.addEventListener('mousedown', blockD3Pan, true);
    container.addEventListener('touchstart', blockD3Pan, { capture: true, passive: false });

    return () => {
      container.removeEventListener('mousedown', blockD3Pan, true);
      container.removeEventListener('touchstart', blockD3Pan, true);
    };
  }, [getRadius]);

  const handlePointerDownCapture = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!fgRef.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const graphCoords = fgRef.current.screen2GraphCoords(mouseX, mouseY);
    
    let foundNode: MyNode | null = null;
    for (let i = graphData.nodes.length - 1; i >= 0; i--) {
      const node = graphData.nodes[i];
      if (node.x === undefined || node.y === undefined) continue;
      
      const dx = node.x - graphCoords.x;
      const dy = node.y - graphCoords.y;
      if (Math.sqrt(dx * dx + dy * dy) <= getRadius(node) * 1.6) { 
        foundNode = node;
        break;
      }
    }

    if (foundNode) {
      event.stopPropagation();
      handleNodeHover(foundNode); 
      dragStartTime.current = performance.now();

      if (enableDrag) {
        dragNodeRef.current = foundNode;
        foundNode.fx = foundNode.x;
        foundNode.fy = foundNode.y;
        
        try {
          (event.target as HTMLElement).setPointerCapture(event.pointerId);
        } catch {}
      }
    }
  }, [enableDrag, getRadius, handleNodeHover]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!fgRef.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const graphCoords = fgRef.current.screen2GraphCoords(mouseX, mouseY);
    
    if (dragNodeRef.current && enableDrag) {
      event.stopPropagation();
      dragNodeRef.current.fx = graphCoords.x;
      dragNodeRef.current.fy = graphCoords.y;
      fgRef.current.d3ReheatSimulation(); 
      return;
    }

    let foundNode: MyNode | null = null;
    for (let i = graphData.nodes.length - 1; i >= 0; i--) {
      const node = graphData.nodes[i];
      if (node.x === undefined || node.y === undefined) continue;
      
      const dx = node.x - graphCoords.x;
      const dy = node.y - graphCoords.y;
      if (Math.sqrt(dx * dx + dy * dy) <= getRadius(node) * 1.6) { 
        foundNode = node;
        break;
      }
    }

    handleNodeHover(foundNode);
  }, [enableDrag, getRadius, handleNodeHover]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (dragNodeRef.current) {
      dragNodeRef.current.fx = undefined;
      dragNodeRef.current.fy = undefined;
      dragNodeRef.current = null;
      try {
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {}
    }
  }, []);

  const handlePointerClick = useCallback(() => {
    if (performance.now() - dragStartTime.current > 200) return;
    if (hoverNodeRef.current) handleNodeClick(hoverNodeRef.current);
  }, [handleNodeClick]);

  // ----------------------------------------------------------------------
  // 60-FPS IMPERATIVE RENDER LOOP
  // ----------------------------------------------------------------------
  const paintNode = useCallback((node: MyNode, ctx: CanvasRenderingContext2D) => {
    ctx.save(); 

    const hovered = hoverNodeRef.current;
    const anyNodeHovered = hovered !== null;
    const isHovered = hovered?.id === node.id;
    const isNeighbor = highlightNodes.current.has(node.id);
    const shouldBeMuted = anyNodeHovered && !isHovered && !isNeighbor;
    
    const baseRadius = getRadius(node); 
    const now = performance.now();

    let anim = animRef.current.get(node.id);
    if (!anim) {
      anim = { hoverTimer: 0, ripples: [], mountTime: now, lastTime: now, muteTimer: 0 };
      animRef.current.set(node.id, anim);
    }
    
    const delta = Math.min((now - anim.lastTime) / 1000, 0.1); 
    anim.lastTime = now;

    if (shouldBeMuted) {
        anim.muteTimer = Math.min(1, anim.muteTimer + delta * 0.4);
    } else {
        anim.muteTimer = Math.max(0, anim.muteTimer - delta * 0.4);
    }

    if (isHovered) {
      anim.hoverTimer = Math.min(1, anim.hoverTimer + delta * 0.66);
    } else {
      if (anim.hoverTimer > 0) {
        if (anim.ripples.length < 3) {
            anim.ripples.push({
                startTime: now,
                startRotation: easeInOutCubic(anim.hoverTimer) * Math.PI * 2
            });
        }
        anim.hoverTimer = 0;
      }
    }

    anim.ripples = anim.ripples.filter(r => (now - r.startTime) / 2500 < 1);

    const TWENTY_MINS_MS = 1200000;
    const bleedDuration = TWENTY_MINS_MS * (baseRadius / 15); 
    const timeSinceMount = now - anim.mountTime;
    
    const linearT = Math.min(1, timeSinceMount / bleedDuration);
    const easeOutCubicT = 1 - Math.pow(1 - linearT, 3);

    const stainOpacity = 0.85 - (0.70 * easeOutCubicT);
    const stainScale = 1.0 + (0.4 * easeOutCubicT); 

    const currentGlobalAlpha = 1.0 - (anim.muteTimer * 0.85);
    ctx.globalAlpha = currentGlobalAlpha;

    // [AESTHETIC MATH]: Dynamic Pigment Anchoring & Drying Simulation
    // 1. Wet State: High pigment concentration (50%) paired with muted tones simulates wet ink.
    // 2. Dried State: Reduced pigment density (35%) and background interpolation (0% muted) simulating physical page bleeding.
    const dominantPct = Math.round(50 - (15 * easeOutCubicT)); 
    const mutedRatio = Math.round(50 * (1 - easeOutCubicT));   
    const dustyHighlight = `color-mix(in oklab, ${themeColors.dominant} ${dominantPct}%, color-mix(in oklab, ${themeColors.muted} ${mutedRatio}%, ${themeColors.light}))`;

    if (!useSVGs) {
      const nodeSize = isHovered ? baseRadius * 1.15 : baseRadius; 
      const baseFill = '#111313'; 
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI, false);
      
      if (isHovered || isNeighbor) {
          ctx.fillStyle = dustyHighlight;
          // Applying the pre-mixed dusty color opaquely prevents optical hue shifting (e.g., red to orange),
          // while the stainOpacity fade enables a visual "bleed" into the canvas over time.
          ctx.globalAlpha = currentGlobalAlpha * stainOpacity; 
          ctx.fill();
          ctx.globalAlpha = currentGlobalAlpha; 
      } else {
          ctx.fillStyle = baseFill;
          ctx.fill();
      }
    } else {
      
      const useHighlight = isNeighbor && !isHovered;
      ctx.globalCompositeOperation = useHighlight ? 'source-over' : 'multiply';

      const drawHoverIcon = (key: string, color: string, rotation: number, scaleMult: number = 1, alpha: number = 1) => {
        const icon = INK_PATHS[key];
        const path = compiledPaths[key];
        if (!icon || !path) return;

        ctx.save();
        ctx.globalAlpha = currentGlobalAlpha * alpha;
        ctx.translate(node.x!, node.y!);
        ctx.rotate(rotation);

        const targetDiameter = baseRadius * 3.2 * scaleMult; 
        const scaleFactor = targetDiameter / icon.width;
        
        ctx.scale(scaleFactor, scaleFactor);
        ctx.translate(-icon.width / 2, -icon.height / 2);
        
        ctx.scale(icon.scaleX, icon.scaleY);
        if (icon.translateY) {
            ctx.translate(0, -icon.translateY / Math.abs(icon.scaleY));
        }

        ctx.fillStyle = color;
        ctx.fill(path);
        ctx.restore();
      };

      const hoverKey = node.id === 'root' ? 'dragon' : 'yinYang';

      anim.ripples.forEach(ripple => {
          const rippleT = (now - ripple.startTime) / 2500; 
          const opacity = 1 - rippleT; 
          const scale = 1.0 + (rippleT * 0.3); 
          drawHoverIcon(hoverKey, '#111313', ripple.startRotation, scale, opacity);
      });

      if (anim.hoverTimer > 0) {
          const paintEase = easeInOutCubic(anim.hoverTimer);
          const currentOpacity = paintEase;
          const currentScale = 1 + (0.15 * paintEase);
          const rotation = paintEase * Math.PI * 2;
          drawHoverIcon(hoverKey, '#111313', rotation, currentScale, currentOpacity);
      }

      // Renders the pre-compiled ink geometry.
      const unifiedPath = unifiedPaths[node.id];
      if (unifiedPath) {
          ctx.save();
          ctx.translate(node.x!, node.y!);
          ctx.scale(stainScale, stainScale); 
          
          if (useHighlight) {
              ctx.globalAlpha = currentGlobalAlpha * stainOpacity;
              ctx.fillStyle = dustyHighlight;
          } else {
              ctx.globalAlpha = currentGlobalAlpha * stainOpacity;
              ctx.fillStyle = '#111313'; 
          }
          
          ctx.fill(unifiedPath); 
          ctx.restore();
      }
      
      ctx.globalCompositeOperation = 'source-over';
    }

    // ----------------------------------------------------------------------
    // TYPOGRAPHY MATH
    // ----------------------------------------------------------------------
    
    // [ACCESSIBILITY ENFORCEMENT]: Evaluates whether the extracted dominant color exceeds 
    // relative luminance thresholds, forcing dark text for strict WCAG compliance.
    const isLightHighlight = getLuminance(themeColors.dominant) > 0.5;
    
    const isDarkText = (isNeighbor || isHovered) 
        ? isLightHighlight
        : (useSVGs && (anim.muteTimer > 0.5 || (!isHovered && !isNeighbor)) && stainOpacity < 0.45);

    ctx.fillStyle = isDarkText ? '#111313' : '#fdf3e8';

    if (!isDarkText) {
      ctx.shadowColor = 'rgba(17, 19, 19, 0.8)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    const currentVisSize = baseRadius * (1 + 0.15 * easeInOutCubic(anim.hoverTimer));
    let fontSize = Math.max(9, Math.min(currentVisSize * 0.4, 16)); 
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const label = node.name;
    const textWidth = ctx.measureText(label).width;
    const maxAllowedWidth = (currentVisSize * 2) * 0.95; 

    if (textWidth > maxAllowedWidth) {
      const ratio = maxAllowedWidth / textWidth;
      fontSize = Math.max(9, fontSize * ratio);
      ctx.font = `bold ${fontSize}px sans-serif`;
    }

    const words = label.split(' ');
    if (words.length > 1 && label.length > 8) {
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      ctx.fillText(line1, node.x!, node.y! - (fontSize * 0.6));
      ctx.fillText(line2, node.x!, node.y! + (fontSize * 0.6));
    } else {
      ctx.fillText(label, node.x!, node.y!);
    }

    ctx.restore(); 

  }, [getRadius, useSVGs, compiledPaths, unifiedPaths, themeColors]);

  const paintLink = useCallback((link: MyLink, ctx: CanvasRenderingContext2D) => {
    const source = link.source as MyNode;
    const target = link.target as MyNode;
    const isHighlighted = highlightLinks.current.has(link);
    
    // [VISUAL ARTIFACT MITIGATION]: Prevents vector lines from rendering through transparent ink nodes.
    const dx = target.x! - source.x!;
    const dy = target.y! - source.y!;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;

    // Approximates the visual radius of the ink blots.
    const sourceR = getRadius(source) * 0.7;
    const targetR = getRadius(target) * 0.7;

    // Bypasses line rendering if nodes overlap or breach proximity thresholds, preventing visual clipping.
    if (distance <= sourceR + targetR) return;

    // Offsets the vector start and end coordinates to terminate precisely at the calculated node perimeter.
    const startX = source.x! + (dx * sourceR) / distance;
    const startY = source.y! + (dy * sourceR) / distance;
    const endX = target.x! - (dx * targetR) / distance;
    const endY = target.y! - (dy * targetR) / distance;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    
    ctx.setLineDash(isHighlighted ? [] : [4, 8]); 
    
    // Locks vector strokes to strict black with dynamic opacity states.
    ctx.globalAlpha = isHighlighted ? 0.4 : 0.15;
    ctx.strokeStyle = '#111313'; 
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.stroke();
    
    ctx.setLineDash([]); 
    ctx.globalAlpha = 1.0; 
  }, [getRadius]); 

  return (
    <div 
      className="w-screen h-screen relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/assets/background.jpg)' }}
    >
      <div className="absolute inset-0 bg-antique-50/50 backdrop-blur-md z-0 pointer-events-none" />

      <div className="absolute top-8 left-8 z-20 pointer-events-none">
        <h1 className="text-3xl font-serif font-bold text-charcoal-950">Yìjìng</h1>
        <p className="text-sm font-bold tracking-widest text-charcoal-600 uppercase mt-1">Digital Garden Architecture</p>
      </div>

      <div className="absolute top-8 right-8 z-20 flex flex-col gap-3 items-end">
        <button 
          onClick={() => setUseSVGs(!useSVGs)}
          className="text-xs font-bold tracking-widest text-charcoal-600 uppercase hover:text-charcoal-900 transition-colors"
        >
          {useSVGs ? "Mode: Ink" : "Mode: Geometric"}
        </button>
        <button 
          onClick={() => setEnableDrag(!enableDrag)}
          className="text-xs font-bold tracking-widest text-charcoal-600 uppercase hover:text-charcoal-900 transition-colors"
        >
          {enableDrag ? "Physics: Unlocked" : "Physics: Locked"}
        </button>
      </div>

      <div 
        ref={containerRef}
        className="relative z-10 w-full h-full cursor-pointer"
        onPointerDownCapture={handlePointerDownCapture}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handlePointerClick}
      >
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          autoPauseRedraw={false}
          enableNodeDrag={false} 
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          d3AlphaDecay={0.01} 
        />
      </div>
    </div>
  );
}