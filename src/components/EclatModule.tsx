import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Transaction, DatasetCase, AssociationRule } from '../types';
import { buildVerticalData, generateAssociationNetwork, NetworkNode, NetworkEdge } from '../algorithms/eclat';
import { extractAssociationRules } from '../algorithms/rules';
import { runAprioriStages } from '../algorithms/apriori';
import { Network, GitCompare, AlertTriangle, Sparkles, Zap, Check, ShieldAlert } from 'lucide-react';

interface EclatModuleProps {
  currentCase: DatasetCase;
  transactions: Transaction[];
  allItems: string[];
  minSup: number;
  minConf: number;
}

export const EclatModule: React.FC<EclatModuleProps> = ({
  currentCase,
  transactions,
  allItems,
  minSup,
  minConf,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Vertical Data Format
  const verticalData = useMemo(() => {
    return buildVerticalData(transactions, minSup);
  }, [transactions, minSup]);

  // Extract rules for network topology
  const rules = useMemo(() => {
    const apriori = runAprioriStages(transactions, minSup, 3);
    return extractAssociationRules(apriori.allFrequent, transactions, minConf, 1.0);
  }, [transactions, minSup, minConf]);

  // Network Nodes & Edges
  const networkData = useMemo(() => {
    return generateAssociationNetwork(rules, allItems);
  }, [rules, allItems]);

  const [selectedPairIdx, setSelectedPairIdx] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  const activeIntersection = verticalData.intersectionSteps[selectedPairIdx] || null;

  // Canvas 2D Particle Beam Transmission Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particleOffset = 0;

    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particleOffset = (particleOffset + 0.008) % 1.0;

      // Draw Grid
      ctx.strokeStyle = 'rgba(241, 245, 249, 0.8)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const nodeMap = new Map(networkData.nodes.map((n) => [n.id, n]));

      // 1. Draw Edges
      networkData.edges.forEach((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (edge.isRedundant) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = edge.color;
          ctx.lineWidth = Math.max(1.5, Math.min(4.5, edge.confidence * 4));
          ctx.setLineDash([]);
        }
        ctx.stroke();

        // Animated Particle Beam on Strong Rules
        if (!edge.isRedundant && edge.lift > 1.25) {
          const px = src.x + (tgt.x - src.x) * particleOffset;
          const py = src.y + (tgt.y - src.y) * particleOffset;

          const grad = ctx.createRadialGradient(px, py, 1, px, py, 4.5);
          grad.addColorStop(0, '#14B8A6');
          grad.addColorStop(1, 'rgba(20, 184, 166, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 2. Draw Nodes
      networkData.nodes.forEach((node) => {
        const isSelected = selectedNode?.id === node.id;

        ctx.save();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#0D9488' : '#1E293B';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#042F2E' : '#64748B';
        ctx.lineWidth = isSelected ? 2.5 : 1.2;
        ctx.stroke();

        ctx.restore();

        // Node Label
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.split(' ')[0], node.x, node.y - node.radius - 3);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [networkData, selectedNode]);

  // Handle canvas click to select node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let hit: NetworkNode | null = null;
    for (const node of networkData.nodes) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist <= node.radius + 6) {
        hit = node;
        break;
      }
    }
    setSelectedNode(hit);
  };

  const redundantCount = rules.filter((r) => r.isRedundant).length;

  return (
    <div className="space-y-6">
      {/* Header Slice */}
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-stone-400">模块 04</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-medium text-teal-700">ECLAT 垂直数据与网络拓扑</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
              TidList 垂直格式交集运算演播与 2D 关联网络拓扑
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl">
              ECLAT (Equivalence Class Transformation) 将传统以事务为行的水平数据库，转置为以项为主键的<strong>垂直数据格式 (Vertical Data Format)</strong>。
              利用简单的位集求交 <code>tidset(A) ∩ tidset(B)</code> 即可直接获得复合项集频数，无需重读原始数据。
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs bg-stone-50 border border-stone-200 rounded px-3 py-2 text-stone-600">
            <Zap className="w-4 h-4 text-teal-700" />
            <span>光束传导代表强关联规则传导流 · 实时标注冗余子规则</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Vertical TidList Intersection, Right 2D Network */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: TidList Vertical Intersection Demo (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Vertical Data Table Slice */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-900 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-teal-700" />
                <span>1. 项 &rarr; 事务 ID 倒排索引表 (Vertical TidList)</span>
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">
                总交易 {transactions.length} 笔
              </span>
            </div>

            <div className="overflow-x-auto max-h-[220px] overflow-y-auto border border-stone-100 rounded text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50 text-[11px] font-mono text-stone-600 sticky top-0">
                  <tr>
                    <th className="p-2 border-b border-stone-200">项 (Item)</th>
                    <th className="p-2 border-b border-stone-200">TID 倒排集合 (TidSet)</th>
                    <th className="p-2 border-b border-stone-200 text-right">频数</th>
                    <th className="p-2 border-b border-stone-200 text-right">支持度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-xs">
                  {verticalData.verticalTable.map((entry) => (
                    <tr key={entry.item} className="hover:bg-stone-50/70">
                      <td className="p-2 font-medium text-stone-800 whitespace-nowrap">
                        {entry.item.split(' ')[0]}
                      </td>
                      <td className="p-2 text-stone-600 text-[11px]">
                        &#123;{entry.tids.join(', ')}&#125;
                      </td>
                      <td className="p-2 text-right font-bold text-teal-800">
                        {entry.count}
                      </td>
                      <td className="p-2 text-right text-stone-500">
                        {(entry.support * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Set Intersection Operator Slice */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-900">
                2. 集合交集演示: TidSet(A) ∩ TidSet(B)
              </h3>
              {verticalData.intersectionSteps.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-stone-400">选择项对:</label>
                  <select
                    value={selectedPairIdx}
                    onChange={(e) => setSelectedPairIdx(parseInt(e.target.value))}
                    className="bg-stone-50 border border-stone-200 rounded px-2 py-0.5 text-xs text-stone-800 focus:outline-none"
                  >
                    {verticalData.intersectionSteps.map((step, idx) => (
                      <option key={idx} value={idx}>
                        {step.itemA.split(' ')[0]} & {step.itemB.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeIntersection ? (
              <div className="space-y-3 text-xs">
                {/* TidSet A */}
                <div className="p-2.5 bg-stone-50 rounded border border-stone-100 space-y-1">
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-800">
                      TidSet({activeIntersection.itemA.split(' ')[0]}):
                    </span>
                    <span className="font-mono">{activeIntersection.tidsA.length} 项</span>
                  </div>
                  <div className="font-mono text-stone-700 text-[11px]">
                    &#123;{activeIntersection.tidsA.join(', ')}&#125;
                  </div>
                </div>

                {/* TidSet B */}
                <div className="p-2.5 bg-stone-50 rounded border border-stone-100 space-y-1">
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-800">
                      TidSet({activeIntersection.itemB.split(' ')[0]}):
                    </span>
                    <span className="font-mono">{activeIntersection.tidsB.length} 项</span>
                  </div>
                  <div className="font-mono text-stone-700 text-[11px]">
                    &#123;{activeIntersection.tidsB.join(', ')}&#125;
                  </div>
                </div>

                {/* Intersection Result */}
                <div
                  className={`p-3 rounded border space-y-1.5 ${
                    activeIntersection.isFrequent
                      ? 'bg-teal-50 border-teal-200 text-teal-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>交集结果 TidSet(A ∩ B):</span>
                    <span className="font-mono font-bold">
                      频数: {activeIntersection.intersectedTids.length} 笔 (支持度: {(activeIntersection.support * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="font-mono text-xs break-all font-bold">
                    &#123;{activeIntersection.intersectedTids.join(', ') || '∅ 空集'}&#125;
                  </div>
                  <div className="text-[11px] pt-1 border-t border-teal-100 flex items-center justify-between">
                    <span>
                      {activeIntersection.isFrequent
                        ? '✓ 达到最小支持度，确认为频繁 2-项集'
                        : '✗ 未达最小支持度截断'}
                    </span>
                    <span className="text-[10px] font-mono text-teal-700">
                      DiffSet 差集大小: {activeIntersection.diffset.length}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 leading-relaxed bg-stone-50/70 p-2.5 rounded border border-stone-100">
                  <strong>dEclat 差集优化原理：</strong> 记录 <code>Diffset(AB) = TidSet(A) \ TidSet(B)</code>，项集越长其差集越小，大幅节约深层求交时的内存开销。
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-stone-400 text-xs">
                暂无可求交的频繁项对。
              </div>
            )}
          </div>
        </div>

        {/* Right: 2D Association Network Graph (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-stone-200 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-semibold text-stone-900">
                2D 关联规则网络拓扑与光束流
              </h3>
            </div>
            {redundantCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>检出 {redundantCount} 条冗余规则</span>
              </div>
            )}
          </div>

          {/* Canvas Viewport */}
          <div className="relative w-full h-[460px] bg-stone-50/60 rounded border border-stone-100 overflow-hidden cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={520}
              height={460}
              onClick={handleCanvasClick}
              className="w-full h-full block"
            />

            {/* Corner Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-stone-200 rounded p-2.5 text-[11px] space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-teal-600 rounded inline-block" />
                <span className="text-stone-700">高提升度强规则 (Lift &gt; 1.25)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-indigo-500 rounded inline-block" />
                <span className="text-stone-600">常规关联规则</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 border-t border-dashed border-red-500 inline-block" />
                <span className="text-red-700 font-medium">冗余规则 (Redundant)</span>
              </div>
            </div>
          </div>

          {/* Selected Node Details or Redundant Warning */}
          <div className="mt-3 p-3 bg-stone-50 rounded border border-stone-200 text-xs">
            {selectedNode ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-900">
                    已选节点: {selectedNode.name}
                  </span>
                  <span className="text-stone-500 text-[11px] ml-2">
                    拓扑度数: {selectedNode.degree}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-[10px] text-stone-400 hover:text-stone-700"
                >
                  取消选中
                </button>
              </div>
            ) : (
              <div className="text-stone-500 text-[11px] flex items-center justify-between">
                <span>点击拓扑中的节点查看连接关系；光束流动展示了强规则间关联传导方向。</span>
                <span className="font-mono text-teal-800 font-semibold">
                  规则数: {rules.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
