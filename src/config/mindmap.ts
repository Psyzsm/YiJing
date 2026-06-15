/**
 * ============================================================================
 * MINDMAP DATA COMPILER & PHYSICS PRE-PROCESSOR
 * ============================================================================
 * @file mindmap.ts
 * @description
 * Transforms the user's hierarchical JSON tree into a flattened nodal array 
 * required by D3.js. This also runs a procedural generation script 
 * (A "Chaos Engine") to assign custom ink geometry and calculate physics 
 * mass weights with a bottom-up accumulation algorithm.
 * ============================================================================
 */

import type { NodeObject } from 'react-force-graph-2d';
import { yijingConfig } from '../../yijing.config';

export interface SplatDef { key: string; rotation: number; offsetX: number; offsetY: number; }
export interface MyNode extends NodeObject { id: string; name: string; group: number; val: number; url?: string; splats: SplatDef[]; }
export interface MyLink { source: string | MyNode; target: string | MyNode; }

/**
 * [DATA TRANSFORMATION]: Flattens the hierarchical Yijing configuration 
 * into the strict `{ nodes: [], links: [] }` format demanded by react-force-graph.
 */
const buildGraphData = () => {
  const { mindmap } = yijingConfig;
  const nodes: Partial<MyNode>[] = [];
  const links: { source: string; target: string }[] = [];

  // Root
  nodes.push({ ...mindmap.rootNode, group: 0 });

  // Level 1: Projects
  mindmap.projects.forEach(p => {
    nodes.push({ ...p, group: 1 });
    links.push({ source: mindmap.rootNode.id, target: p.id });
  });

  // Level 2: Tools
  mindmap.tools.forEach(t => {
    nodes.push({ id: t.id, name: t.name, url: t.url, group: 2 });
    links.push({ source: t.parent, target: t.id });
  });

  // Level 3: Concepts
  mindmap.concepts.forEach(c => {
    nodes.push({ id: c.id, name: c.name, group: 3 });
    links.push({ source: c.parent, target: c.id });
  });

  // Custom Interconnections
  mindmap.customLinks.forEach(l => links.push(l));

  return { nodes: nodes as MyNode[], links };
};

const rawData = buildGraphData();

// ----------------------------------------------------------------------
// THE CHAOS ENGINE (PROCEDURAL GENERATION & PHYSICS MATH)
// ----------------------------------------------------------------------
const computeWeights = () => {
  const nodeMap = new Map<string, MyNode>();
  
  rawData.nodes.forEach(n => { 
    n.val = 1; 
    
    // [PHYSICS OPTIMIZATION]: If all nodes spawn at exactly (0,0), the D3.js 
    // force-directed algorithm experiences a singularity and explodes outward violently. 
    // Nodes are pre-scattered randomly to ensure a smooth simulation warm-up.
    n.x = (Math.random() - 0.5) * 800;
    n.y = (Math.random() - 0.5) * 800;

    // [PROCEDURAL UI]: Randomly assigns 1 to 3 "ink splat" SVG paths to each node, 
    // randomizing their rotation and offsets to create organic, non-repeating shapes.
    n.splats = [];
    const rand = Math.random();
    const layerCount = rand < 0.2 ? 1 : (rand < 0.8 ? 2 : 3);
    
    for (let i = 0; i < layerCount; i++) {
        n.splats.push({
            key: `splat${Math.floor(Math.random() * 3) + 1}`,
            rotation: Math.random() * 360, 
            offsetX: i === 0 ? 0 : (Math.random() - 0.5) * 1.5, 
            offsetY: i === 0 ? 0 : (Math.random() - 0.5) * 1.5,
        });
    }
    nodeMap.set(n.id, n); 
  });

  const childrenMap = new Map<string, string[]>();
  rawData.links.forEach(l => {
    if (!childrenMap.has(l.source)) childrenMap.set(l.source, []);
    childrenMap.get(l.source)!.push(l.target);
  });

  /**
   * [ALGORITHM: BOTTOM-UP ACCUMULATION] (Recursive Depth-First Search)
   * The parent nodes (like "React") to be physically larger than their children. 
   * This recursive function traverses the graph and calculates a node's total weight 
   * (val) by summing the weight of all its downstream dependents.
   */
  const calculateWeight = (nodeId: string, visited: Set<string>): number => {
    // Break circular references (cycles) to prevent infinite loops (Stack Overflow)
    if (visited.has(nodeId)) return nodeMap.get(nodeId)?.val || 1; 
    visited.add(nodeId);
    
    const node = nodeMap.get(nodeId);
    if (!node) return 1;

    let totalWeight = 1; 
    const children = childrenMap.get(nodeId) || [];
    children.forEach(childId => {
      totalWeight += calculateWeight(childId, new Set(visited));
    });

    node.val = totalWeight;
    return totalWeight;
  };

  // Kickoff the recursion from the root node
  calculateWeight(yijingConfig.mindmap.rootNode.id, new Set());
};

computeWeights();
export const graphData = rawData as { nodes: MyNode[]; links: MyLink[] };