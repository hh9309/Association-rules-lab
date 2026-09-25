import React from 'react';
import { DatasetCase } from '../types';
import { 
  Binary, 
  Box, 
  GitFork, 
  Network, 
  Layers, 
  Terminal, 
  Sparkles, 
  Workflow, 
  Download, 
  BookOpen,
  ChevronDown
} from 'lucide-react';

export type LabTab =
  | 'algebra'
  | 'apriori'
  | 'fptree'
  | 'eclat'
  | 'cases'
  | 'code'
  | 'ai'
  | 'pipeline'
  | 'report'
  | 'knowledge';

interface NavbarProps {
  activeTab: LabTab;
  setActiveTab: (tab: LabTab) => void;
  currentCase: DatasetCase;
  allCases: DatasetCase[];
  onSelectCase: (c: DatasetCase) => void;
  minSup: number;
  setMinSup: (val: number) => void;
  minConf: number;
  setMinConf: (val: number) => void;
  frequentCount: number;
  rulesCount: number;
  onOpenAiModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentCase,
  allCases,
  onSelectCase,
  minSup,
  setMinSup,
  minConf,
  setMinConf,
  frequentCount,
  rulesCount,
  onOpenAiModal,
}) => {
  const tabs: { id: LabTab; name: string; num: string; icon: React.ReactNode }[] = [
    { id: 'algebra', name: '理论代数', num: '1', icon: <Binary className="w-3.5 h-3.5" /> },
    { id: 'apriori', name: 'Apriori 3D', num: '2', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'fptree', name: 'FP-Tree 树图', num: '3', icon: <GitFork className="w-3.5 h-3.5" /> },
    { id: 'eclat', name: 'ECLAT 垂直', num: '4', icon: <Network className="w-3.5 h-3.5" /> },
    { id: 'cases', name: '四大案例', num: '5', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'code', name: '代码引擎', num: '6', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'ai', name: 'AI 诊断', num: '7', icon: <Sparkles className="w-3.5 h-3.5 text-teal-600" /> },
    { id: 'pipeline', name: '全流程', num: '8', icon: <Workflow className="w-3.5 h-3.5" /> },
    { id: 'report', name: '数据报告', num: '9', icon: <Download className="w-3.5 h-3.5" /> },
    { id: 'knowledge', name: '知识导引', num: '10', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top Banner */}
      <div className="max-w-[1560px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-serif font-bold text-sm tracking-tighter">
            AR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-stone-900 tracking-tight">
                频繁项集与关联分析实验室
              </h1>
              <span className="text-[11px] font-mono text-stone-400">
                Association Rules Lab v2.5
              </span>
            </div>
            <p className="text-[12px] text-stone-500 leading-tight">
              0-1 矩阵形式化 · 3D 剪枝 · FP 树图 · 垂直倒排求交 · 规则评估
            </p>
          </div>
        </div>

        {/* Quick Parameters & Current Dataset */}
        <div className="flex items-center gap-4 flex-wrap text-xs">
          {/* Dataset Selector */}
          <div className="relative flex items-center">
            <label className="text-stone-400 mr-2 text-[11px]">当前案例:</label>
            <div className="relative">
              <select
                aria-label="选择数据案例"
                value={currentCase.id}
                onChange={(e) => {
                  const target = allCases.find((c) => c.id === e.target.value);
                  if (target) onSelectCase(target);
                }}
                className="appearance-none bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 rounded px-2.5 py-1 pr-6 font-medium text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                {allCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.algorithmHighlight})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-stone-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Min Support Quick Slider */}
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded px-2.5 py-1">
            <span className="text-stone-500 text-[11px]">Min Sup:</span>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={minSup}
              onChange={(e) => setMinSup(parseFloat(e.target.value))}
              className="w-16 h-1 bg-stone-200 rounded appearance-none cursor-pointer accent-teal-700"
            />
            <span className="font-mono text-stone-800 font-semibold w-8 text-right">
              {(minSup * 100).toFixed(0)}%
            </span>
          </div>

          {/* Min Conf Quick Slider */}
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded px-2.5 py-1">
            <span className="text-stone-500 text-[11px]">Min Conf:</span>
            <input
              type="range"
              min="0.30"
              max="0.95"
              step="0.05"
              value={minConf}
              onChange={(e) => setMinConf(parseFloat(e.target.value))}
              className="w-16 h-1 bg-stone-200 rounded appearance-none cursor-pointer accent-teal-700"
            />
            <span className="font-mono text-stone-800 font-semibold w-8 text-right">
              {(minConf * 100).toFixed(0)}%
            </span>
          </div>

          {/* Data Stats Counter */}
          <div className="flex items-center gap-2 text-stone-600 text-[11px] font-mono">
            <span>频繁项集: <strong className="text-stone-900">{frequentCount}</strong></span>
            <span className="text-stone-300">|</span>
            <span>强规则: <strong className="text-teal-700">{rulesCount}</strong></span>
          </div>

          {/* Floating AI Diagnostics Launcher */}
          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-medium transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <span>AI 随诊对话</span>
          </button>
        </div>
      </div>

      {/* 10 Slices Navigation Bar */}
      <div className="max-w-[1560px] mx-auto px-4 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 py-1 text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-stone-900 text-stone-950 bg-stone-50/70 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50/50'
                }`}
              >
                <span
                  className={`text-[10px] font-mono w-4 h-4 rounded-sm flex items-center justify-center ${
                    isActive ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {tab.num}
                </span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
