import { Transaction, FrequentItemset, AprioriStepStage } from '../types';
import { countItemsetInTransactions, getAllUniqueItems } from './core';

export interface Lattice3DNode {
  id: string;
  items: string[];
  k: number;
  x: number;
  y: number;
  z: number;
  x2d?: number;
  y2d?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  count: number;
  support: number;
  status: 'frequent' | 'pruned_by_property' | 'pruned_by_cutoff' | 'candidate' | 'unvisited';
  pruneReason?: string;
  subsets?: { items: string[]; isFrequent: boolean; name: string }[];
}

export interface Lattice3DEdge {
  sourceId: string;
  targetId: string;
  isPruned: boolean;
}

export function runAprioriStages(
  transactions: Transaction[],
  minSup: number,
  maxK: number = 4
): {
  stages: AprioriStepStage[];
  allFrequent: FrequentItemset[];
  latticeNodes: Lattice3DNode[];
  latticeEdges: Lattice3DEdge[];
} {
  const n = transactions.length;
  const stages: AprioriStepStage[] = [];
  const allFrequent: FrequentItemset[] = [];
  const uniqueItems = getAllUniqueItems(transactions);

  const latticeNodeMap = new Map<string, Lattice3DNode>();
  const latticeEdges: Lattice3DEdge[] = [];

  // Stage 1: C1 Candidates
  const c1Candidates = uniqueItems.map((item) => {
    const count = countItemsetInTransactions([item], transactions);
    const support = n > 0 ? count / n : 0;
    const isFrequent = support >= minSup;
    return {
      items: [item],
      count,
      support,
      isFrequent,
      prunedByApriori: false,
      pruneReason: isFrequent ? undefined : `支持度 ${support.toFixed(3)} < 阈值 ${minSup.toFixed(3)}`,
    };
  });

  const l1Frequent: FrequentItemset[] = c1Candidates
    .filter((c) => c.isFrequent)
    .map((c) => ({
      items: c.items,
      count: c.count,
      support: c.support,
      k: 1,
    }));

  stages.push({
    k: 1,
    phase: 'candidate_generation',
    candidates: c1Candidates,
    frequent: l1Frequent,
    description: `生成候选 1-项集 C₁ (${c1Candidates.length} 项)，扫描全表计数。经截断线筛选出 ${l1Frequent.length} 个频繁项集 L₁。`,
  });

  allFrequent.push(...l1Frequent);

  let currentFrequent = l1Frequent;
  let currentK = 2;

  while (currentFrequent.length > 0 && currentK <= maxK) {
    // 1. Join step: Generate Ck from L_{k-1}
    const candidateSets: string[][] = [];
    const prevFrequentStrings = new Set(currentFrequent.map((f) => f.items.sort().join('::')));

    for (let i = 0; i < currentFrequent.length; i++) {
      for (let j = i + 1; j < currentFrequent.length; j++) {
        const itemset1 = currentFrequent[i].items.slice().sort();
        const itemset2 = currentFrequent[j].items.slice().sort();

        // Check if first k-2 items are identical
        let canJoin = true;
        for (let idx = 0; idx < currentK - 2; idx++) {
          if (itemset1[idx] !== itemset2[idx]) {
            canJoin = false;
            break;
          }
        }

        if (canJoin) {
          const unionSet = Array.from(new Set([...itemset1, ...itemset2])).sort();
          if (unionSet.length === currentK) {
            const key = unionSet.join('::');
            if (!candidateSets.some((c) => c.join('::') === key)) {
              candidateSets.push(unionSet);
            }
          }
        }
      }
    }

    if (candidateSets.length === 0) break;

    // 2. Prune step by Apriori property (every k-1 subset must be frequent)
    const evaluatedCandidates: AprioriStepStage['candidates'] = [];
    const validCandidatesForCounting: string[][] = [];

    for (const cand of candidateSets) {
      // Generate all (k-1) subsets
      let prunedByApriori = false;
      let failedSubsetStr = '';

      for (let idx = 0; idx < cand.length; idx++) {
        const subset = cand.filter((_, i) => i !== idx).sort();
        const subKey = subset.join('::');
        if (!prevFrequentStrings.has(subKey)) {
          prunedByApriori = true;
          failedSubsetStr = subset.join(', ');
          break;
        }
      }

      if (prunedByApriori) {
        evaluatedCandidates.push({
          items: cand,
          count: 0,
          support: 0,
          isFrequent: false,
          prunedByApriori: true,
          pruneReason: `先验剪枝：其子集 {${failedSubsetStr}} 非频繁`,
        });
      } else {
        const count = countItemsetInTransactions(cand, transactions);
        const support = n > 0 ? count / n : 0;
        const isFrequent = support >= minSup;
        evaluatedCandidates.push({
          items: cand,
          count,
          support,
          isFrequent,
          prunedByApriori: false,
          pruneReason: isFrequent
            ? undefined
            : `支持度 ${support.toFixed(3)} < 截断阈值 ${minSup.toFixed(3)}`,
        });
        if (isFrequent) {
          validCandidatesForCounting.push(cand);
        }
      }
    }

    const nextFrequent: FrequentItemset[] = evaluatedCandidates
      .filter((c) => c.isFrequent)
      .map((c) => ({
        items: c.items,
        count: c.count,
        support: c.support,
        k: currentK,
      }));

    stages.push({
      k: currentK,
      phase: 'pruning',
      candidates: evaluatedCandidates,
      frequent: nextFrequent,
      description: `由 L${currentK - 1} 连接生成 ${candidateSets.length} 个 ${currentK}-项候选集。先验剪枝移除 ${
        evaluatedCandidates.filter((c) => c.prunedByApriori).length
      } 个，支持度截断排除 ${
        evaluatedCandidates.filter((c) => !c.prunedByApriori && !c.isFrequent).length
      } 个，最终留存频繁项集 L${currentK} 共 ${nextFrequent.length} 个。`,
    });

    allFrequent.push(...nextFrequent);
    currentFrequent = nextFrequent;
    currentK++;
  }

  // Construct Lattice Graph for 2D & 3D display
  // Base Level 0 (Empty set)
  latticeNodeMap.set('ROOT', {
    id: 'ROOT',
    items: ['∅ 空集'],
    k: 0,
    x: 0,
    y: 180,
    z: 0,
    x2d: 0,
    y2d: 40,
    count: n,
    support: 1.0,
    status: 'frequent',
  });

  stages.forEach((stage) => {
    const k = stage.k;
    const candidates = stage.candidates;
    const countOnLevel = candidates.length;
    const y = 180 - k * 110; // 3D layer
    const radius = Math.min(220, 60 + countOnLevel * 18);

    // 2D Coordinates: clean horizontal distribution across layered tiers
    const y2d = 40 + k * 140;
    const nodeSpacing2d = Math.max(120, Math.min(190, 960 / Math.max(countOnLevel, 1)));
    const totalWidth2d = (countOnLevel - 1) * nodeSpacing2d;
    const startX2d = -totalWidth2d / 2;

    candidates.forEach((cand, idx) => {
      const angle = (idx / Math.max(countOnLevel, 1)) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const id = cand.items.slice().sort().join('::');

      const x2d = startX2d + idx * nodeSpacing2d;

      let status: Lattice3DNode['status'] = 'frequent';
      if (cand.prunedByApriori) status = 'pruned_by_property';
      else if (!cand.isFrequent) status = 'pruned_by_cutoff';

      // Record (k-1) subsets and frequent verification
      const subsets =
        k > 1
          ? cand.items.map((_, skipIdx) => {
              const sub = cand.items.filter((_, i) => i !== skipIdx).sort();
              const subId = sub.join('::');
              const parentNode = latticeNodeMap.get(subId);
              const isFreq = parentNode ? parentNode.status === 'frequent' : false;
              return {
                items: sub,
                name: sub.join('·'),
                isFrequent: isFreq,
              };
            })
          : undefined;

      latticeNodeMap.set(id, {
        id,
        items: cand.items,
        k,
        x,
        y,
        z,
        x2d,
        y2d,
        count: cand.count,
        support: cand.support,
        status,
        pruneReason: cand.pruneReason,
        subsets,
      });

      // Connect to L0 if k=1
      if (k === 1) {
        latticeEdges.push({
          sourceId: 'ROOT',
          targetId: id,
          isPruned: status !== 'frequent',
        });
      } else {
        // Connect to parent (k-1) subsets
        cand.items.forEach((_, skipIdx) => {
          const parentItems = cand.items.filter((_, i) => i !== skipIdx);
          const parentId = parentItems.join('::');
          if (latticeNodeMap.has(parentId)) {
            latticeEdges.push({
              sourceId: parentId,
              targetId: id,
              isPruned: status !== 'frequent',
            });
          }
        });
      }
    });
  });

  return {
    stages,
    allFrequent,
    latticeNodes: Array.from(latticeNodeMap.values()),
    latticeEdges,
  };
}
