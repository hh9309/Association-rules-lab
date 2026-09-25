/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CLASSIC_CASES } from './data/cases';
import { DatasetCase, Transaction, FrequentItemset, AssociationRule } from './types';
import { runAprioriStages } from './algorithms/apriori';
import { extractAssociationRules } from './algorithms/rules';

// Navbar
import { Navbar, LabTab } from './components/Navbar';

// 10 Modules
import { AlgebraModule } from './components/AlgebraModule';
import { Apriori3DModule } from './components/Apriori3DModule';
import { FPTreeModule } from './components/FPTreeModule';
import { EclatModule } from './components/EclatModule';
import { CasesModule } from './components/CasesModule';
import { CodeEngineModule } from './components/CodeEngineModule';
import { AiCopilotModule } from './components/AiCopilotModule';
import { AiCopilotModal } from './components/AiCopilotModal';
import { PipelineModule } from './components/PipelineModule';
import { ReportExportModule } from './components/ReportExportModule';
import { KnowledgeSlicesModule } from './components/KnowledgeSlicesModule';

export default function App() {
  const [activeTab, setActiveTab] = useState<LabTab>('algebra');
  const [currentCase, setCurrentCase] = useState<DatasetCase>(CLASSIC_CASES[0]);
  const [customTransactions, setCustomTransactions] = useState<Transaction[] | null>(null);

  // Hyperparameters
  const [minSup, setMinSup] = useState<number>(CLASSIC_CASES[0].recommendedMinSup);
  const [minConf, setMinConf] = useState<number>(CLASSIC_CASES[0].recommendedMinConf);

  // Floating AI Copilot Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Active transactions and item list
  const activeTransactions = useMemo(() => {
    return customTransactions || currentCase.transactions;
  }, [customTransactions, currentCase.transactions]);

  const allItems = useMemo<string[]>(() => {
    if (customTransactions) {
      const set = new Set<string>();
      customTransactions.forEach((t) => t.items.forEach((it) => set.add(it)));
      return Array.from(set);
    }
    return currentCase.items.map((i) => i.name);
  }, [customTransactions, currentCase.items]);

  // Frequent Itemsets and Rules
  const aprioriResult = useMemo(() => {
    return runAprioriStages(activeTransactions, minSup, 3);
  }, [activeTransactions, minSup]);

  const rules: AssociationRule[] = useMemo(() => {
    return extractAssociationRules(aprioriResult.allFrequent, activeTransactions, minConf, 0.8);
  }, [aprioriResult.allFrequent, activeTransactions, minConf]);

  // Handle case selection
  const handleSelectCase = (c: DatasetCase) => {
    setCurrentCase(c);
    setCustomTransactions(null);
    setMinSup(c.recommendedMinSup);
    setMinConf(c.recommendedMinConf);
  };

  // Handle custom transactions upload
  const handleCustomTransactionsLoaded = (newTx: Transaction[], name: string) => {
    setCustomTransactions(newTx);
    const set = new Set<string>();
    newTx.forEach((t) => t.items.forEach((it) => set.add(it)));
    const itemsList = Array.from(set);

    setCurrentCase({
      id: 'custom_upload',
      title: `自定义小票数据 (${name})`,
      subtitle: '用户导入的交易长表',
      category: '自定义数据集',
      algorithmHighlight: '通用关联挖掘',
      description: `从 ${name}.csv 成功解析出 ${newTx.length} 笔交易记录与 ${itemsList.length} 种离散项。`,
      businessGoal: '挖掘导入数据中的高频伴随组合与强关联置信度规则。',
      items: itemsList.map((itemName) => ({
        id: itemName,
        name: itemName,
        category: '常规项目',
      })),
      transactions: newTx,
      recommendedMinSup: 0.25,
      recommendedMinConf: 0.6,
      recommendedMinLift: 1.2,
      domainInsights: [
        '自定义交易已就绪，可在各算法模块中随意切换比对。',
        '建议先在代数模块中观察 0-1 矩阵的稀疏度分布。',
      ],
      crossSellingAdvice: [
        '结合提升度 Lift > 1.25 的项集规划商品连带与组合促销。',
      ],
    });
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-800 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navigation & Status Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentCase={currentCase}
        allCases={CLASSIC_CASES}
        onSelectCase={handleSelectCase}
        minSup={minSup}
        setMinSup={setMinSup}
        minConf={minConf}
        setMinConf={setMinConf}
        frequentCount={aprioriResult.allFrequent.length}
        rulesCount={rules.length}
        onOpenAiModal={() => setIsAiModalOpen(true)}
      />

      {/* Main Lab Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'algebra' && (
          <AlgebraModule
            currentCase={currentCase}
            transactions={activeTransactions}
            allItems={allItems}
            minSup={minSup}
            minConf={minConf}
          />
        )}

        {activeTab === 'apriori' && (
          <Apriori3DModule
            currentCase={currentCase}
            transactions={activeTransactions}
            minSup={minSup}
            setMinSup={setMinSup}
          />
        )}

        {activeTab === 'fptree' && (
          <FPTreeModule
            currentCase={currentCase}
            transactions={activeTransactions}
            minSup={minSup}
          />
        )}

        {activeTab === 'eclat' && (
          <EclatModule
            currentCase={currentCase}
            transactions={activeTransactions}
            allItems={allItems}
            minSup={minSup}
            minConf={minConf}
          />
        )}

        {activeTab === 'cases' && (
          <CasesModule
            allCases={CLASSIC_CASES}
            currentCase={currentCase}
            onSelectCase={handleSelectCase}
            setActiveTab={setActiveTab}
            setMinSup={setMinSup}
            setMinConf={setMinConf}
          />
        )}

        {activeTab === 'code' && (
          <CodeEngineModule
            currentCase={currentCase}
            transactions={activeTransactions}
            allItems={allItems}
            minSup={minSup}
            minConf={minConf}
          />
        )}

        {activeTab === 'ai' && (
          <AiCopilotModule
            currentCase={currentCase}
            transactions={activeTransactions}
            rules={rules}
            minSup={minSup}
            minConf={minConf}
            setMinSup={setMinSup}
            setMinConf={setMinConf}
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelineModule
            currentCase={currentCase}
            transactions={activeTransactions}
            allItems={allItems}
            minSup={minSup}
            setMinSup={setMinSup}
            minConf={minConf}
            setMinConf={setMinConf}
            onGoToReport={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'report' && (
          <ReportExportModule
            currentCase={currentCase}
            transactions={activeTransactions}
            frequentItemsets={aprioriResult.allFrequent}
            rules={rules}
            minSup={minSup}
            minConf={minConf}
            onCustomTransactionsLoaded={handleCustomTransactionsLoaded}
            onSelectCase={handleSelectCase}
          />
        )}

        {activeTab === 'knowledge' && <KnowledgeSlicesModule />}
      </main>

      {/* Floating AI Copilot Popup */}
      <AiCopilotModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentCase={currentCase}
        transactions={activeTransactions}
        rules={rules}
        minSup={minSup}
        minConf={minConf}
      />

      {/* Bottom Footer */}
      <footer className="border-t border-stone-200 bg-white/70 py-4 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-stone-600">频繁项集与关联分析实验室</span>
            <span>·</span>
            <span>Association Rules & Frequent Itemsets Lab</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>十大切片模块全量就绪</span>
            <span>·</span>
            <span>Apriori / FP-Tree / ECLAT</span>
            <span>·</span>
            <span>无监督模式识别</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
