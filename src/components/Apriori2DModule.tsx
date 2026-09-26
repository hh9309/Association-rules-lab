import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, DatasetCase } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Scissors, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  HelpCircle,
  Shuffle,
  GitBranch,
  Table as TableIcon,
  BarChart3,
  Sliders,
  Check,
  Compass
} from 'lucide-react';

interface Apriori2DModuleProps {
  currentCase: DatasetCase;
  transactions: Transaction[];
  minSup: number;
  setMinSup: (val: number) => void;
}

// 4-item representation node
export interface Lattice4DNode {
  id: string; // e.g. "A::B"
  items: string[]; // e.g. ["A", "B"]
  level: number; // 0, 1, 2, 3, 4
  x: number;
  y: number;
  count: number;
  support: number;
  status: 'unvisited' | 'candidate' | 'frequent' | 'pruned_by_property' | 'pruned_by_cutoff';
  pruneReason?: string;
  subsets: string[]; // subset node IDs
  supersets: string[]; // superset node IDs
}

export interface Lattice4DEdge {
  id: string;
  source: string;
  target: string;
  isPruned: boolean;
}

export const Apriori2DModule: React.FC<Apriori2DModuleProps> = ({
  currentCase,
  transactions,
  minSup,
  setMinSup,
}) => {
  // Mode: 'symbolic' (A, B, C, D) or 'real' (面包, 牛奶, 尿布, 啤酒)
  const [labelMode, setLabelMode] = useState<'symbolic' | 'hybrid' | 'real'>('hybrid');

  // Pruning Scenario Mode:
  // 'classic': Textbook scenario where item D is below min_sup, pruning a massive cone of 7 supersets!
  // 'real': Using actual counts computed from the current transaction database
  // 'balanced': Balanced threshold scenario
  const [scenario, setScenario] = useState<'classic' | 'real' | 'balanced'>('classic');

  // Active step in Apriori:
  // 0 = 初始状态 (仅空集基底)
  // 1 = 第 1 阶 (k=1 单项集评估与剪枝)
  // 2 = 第 2 阶 (k=2 候选集连接与先验剪枝 ✂️)
  // 3 = 第 3 阶 (k=3 候选集连接与先验剪枝 ✂️)
  // 4 = 第 4 阶 (k=4 候选集连接与先验剪枝 ✂️)
  const [activeK, setActiveK] = useState<number>(4);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Active view tab: 'lattice' (2D 格树拓扑), 'matrix' (剪枝对比矩阵), 'reduction' (空间削减效率)
  const [viewTab, setViewTab] = useState<'lattice' | 'matrix' | 'reduction'>('lattice');

  // Top 4 representative items from the current case
  const top4Items = useMemo(() => {
    // Count occurrences of each item in transactions
    const counts = new Map<string, number>();
    transactions.forEach((t) => {
      t.items.forEach((it) => {
        counts.set(it, (counts.get(it) || 0) + 1);
      });
    });

    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);

    const defaultNames = ['面包', '牛奶', '尿布', '啤酒'];
    const chosen = sorted.slice(0, 4);
    while (chosen.length < 4) {
      chosen.push(defaultNames[chosen.length] || `商品-${chosen.length + 1}`);
    }
    return chosen;
  }, [transactions]);

  // Symbol mapping A, B, C, D
  const itemMap = useMemo(() => {
    return {
      A: top4Items[0],
      B: top4Items[1],
      C: top4Items[2],
      D: top4Items[3],
    };
  }, [top4Items]);

  // Helper to format itemset text
  const formatItemset = useCallback(
    (letters: string[]) => {
      if (letters.length === 0) return '∅ (空集)';
      if (labelMode === 'symbolic') {
        return `{${letters.join(', ')}}`;
      }
      if (labelMode === 'real') {
        return `{${letters.map((L) => itemMap[L as keyof typeof itemMap]?.split(' ')[0] || L).join(', ')}}`;
      }
      // Hybrid
      return `{${letters
        .map((L) => `${L}:${itemMap[L as keyof typeof itemMap]?.split(' ')[0] || L}`)
        .join(', ')}}`;
    },
    [labelMode, itemMap]
  );

  // Compute Support for any subset of {A, B, C, D} based on chosen scenario
  const computeSupport = useCallback(
    (letters: string[]): { count: number; support: number } => {
      const n = transactions.length || 100;
      if (letters.length === 0) return { count: n, support: 1.0 };

      if (scenario === 'classic') {
        // Classic textbook 4-itemset scenario:
        // A, B, C are high support (frequent).
        // D is low support (below min_sup, e.g. 0.20 when min_sup=0.30)!
        // This triggers the classic Apriori cascade pruning on all 7 supersets of D!
        const effectiveMinSup = minSup;
        const letterKey = letters.slice().sort().join('');

        if (letters.length === 1) {
          if (letters[0] === 'A') return { count: Math.round(n * 0.70), support: 0.70 };
          if (letters[0] === 'B') return { count: Math.round(n * 0.65), support: 0.65 };
          if (letters[0] === 'C') return { count: Math.round(n * 0.55), support: 0.55 };
          if (letters[0] === 'D') return { count: Math.round(n * (effectiveMinSup * 0.65)), support: Number((effectiveMinSup * 0.65).toFixed(2)) }; // below min_sup!
        }
        if (letters.length === 2) {
          if (letterKey === 'AB') return { count: Math.round(n * 0.50), support: 0.50 };
          if (letterKey === 'AC') return { count: Math.round(n * 0.45), support: 0.45 };
          if (letterKey === 'BC') return { count: Math.round(n * 0.40), support: 0.40 };
          // Any pair with D is low
          return { count: Math.round(n * 0.15), support: 0.15 };
        }
        if (letters.length === 3) {
          if (letterKey === 'ABC') return { count: Math.round(n * 0.35), support: 0.35 };
          return { count: Math.round(n * 0.10), support: 0.10 };
        }
        if (letters.length === 4) {
          return { count: Math.round(n * 0.08), support: 0.08 };
        }
      } else if (scenario === 'balanced') {
        // Balanced scenario: A, B, C, D all frequent singletons, but CD and BD are below minSup
        const letterKey = letters.slice().sort().join('');
        if (letters.length === 1) {
          return { count: Math.round(n * 0.60), support: 0.60 };
        }
        if (letters.length === 2) {
          if (['AB', 'AC', 'BC'].includes(letterKey)) return { count: Math.round(n * 0.45), support: 0.45 };
          return { count: Math.round(n * 0.20), support: 0.20 };
        }
        if (letters.length === 3) {
          if (letterKey === 'ABC') return { count: Math.round(n * 0.35), support: 0.35 };
          return { count: Math.round(n * 0.10), support: 0.10 };
        }
        return { count: Math.round(n * 0.05), support: 0.05 };
      }

      // Real Dataset projection
      const realItems = letters.map((L) => itemMap[L as keyof typeof itemMap]);
      let matchCount = 0;
      transactions.forEach((t) => {
        const hasAll = realItems.every((it) => t.items.includes(it));
        if (hasAll) matchCount++;
      });
      return {
        count: matchCount,
        support: Number((matchCount / n).toFixed(2)),
      };
    },
    [scenario, transactions, minSup, itemMap]
  );

  // Construct the 16-node Hasse Lattice of {A, B, C, D}
  const { nodes, edges } = useMemo(() => {
    // 5 Tiers:
    // Level 0: [] (1)
    // Level 1: [A], [B], [C], [D] (4)
    // Level 2: [AB], [AC], [AD], [BC], [BD], [CD] (6)
    // Level 3: [ABC], [ABD], [ACD], [BCD] (4)
    // Level 4: [ABCD] (1)

    const rawLevels: string[][] = [
      [''],
      ['A', 'B', 'C', 'D'],
      ['AB', 'AC', 'AD', 'BC', 'BD', 'CD'],
      ['ABC', 'ABD', 'ACD', 'BCD'],
      ['ABCD'],
    ];

    // Coordinates layout on a 880x480 coordinate space
    const levelY = [35, 125, 225, 330, 425];
    const nodeMap = new Map<string, Lattice4DNode>();
    const edgeList: Lattice4DEdge[] = [];

    // Helper: generate subsets of length k-1
    const getSubsets = (letters: string[]): string[] => {
      if (letters.length <= 1) return ['ROOT'];
      const res: string[] = [];
      for (let i = 0; i < letters.length; i++) {
        const sub = letters.filter((_, idx) => idx !== i);
        res.push(sub.join(''));
      }
      return res;
    };

    // Helper: generate supersets of length k+1
    const allSymbols = ['A', 'B', 'C', 'D'];
    const getSupersets = (letters: string[]): string[] => {
      if (letters.length === 0) return ['A', 'B', 'C', 'D'];
      if (letters.length >= 4) return [];
      const set = new Set(letters);
      const res: string[] = [];
      allSymbols.forEach((s) => {
        if (!set.has(s)) {
          const sup = [...letters, s].sort().join('');
          res.push(sup);
        }
      });
      return res;
    };

    // 1. Instantiate all 16 nodes
    rawLevels.forEach((tier, lvl) => {
      const countOnTier = tier.length;
      const y = levelY[lvl];

      // Calculate horizontal x distribution
      tier.forEach((key, idx) => {
        const letters = key === '' ? [] : key.split('');
        const id = key === '' ? 'ROOT' : key;

        let x = 440;
        if (countOnTier === 4) {
          const spacing = 160;
          x = 440 + (idx - 1.5) * spacing;
        } else if (countOnTier === 6) {
          const spacing = 125;
          x = 440 + (idx - 2.5) * spacing;
        }

        const metrics = computeSupport(letters);

        nodeMap.set(id, {
          id,
          items: letters,
          level: lvl,
          x,
          y,
          count: metrics.count,
          support: metrics.support,
          status: 'unvisited',
          subsets: getSubsets(letters),
          supersets: getSupersets(letters),
        });
      });
    });

    // 2. Compute Apriori status level by level up to activeK
    // Root Level 0
    const root = nodeMap.get('ROOT');
    if (root) root.status = 'frequent';

    // Levels 1 to 4
    for (let k = 1; k <= 4; k++) {
      const tierKeys = rawLevels[k];

      tierKeys.forEach((key) => {
        const node = nodeMap.get(key);
        if (!node) return;

        if (k > activeK) {
          node.status = 'unvisited';
          return;
        }

        if (k === 1) {
          // Singleton: check min_sup directly
          if (node.support >= minSup) {
            node.status = 'frequent';
            node.pruneReason = `支持度 ${(node.support * 100).toFixed(0)}% ≥ 设定阈值 ${(minSup * 100).toFixed(0)}%，入选频繁项集 L₁`;
          } else {
            node.status = 'pruned_by_cutoff';
            node.pruneReason = `支持度 ${(node.support * 100).toFixed(0)}% < 设定阈值 ${(minSup * 100).toFixed(0)}%，支持度不足淘汰`;
          }
        } else {
          // k >= 2: Apriori Property Check first!
          // Check all (k-1) subsets
          const parentNodes = node.subsets.map((sid) => nodeMap.get(sid));
          const nonFrequentParent = parentNodes.find((p) => p && p.status !== 'frequent');

          if (nonFrequentParent) {
            // Pruned by Apriori Property (NO NEED TO SCAN DATABASE!)
            node.status = 'pruned_by_property';
            node.pruneReason = `先验剪枝 ✂️：其直接子集 {${nonFrequentParent.items.join(', ')}} 非频繁。根据先验性质逆否定理，该超集必然非频繁，直接先验剪除，无需扫描数据库！`;
          } else {
            // All subsets frequent! Candidate generated. Now evaluate support!
            if (node.support >= minSup) {
              node.status = 'frequent';
              node.pruneReason = `全集子项均频繁且经数据库扫描支持度 ${(node.support * 100).toFixed(0)}% ≥ ${(minSup * 100).toFixed(0)}%，晋升频繁项集 L_${k}`;
            } else {
              node.status = 'pruned_by_cutoff';
              node.pruneReason = `所有子集均频繁，但扫描全量数据库后支持度 ${(node.support * 100).toFixed(0)}% < ${(minSup * 100).toFixed(0)}%，频数不足截断`;
            }
          }
        }
      });
    }

    // 3. Construct Edges between adjacent levels
    // Root to Level 1
    rawLevels[1].forEach((k1) => {
      edgeList.push({
        id: `ROOT->${k1}`,
        source: 'ROOT',
        target: k1,
        isPruned: nodeMap.get(k1)?.status === 'pruned_by_cutoff',
      });
    });

    // Between k and k+1
    for (let k = 1; k < 4; k++) {
      rawLevels[k].forEach((srcKey) => {
        const srcNode = nodeMap.get(srcKey);
        if (!srcNode) return;

        srcNode.supersets.forEach((tgtKey) => {
          const tgtNode = nodeMap.get(tgtKey);
          if (!tgtNode) return;

          const isPruned =
            srcNode.status !== 'frequent' ||
            tgtNode.status === 'pruned_by_property' ||
            tgtNode.status === 'pruned_by_cutoff';

          edgeList.push({
            id: `${srcKey}->${tgtKey}`,
            source: srcKey,
            target: tgtKey,
            isPruned,
          });
        });
      });
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges: edgeList,
    };
  }, [computeSupport, activeK, minSup]);

  // Node Map for fast lookup
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Currently selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodeMap.get(selectedNodeId) || null;
  }, [selectedNodeId, nodeMap]);

  // Compute pruned cone (all descendants) if hovering/clicking a pruned node
  const activePrunedCone = useMemo(() => {
    const focusId = hoveredNodeId || selectedNodeId;
    if (!focusId || focusId === 'ROOT') return new Set<string>();

    const focusNode = nodeMap.get(focusId);
    if (!focusNode || (focusNode.status !== 'pruned_by_property' && focusNode.status !== 'pruned_by_cutoff')) {
      return new Set<string>();
    }

    // Breadth-first search to find all supersets (descendants)
    const cone = new Set<string>();
    const queue = [focusId];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      cone.add(curr);
      const currNode = nodeMap.get(curr);
      if (currNode) {
        currNode.supersets.forEach((sup) => {
          if (!cone.has(sup)) {
            queue.push(sup);
          }
        });
      }
    }

    return cone;
  }, [hoveredNodeId, selectedNodeId, nodeMap]);

  // Auto-play stepper through k = 1 to 4
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveK((prev) => {
        if (prev >= 4) {
          setIsPlaying(false);
          return 4;
        }
        return prev + 1;
      });
    }, 2400);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Pruning Efficiency Statistics
  const stats = useMemo(() => {
    const nonRoot = nodes.filter((n) => n.id !== 'ROOT');
    const total = 15; // 2^4 - 1
    const evaluated = nonRoot.filter((n) => n.level <= activeK);
    const frequent = evaluated.filter((n) => n.status === 'frequent').length;
    const prunedByProperty = evaluated.filter((n) => n.status === 'pruned_by_property').length;
    const prunedByCutoff = evaluated.filter((n) => n.status === 'pruned_by_cutoff').length;
    const unvisited = total - evaluated.length;
    const reductionPct = Math.round((prunedByProperty / total) * 100);

    return {
      total,
      frequent,
      prunedByProperty,
      prunedByCutoff,
      unvisited,
      reductionPct,
    };
  }, [nodes, activeK]);

  return (
    <div className="space-y-6">
      {/* Header Slice */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-stone-400">模块 02</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-medium text-teal-700">经典四项集格空间剪枝</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <span>Apriori 四项集格树逐层连接与先验剪枝演播</span>
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-normal font-sans">
                <Scissors className="w-3 h-3 text-red-600" />
                <span>16 节点哈斯图 (Hasse Diagram)</span>
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl leading-relaxed">
              数据挖掘权威教科书经典范式：以包含 4 个核心商品 <code>&#123;A, B, C, D&#125;</code> 的 16 节点项集格空间为载体，
              清晰展现<strong>“非频繁子集之超集皆非频繁”</strong>的向下封闭性（Downward Closure）与先验剪枝裁切全景。
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 text-xs bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2">
            <div>
              <span className="text-stone-400 text-[10px] block">先验性质直接省除</span>
              <span className="font-mono font-bold text-red-600 text-sm">
                {stats.prunedByProperty} 个超集免扫库
              </span>
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div>
              <span className="text-stone-400 text-[10px] block">空间削减压缩率</span>
              <span className="font-mono font-bold text-teal-700 text-sm">
                {stats.reductionPct}% 削减
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Visualizer Canvas (8 cols) + Detail Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 2D Hasse Lattice Visualizer (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-lg p-4 flex flex-col shadow-xs">
          {/* Top Bar: View Tabs & Scenario Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-stone-100 text-xs">
            {/* View Tabs */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-md">
              <button
                onClick={() => setViewTab('lattice')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                  viewTab === 'lattice'
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-teal-600" />
                <span>2D 四项集格树拓扑</span>
              </button>
              <button
                onClick={() => setViewTab('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                  viewTab === 'matrix'
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>16 项集状态判别表</span>
              </button>
              <button
                onClick={() => setViewTab('reduction')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                  viewTab === 'reduction'
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                <span>剪枝效率与空间压缩</span>
              </button>
            </div>

            {/* Presets & Display Format */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border border-stone-200 rounded p-0.5 bg-stone-50 text-[11px]">
                <span className="text-stone-400 pl-1 text-[10px]">模式:</span>
                <button
                  onClick={() => setScenario('classic')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    scenario === 'classic'
                      ? 'bg-stone-900 text-white font-medium shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="教科书经典场景：D 为非频繁项，导致 7 个超集瞬间被一网打尽全部先验剪枝！"
                >
                  经典示范(D非频)
                </button>
                <button
                  onClick={() => setScenario('real')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    scenario === 'real'
                      ? 'bg-stone-900 text-white font-medium shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="使用当前数据集真实交易支持度演算"
                >
                  真实案例数据
                </button>
              </div>

              {/* Label Format */}
              <div className="flex items-center border border-stone-200 rounded overflow-hidden text-[11px]">
                <button
                  onClick={() => setLabelMode('symbolic')}
                  className={`px-2 py-1 cursor-pointer ${labelMode === 'symbolic' ? 'bg-teal-700 text-white font-bold' : 'bg-white text-stone-600'}`}
                  title="显示代号 A, B, C, D"
                >
                  ABCD
                </button>
                <button
                  onClick={() => setLabelMode('hybrid')}
                  className={`px-2 py-1 cursor-pointer ${labelMode === 'hybrid' ? 'bg-teal-700 text-white font-bold' : 'bg-white text-stone-600'}`}
                  title="显示代号+商品名称"
                >
                  混排
                </button>
                <button
                  onClick={() => setLabelMode('real')}
                  className={`px-2 py-1 cursor-pointer ${labelMode === 'real' ? 'bg-teal-700 text-white font-bold' : 'bg-white text-stone-600'}`}
                  title="显示纯商品名称"
                >
                  商品名
                </button>
              </div>
            </div>
          </div>

          {/* VIEW TAB 1: 2D Hasse Diagram Canvas / SVG */}
          {viewTab === 'lattice' && (
            <div className="relative w-full h-[510px] bg-stone-50/70 rounded-lg border border-stone-200 overflow-hidden select-none">
              {/* Dynamic SVG Lattice Diagram */}
              <svg
                viewBox="0 0 880 480"
                className="w-full h-full block"
              >
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#e2e8f0" />
                  </pattern>
                </defs>
                <rect width="880" height="480" fill="url(#dotGrid)" />

                {/* Level Tier Guides */}
                {[
                  { lvl: 0, label: '基底 ∅ (空集)', y: 35 },
                  { lvl: 1, label: 'k = 1 阶 (单项集 4 项)', y: 125 },
                  { lvl: 2, label: 'k = 2 阶 (2-项集 6 项)', y: 225 },
                  { lvl: 3, label: 'k = 3 阶 (3-项集 4 项)', y: 330 },
                  { lvl: 4, label: 'k = 4 阶 (4-项集 1 项)', y: 425 },
                ].map((guide) => (
                  <g key={guide.lvl}>
                    <line
                      x1="40"
                      y1={guide.y}
                      x2="840"
                      y2={guide.y}
                      stroke={guide.lvl <= activeK ? 'rgba(203, 213, 225, 0.7)' : 'rgba(226, 232, 240, 0.4)'}
                      strokeDasharray="4 6"
                      strokeWidth="1"
                    />
                    <text
                      x="48"
                      y={guide.y - 6}
                      fill={guide.lvl <= activeK ? '#64748b' : '#cbd5e1'}
                      fontSize="9.5"
                      fontFamily="monospace"
                    >
                      {guide.label}
                    </text>
                  </g>
                ))}

                {/* Edges */}
                {edges.map((edge) => {
                  const src = nodeMap.get(edge.source);
                  const tgt = nodeMap.get(edge.target);
                  if (!src || !tgt) return null;

                  // Visibility based on activeK
                  if (tgt.level > activeK) return null;

                  const isConePruned = activePrunedCone.has(src.id) || activePrunedCone.has(tgt.id);
                  const isSelectedRelation =
                    selectedNode &&
                    (selectedNode.id === src.id ||
                      selectedNode.id === tgt.id ||
                      selectedNode.subsets.includes(src.id) ||
                      selectedNode.supersets.includes(tgt.id));

                  // Path coordinates
                  const x1 = src.x;
                  const y1 = src.y + 14;
                  const x2 = tgt.x;
                  const y2 = tgt.y - 14;
                  const midY = (y1 + y2) / 2;

                  let stroke = '#cbd5e1';
                  let strokeWidth = 1.2;
                  let strokeDasharray = '';

                  if (isConePruned || tgt.status === 'pruned_by_property') {
                    stroke = '#ef4444';
                    strokeWidth = 2;
                    strokeDasharray = '4 4';
                  } else if (tgt.status === 'frequent' && src.status === 'frequent') {
                    stroke = isSelectedRelation ? '#0d9488' : '#14b8a6';
                    strokeWidth = isSelectedRelation ? 2.5 : 1.8;
                  } else if (tgt.status === 'pruned_by_cutoff') {
                    stroke = '#94a3b8';
                    strokeWidth = 1.2;
                    strokeDasharray = '3 3';
                  }

                  return (
                    <g key={edge.id}>
                      <path
                        d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        opacity={isConePruned ? 0.9 : 0.75}
                      />

                      {/* Animated Scissor marker on pruned edges */}
                      {tgt.status === 'pruned_by_property' && tgt.level > 1 && (
                        <text
                          x={(x1 + x2) / 2}
                          y={midY + 2}
                          fill="#ef4444"
                          fontSize="11"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          ✂
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const isVisible = node.level <= activeK;
                  if (!isVisible) {
                    // Unvisited ghost placeholder
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        opacity={0.35}
                      >
                        <rect
                          x={node.id === 'ROOT' ? -35 : -48}
                          y={-14}
                          width={node.id === 'ROOT' ? 70 : 96}
                          height={28}
                          rx={5}
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                          strokeDasharray="2 3"
                          strokeWidth="1"
                        />
                        <text
                          x={0}
                          y={3}
                          fill="#94a3b8"
                          fontSize="10"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {formatItemset(node.items)}
                        </text>
                      </g>
                    );
                  }

                  const isSelected = selectedNodeId === node.id;
                  const isHovered = hoveredNodeId === node.id;
                  const isRoot = node.id === 'ROOT';
                  const isConePruned = activePrunedCone.has(node.id);

                  const cardW = isRoot ? 80 : 108;
                  const cardH = isRoot ? 28 : 38;

                  let fill = '#f8fafc';
                  let stroke = '#cbd5e1';
                  let strokeWidth = 1.2;
                  let strokeDasharray = '';
                  let textColor = '#1e293b';
                  let badgeText = '';
                  let badgeColor = '#64748b';

                  if (isRoot) {
                    fill = '#1e293b';
                    stroke = '#0f172a';
                    textColor = '#ffffff';
                  } else if (node.status === 'frequent') {
                    fill = isSelected ? '#ccfbf1' : '#f0fdfa';
                    stroke = isSelected ? '#0d9488' : '#2dd4bf';
                    strokeWidth = isSelected ? 2.5 : 1.6;
                    textColor = '#134e4a';
                    badgeText = `✓ 频繁 (${(node.support * 100).toFixed(0)}%)`;
                    badgeColor = '#0f766e';
                  } else if (node.status === 'pruned_by_property' || isConePruned) {
                    fill = isSelected ? '#fee2e2' : '#fef2f2';
                    stroke = isSelected ? '#dc2626' : '#ef4444';
                    strokeWidth = isSelected ? 2.5 : 1.6;
                    strokeDasharray = '3 2';
                    textColor = '#991b1b';
                    badgeText = `✂ 先验剪除`;
                    badgeColor = '#b91c1c';
                  } else if (node.status === 'pruned_by_cutoff') {
                    fill = isSelected ? '#e2e8f0' : '#f1f5f9';
                    stroke = isSelected ? '#475569' : '#94a3b8';
                    strokeWidth = isSelected ? 2 : 1.2;
                    strokeDasharray = '3 2';
                    textColor = '#475569';
                    badgeText = `✗ 截断 (${(node.support * 100).toFixed(0)}%)`;
                    badgeColor = '#64748b';
                  }

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setSelectedNodeId(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      className="cursor-pointer transition-transform hover:scale-105"
                    >
                      {/* Card Base */}
                      <rect
                        x={-cardW / 2}
                        y={-cardH / 2}
                        width={cardW}
                        height={cardH}
                        rx={6}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                      />

                      {/* Diagonal Slash line if pruned */}
                      {(node.status === 'pruned_by_property' || isConePruned) && (
                        <line
                          x1={-cardW / 2 + 6}
                          y1={cardH / 2 - 4}
                          x2={cardW / 2 - 6}
                          y2={-cardH / 2 + 4}
                          stroke="rgba(239, 68, 68, 0.4)"
                          strokeWidth="2"
                        />
                      )}

                      {/* Main Item Text */}
                      <text
                        x={0}
                        y={isRoot ? 4 : -2}
                        fill={textColor}
                        fontSize={isRoot ? '11' : '10.5'}
                        fontWeight={isSelected ? 'bold' : '600'}
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {formatItemset(node.items)}
                      </text>

                      {/* Status Badge Text */}
                      {!isRoot && (
                        <text
                          x={0}
                          y={12}
                          fill={badgeColor}
                          fontSize="8.5"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {badgeText}
                        </text>
                      )}

                      {/* Selection Aura */}
                      {(isSelected || isHovered) && (
                        <rect
                          x={-cardW / 2 - 3}
                          y={-cardH / 2 - 3}
                          width={cardW + 6}
                          height={cardH + 6}
                          rx={8}
                          fill="none"
                          stroke={isSelected ? '#0d9488' : '#94a3b8'}
                          strokeWidth="1.5"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Floating Bottom-Left Legend */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-stone-200 rounded-lg p-2.5 text-[11px] space-y-1.5 shadow-xs">
                <div className="font-semibold text-stone-800 text-[10px] uppercase tracking-wider mb-1">
                  节点判别图例
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-teal-100 border border-teal-600 inline-block" />
                  <span className="text-teal-900 font-medium">频繁项集 (L_k, s ≥ min_sup)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-100 border border-dashed border-red-500 inline-block" />
                  <span className="text-red-700 font-medium">✂ 先验剪除 (直接子集非频，免扫库)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-stone-100 border border-dashed border-stone-400 inline-block" />
                  <span className="text-stone-600">✗ 支持度不足 (扫库后截断淘汰)</span>
                </div>
              </div>

              {/* Floating Hint Overlay on Canvas */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-stone-200 rounded px-2.5 py-1 text-[11px] text-stone-600 shadow-xs flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                <span>悬停或点击任意节点，观察其子集溯源与上方/下方剪枝锥体</span>
              </div>
            </div>
          )}

          {/* VIEW TAB 2: Matrix Breakdown Table */}
          {viewTab === 'matrix' && (
            <div className="w-full h-[510px] overflow-auto border border-stone-200 rounded-lg bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50 text-stone-600 font-semibold sticky top-0 border-b border-stone-200 z-10 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">阶数 (k)</th>
                    <th className="py-2.5 px-3">候选项集 (Candidate C_k)</th>
                    <th className="py-2.5 px-3">直接子集检验 (Subsets)</th>
                    <th className="py-2.5 px-3">先验性质剪枝状态</th>
                    <th className="py-2.5 px-3 text-right">支持度 Supp</th>
                    <th className="py-2.5 px-3">最终判决</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-xs">
                  {nodes
                    .filter((n) => n.id !== 'ROOT')
                    .map((node) => {
                      const isFrequent = node.status === 'frequent';
                      const isPruned = node.status === 'pruned_by_property';
                      const isSelected = selectedNodeId === node.id;

                      return (
                        <tr
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`hover:bg-teal-50/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-teal-50/80 font-bold' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-stone-500 font-mono">k={node.level}</td>
                          <td className="py-2 px-3 font-medium text-stone-900 font-sans">
                            {formatItemset(node.items)}
                          </td>
                          <td className="py-2 px-3 text-[11px] font-sans">
                            {node.level === 1 ? (
                              <span className="text-stone-400">单项基准</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {node.subsets.map((sid) => {
                                  const subNode = nodeMap.get(sid);
                                  const isSubFreq = subNode?.status === 'frequent';
                                  return (
                                    <span
                                      key={sid}
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                                        isSubFreq
                                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                          : 'bg-red-50 text-red-700 border border-red-200'
                                      }`}
                                    >
                                      {sid} {isSubFreq ? '✓' : '✗'}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            {isPruned ? (
                              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px] font-medium">
                                <Scissors className="w-3 h-3 text-red-600" />
                                <span>先验剪枝 ✂️ (免扫库)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                <span>子集全频 (进入扫库)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isPruned ? (
                              <span className="text-stone-400">---</span>
                            ) : (
                              <span className="text-stone-800">
                                {(node.support * 100).toFixed(0)}%
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            {isFrequent ? (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                                ✓ 晋升 L_{node.level}
                              </span>
                            ) : isPruned ? (
                              <span className="text-red-700 text-[11px]">✂ 提前剪除</span>
                            ) : (
                              <span className="text-stone-500 text-[11px]">✗ 支持度截断</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW TAB 3: Space Reduction Quantified */}
          {viewTab === 'reduction' && (
            <div className="w-full h-[510px] p-5 border border-stone-200 rounded-lg bg-stone-50 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>四项集组合空间先验削减效应</span>
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    在无剪枝策略下，一个 4 元素的集合总共有 <strong>2⁴ - 1 = 15 个</strong> 非空候选组合需要进行全量事务扫描。
                    而在当前先验性质约束下，由于部分单项或 2-项集非频繁，算法直接跳过了{' '}
                    <strong className="text-red-600">{stats.prunedByProperty} 个高阶超集</strong> 的计算与数据库扫描！
                  </p>
                </div>

                {/* Level Breakdown Histogram */}
                <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
                  <h5 className="text-xs font-semibold text-stone-800">各阶项集筛选分布对比</h5>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((k) => {
                      const tierNodes = nodes.filter((n) => n.level === k);
                      const total = tierNodes.length;
                      const freq = tierNodes.filter((n) => n.status === 'frequent').length;
                      const pruned = tierNodes.filter((n) => n.status === 'pruned_by_property').length;
                      const cutoff = tierNodes.filter((n) => n.status === 'pruned_by_cutoff').length;

                      return (
                        <div key={k} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-stone-800">
                              k = {k} 阶 ({total} 个组合)
                            </span>
                            <span className="text-teal-700 font-bold font-mono">
                              {freq} 个入选 L_{k}
                            </span>
                          </div>
                          <div className="h-4 bg-stone-100 rounded overflow-hidden flex">
                            <div
                              style={{ width: `${(freq / total) * 100}%` }}
                              className="bg-teal-600 h-full"
                              title={`频繁: ${freq}`}
                            />
                            <div
                              style={{ width: `${(pruned / total) * 100}%` }}
                              className="bg-red-500 h-full"
                              title={`先验剪枝: ${pruned}`}
                            />
                            <div
                              style={{ width: `${(cutoff / total) * 100}%` }}
                              className="bg-stone-300 h-full"
                              title={`截断: ${cutoff}`}
                            />
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-stone-500">
                            <span>频繁: {freq}</span>
                            <span>先验剪枝: {pruned}</span>
                            <span>截断淘汰: {cutoff}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quantified Summary Banner */}
              <div className="bg-teal-900 text-teal-50 rounded-lg p-4 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white">
                    搜索空间剪除率: {stats.reductionPct}%
                  </div>
                  <div className="text-teal-200 text-[11px] mt-0.5">
                    先验性质直接省免了 {stats.prunedByProperty} 次无意义的超集全表扫描！
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-teal-300 text-[10px]">实际存留 / 组合总数</div>
                  <div className="text-sm font-bold text-white">
                    {stats.frequent} / {stats.total}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Step Control Bar */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
            {/* Step Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveK((prev) => Math.max(0, prev - 1))}
                disabled={activeK === 0}
                className="p-1.5 border border-stone-200 rounded bg-stone-50 hover:bg-stone-100 disabled:opacity-40 text-stone-700 cursor-pointer"
                title="上一阶"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-medium cursor-pointer shadow-xs"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? '暂停演播' : '逐阶自动演播'}</span>
              </button>

              <button
                onClick={() => setActiveK((prev) => Math.min(4, prev + 1))}
                disabled={activeK >= 4}
                className="p-1.5 border border-stone-200 rounded bg-stone-50 hover:bg-stone-100 disabled:opacity-40 text-stone-700 cursor-pointer"
                title="下一阶"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Step Badges */}
              <div className="flex items-center gap-1 ml-2">
                {[0, 1, 2, 3, 4].map((step) => (
                  <button
                    key={step}
                    onClick={() => setActiveK(step)}
                    className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                      activeK === step
                        ? 'bg-teal-700 text-white font-bold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {step === 0 ? '∅基底' : `k=${step}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Min Sup Slider */}
            <div className="flex items-center gap-2 text-xs">
              <Scissors className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-600">最小支持度 (min_sup):</span>
              <input
                type="range"
                min="0.10"
                max="0.70"
                step="0.05"
                value={minSup}
                onChange={(e) => setMinSup(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-stone-200 rounded appearance-none cursor-pointer accent-teal-700"
              />
              <span className="font-mono text-teal-800 font-bold w-10">
                {(minSup * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Pruning Diagnostic Inspector & Educational Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Node Inspector Slice */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-900">
                项集节点深度剪枝归因检视
              </h3>
              {selectedNode && (
                <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-bold">
                  {selectedNode.level === 0 ? '基底' : `${selectedNode.level}-项集`}
                </span>
              )}
            </div>

            {selectedNode && selectedNode.id !== 'ROOT' ? (
              <div className="space-y-3 text-xs">
                {/* Item Content */}
                <div className="bg-stone-50 p-2.5 rounded border border-stone-100">
                  <div className="text-stone-400 text-[10px]">项集内容:</div>
                  <div className="text-stone-900 font-bold text-sm mt-0.5">
                    {formatItemset(selectedNode.items)}
                  </div>
                </div>

                {/* Subsets Pruning Trace */}
                {selectedNode.level > 1 && (
                  <div className="border border-stone-200 rounded p-2.5 bg-stone-50/70 space-y-1.5">
                    <div className="text-stone-600 font-medium text-[11px] flex items-center justify-between">
                      <span>(k-1) 阶直接子集完备性检验:</span>
                      <span className="text-[10px] text-stone-400">
                        共 {selectedNode.subsets.length} 个子集
                      </span>
                    </div>
                    <div className="space-y-1">
                      {selectedNode.subsets.map((subId) => {
                        const subNode = nodeMap.get(subId);
                        const isSubFreq = subNode?.status === 'frequent';
                        return (
                          <div
                            key={subId}
                            className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded border border-stone-100"
                          >
                            <span className="font-mono text-stone-700">
                              &#123;{subNode ? formatItemset(subNode.items) : subId}&#125;
                            </span>
                            {isSubFreq ? (
                              <span className="flex items-center gap-1 text-teal-700 font-medium text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                <span>频繁子集 (通过)</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 font-medium text-[10px]">
                                <XCircle className="w-3 h-3 text-red-500" />
                                <span>非频繁 (触发剪枝 ✂️)</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Support & Count Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-stone-50 p-2 rounded">
                    <span className="text-stone-400 text-[10px]">出现频数:</span>
                    <div className="font-mono font-bold text-stone-800">
                      {selectedNode.status === 'pruned_by_property' ? '免扫库' : `${selectedNode.count} 笔`}
                    </div>
                  </div>
                  <div className="bg-stone-50 p-2 rounded">
                    <span className="text-stone-400 text-[10px]">实际支持度:</span>
                    <div className="font-mono font-bold text-stone-800">
                      {(selectedNode.support * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Verdict Badge */}
                <div
                  className={`p-3 rounded text-[11px] leading-relaxed border ${
                    selectedNode.status === 'frequent'
                      ? 'bg-teal-50 border-teal-200 text-teal-900'
                      : selectedNode.status === 'pruned_by_property'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1 mb-1">
                    {selectedNode.status === 'frequent' && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-teal-700" />
                        <span>判定: 频繁项集 (晋升 L_{selectedNode.level})</span>
                      </>
                    )}
                    {selectedNode.status === 'pruned_by_property' && (
                      <>
                        <Scissors className="w-4 h-4 text-red-600" />
                        <span>判定: 先验性质剪枝 (无需查库直接剔除)</span>
                      </>
                    )}
                    {selectedNode.status === 'pruned_by_cutoff' && (
                      <>
                        <XCircle className="w-4 h-4 text-stone-500" />
                        <span>判定: 支持度不足截断 (Below min_sup)</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-600 leading-normal">
                    {selectedNode.pruneReason}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-stone-400 flex flex-col items-center gap-1.5">
                <HelpCircle className="w-5 h-5 text-stone-300" />
                <span>点击左侧四项集格树中的任意节点，检视子集完备性与剪枝归因</span>
              </div>
            )}
          </div>

          {/* Mathematical Proof & Apriori Principle Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-xs space-y-2.5">
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-700" />
              <span>先验性质 (Apriori Property) 数学形式化</span>
            </h4>
            <div className="bg-white p-2.5 rounded border border-stone-200 font-mono text-[11px] text-teal-900 leading-relaxed">
              ∀ X ⊆ Y ⟹ supp(X) ≥ supp(Y)
            </div>
            <div className="text-[11px] text-stone-600 space-y-1.5 leading-relaxed">
              <p>
                <strong>逆否定理</strong>：若某项集 $X$ 非频繁（<code>supp(X) &lt; min_sup</code>），
                则对于任何包含 $X$ 的超集 $Y$（$X \subseteq Y$），必然有 <code>supp(Y) &lt; min_sup</code>。
              </p>
              <p className="text-red-700 font-medium">
                ✂️ 因此任何包含非频繁子集的候选项集均可被<strong>提前直接剪除</strong>，免除了海量的数据库全表扫描开销！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Backwards-compatibility alias
export const Apriori3DModule = Apriori2DModule;
