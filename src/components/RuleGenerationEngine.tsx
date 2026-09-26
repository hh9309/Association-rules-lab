import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Transaction, FrequentItemset, AssociationRule } from '../types';
import { calculateRuleMetrics, generateAllSubsets } from '../algorithms/core';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Scissors, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Zap, 
  Split, 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  HelpCircle,
  Shuffle,
  Compass
} from 'lucide-react';

interface RuleGenerationEngineProps {
  frequentItemsets: FrequentItemset[];
  transactions: Transaction[];
  minConf: number;
  setMinConf?: (val: number) => void;
  minLift?: number;
}

interface CandidateRuleDirection {
  id: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
  count: number;
  suppA: number;
  suppB: number;
  passesConf: boolean;
  passesLift: boolean;
}

export const RuleGenerationEngine: React.FC<RuleGenerationEngineProps> = ({
  frequentItemsets,
  transactions,
  minConf,
  setMinConf,
  minLift = 1.0,
}) => {
  // Only frequent itemsets with length >= 2 can generate rules
  const eligibleItemsets = useMemo(() => {
    return frequentItemsets.filter((f) => f.items.length >= 2);
  }, [frequentItemsets]);

  // Selected frequent itemset for demonstration
  const [selectedItemsetKey, setSelectedItemsetKey] = useState<string>('');

  // Set initial selected itemset
  useEffect(() => {
    if (eligibleItemsets.length > 0 && (!selectedItemsetKey || !eligibleItemsets.some((f) => f.items.slice().sort().join('::') === selectedItemsetKey))) {
      // Prefer a 3-itemset if available for maximum educational richness, else 2-itemset
      const threeItemset = eligibleItemsets.find((f) => f.items.length === 3);
      const chosen = threeItemset || eligibleItemsets[0];
      setSelectedItemsetKey(chosen.items.slice().sort().join('::'));
    }
  }, [eligibleItemsets, selectedItemsetKey]);

  // Current active frequent itemset object
  const currentItemset = useMemo(() => {
    return eligibleItemsets.find((f) => f.items.slice().sort().join('::') === selectedItemsetKey) || eligibleItemsets[0] || null;
  }, [eligibleItemsets, selectedItemsetKey]);

  // Generate all possible directional rules (all proper non-empty subsets X -> Y = L \ X)
  const candidateRuleDirections = useMemo<CandidateRuleDirection[]>(() => {
    if (!currentItemset) return [];
    const items = currentItemset.items;
    const subsets = generateAllSubsets(items);
    const rules: CandidateRuleDirection[] = [];
    let idCounter = 1;

    subsets.forEach((antecedent) => {
      if (antecedent.length === 0 || antecedent.length === items.length) return;
      const antecedentSet = new Set(antecedent);
      const consequent = items.filter((it) => !antecedentSet.has(it));
      if (consequent.length === 0) return;

      const metrics = calculateRuleMetrics(antecedent, consequent, transactions);
      rules.push({
        id: `DIR-${idCounter++}`,
        antecedent,
        consequent,
        support: metrics.support,
        confidence: metrics.confidence,
        lift: metrics.lift,
        conviction: metrics.conviction,
        count: metrics.count,
        suppA: metrics.suppA,
        suppB: metrics.suppB,
        passesConf: metrics.confidence >= minConf,
        passesLift: metrics.lift >= minLift,
      });
    });

    // Sort by confidence descending
    return rules.sort((a, b) => b.confidence - a.confidence);
  }, [currentItemset, transactions, minConf, minLift]);

  // Selected candidate rule direction to inspect
  const [selectedDirectionIdx, setSelectedDirectionIdx] = useState<number>(0);

  // Keep selection within bounds
  useEffect(() => {
    if (selectedDirectionIdx >= candidateRuleDirections.length) {
      setSelectedDirectionIdx(0);
    }
  }, [candidateRuleDirections.length, selectedDirectionIdx]);

  const activeDirection = candidateRuleDirections[selectedDirectionIdx] || candidateRuleDirections[0] || null;

  // Animation Micro-step (1 to 5):
  // 1 = 频繁项集提取与检验 (Select Frequent Itemset L)
  // 2 = 非空真子集切分 (Partition Subsets: s => L \ s)
  // 3 = 查表代数支持度与置信度推导 (Compute Support & Confidence)
  // 4 = 置信度剪枝与强规则判定 (Confidence Pruning Check)
  // 5 = 提升度与商业诊断落地 (Lift Evaluation & Business Action)
  const [animPhase, setAnimPhase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1.0); // 0.6x, 1x, 1.5x

  // Auto-play stepper
  useEffect(() => {
    if (!isAutoPlaying) return;
    const intervalTime = 2200 / playSpeed;
    const timer = setInterval(() => {
      setAnimPhase((prev) => {
        if (prev < 5) {
          return (prev + 1) as 1 | 2 | 3 | 4 | 5;
        } else {
          // If reached step 5, optionally cycle to next direction or pause
          setIsAutoPlaying(false);
          return 5;
        }
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isAutoPlaying, playSpeed]);

  // Random itemset switcher
  const handleRandomItemset = () => {
    if (eligibleItemsets.length <= 1) return;
    const otherItemsets = eligibleItemsets.filter(
      (f) => f.items.slice().sort().join('::') !== selectedItemsetKey
    );
    const randomOne = otherItemsets[Math.floor(Math.random() * otherItemsets.length)];
    if (randomOne) {
      setSelectedItemsetKey(randomOne.items.slice().sort().join('::'));
      setSelectedDirectionIdx(0);
      setAnimPhase(1);
    }
  };

  // Phase Explanations
  const phaseDetails = [
    {
      step: 1,
      name: '频繁项集锁定',
      title: '第 1 步：从已挖掘的频繁项集池中锁定合资格项集 L',
      desc: '只有长度 |L| ≥ 2 的频繁项集才能推导关联规则（单项集无因果前项与后项）。',
      badge: '项集选取',
      icon: <Layers className="w-4 h-4 text-teal-600" />,
    },
    {
      step: 2,
      name: '非空子集二分',
      title: '第 2 步：非空真子集切分 (Partitioning: s ⇒ L \\ s)',
      desc: `根据排列组合，项集包含的 ${currentItemset?.items.length || 0} 个元素可拆解出 2^k - 2 = ${candidateRuleDirections.length} 种前项与后项定向推导可能。`,
      badge: '子集拆解',
      icon: <Split className="w-4 h-4 text-indigo-600" />,
    },
    {
      step: 3,
      name: '置信度代数计算',
      title: '第 3 步：提取支持度并计算置信度 Conf(s ⇒ c) = supp(L) / supp(s)',
      desc: '条件概率度量：在包含前件的所有交易中，同时包含后件的比例是多少。',
      badge: '公式代数',
      icon: <Calculator className="w-4 h-4 text-blue-600" />,
    },
    {
      step: 4,
      name: '置信度剪枝检验',
      title: '第 4 步：置信度阈值过滤与规则剪枝 (Confidence Pruning)',
      desc: `检验 Conf 是否达到最小置信度阈值 ${(minConf * 100).toFixed(0)}%。未达到者直接 ✂️ 剪枝淘汰！`,
      badge: '规则剪枝',
      icon: <Scissors className="w-4 h-4 text-red-600" />,
    },
    {
      step: 5,
      name: '提升度商业诊断',
      title: '第 5 步：提升度 Lift 检验与因果商业决策落地',
      desc: '消除后项基准概率影响：Lift > 1 才是真正的正向连带促进；Lift ≈ 1 纯属高频巧合（伪关联）。',
      badge: '商业决策',
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
    },
  ];

  if (!currentItemset) {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 text-center text-xs text-stone-500">
        <HelpCircle className="w-6 h-6 mx-auto mb-2 text-stone-400" />
        <span>当前数据集在给定最小支持度下未产生长度 ≥ 2 的频繁项集，请先适当降低最小支持度 (MinSup)。</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-5">
      {/* Title & Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
              交互式推导流水线
            </span>
            <span className="text-stone-300">/</span>
            <span className="text-xs text-stone-500 font-medium">从频繁项集到强关联规则</span>
          </div>
          <h3 className="text-base font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <span>关联规则动态生成全过程展示动画</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-sans font-normal px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              <Zap className="w-3 h-3 text-amber-600 animate-pulse" />
              <span>逐步代数推导 + 动态剪枝</span>
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            展示从单个<strong>高阶频繁项集 $L$</strong> 出发，如何通过<strong>非空真子集切分、条件概率商除、置信度阈值剪枝</strong>以及<strong>提升度因果诊断</strong>，
            最终蜕变为具有商业指导价值的<strong>强关联规则</strong>。
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomItemset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-xs text-stone-700 transition-colors cursor-pointer"
            title="随机选取另一个频繁项集进行推导演播"
          >
            <Shuffle className="w-3.5 h-3.5 text-stone-500" />
            <span>换一个项集</span>
          </button>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-xs cursor-pointer ${
              isAutoPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPlaying ? '暂停演播' : '连续演播全过程'}</span>
          </button>
        </div>
      </div>

      {/* Itemset Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-stone-500 shrink-0 font-medium text-[11px] flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span>选择示范频繁项集:</span>
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {eligibleItemsets.slice(0, 8).map((fit, idx) => {
            const key = fit.items.slice().sort().join('::');
            const isSelected = key === selectedItemsetKey;
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedItemsetKey(key);
                  setSelectedDirectionIdx(0);
                  setAnimPhase(1);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700'
                }`}
              >
                <span>&#123;{fit.items.map((it) => it.split(' ')[0]).join('·')}&#125;</span>
                <span className={`text-[10px] ${isSelected ? 'text-teal-200' : 'text-stone-400'}`}>
                  ({(fit.support * 100).toFixed(0)}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5-Step Process Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
        {phaseDetails.map((ph) => {
          const isCurrent = animPhase === ph.step;
          const isPassed = animPhase > ph.step;
          return (
            <button
              key={ph.step}
              onClick={() => setAnimPhase(ph.step as any)}
              className={`p-2 rounded text-left transition-all border cursor-pointer ${
                isCurrent
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : isPassed
                  ? 'bg-teal-50/60 border-teal-200 text-stone-800'
                  : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded ${
                    isCurrent
                      ? 'bg-stone-800 text-teal-300 font-bold'
                      : isPassed
                      ? 'bg-teal-600 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  Step 0{ph.step}
                </span>
                {isPassed && <CheckCircle2 className="w-3 h-3 text-teal-700" />}
              </div>
              <div className="text-[11px] font-semibold truncate">{ph.name}</div>
            </button>
          );
        })}
      </div>

      {/* Main Animated Visualization Stage Box */}
      <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-5 space-y-6 relative overflow-hidden">
        {/* Dynamic Step Banner Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-white border border-stone-200 shadow-xs text-stone-700 mt-0.5">
              {phaseDetails[animPhase - 1].icon}
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                <span>{phaseDetails[animPhase - 1].title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-stone-200 text-teal-800">
                  {phaseDetails[animPhase - 1].badge}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {phaseDetails[animPhase - 1].desc}
              </p>
            </div>
          </div>

          {/* Stepper Controls in Corner */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setAnimPhase((prev) => Math.max(1, prev - 1) as any)}
              disabled={animPhase === 1}
              className="p-1 border border-stone-200 rounded bg-white hover:bg-stone-100 disabled:opacity-40 text-stone-700 cursor-pointer"
              title="上一步"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setAnimPhase((prev) => Math.min(5, prev + 1) as any)}
              disabled={animPhase === 5}
              className="p-1 border border-stone-200 rounded bg-white hover:bg-stone-100 disabled:opacity-40 text-stone-700 cursor-pointer"
              title="下一步"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setAnimPhase(1)}
              className="p-1 border border-stone-200 rounded bg-white hover:bg-stone-100 text-stone-600 cursor-pointer"
              title="重头演播"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Canvas: The Transformation from Frequent Itemset to Directed Rule */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
          {/* Top: The Source Frequent Itemset L */}
          <div className="flex flex-col items-center">
            <div className="text-[11px] font-mono text-stone-400 mb-1.5 flex items-center gap-1">
              <span>输入高阶频繁项集 L (k = {currentItemset.items.length})</span>
            </div>
            <div className={`px-4 py-2.5 rounded-lg border-2 transition-all duration-500 flex items-center gap-3 ${
              animPhase === 1
                ? 'border-teal-500 bg-teal-50/80 shadow-md scale-105'
                : 'border-stone-200 bg-stone-50'
            }`}>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentItemset.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-white border border-stone-200 font-medium text-xs text-stone-800 shadow-2xs"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="h-5 w-px bg-stone-200" />
              <div className="text-xs font-mono text-stone-600">
                <span className="text-stone-400 text-[10px]">支持度: </span>
                <span className="font-bold text-teal-800">{(currentItemset.support * 100).toFixed(1)}%</span>
                <span className="text-stone-400 text-[10px]"> ({currentItemset.count}笔)</span>
              </div>
            </div>
          </div>

          {/* Animated Connecting Flow Arrows */}
          <div className="py-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-stone-400 text-[11px]">
              <Split className={`w-4 h-4 transition-transform duration-500 ${animPhase >= 2 ? 'text-indigo-600 scale-110' : 'text-stone-300'}`} />
              <span className="font-mono">
                {animPhase === 1 ? '准备子集切分...' : `拆解为 ${candidateRuleDirections.length} 条定向规则组合`}
              </span>
            </div>
            <div className="w-0.5 h-6 bg-gradient-to-b from-stone-300 to-indigo-400 my-1" />
          </div>

          {/* Candidate Direction Selector Buttons */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-stone-600 font-medium text-[11px] flex items-center gap-1">
                <span>切分出的候选推导方向（点击切换检验）:</span>
              </span>
              <span className="font-mono text-stone-400 text-[10px]">
                {candidateRuleDirections.filter((r) => r.passesConf).length} 条达标 / 共 {candidateRuleDirections.length} 种方向
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {candidateRuleDirections.map((dir, idx) => {
                const isSelected = idx === selectedDirectionIdx;
                const isPruned = !dir.passesConf;
                return (
                  <button
                    key={dir.id}
                    onClick={() => {
                      setSelectedDirectionIdx(idx);
                      if (animPhase < 2) setAnimPhase(2);
                    }}
                    className={`p-2 rounded text-left border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-600 font-semibold'
                        : isPruned && animPhase >= 4
                        ? 'border-red-200 bg-red-50/30 text-stone-600 hover:bg-red-50/60'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono text-[10px] text-stone-400">#{idx + 1}</span>
                      <span className="truncate">
                        &#123;{dir.antecedent.map((it) => it.split(' ')[0]).join('·')}&#125; ⇒ &#123;{dir.consequent.map((it) => it.split(' ')[0]).join('·')}&#125;
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                      {animPhase >= 4 && isPruned ? (
                        <span className="text-red-600 text-[10px] flex items-center gap-0.5">
                          <Scissors className="w-3 h-3" />
                          <span>剪除</span>
                        </span>
                      ) : (
                        <span className={`${dir.passesConf ? 'text-teal-700 font-bold' : 'text-stone-500'}`}>
                          {(dir.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Direction Detailed Dynamic Derivation Card */}
          {activeDirection && (
            <div className={`border-2 rounded-xl p-4 transition-all duration-500 space-y-4 ${
              animPhase === 4 && !activeDirection.passesConf
                ? 'border-red-400 bg-red-50/40'
                : animPhase >= 4 && activeDirection.passesConf
                ? 'border-teal-500 bg-teal-50/30 shadow-sm'
                : 'border-stone-300 bg-stone-50/60'
            }`}>
              {/* Dynamic Split Visual: Antecedent => Consequent */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-2">
                {/* Antecedent Card */}
                <div className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                  animPhase >= 2
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700'
                }`}>
                  <div className="text-[10px] font-mono text-indigo-700 font-semibold mb-1">
                    前件 (Antecedent s)
                  </div>
                  <div className="font-bold text-xs">
                    &#123;{activeDirection.antecedent.join(', ')}&#125;
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-1">
                    supp(s) = {(activeDirection.suppA * 100).toFixed(1)}% ({Math.round(activeDirection.suppA * transactions.length)}笔)
                  </div>
                </div>

                {/* Animated Arrow */}
                <div className="flex flex-col items-center justify-center px-2">
                  <div className="text-[10px] font-mono text-stone-400 mb-0.5">触发推导</div>
                  <div className={`p-2 rounded-full border transition-all duration-300 ${
                    animPhase >= 3
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-stone-200 text-stone-500 border-stone-300'
                  }`}>
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="text-[10px] font-mono text-stone-400 mt-0.5">关联后件</div>
                </div>

                {/* Consequent Card */}
                <div className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                  animPhase >= 2
                    ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700'
                }`}>
                  <div className="text-[10px] font-mono text-amber-700 font-semibold mb-1">
                    后件 (Consequent c)
                  </div>
                  <div className="font-bold text-xs">
                    &#123;{activeDirection.consequent.join(', ')}&#125;
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-1">
                    supp(c) = {(activeDirection.suppB * 100).toFixed(1)}% ({Math.round(activeDirection.suppB * transactions.length)}笔)
                  </div>
                </div>
              </div>

              {/* Step 3: Math Formulas Calculation */}
              {animPhase >= 3 && (
                <div className="bg-white border border-stone-200 rounded-lg p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-blue-600" />
                      <span>置信度代数计算与推导 (Confidence Derivation)</span>
                    </span>
                    <span className="font-mono text-stone-400 text-[10px]">
                      P(后件 | 前件)
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-stone-50 border border-stone-100 font-mono text-xs text-stone-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span>Conf(s ⇒ c) = </span>
                      <span className="text-teal-800 font-bold">supp(s ∪ c)</span>
                      <span> / </span>
                      <span className="text-indigo-800 font-bold">supp(s)</span>
                      <span> = </span>
                      <span className="text-teal-800">{(activeDirection.support * 100).toFixed(1)}%</span>
                      <span> / </span>
                      <span className="text-indigo-800">{(activeDirection.suppA * 100).toFixed(1)}%</span>
                      <span> = </span>
                      <span className="text-sm font-bold text-teal-800 underline decoration-teal-500 decoration-2">
                        {(activeDirection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500">
                      基数计: {activeDirection.count} 笔 / {Math.round(activeDirection.suppA * transactions.length)} 笔
                    </div>
                  </div>

                  {/* Confidence Bar Comparison */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-600">
                        当前计算值: <strong>{(activeDirection.confidence * 100).toFixed(1)}%</strong>
                      </span>
                      <span className="text-stone-500 font-mono">
                        门槛阈值 MinConf: <strong>{(minConf * 100).toFixed(0)}%</strong>
                      </span>
                    </div>
                    <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden relative">
                      <div
                        style={{ width: `${Math.min(100, activeDirection.confidence * 100)}%` }}
                        className={`h-full transition-all duration-500 ${
                          activeDirection.passesConf ? 'bg-teal-600' : 'bg-red-500'
                        }`}
                      />
                      {/* MinConf Threshold Pin Line */}
                      <div
                        style={{ left: `${minConf * 100}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-stone-900 z-10"
                        title={`MinConf: ${(minConf * 100).toFixed(0)}%`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 & 5: Pruning Verdict & Lift Diagnosis */}
              {animPhase >= 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Pruning Verdict */}
                  <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    activeDirection.passesConf
                      ? 'bg-teal-50 border-teal-200 text-teal-950'
                      : 'bg-red-50 border-red-200 text-red-950'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {activeDirection.passesConf ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-teal-700" />
                          <span>置信度达标：确立为有效关联规则 ✓</span>
                        </>
                      ) : (
                        <>
                          <Scissors className="w-4 h-4 text-red-600" />
                          <span>置信度不足剪枝：弱规则予以剔除 ✂️</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {activeDirection.passesConf
                        ? `计算置信度 ${(activeDirection.confidence * 100).toFixed(1)}% ≥ 设定阈值 ${(minConf * 100).toFixed(0)}%，通过第一道质量过滤！`
                        : `计算置信度 ${(activeDirection.confidence * 100).toFixed(1)}% < 设定阈值 ${(minConf * 100).toFixed(0)}%，关联性过弱被剪枝淘汰。`}
                    </p>
                  </div>

                  {/* Step 5: Lift Diagnosis */}
                  {animPhase >= 5 && (
                    <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      activeDirection.lift >= 1.2
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : activeDirection.lift < 0.9
                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}>
                      <div className="font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-teal-700" />
                          <span>提升度 Lift 商业因果定性:</span>
                        </span>
                        <span className="font-mono text-sm font-bold">
                          {activeDirection.lift.toFixed(2)}x
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {activeDirection.lift >= 1.2 ? (
                          <span>
                            🚀 <strong>强正相关促进</strong>：买前件使买后件概率提升 <strong>{activeDirection.lift.toFixed(2)} 倍</strong>，黄金搭配！
                          </span>
                        ) : activeDirection.lift < 0.9 ? (
                          <span>
                            ⛔ <strong>负相关互斥</strong>：两项存在替代关系（竞争品），不可盲目捆绑促销。
                          </span>
                        ) : (
                          <span>
                            ⚠️ <strong>独立伪关联</strong>：两项同时出现纯属后项自身购买概率高，无实际连带推动力。
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Educational Principle Card */}
        <div className="bg-white border border-stone-200 rounded-lg p-4 text-xs text-stone-600 flex items-start gap-3">
          <Compass className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <div className="font-semibold text-stone-900">
              关联规则置信度的反单调性 (Anti-monotonicity of Rule Confidence)：
            </div>
            <p className="text-[11px]">
              对同一个频繁项集 $L$，若规则 $c_1 \implies (L \setminus c_1)$ 置信度不足，则其后项的任何子集规则通常同样不具备高置信度。
              这种性质使得算法在推导高阶规则时可以<strong>自底向上反向剪枝</strong>，极大地缩减了高阶规则搜索空间！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
