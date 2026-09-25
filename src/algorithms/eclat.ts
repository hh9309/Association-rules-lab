import { Transaction, AssociationRule } from '../types';
import { getAllUniqueItems } from './core';

export interface VerticalItemEntry {
  item: string;
  tids: number[];
  support: number;
  count: number;
}

export interface TidIntersectionStep {
  itemA: string;
  itemB: string;
  tidsA: number[];
  tidsB: number[];
  intersectedTids: number[];
  diffset: number[]; // tidsA \ tidsB
  support: number;
  isFrequent: boolean;
}

export interface NetworkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  support: number;
  degree: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  support: number;
  confidence: number;
  lift: number;
  isRedundant: boolean;
  redundancyReason?: string;
  color: string;
  curvature: number;
}

export function buildVerticalData(
  transactions: Transaction[],
  minSup: number
): {
  verticalTable: VerticalItemEntry[];
  intersectionSteps: TidIntersectionStep[];
  allTids: number[];
} {
  const n = transactions.length;
  const uniqueItems = getAllUniqueItems(transactions);
  const allTids = transactions.map((_, idx) => idx + 1);

  // 1. Build TidList for single items
  const verticalTable: VerticalItemEntry[] = uniqueItems.map((item) => {
    const tids: number[] = [];
    transactions.forEach((tx, idx) => {
      if (tx.items.includes(item)) {
        tids.push(idx + 1);
      }
    });
    const count = tids.length;
    const support = n > 0 ? count / n : 0;
    return { item, tids, support, count };
  });

  // Filter by minSup
  const frequentVertical = verticalTable
    .filter((v) => v.support >= minSup)
    .sort((a, b) => b.count - a.count);

  // 2. Compute 2-item intersections (TidSet_A & TidSet_B)
  const intersectionSteps: TidIntersectionStep[] = [];
  for (let i = 0; i < frequentVertical.length; i++) {
    for (let j = i + 1; j < frequentVertical.length; j++) {
      const a = frequentVertical[i];
      const b = frequentVertical[j];

      const setB = new Set(b.tids);
      const intersectedTids = a.tids.filter((tid) => setB.has(tid));
      const diffset = a.tids.filter((tid) => !setB.has(tid));

      const count = intersectedTids.length;
      const support = n > 0 ? count / n : 0;

      intersectionSteps.push({
        itemA: a.item,
        itemB: b.item,
        tidsA: a.tids,
        tidsB: b.tids,
        intersectedTids,
        diffset,
        support,
        isFrequent: support >= minSup,
      });
    }
  }

  return {
    verticalTable,
    intersectionSteps,
    allTids,
  };
}

export function generateAssociationNetwork(
  rules: AssociationRule[],
  allItems: string[]
): {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
} {
  // Arrange nodes along a smooth oval circle
  const centerX = 260;
  const centerY = 240;
  const radiusX = 180;
  const radiusY = 150;

  // Filter items that participate in rules
  const activeItems = new Set<string>();
  rules.forEach((r) => {
    r.antecedent.forEach((it) => activeItems.add(it));
    r.consequent.forEach((it) => activeItems.add(it));
  });

  const displayItems = allItems.filter((it) => activeItems.has(it));
  const total = displayItems.length || 1;

  const nodeMap = new Map<string, NetworkNode>();

  displayItems.forEach((item, idx) => {
    const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radiusX;
    const y = centerY + Math.sin(angle) * radiusY;

    // Calculate degree
    let degree = 0;
    rules.forEach((r) => {
      if (r.antecedent.includes(item) || r.consequent.includes(item)) degree++;
    });

    const node: NetworkNode = {
      id: item,
      name: item,
      x,
      y,
      radius: Math.min(28, Math.max(16, 14 + degree * 2.5)),
      support: 0.5,
      degree,
    };
    nodeMap.set(item, node);
  });

  // Build edges
  const edges: NetworkEdge[] = [];
  rules.forEach((r, idx) => {
    // Only draw 1-to-1 or key composite rules for clean 2D topology
    const src = r.antecedent[0];
    const tgt = r.consequent[0];
    if (src && tgt && src !== tgt && nodeMap.has(src) && nodeMap.has(tgt)) {
      const isRedundant = !!r.isRedundant;
      edges.push({
        id: `edge-${idx}-${src}-${tgt}`,
        source: src,
        target: tgt,
        support: r.support,
        confidence: r.confidence,
        lift: r.lift,
        isRedundant,
        redundancyReason: isRedundant
          ? '置信度未显著超越单项先决条件，且子集已具备更高独立提升度'
          : undefined,
        color: isRedundant
          ? 'rgba(239, 68, 68, 0.45)'
          : r.lift > 1.4
          ? 'rgba(13, 148, 136, 0.85)'
          : 'rgba(99, 102, 241, 0.7)',
        curvature: (idx % 2 === 0 ? 0.2 : -0.2) * ((idx % 3) + 1),
      });
    }
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}
