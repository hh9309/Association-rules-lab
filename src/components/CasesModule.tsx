import React from 'react';
import { DatasetCase } from '../types';
import { LabTab } from './Navbar';
import { 
  ShoppingCart, 
  Globe, 
  Stethoscope, 
  CreditCard, 
  Check, 
  ArrowRight, 
  Sparkles,
  Layers,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

interface CasesModuleProps {
  allCases: DatasetCase[];
  currentCase: DatasetCase;
  onSelectCase: (c: DatasetCase) => void;
  setActiveTab: (tab: LabTab) => void;
  setMinSup: (val: number) => void;
  setMinConf: (val: number) => void;
}

export const CasesModule: React.FC<CasesModuleProps> = ({
  allCases,
  currentCase,
  onSelectCase,
  setActiveTab,
  setMinSup,
  setMinConf,
}) => {
  const getCaseIcon = (id: string) => {
    switch (id) {
      case 'supermarket':
        return <ShoppingCart className="w-5 h-5 text-teal-700" />;
      case 'ecommerce_funnel':
        return <Globe className="w-5 h-5 text-indigo-700" />;
      case 'healthcare':
        return <Stethoscope className="w-5 h-5 text-rose-700" />;
      case 'fraud_detection':
        return <CreditCard className="w-5 h-5 text-amber-700" />;
      default:
        return <Layers className="w-5 h-5 text-stone-700" />;
    }
  };

  const getTargetTabForCase = (id: string): LabTab => {
    switch (id) {
      case 'supermarket':
        return 'apriori';
      case 'ecommerce_funnel':
        return 'fptree';
      case 'healthcare':
        return 'eclat';
      case 'fraud_detection':
        return 'pipeline';
      default:
        return 'algebra';
    }
  };

  const handleApplyCase = (c: DatasetCase, jump: boolean = false) => {
    onSelectCase(c);
    setMinSup(c.recommendedMinSup);
    setMinConf(c.recommendedMinConf);
    if (jump) {
      setActiveTab(getTargetTabForCase(c.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Slice */}
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-stone-400">模块 05</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-medium text-teal-700">四大行业真实案例库</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
              多领域典型关联分析场景与业务落地策略库
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl">
              关联分析不仅是经典的“啤酒与尿布”零售命题，更是互联网用户行为漏斗优化、临床并发症预警、
              以及金融犯罪洗钱与欺诈联查的核心无监督利器。点击一键载入即可同步全实验室数据流。
            </p>
          </div>
        </div>
      </div>

      {/* 4 Classic Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allCases.map((c) => {
          const isActive = currentCase.id === c.id;
          return (
            <div
              key={c.id}
              className={`bg-white border rounded-lg p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-teal-600 ring-2 ring-teal-600/10 shadow-sm'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-stone-100 border border-stone-200">
                      {getCaseIcon(c.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-stone-900">
                          {c.title}
                        </h3>
                        {isActive && (
                          <span className="text-[10px] font-medium bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                            当前载入中
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 font-mono">
                        {c.subtitle} · {c.category}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-stone-700 bg-stone-100 px-2.5 py-1 rounded">
                    适配: {c.algorithmHighlight}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  {c.description}
                </p>

                {/* Business Goal Slice */}
                <div className="bg-stone-50 p-3 rounded border border-stone-100 text-xs mb-4">
                  <div className="text-[11px] font-semibold text-stone-900 mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-stone-600" />
                    <span>商业决策目标 (Business Goal)</span>
                  </div>
                  <div className="text-stone-600 leading-relaxed">
                    {c.businessGoal}
                  </div>
                </div>

                {/* Transactions Preview & Items */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex justify-between text-stone-500 text-[11px]">
                    <span>包含实体项: {c.items.length} 种</span>
                    <span>样本事务: {c.transactions.length} 笔</span>
                  </div>

                  {/* Sample Transaction Pills */}
                  <div className="bg-stone-50/70 p-2.5 rounded border border-stone-100 space-y-1 font-mono text-[11px]">
                    <div className="text-[10px] text-stone-400">小票样本 (Transaction Sample):</div>
                    <div className="text-stone-700 truncate">
                      {c.transactions[0].id}: [{c.transactions[0].items.join(', ')}]
                    </div>
                  </div>
                </div>

                {/* Domain Insights */}
                <div className="space-y-1.5 mb-4 text-xs">
                  <div className="text-[11px] font-semibold text-stone-800">
                    实战洞察与高提升度规律:
                  </div>
                  <ul className="space-y-1 text-[11px] text-stone-600 list-disc list-inside">
                    {c.domainInsights.map((insight, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                <div className="text-[11px] text-stone-500 font-mono">
                  推荐 MinSup: {(c.recommendedMinSup * 100).toFixed(0)}% · Conf: {(c.recommendedMinConf * 100).toFixed(0)}%
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyCase(c, false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-stone-100 text-stone-600 border border-stone-200'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border border-stone-300'
                    }`}
                  >
                    {isActive ? '已激活' : '一键载入'}
                  </button>

                  <button
                    onClick={() => handleApplyCase(c, true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                  >
                    <span>跳转演播</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
