import React, { useState, useMemo } from 'react';
import { Transaction, DatasetCase } from '../types';
import { buildBinaryMatrix, calculateRuleMetrics } from '../algorithms/core';
import { Calculator, Check, ArrowRight, Info, Eye, Layers } from 'lucide-react';

interface AlgebraModuleProps {
  currentCase: DatasetCase;
  transactions: Transaction[];
  allItems: string[];
  minSup?: number;
  minConf?: number;
}

export const AlgebraModule: React.FC<AlgebraModuleProps> = ({
  currentCase,
  transactions,
  allItems,
  minSup,
  minConf,
}) => {
  const binaryData = useMemo(
    () => buildBinaryMatrix(transactions, allItems),
    [transactions, allItems]
  );

  const [selectedItemA, setSelectedItemA] = useState<string>(allItems[0] || '');
  const [selectedItemB, setSelectedItemB] = useState<string>(allItems[1] || allItems[0] || '');
  const [highlightRowIdx, setHighlightRowIdx] = useState<number | null>(null);
  const [highlightColIdx, setHighlightColIdx] = useState<number | null>(null);

  // Sync if items changed
  React.useEffect(() => {
    if (allItems.length >= 2) {
      setSelectedItemA(allItems[0]);
      setSelectedItemB(allItems[1]);
    }
  }, [allItems]);

  // Metric Calculation
  const metrics = useMemo(() => {
    if (!selectedItemA || !selectedItemB) return null;
    return calculateRuleMetrics([selectedItemA], [selectedItemB], transactions);
  }, [selectedItemA, selectedItemB, transactions]);

  // Matching transactions
  const matchedTidsAB = useMemo(() => {
    if (!selectedItemA || !selectedItemB) return [];
    return transactions
      .filter((t) => t.items.includes(selectedItemA) && t.items.includes(selectedItemB))
      .map((t) => t.id);
  }, [selectedItemA, selectedItemB, transactions]);

  const matchedTidsA = useMemo(() => {
    if (!selectedItemA) return [];
    return transactions.filter((t) => t.items.includes(selectedItemA)).map((t) => t.id);
  }, [selectedItemA, transactions]);

  const matchedTidsB = useMemo(() => {
    if (!selectedItemB) return [];
    return transactions.filter((t) => t.items.includes(selectedItemB)).map((t) => t.id);
  }, [selectedItemB, transactions]);

  const totalItemsCount = allItems.length;
  const latticeSpaceSize = Math.pow(2, totalItemsCount);

  return (
    <div className="space-y-6">
      {/* Module Overview Header */}
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-stone-400">模块 01</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-medium text-teal-700">理论代数与格空间</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
              0-1 交易矩阵代数空间与关联测度形式化推导
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl">
              关联规则挖掘的核心基石建立在离散代数空间上：将数据库形式化为 0-1 哑变量二值矩阵 T &isin; &#123;0, 1&#125;<sup>m&times;n</sup>，
              其项集搜索空间构成为包含 2<sup>|I|</sup> 个状态的半序有界布尔格（Boolean Lattice）。
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs bg-stone-50 border border-stone-200 rounded p-3">
            <div>
              <div className="text-stone-400 text-[11px]">事务规模 m</div>
              <div className="text-stone-900 font-mono font-bold text-sm">{transactions.length} 笔</div>
            </div>
            <div className="w-px h-6 bg-stone-200" />
            <div>
              <div className="text-stone-400 text-[11px]">项维度 n</div>
              <div className="text-stone-900 font-mono font-bold text-sm">{totalItemsCount} 项</div>
            </div>
            <div className="w-px h-6 bg-stone-200" />
            <div>
              <div className="text-stone-400 text-[11px]">格空间规模 2ⁿ</div>
              <div className="text-stone-900 font-mono font-bold text-sm">{latticeSpaceSize.toLocaleString()} 状态</div>
            </div>
            <div className="w-px h-6 bg-stone-200" />
            <div>
              <div className="text-stone-400 text-[11px]">矩阵稀疏度</div>
              <div className="text-stone-900 font-mono font-bold text-sm">{(binaryData.sparsity * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Matrix, Right Algebraic Formula Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 0-1 Binary Matrix Visualization (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-600" />
              <h3 className="text-sm font-semibold text-stone-900">
                0-1 哑变量矩阵 T &isin; &#123;0, 1&#125;<sup>m&times;n</sup>
              </h3>
            </div>
            <span className="text-[11px] text-stone-400 font-mono">
              点击行/列高亮联动
            </span>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-stone-100 rounded text-xs">
            <table className="w-full text-center border-collapse">
              <thead className="bg-stone-50 text-[11px] font-mono text-stone-600 sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="p-2 border-b border-r border-stone-200 text-left bg-stone-100/80 font-normal">
                    TID \ Item
                  </th>
                  {binaryData.colLabels.map((item, cIdx) => (
                    <th
                      key={item}
                      onClick={() => setHighlightColIdx(highlightColIdx === cIdx ? null : cIdx)}
                      className={`p-2 border-b border-r border-stone-200 cursor-pointer font-normal transition-colors whitespace-nowrap ${
                        highlightColIdx === cIdx ? 'bg-teal-100 text-teal-900 font-bold' : 'hover:bg-stone-100'
                      }`}
                      title={item}
                    >
                      <div className="max-w-[70px] truncate">{item.split(' ')[0]}</div>
                    </th>
                  ))}
                  <th className="p-2 border-b border-stone-200 font-normal bg-stone-100/50">
                    |tᵢ|
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-xs">
                {binaryData.matrix.map((row, rIdx) => {
                  const tid = binaryData.rowLabels[rIdx];
                  const isRowHighlighted = highlightRowIdx === rIdx;
                  return (
                    <tr
                      key={tid}
                      onClick={() => setHighlightRowIdx(isRowHighlighted ? null : rIdx)}
                      className={`transition-colors cursor-pointer ${
                        isRowHighlighted ? 'bg-amber-50/80' : 'hover:bg-stone-50/80'
                      }`}
                    >
                      <td className="p-2 font-medium text-stone-700 text-left border-r border-stone-200 bg-stone-50/30 whitespace-nowrap">
                        {tid}
                      </td>
                      {row.map((val, cIdx) => {
                        const isColHighlighted = highlightColIdx === cIdx;
                        const isHit = val === 1;
                        return (
                          <td
                            key={cIdx}
                            className={`p-2 border-r border-stone-100 transition-colors ${
                              isColHighlighted
                                ? isHit
                                  ? 'bg-teal-100 text-teal-950 font-bold'
                                  : 'bg-teal-50 text-stone-300'
                                : isHit
                                ? 'text-teal-900 bg-teal-50/40 font-semibold'
                                : 'text-stone-300'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                      <td className="p-2 text-stone-500 font-semibold bg-stone-50/20">
                        {binaryData.rowSums[rIdx]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-stone-100 text-[11px] font-mono sticky bottom-0 z-10 text-stone-700">
                <tr>
                  <td className="p-2 text-left font-bold border-r border-stone-200">
                    列和频数 ∑
                  </td>
                  {binaryData.colSums.map((sum, cIdx) => (
                    <td key={cIdx} className="p-2 border-r border-stone-200 font-bold">
                      {sum}
                    </td>
                  ))}
                  <td className="p-2 font-bold text-teal-800">
                    {binaryData.rowSums.reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-3 text-[11px] text-stone-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-100 border border-teal-300 inline-block" />
              数值 1: 该笔交易包含该项
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-stone-100 border border-stone-200 inline-block" />
              数值 0: 未发生购买/行为
            </span>
          </div>
        </div>

        {/* Right: Four Algebraic Metrics Interactive Derivations (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive Item Selector */}
          <div className="bg-white border border-stone-200 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-semibold text-stone-900">
                  关联规则代数推导工作台: A ⇒ B
                </h3>
              </div>
              <span className="text-[11px] text-stone-500 font-mono">
                即时代数求解推演
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-stone-500 mb-1 font-medium">
                  前项 / 条件件 (Antecedent A):
                </label>
                <select
                  value={selectedItemA}
                  onChange={(e) => setSelectedItemA(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-xs text-stone-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
                >
                  {allItems.map((item) => (
                    <option key={item} value={item} disabled={item === selectedItemB}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 mb-1 font-medium">
                  后项 / 结论件 (Consequent B):
                </label>
                <select
                  value={selectedItemB}
                  onChange={(e) => setSelectedItemB(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-xs text-stone-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
                >
                  {allItems.map((item) => (
                    <option key={item} value={item} disabled={item === selectedItemA}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Metric 1: Support */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-900">1. 支持度 (Support)</span>
                  <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    {(metrics.support * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] font-mono bg-stone-50 p-2 rounded text-stone-700 border border-stone-100">
                  Supp(A ⇒ B) = |&#123;t ∈ T | A ∪ B ⊆ t&#125;| / |T|
                </div>
                <div className="text-xs text-stone-600 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400">同时包含 A 与 B 的交易数:</span>
                    <span className="font-mono font-semibold">{metrics.count} 笔</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400">数据库总交易数 |T|:</span>
                    <span className="font-mono font-semibold">{transactions.length} 笔</span>
                  </div>
                  <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 font-mono">
                    = {metrics.count} / {transactions.length} = {metrics.support.toFixed(3)}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed pt-1">
                  <strong>代数内涵：</strong> 衡量该规则在所有交易中发生的普遍性（联合概率 P(A ∩ B)）。支持度过低意味着偶然噪音。
                </p>
              </div>

              {/* Metric 2: Confidence */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-900">2. 置信度 (Confidence)</span>
                  <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    {(metrics.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] font-mono bg-stone-50 p-2 rounded text-stone-700 border border-stone-100">
                  Conf(A ⇒ B) = Supp(A ∪ B) / Supp(A) = P(B | A)
                </div>
                <div className="text-xs text-stone-600 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400">包含前项 A 的交易数:</span>
                    <span className="font-mono font-semibold">{matchedTidsA.length} 笔</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400">其中也包含 B 的交易数:</span>
                    <span className="font-mono font-semibold">{metrics.count} 笔</span>
                  </div>
                  <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 font-mono">
                    = {metrics.count} / {matchedTidsA.length || 1} = {metrics.confidence.toFixed(3)}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed pt-1">
                  <strong>代数内涵：</strong> 条件概率。在购买前项 A 的前提下，购买结论件 B 的可靠性程度。
                </p>
              </div>

              {/* Metric 3: Lift */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-900">3. 提升度 (Lift)</span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      metrics.lift > 1.2
                        ? 'bg-teal-100 text-teal-900'
                        : metrics.lift < 0.9
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-stone-100 text-stone-800'
                    }`}
                  >
                    {metrics.lift.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] font-mono bg-stone-50 p-2 rounded text-stone-700 border border-stone-100">
                  Lift(A ⇒ B) = Conf(A ⇒ B) / Supp(B) = P(A ∩ B) / (P(A)·P(B))
                </div>
                <div className="text-xs text-stone-600 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400">结论件 B 全局支持度 Supp(B):</span>
                    <span className="font-mono font-semibold">{(metrics.suppB * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400">条件发生比 / 自然发生比:</span>
                    <span className="font-mono font-semibold">
                      {metrics.confidence.toFixed(2)} / {metrics.suppB.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 font-mono">
                    = {metrics.lift.toFixed(3)}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed pt-1">
                  <strong>判定准则：</strong> {metrics.lift > 1.0 ? 'Lift > 1 存在正向协同促进（强关联）' : metrics.lift === 1.0 ? 'Lift = 1 相互独立' : 'Lift < 1 负相关（互斥或替代品）'}。
                </p>
              </div>

              {/* Metric 4: Conviction */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-900">4. 确信度 (Conviction)</span>
                  <span className="text-xs font-mono font-bold text-teal-800 bg-stone-100 px-2 py-0.5 rounded">
                    {metrics.conviction > 100 ? '∞ (绝对确定)' : metrics.conviction.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] font-mono bg-stone-50 p-2 rounded text-stone-700 border border-stone-100">
                  Conv(A ⇒ B) = (1 - Supp(B)) / (1 - Conf(A ⇒ B))
                </div>
                <div className="text-xs text-stone-600 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400">B 不出现的期望比 (1 - Supp(B)):</span>
                    <span className="font-mono font-semibold">{(1 - metrics.suppB).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400">规则出现错误的概率 (1 - Conf):</span>
                    <span className="font-mono font-semibold">{(1 - metrics.confidence).toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 font-mono">
                    = {metrics.conviction > 100 ? '∞' : metrics.conviction.toFixed(3)}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed pt-1">
                  <strong>代数内涵：</strong> 衡量 A 出现而 B 不出现被逻辑违背的强烈程度。值越大代表规则方向性越绝对。
                </p>
              </div>
            </div>
          )}

          {/* Venn-Diagram / Tids Trace Slice */}
          <div className="bg-white border border-stone-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-stone-500" />
              <span>集合交集与命中文档追踪 (TID Sets)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-stone-50 p-2.5 rounded border border-stone-100">
                <div className="text-stone-500 text-[11px] mb-1 font-medium">
                  包含 A 的 TID 集合 ({matchedTidsA.length}):
                </div>
                <div className="font-mono text-stone-800 text-[11px] break-all">
                  &#123;{matchedTidsA.join(', ') || '∅'}&#125;
                </div>
              </div>

              <div className="bg-stone-50 p-2.5 rounded border border-stone-100">
                <div className="text-stone-500 text-[11px] mb-1 font-medium">
                  包含 B 的 TID 集合 ({matchedTidsB.length}):
                </div>
                <div className="font-mono text-stone-800 text-[11px] break-all">
                  &#123;{matchedTidsB.join(', ') || '∅'}&#125;
                </div>
              </div>

              <div className="bg-teal-50 p-2.5 rounded border border-teal-100">
                <div className="text-teal-900 text-[11px] mb-1 font-bold">
                  交集 A ∩ B 命中的 TID ({matchedTidsAB.length}):
                </div>
                <div className="font-mono text-teal-950 font-bold text-[11px] break-all">
                  &#123;{matchedTidsAB.join(', ') || '∅'}&#125;
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
