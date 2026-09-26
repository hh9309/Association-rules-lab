import React, { useState, useMemo } from 'react';
import { Transaction, DatasetCase, AssociationRule } from '../types';
import { buildBinaryMatrix } from '../algorithms/core';
import { runAprioriStages } from '../algorithms/apriori';
import { extractAssociationRules } from '../algorithms/rules';
import { RuleGenerationEngine } from './RuleGenerationEngine';
import { 
  Workflow, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Layers, 
  Sliders, 
  ScatterChart, 
  TrendingUp, 
  Filter,
  CheckCircle2,
  FileText,
  Sparkles,
  Table as TableIcon,
  Zap
} from 'lucide-react';

interface PipelineModuleProps {
  currentCase: DatasetCase;
  transactions: Transaction[];
  allItems: string[];
  minSup: number;
  setMinSup: (val: number) => void;
  minConf: number;
  setMinConf: (val: number) => void;
  onGoToReport: () => void;
}

export const PipelineModule: React.FC<PipelineModuleProps> = ({
  currentCase,
  transactions,
  allItems,
  minSup,
  setMinSup,
  minConf,
  setMinConf,
  onGoToReport,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [step4View, setStep4View] = useState<'anim' | 'table'>('anim');
  const [minLiftFilter, setMinLiftFilter] = useState<number>(1.2);
  const [hoveredRule, setHoveredRule] = useState<AssociationRule | null>(null);

  // Compute pipeline data
  const binaryData = useMemo(() => {
    return buildBinaryMatrix(transactions, allItems);
  }, [transactions, allItems]);

  const aprioriData = useMemo(() => {
    return runAprioriStages(transactions, minSup, 3);
  }, [transactions, minSup]);

  const allRules = useMemo(() => {
    return extractAssociationRules(aprioriData.allFrequent, transactions, minConf, 0.8);
  }, [aprioriData.allFrequent, transactions, minConf]);

  const filteredRules = useMemo(() => {
    return allRules.filter((r) => r.lift >= minLiftFilter);
  }, [allRules, minLiftFilter]);

  const steps = [
    { num: 1, title: '原始交易数据', desc: '长表交易明细与词汇项集' },
    { num: 2, title: '0-1 哑变量转化', desc: '独热二值特征矩阵' },
    { num: 3, title: '频繁项集提取', desc: '先验剪枝与支持度截断' },
    { num: 4, title: '关联规则生成', desc: '从频繁项集到规则生成动画' },
    { num: 5, title: '指标散点分布', desc: '支持度 vs 置信度 vs Lift' },
    { num: 6, title: '商业决策看板', desc: '捆绑策略与价值转化' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Slice */}
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-stone-400">模块 08</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-medium text-teal-700">全流程导引与指标散点图</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
              数据预处理 &rarr; 频繁模式提取 &rarr; 规则过滤 &rarr; 商业转化全生命周期
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl">
              规范化的数据挖掘流水线引导：逐步揭示从稀疏长表到 0-1 二值矩阵，再到候选项集剪枝、
              多维散点评价过滤、直至产出直接服务于运营与风控的商业决策。
            </p>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-5 pt-4 border-t border-stone-100">
          {steps.map((st) => {
            const isCurrent = currentStep === st.num;
            const isCompleted = currentStep > st.num;
            return (
              <button
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                className={`p-2.5 rounded text-left transition-all border cursor-pointer ${
                  isCurrent
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : isCompleted
                    ? 'bg-teal-50/60 border-teal-200 text-stone-800'
                    : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isCurrent
                        ? 'bg-stone-800 text-teal-300'
                        : isCompleted
                        ? 'bg-teal-600 text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    Step 0{st.num}
                  </span>
                  {isCompleted && <Check className="w-3.5 h-3.5 text-teal-700" />}
                </div>
                <div className="text-xs font-semibold truncate">{st.title}</div>
                <div
                  className={`text-[10px] truncate ${
                    isCurrent ? 'text-stone-300' : 'text-stone-400'
                  }`}
                >
                  {st.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content View */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 min-h-[460px] flex flex-col justify-between">
        {/* Step 1: Raw Data */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  第一步：原始交易长表明细检视 (Transaction Long Table)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  输入无规则的多项列表。每条记录代表一次结算交易、一个 Web 会话或一位患者就诊单。
                </p>
              </div>
              <span className="text-xs font-mono text-stone-500">
                事务数: {transactions.length} 笔 · 包含独立项: {allItems.length} 种
              </span>
            </div>

            <div className="overflow-x-auto border border-stone-100 rounded max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50 text-[11px] font-mono text-stone-600 sticky top-0">
                  <tr>
                    <th className="p-2.5 border-b border-stone-200">事务 ID (TID)</th>
                    <th className="p-2.5 border-b border-stone-200">包含项明细 (Items Array)</th>
                    <th className="p-2.5 border-b border-stone-200 text-right">项数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-xs">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-50/70">
                      <td className="p-2.5 font-bold text-stone-800">{tx.id}</td>
                      <td className="p-2.5 text-stone-600 font-sans">
                        <div className="flex flex-wrap gap-1">
                          {tx.items.map((it) => (
                            <span
                              key={it}
                              className="bg-stone-100 text-stone-800 text-[11px] px-2 py-0.5 rounded"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-semibold text-teal-800">
                        {tx.items.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 2: One-Hot Matrix */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  第二步：构建 0-1 哑变量二值稀疏矩阵 (One-Hot Binary Matrix)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  将变长列表映射到固定维度的布尔向量空间：1 代表购买/发生，0 代表未发生。
                </p>
              </div>
              <span className="text-xs font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                稀疏度: {(binaryData.sparsity * 100).toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-stone-50 p-3 rounded border border-stone-100">
                <span className="text-stone-400 text-[11px]">矩阵维度</span>
                <div className="font-mono font-bold text-stone-900 text-base mt-1">
                  {binaryData.rowLabels.length} 行 × {binaryData.colLabels.length} 列
                </div>
              </div>
              <div className="bg-stone-50 p-3 rounded border border-stone-100">
                <span className="text-stone-400 text-[11px]">非零元素 (1的数量)</span>
                <div className="font-mono font-bold text-teal-800 text-base mt-1">
                  {binaryData.rowSums.reduce((a, b) => a + b, 0)} 个
                </div>
              </div>
              <div className="bg-stone-50 p-3 rounded border border-stone-100">
                <span className="text-stone-400 text-[11px]">单均项数 (Avg Basket)</span>
                <div className="font-mono font-bold text-stone-900 text-base mt-1">
                  {(
                    binaryData.rowSums.reduce((a, b) => a + b, 0) /
                    (binaryData.rowLabels.length || 1)
                  ).toFixed(1)} 项/单
                </div>
              </div>
              <div className="bg-stone-50 p-3 rounded border border-stone-100">
                <span className="text-stone-400 text-[11px]">格空间可能项集数 2ⁿ</span>
                <div className="font-mono font-bold text-stone-900 text-base mt-1">
                  {Math.pow(2, allItems.length).toLocaleString()} 种
                </div>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded border border-stone-200 text-xs text-stone-600 leading-relaxed">
              <strong>代数向量视角：</strong> 任意事务向量表示为 t<sub>i</sub> = (v<sub>i1</sub>, v<sub>i2</sub>, ..., v<sub>in</sub>) &isin; &#123;0, 1&#125;<sup>n</sup>。
              判断事务是否满足项集 X 等价于求布尔逻辑与或掩码内积：t<sub>i</sub> &middot; m<sub>X</sub> = |X|。
            </div>
          </div>
        )}

        {/* Step 3: Frequent Itemsets Extraction */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  第三步：频繁项集提取与先验性质剪枝 (Frequent Itemset Mining)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  设定最小支持度 MinSup = {(minSup * 100).toFixed(0)}%，排除非频繁项集。
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-teal-800">
                频繁项集总数: {aprioriData.allFrequent.length} 个
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((k) => {
                const kSets = aprioriData.allFrequent.filter((f) => f.items.length === k);
                return (
                  <div key={k} className="p-3 bg-stone-50 rounded border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                      <span>L_{k} ({k}-频繁项集)</span>
                      <span className="font-mono text-teal-800">{kSets.length} 个</span>
                    </div>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto text-xs font-mono">
                      {kSets.map((f, i) => (
                        <div
                          key={i}
                          className="p-1.5 bg-white rounded border border-stone-100 flex justify-between"
                        >
                          <span className="truncate text-stone-700">
                            {f.items.map((it) => it.split(' ')[0]).join('·')}
                          </span>
                          <span className="text-teal-800 font-bold ml-1">
                            {(f.support * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Seamless Transition to Rule Generation */}
            <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="text-xs text-teal-950">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span>频繁项集提取完毕！</span>
                </span>
                <p className="text-teal-800 text-[11px] mt-0.5">
                  已产出 {aprioriData.allFrequent.filter((f) => f.items.length >= 2).length} 个可用于拆解关联规则的高阶频繁项集（k ≥ 2），可直接进入第四步体验规则生成全过程动画。
                </p>
              </div>
              <button
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-medium cursor-pointer transition-colors shadow-xs shrink-0"
              >
                <span>下一步：规则生成推导动画</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Rules Generation & Animation */}
        {currentStep === 4 && (
          <div className="space-y-5">
            {/* Step 4 Sub-View Switcher Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <span>第四步：从频繁项集到关联规则生成</span>
                  <span className="text-[11px] font-normal text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    全过程推导与动态剪枝
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  以最小置信度 {(minConf * 100).toFixed(0)}% 和最小提升度 {minLiftFilter.toFixed(1)} 过滤强关联规则。
                </p>
              </div>

              {/* Sub-view Toggle */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-md text-xs">
                <button
                  onClick={() => setStep4View('anim')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                    step4View === 'anim'
                      ? 'bg-white text-stone-900 font-semibold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>🎬 规则生成全过程动画</span>
                </button>
                <button
                  onClick={() => setStep4View('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                    step4View === 'table'
                      ? 'bg-white text-stone-900 font-semibold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-teal-600" />
                  <span>📋 全量关联规则明细表</span>
                </button>
              </div>
            </div>

            {/* View A: Interactive Rule Generation Animation Engine */}
            {step4View === 'anim' && (
              <RuleGenerationEngine
                frequentItemsets={aprioriData.allFrequent}
                transactions={transactions}
                minConf={minConf}
                setMinConf={setMinConf}
                minLift={minLiftFilter}
              />
            )}

            {/* View B: Full Rules Matrix Table */}
            {step4View === 'table' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-stone-600 font-medium">
                    当前筛选出 <span className="text-teal-800 font-bold">{filteredRules.length}</span> 条强关联规则 (Lift ≥ {minLiftFilter.toFixed(1)})
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-stone-500">Min Lift 过滤滑块:</span>
                    <input
                      type="range"
                      min="0.8"
                      max="2.5"
                      step="0.1"
                      value={minLiftFilter}
                      onChange={(e) => setMinLiftFilter(parseFloat(e.target.value))}
                      className="w-24 accent-teal-700 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-teal-800">{minLiftFilter.toFixed(1)}</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded-lg max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-50 text-[11px] font-mono text-stone-600 sticky top-0 border-b border-stone-200 z-10">
                      <tr>
                        <th className="p-2.5">规则 ID</th>
                        <th className="p-2.5">前项 Antecedent ⇒ 后项 Consequent</th>
                        <th className="p-2.5 text-right">支持度 Supp</th>
                        <th className="p-2.5 text-right">置信度 Conf</th>
                        <th className="p-2.5 text-right">提升度 Lift</th>
                        <th className="p-2.5 text-right">确信度 Conv</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono text-xs">
                      {filteredRules.map((r) => (
                        <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="p-2.5 font-bold text-stone-700">{r.id}</td>
                          <td className="p-2.5 font-sans font-medium text-stone-900">
                            [{r.antecedent.map((it) => it.split(' ')[0]).join(' + ')}] ⇒ [{r.consequent.map((it) => it.split(' ')[0]).join(' + ')}]
                          </td>
                          <td className="p-2.5 text-right text-stone-600">{(r.support * 100).toFixed(1)}%</td>
                          <td className="p-2.5 text-right font-bold text-teal-800">{(r.confidence * 100).toFixed(1)}%</td>
                          <td className="p-2.5 text-right">
                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-900 font-bold border border-teal-200">
                              {r.lift.toFixed(2)}x
                            </span>
                          </td>
                          <td className="p-2.5 text-right text-stone-500">
                            {r.conviction > 100 ? '∞' : r.conviction.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Scatter Plot Distribution */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  第五步：规则三维散点气泡分布 (Support vs Confidence vs Lift)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  横轴支持度（普遍性），纵轴置信度（因果可靠性），气泡大小及颜色深度代表提升度 Lift。
                </p>
              </div>
            </div>

            {/* Interactive SVG Scatter Plot */}
            <div className="relative w-full h-[280px] bg-stone-50 rounded border border-stone-200 p-2 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 600 240">
                {/* Grid Lines */}
                <line x1="50" y1="20" x2="50" y2="200" stroke="#CBD5E1" strokeWidth="1" />
                <line x1="50" y1="200" x2="580" y2="200" stroke="#CBD5E1" strokeWidth="1" />

                {/* Y-axis Labels */}
                <text x="15" y="30" fontSize="10" fill="#64748B">100%</text>
                <text x="20" y="115" fontSize="10" fill="#64748B">50%</text>
                <text x="25" y="200" fontSize="10" fill="#64748B">0%</text>
                <text x="10" y="10" fontSize="10" fontWeight="bold" fill="#334155">置信度 Conf ↑</text>

                {/* X-axis Labels */}
                <text x="50" y="215" fontSize="10" fill="#64748B">0%</text>
                <text x="310" y="215" fontSize="10" fill="#64748B">50%</text>
                <text x="560" y="215" fontSize="10" fill="#64748B">100%</text>
                <text x="510" y="235" fontSize="10" fontWeight="bold" fill="#334155">支持度 Supp →</text>

                {/* Rule Bubbles */}
                {filteredRules.map((r, i) => {
                  const cx = 50 + r.support * 520;
                  const cy = 200 - r.confidence * 180;
                  const radius = Math.max(6, Math.min(18, r.lift * 6));
                  const isHovered = hoveredRule?.id === r.id;

                  return (
                    <g key={r.id}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={r.lift > 1.4 ? 'rgba(13, 148, 136, 0.7)' : 'rgba(99, 102, 241, 0.6)'}
                        stroke={isHovered ? '#042F2E' : '#0F172A'}
                        strokeWidth={isHovered ? 2.5 : 1}
                        className="cursor-pointer transition-all hover:opacity-100"
                        onMouseEnter={() => setHoveredRule(r)}
                        onMouseLeave={() => setHoveredRule(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Details Card */}
              {hoveredRule && (
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm border border-stone-300 rounded p-2.5 text-xs shadow-md space-y-1">
                  <div className="font-semibold text-stone-900">
                    [{hoveredRule.antecedent.join('+')}] ⇒ [{hoveredRule.consequent.join('+')}]
                  </div>
                  <div className="text-stone-500 font-mono text-[11px]">
                    Supp: {(hoveredRule.support * 100).toFixed(1)}% · Conf: {(hoveredRule.confidence * 100).toFixed(1)}% · Lift: {hoveredRule.lift.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Business Decision Dashboard */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  第六步：商业决策转化看板与战略价值落地
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  将关联规则提炼为营销组合、货架动线陈列及产品连带策略。
                </p>
              </div>
              <button
                onClick={onGoToReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-medium hover:bg-stone-800 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>生成完整分析报告</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded space-y-2">
                <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-teal-700" />
                  <span>交叉销售与货架摆放行动项 (Action Items)</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-teal-900">
                  {currentCase.crossSellingAdvice.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold">✓</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded space-y-2">
                <h4 className="text-xs font-bold text-stone-900">
                  核心收益预估模型
                </h4>
                <div className="space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between border-b border-stone-100 pb-1">
                    <span>连带率预期提升:</span>
                    <span className="font-mono font-bold text-teal-800">+18.5% ~ +24.2%</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-1">
                    <span>客单价 (AOV) 增量空间:</span>
                    <span className="font-mono font-bold text-teal-800">+12.8%</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-1">
                    <span>滞销长尾库存周转加速:</span>
                    <span className="font-mono font-bold text-teal-800">+31.0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-xs text-stone-700 disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>上一步</span>
          </button>

          <span className="text-xs text-stone-400 font-mono">
            {currentStep} / {steps.length}
          </span>

          <button
            onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))}
            disabled={currentStep === steps.length}
            className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-medium disabled:opacity-40 cursor-pointer"
          >
            <span>下一步</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
