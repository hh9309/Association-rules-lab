import React, { useState, useMemo } from 'react';
import { Transaction, DatasetCase, FPNode } from '../types';
import { buildFPTree } from '../algorithms/fptree';
import { GitFork, ArrowDown, Scissors, CheckCircle2, ChevronRight, Info, Layers } from 'lucide-react';

interface FPTreeModuleProps {
  currentCase: DatasetCase;
  transactions: Transaction[];
  minSup: number;
}

export const FPTreeModule: React.FC<FPTreeModuleProps> = ({
  currentCase,
  transactions,
  minSup,
}) => {
  const fpData = useMemo(() => {
    return buildFPTree(transactions, minSup);
  }, [transactions, minSup]);

  // Selected Suffix Item for conditional pattern mining
  const [selectedSuffix, setSelectedSuffix] = useState<string>('');
  const [cutterY, setCutterY] = useState<number>(220); // Horizontal cutter position

  // Initialize selected suffix with the least frequent item in header table (standard FP-Growth bottom-up order)
  React.useEffect(() => {
    if (fpData.headerTable.length > 0) {
      const bottomItem = fpData.headerTable[fpData.headerTable.length - 1].item;
      setSelectedSuffix(bottomItem);
    }
  }, [fpData.headerTable]);

  const activeConditionalBase = selectedSuffix
    ? fpData.conditionalBases[selectedSuffix]
    : null;

  // Flatten tree for SVG rendering with computed coordinates
  const { layoutNodes, layoutLinks } = useMemo(() => {
    const nodes: { id: string; name: string; count: number; x: number; y: number; depth: number }[] = [];
    const links: { sourceId: string; targetId: string; x1: number; y1: number; x2: number; y2: number }[] = [];

    function assignCoords(
      node: FPNode,
      xMin: number,
      xMax: number,
      depth: number
    ) {
      const x = (xMin + xMax) / 2;
      const y = 30 + depth * 75;

      nodes.push({
        id: node.id,
        name: node.name,
        count: node.count,
        x,
        y,
        depth,
      });

      const childCount = node.children.length;
      if (childCount > 0) {
        const span = (xMax - xMin) / childCount;
        node.children.forEach((child, idx) => {
          const cMin = xMin + idx * span;
          const cMax = cMin + span;
          const cX = (cMin + cMax) / 2;
          const cY = 30 + (depth + 1) * 75;

          links.push({
            sourceId: node.id,
            targetId: child.id,
            x1: x,
            y1: y,
            x2: cX,
            y2: cY,
          });

          assignCoords(child, cMin, cMax, depth + 1);
        });
      }
    }

    assignCoords(fpData.root, 20, 680, 0);

    return { layoutNodes: nodes, layoutLinks: links };
  }, [fpData.root]);

  // Check if a node belongs to prefix paths of selected suffix
  const highlightedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!selectedSuffix) return ids;

    const entry = fpData.headerTable.find((h) => h.item === selectedSuffix);
    if (!entry) return ids;

    // Traverse upwards from each node matching selected suffix
    const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));
    const parentMap = new Map<string, string>();

    function buildParentMap(n: FPNode) {
      n.children.forEach((c) => {
        parentMap.set(c.id, n.id);
        buildParentMap(c);
      });
    }
    buildParentMap(fpData.root);

    entry.nodeIds.forEach((nid) => {
      let cur: string | undefined = nid;
      while (cur && cur !== 'node-root') {
        ids.add(cur);
        cur = parentMap.get(cur);
      }
    });

    return ids;
  }, [selectedSuffix, fpData, layoutNodes]);

  return (
    <div className="space-y-6">
      {/* Header Slice */}
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-stone-400">模块 03</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-medium text-teal-700">FP-Growth 压缩树图</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
              FP-Tree 树图构建、项头表链表与条件模式基路径切割
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl">
              FP-Growth (Frequent Pattern Growth) 仅需两次扫描数据库，将庞大事务数据无损紧凑压缩到一棵以<strong>频繁项头表 (Header Table)</strong>
              和前缀共享树 (FP-Tree) 构成的内存结构中，免去 Apriori 组合爆炸的候选集生成瓶颈。
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs bg-stone-50 border border-stone-200 rounded px-3 py-2 text-stone-600">
            <Scissors className="w-4 h-4 text-teal-700" />
            <span>拖动水平切割线或选择后缀项，动态点亮高频前缀路径并构建条件树</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Header Table + Sorted Transactions (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header Table Slice */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-900">
                1. 频繁项头表 (Header Table)
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">按频数降序</span>
            </div>

            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {fpData.headerTable.map((entry, idx) => {
                const isSelected = selectedSuffix === entry.item;
                return (
                  <button
                    key={entry.item}
                    onClick={() => setSelectedSuffix(entry.item)}
                    className={`w-full text-left p-2 rounded text-xs transition-all flex items-center justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 border-teal-300 text-teal-950 font-bold shadow-xs'
                        : 'bg-stone-50/70 border-stone-100 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] font-mono text-stone-400 w-4">
                        #{idx + 1}
                      </span>
                      <span className="truncate">{entry.item.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                      <span className="text-teal-800 font-semibold">{entry.count} 次</span>
                      <span className="text-stone-400 text-[10px]">
                        ({entry.nodeIds.length} 节点)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-stone-400 leading-normal">
              项头表通过单向链表 (Node-link) 串接树中同名节点，加速条件模式基逆向回溯。
            </p>
          </div>

          {/* Filtered & Ordered Transactions Slice */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-semibold text-stone-900">
              2. 事务频繁项重排流水线
            </h3>
            <div className="text-[11px] text-stone-500">
              仅保留频繁项，并按头表优先级重排后插入树中：
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto text-xs font-mono">
              {fpData.filteredTransactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="p-2 bg-stone-50 rounded border border-stone-100">
                  <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                    <span>{tx.id}</span>
                    <span>{tx.sorted.length} 项</span>
                  </div>
                  <div className="text-teal-900 font-medium truncate text-[11px]">
                    [{tx.sorted.map((it) => it.split(' ')[0]).join(' → ')}]
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: FP-Tree Interactive Tree Visualizer with Dynamic Cutter Line (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-semibold text-stone-900">
                FP-Tree 树图结构与动态水平切割线
              </h3>
            </div>
            <span className="text-[11px] text-stone-400 font-mono">
              高亮分支: {selectedSuffix ? selectedSuffix.split(' ')[0] : '无'}
            </span>
          </div>

          {/* SVG Canvas Container */}
          <div className="relative w-full h-[470px] bg-stone-50/50 rounded border border-stone-100 overflow-hidden">
            {/* Dynamic Slicing Line Slider Controls */}
            <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-sm border border-stone-200 rounded px-2.5 py-1 text-[11px] flex items-center gap-2 shadow-xs">
              <span className="text-stone-500">切割线深度:</span>
              <input
                type="range"
                min="50"
                max="420"
                value={cutterY}
                onChange={(e) => setCutterY(parseInt(e.target.value))}
                className="w-20 h-1 bg-stone-200 rounded appearance-none cursor-pointer accent-teal-700"
              />
              <span className="font-mono text-teal-800">{cutterY}px</span>
            </div>

            {/* Tree SVG */}
            <svg className="w-full h-full" viewBox="0 0 700 480">
              {/* Dynamic Slicing Line */}
              <line
                x1="0"
                y1={cutterY}
                x2="700"
                y2={cutterY}
                stroke="#F43F5E"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text
                x="10"
                y={cutterY - 5}
                fill="#F43F5E"
                fontSize="10"
                fontFamily="monospace"
              >
                水平切割基准线 (Prefix Path Cut Plane)
              </text>

              {/* Links */}
              {layoutLinks.map((link, idx) => {
                const isTargetHighlighted = highlightedNodeIds.has(link.targetId);
                return (
                  <line
                    key={idx}
                    x1={link.x1}
                    y1={link.y1}
                    x2={link.x2}
                    y2={link.y2}
                    stroke={isTargetHighlighted ? '#0D9488' : '#CBD5E1'}
                    strokeWidth={isTargetHighlighted ? 2.5 : 1}
                    strokeDasharray={isTargetHighlighted ? 'none' : 'none'}
                    className="transition-colors duration-300"
                  />
                );
              })}

              {/* Nodes */}
              {layoutNodes.map((n) => {
                const isRoot = n.id === 'node-root';
                const isHighlighted = highlightedNodeIds.has(n.id);
                const isDirectSuffix = n.name === selectedSuffix;

                return (
                  <g
                    key={n.id}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => {
                      if (!isRoot) setSelectedSuffix(n.name);
                    }}
                  >
                    {/* Circle Node */}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isRoot ? 16 : isHighlighted ? 15 : 12}
                      fill={
                        isRoot
                          ? '#1E293B'
                          : isDirectSuffix
                          ? '#F59E0B' // Amber highlight for leaf target
                          : isHighlighted
                          ? '#0D9488' // Teal for prefix
                          : '#FFFFFF'
                      }
                      stroke={
                        isRoot
                          ? '#0F172A'
                          : isDirectSuffix
                          ? '#B45309'
                          : isHighlighted
                          ? '#042F2E'
                          : '#94A3B8'
                      }
                      strokeWidth={isHighlighted || isDirectSuffix ? 2 : 1}
                    />

                    {/* Node Text Label */}
                    <text
                      x={n.x}
                      y={n.y - 16}
                      textAnchor="middle"
                      fontSize={isHighlighted ? '10' : '9'}
                      fontWeight={isHighlighted ? 'bold' : 'normal'}
                      fill={isHighlighted ? '#0F172A' : '#64748B'}
                    >
                      {n.name.split(' ')[0]}
                    </text>

                    {/* Count Inside Node */}
                    <text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill={isRoot || isHighlighted || isDirectSuffix ? '#FFFFFF' : '#334155'}
                    >
                      {isRoot ? 'R' : n.count}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                目标后缀项 (Leaf)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
                回溯高频前缀路径
              </span>
            </div>
            <span className="text-stone-400">点击任意树节点快速切换后缀</span>
          </div>
        </div>

        {/* Right: Conditional Pattern Base & Conditional Tree (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-900">
                3. 条件模式基 (Conditional Pattern Base)
              </h3>
              <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                项: {selectedSuffix ? selectedSuffix.split(' ')[0] : '未选'}
              </span>
            </div>

            {activeConditionalBase && activeConditionalBase.paths.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[11px] text-stone-500">
                  以「{selectedSuffix.split(' ')[0]}」为后缀由下至上回溯得到的全部前缀路径：
                </div>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {activeConditionalBase.paths.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-stone-800">
                        &#123;{p.prefix.map((it) => it.split(' ')[0]).join(', ')}&#125;
                      </span>
                      <span className="font-bold text-teal-800">:{p.count} 次</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-stone-400 bg-stone-50 rounded border border-dashed border-stone-200">
                该节点为顶层单项，无父前缀路径。
              </div>
            )}
          </div>

          {/* Conditional FP-Tree & Mined Frequent Patterns */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-stone-900">
              4. 条件 FP-Tree 挖掘频繁项集
            </h3>
            <p className="text-[11px] text-stone-500 leading-normal">
              在条件模式基中累计前缀项频数，保留 ≥ 最小支持度的项，构建条件树并递归生成频繁项集：
            </p>

            {activeConditionalBase && activeConditionalBase.minedRules.length > 0 ? (
              <div className="space-y-2">
                {activeConditionalBase.minedRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-teal-50/70 border border-teal-100 rounded text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span className="font-mono text-teal-950 font-medium">{rule}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-stone-400 bg-stone-50 rounded border border-dashed border-stone-200">
                暂无达到最小支持度阈值的复合频繁项集。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
