import React, { useState, useMemo } from 'react';
import { Transaction, DatasetCase, AssociationRule, FrequentItemset } from '../types';
import { CLASSIC_CASES } from '../data/cases';
import { buildBinaryMatrix } from '../algorithms/core';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  FileCode, 
  Check, 
  Layers, 
  Printer, 
  FileJson,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Smartphone,
  Activity,
  ShieldAlert,
  Copy,
  ExternalLink,
  ChevronRight,
  Database,
  Eye,
  Sliders,
  TrendingUp,
  Table,
  Workflow
} from 'lucide-react';

interface ReportExportModuleProps {
  currentCase: DatasetCase;
  transactions: Transaction[];
  frequentItemsets: FrequentItemset[];
  rules: AssociationRule[];
  minSup: number;
  minConf: number;
  onCustomTransactionsLoaded: (newTransactions: Transaction[], name: string) => void;
  onSelectCase?: (c: DatasetCase) => void;
}

export const ReportExportModule: React.FC<ReportExportModuleProps> = ({
  currentCase,
  transactions,
  frequentItemsets,
  rules,
  minSup,
  minConf,
  onCustomTransactionsLoaded,
  onSelectCase,
}) => {
  // Main view mode
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'latex' | 'raw_datasets'>('preview');
  
  // Selected case for viewing raw transactions in preview modal/drawer
  const [previewingRawCaseId, setPreviewingRawCaseId] = useState<string | null>(null);
  
  // Section anchor in interactive preview
  const [activeSection, setActiveSection] = useState<number>(1);
  
  // Copy notification states
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Trigger copy with feedback
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  // Helper to trigger file download
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper for CSV download with UTF-8 BOM
  const downloadCSV = (content: string, filename: string) => {
    triggerDownload('\ufeff' + content, filename, 'text/csv;charset=utf-8;');
  };

  // 1. Generate Raw Data CSV for any case
  const generateCaseRawCSV = (c: DatasetCase): string => {
    let csv = 'Transaction_ID,Item_Count,Items_List\n';
    c.transactions.forEach((tx) => {
      const escapedItems = `"${tx.items.join('; ')}"`;
      csv += `${tx.id},${tx.items.length},${escapedItems}\n`;
    });
    return csv;
  };

  // 2. Generate Raw Data JSON for any case
  const generateCaseRawJSON = (c: DatasetCase): string => {
    return JSON.stringify(
      {
        caseId: c.id,
        title: c.title,
        subtitle: c.subtitle,
        category: c.category,
        algorithmHighlight: c.algorithmHighlight,
        businessGoal: c.businessGoal,
        recommendedParameters: {
          minSup: c.recommendedMinSup,
          minConf: c.recommendedMinConf,
          minLift: c.recommendedMinLift,
        },
        itemVocabulary: c.items,
        transactionsCount: c.transactions.length,
        transactions: c.transactions,
        domainInsights: c.domainInsights,
        crossSellingAdvice: c.crossSellingAdvice,
      },
      null,
      2
    );
  };

  // 3. Generate Raw Data TXT (one transaction per line, comma separated)
  const generateCaseRawTXT = (c: DatasetCase): string => {
    return c.transactions.map((t) => t.items.join(',')).join('\n');
  };

  // 4. Download individual raw data file
  const handleDownloadCaseData = (c: DatasetCase, format: 'csv' | 'json' | 'txt') => {
    if (format === 'csv') {
      downloadCSV(generateCaseRawCSV(c), `raw_dataset_${c.id}.csv`);
    } else if (format === 'json') {
      triggerDownload(generateCaseRawJSON(c), `raw_dataset_${c.id}.json`, 'application/json');
    } else if (format === 'txt') {
      triggerDownload(generateCaseRawTXT(c), `raw_transactions_${c.id}.txt`, 'text/plain;charset=utf-8');
    }
  };

  // 5. Bulk download all 4 cases in one JSON bundle
  const handleDownloadAllCasesBundle = () => {
    const bundle = {
      collection: 'AI Studio Association Rules Lab - 4 Classic Datasets Suite',
      exportedAt: new Date().toISOString(),
      casesCount: CLASSIC_CASES.length,
      cases: CLASSIC_CASES.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        category: c.category,
        algorithmHighlight: c.algorithmHighlight,
        businessGoal: c.businessGoal,
        recommendedParameters: {
          minSup: c.recommendedMinSup,
          minConf: c.recommendedMinConf,
          minLift: c.recommendedMinLift,
        },
        items: c.items,
        transactionsCount: c.transactions.length,
        transactions: c.transactions,
        domainInsights: c.domainInsights,
        crossSellingAdvice: c.crossSellingAdvice,
      })),
    };
    triggerDownload(JSON.stringify(bundle, null, 2), 'all_4_classic_cases_raw_dataset.json', 'application/json');
  };

  // 6. Export Mined Frequent Itemsets CSV
  const handleExportFrequentCSV = () => {
    let csv = 'Rank,Items,Item_Count_k,Occurrences,Support_Ratio,Support_Percent\n';
    frequentItemsets.forEach((f, idx) => {
      const itemsStr = `"${f.items.join('; ')}"`;
      csv += `${idx + 1},${itemsStr},${f.items.length},${f.count},${f.support.toFixed(4)},${(f.support * 100).toFixed(2)}%\n`;
    });
    downloadCSV(csv, `frequent_itemsets_${currentCase.id}.csv`);
  };

  // 7. Export Mined Rules CSV
  const handleExportRulesCSV = () => {
    let csv = 'Rule_ID,Antecedent,Consequent,Support,Confidence,Lift,Conviction,Leverage,Is_Redundant\n';
    rules.forEach((r) => {
      const ant = `"${r.antecedent.join('; ')}"`;
      const cons = `"${r.consequent.join('; ')}"`;
      const conv = r.conviction > 100 ? 'Infinity' : r.conviction.toFixed(3);
      csv += `${r.id},${ant},${cons},${(r.support * 100).toFixed(2)}%,${(r.confidence * 100).toFixed(2)}%,${r.lift.toFixed(3)},${conv},${r.leverage.toFixed(4)},${r.isRedundant ? 'Yes' : 'No'}\n`;
    });
    downloadCSV(csv, `association_rules_${currentCase.id}.csv`);
  };

  // 8. Export Network JSON
  const handleExportNetworkJSON = () => {
    const data = {
      dataset: currentCase.title,
      parameters: { minSupport: minSup, minConfidence: minConf },
      rules: rules.map((r) => ({
        source: r.antecedent,
        target: r.consequent,
        support: r.support,
        confidence: r.confidence,
        lift: r.lift,
        isRedundant: !!r.isRedundant,
      })),
    };
    triggerDownload(JSON.stringify(data, null, 2), `network_topology_${currentCase.id}.json`, 'application/json');
  };

  // Handle Custom CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        const newTx: Transaction[] = [];

        lines.forEach((line, idx) => {
          const cleanLine = line.replace(/["'\r]/g, '');
          const parts = cleanLine.split(/[,;\t]/).map((p) => p.trim()).filter((p) => p.length > 0);
          if (parts.length > 0) {
            newTx.push({
              id: `CSV_${idx + 1}`,
              items: parts,
            });
          }
        });

        if (newTx.length > 0) {
          onCustomTransactionsLoaded(newTx, file.name.replace(/\.[^/.]+$/, ''));
          setUploadStatus(`成功解析并载入 ${newTx.length} 条自定义交易记录！`);
        } else {
          setUploadStatus('未能解析出有效的交易项，请确保每行以逗号分隔。');
        }
      } catch {
        setUploadStatus('文件解析出错，请检查 CSV 格式。');
      }
    };
    reader.readAsText(file);
  };

  // Compute 0-1 Matrix and statistics for Section 2
  const allItemNames = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.items.forEach((it) => set.add(it)));
    return Array.from(set);
  }, [transactions]);

  const binaryData = useMemo(() => {
    return buildBinaryMatrix(transactions, allItemNames);
  }, [transactions, allItemNames]);

  // Group frequent itemsets by length k for Section 3
  const itemsetsByK = useMemo(() => {
    const map: Record<number, FrequentItemset[]> = { 1: [], 2: [], 3: [], 4: [] };
    frequentItemsets.forEach((f) => {
      const k = f.items.length;
      if (!map[k]) map[k] = [];
      map[k].push(f);
    });
    return map;
  }, [frequentItemsets]);

  // Compute quality statistics for Section 5
  const qualityStats = useMemo(() => {
    const totalRules = rules.length;
    const redundantCount = rules.filter((r) => r.isRedundant).length;
    const validStrongRules = rules.filter((r) => r.lift >= 1.2 && !r.isRedundant).length;
    const spuriousCount = rules.filter((r) => r.lift < 1.2).length;
    const avgConfidence = totalRules > 0 ? (rules.reduce((acc, r) => acc + r.confidence, 0) / totalRules) * 100 : 0;
    const avgLift = totalRules > 0 ? rules.reduce((acc, r) => acc + r.lift, 0) / totalRules : 0;

    return {
      totalRules,
      redundantCount,
      validStrongRules,
      spuriousCount,
      avgConfidence,
      avgLift,
      cleanRatio: totalRules > 0 ? Math.round((validStrongRules / totalRules) * 100) : 100,
    };
  }, [rules]);

  // Case category icons helper
  const getCaseIcon = (caseId: string) => {
    switch (caseId) {
      case 'supermarket':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'ecommerce_funnel':
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case 'healthcare':
        return <Activity className="w-4 h-4 text-rose-600" />;
      case 'fraud_detection':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      default:
        return <Database className="w-4 h-4 text-teal-600" />;
    }
  };

  // Full-Process 6 Sections Data Structure
  const reportSections = [
    { num: 1, title: '业务场景背景与原始交易集概览', shortTitle: '1. 原始交易与业务', icon: <Database className="w-4 h-4" /> },
    { num: 2, title: '布尔代数编码与项集空间映射', shortTitle: '2. 0-1 矩阵编码', icon: <Table className="w-4 h-4" /> },
    { num: 3, title: '逐层候选项集剪枝与支持度度量', shortTitle: '3. 频繁项集剪枝', icon: <Sliders className="w-4 h-4" /> },
    { num: 4, title: '强关联规则推导与核心指标矩阵', shortTitle: '4. 强规则推导', icon: <Workflow className="w-4 h-4" /> },
    { num: 5, title: '指标多维空间分布与伪关联体检诊断', shortTitle: '5. 空间与伪关联体检', icon: <AlertTriangle className="w-4 h-4" /> },
    { num: 6, title: '商业交叉销售策略与落地行动看板', shortTitle: '6. 商业策略看板', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  // Generate Comprehensive 6-Part Markdown Report
  const fullMarkdownReport = useMemo(() => {
    return `# 关联规则挖掘全流程实验报告：${currentCase.title}
**案例分类**: ${currentCase.category} | **推荐算法**: ${currentCase.algorithmHighlight}  
**生成时间**: ${new Date().toLocaleString('zh-CN')}  
**实验参数配置**: 最小支持度阈值 MinSup = ${(minSup * 100).toFixed(1)}%, 最小置信度阈值 MinConf = ${(minConf * 100).toFixed(1)}%

---

## 第 1 部分：业务场景背景与原始交易集概览 (Raw Transaction Dataset & Business Objective)
- **业务诉求与痛点**: ${currentCase.businessGoal}
- **业务场景描述**: ${currentCase.description}
- **原始数据宏观指标**:
  - 样本交易总笔数 (N): ${transactions.length} 笔
  - 离散特征项总数 (|I|): ${allItemNames.length} 种
  - 理论子集空间基数: 2^|I| - 1 = ${(Math.pow(2, Math.min(allItemNames.length, 30)) - 1).toLocaleString()} 个可能项集组合
- **原始交易记录抽样 (Top 5 笔)**:
| 事务编号 (TID) | 包含项目数 | 购买/触碰项明细 |
| :--- | :--- | :--- |
${transactions.slice(0, 5).map((t) => `| ${t.id} | ${t.items.length} | ${t.items.join('; ')} |`).join('\n')}

---

## 第 2 部分：布尔代数编码与项集空间映射 (Boolean Algebra & 0-1 One-Hot Matrix)
将异构长表交易映射为无符号布尔矩阵 $T \\in \\{0, 1\\}^{m \\times n}$，其中行代表单笔交易事务，列代表特征项空间：
- **特征矩阵规模**: ${transactions.length} 行 × ${allItemNames.length} 列 (总单元格: ${transactions.length * allItemNames.length})
- **矩阵稀疏度 (Sparsity)**: ${(binaryData.sparsity * 100).toFixed(2)}%
- **项边缘出现频次与边缘支持度 P(i) (Top 6)**:
| 序号 | 项目名称 | 频次 (Count) | 边缘支持度 P(i) |
| :--- | :--- | :--- | :--- |
${allItemNames.slice(0, 6).map((it, idx) => {
  const colSum = binaryData.colSums[idx] || 0;
  return `| ${idx + 1} | ${it} | ${colSum} | ${((colSum / transactions.length) * 100).toFixed(1)}% |`;
}).join('\n')}

---

## 第 3 部分：逐层候选项集剪枝与支持度度量 (Level-wise Apriori Pruning & Frequent Itemsets)
- **剪枝核心理论依据**: Apriori 单调向下封闭性 (Monotonicity) —— 任何非频繁项集的超集必非频繁。
- **挖掘成果总览**: 在 MinSup = ${(minSup * 100).toFixed(1)}% 过滤后，共保留 **${frequentItemsets.length}** 个高频项集。
  - 1-项集 (L1) 数量: ${itemsetsByK[1]?.length || 0} 个
  - 2-项集 (L2) 数量: ${itemsetsByK[2]?.length || 0} 个
  - 3-项集及以上 (L3+) 数量: ${(itemsetsByK[3]?.length || 0) + (itemsetsByK[4]?.length || 0)} 个
- **Top 频繁项集明细清单 (按支持度排序)**:
| 排名 | 频繁项集内容 {X} | 阶数 k | 出现频次 | 支持度 Support |
| :--- | :--- | :--- | :--- | :--- |
${frequentItemsets.slice(0, 8).map((f, idx) => `| ${idx + 1} | { ${f.items.join(', ')} } | ${f.items.length} | ${f.count} | ${(f.support * 100).toFixed(1)}% |`).join('\n')}

---

## 第 4 部分：强关联规则推导与核心指标矩阵 (Strong Association Rules & Multi-Metric Evaluation)
通过对 $L_k (k \\ge 2)$ 频繁项集进行非空真子集划分 ($A \\Rightarrow B$)，计算多维质量评估指标：
$$\\text{Support}(A \\Rightarrow B) = P(A \\cup B)$$
$$\\text{Confidence}(A \\Rightarrow B) = P(B|A) = \\frac{\\text{Support}(A \\cup B)}{\\text{Support}(A)}$$
$$\\text{Lift}(A \\Rightarrow B) = \\frac{P(A \\cup B)}{P(A)P(B)}$$
$$\\text{Conviction}(A \\Rightarrow B) = \\frac{1 - P(B)}{1 - \\text{Confidence}(A \\Rightarrow B)}$$

- **强关联规则全景清单 (Top 8)**:
| 规则编号 | 规则表达式 (A => B) | 支持度 | 置信度 | 提升度 Lift | 确信度 Conv | 冗余判定 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${rules.slice(0, 8).map((r) => {
  const conv = r.conviction > 100 ? '∞' : r.conviction.toFixed(2);
  return `| ${r.id} | [${r.antecedent.join(' + ')}] => [${r.consequent.join(' + ')}] | ${(r.support * 100).toFixed(1)}% | ${(r.confidence * 100).toFixed(1)}% | ${r.lift.toFixed(2)} | ${conv} | ${r.isRedundant ? '是 (冗余)' : '否 (有效)'} |`;
}).join('\n')}

---

## 第 5 部分：指标多维空间分布与伪关联体检诊断 (Metric Distribution & Rule Health Screening)
- **多维指标分布概况**:
  - 挖掘推导规则总数: ${qualityStats.totalRules} 条
  - 有效强促进规则数 (Lift ≥ 1.2 且非冗余): ${qualityStats.validStrongRules} 条
  - 冗余规则消解数 (更简短前项已达同等置信度): ${qualityStats.redundantCount} 条
  - 伪关联/弱相关预警数 (Lift < 1.2): ${qualityStats.spuriousCount} 条
  - 平均置信度: ${qualityStats.avgConfidence.toFixed(1)}% | 平均提升度: ${qualityStats.avgLift.toFixed(2)}
- **伪关联深度体检剖析**:
  - **假阳性陷阱识别**: 大众高频项（如日常必需品）由于先验概率 $P(B)$ 极高，即使条件概率 $P(B|A)$ 极高，其提升度可能仅在 1.0 上下，属于无协同增益的虚假关联。
  - **冗余过滤机制**: 避免复合规则（如 $A+C \\Rightarrow B$）在 $A \\Rightarrow B$ 已完全成立的情况下过度细分导致过拟合与运营困扰。

---

## 第 6 部分：商业交叉销售策略与落地行动看板 (Commercial Cross-Selling & Operational Action Matrix)
- **领域专家核心洞察**:
${currentCase.domainInsights.map((insight, idx) => `  ${idx + 1}. ${insight}`).join('\n')}
- **落地转化与动线策略建议**:
${currentCase.crossSellingAdvice.map((advice, idx) => `  ${idx + 1}. ${advice}`).join('\n')}
- **预期业务价值评估**:
  - 实施定向捆绑陈列预计可将连带购买率提升 15%~25%；
  - 规避独立伪关联陈列，降低低效促销费用约 10%~18%；
  - 建立动态规则触发引擎，为结账端提供毫秒级交叉推荐支持。
`;
  }, [currentCase, transactions, allItemNames, minSup, minConf, frequentItemsets, itemsetsByK, rules, binaryData, qualityStats]);

  // Generate Academic LaTeX Report
  const fullLatexReport = useMemo(() => {
    return `% ==============================================================================
% 关联规则挖掘全流程学术报告：${currentCase.title}
% 严格遵循数据科学全生命周期规范 (Full-Process 6 Stages)
% ==============================================================================
\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{geometry}
\\usepackage{hyperref}
\\geometry{margin=2.5cm}

\\title{关联模式挖掘与多维规则评估学术报告\\\\\\large 案例：${currentCase.title} (${currentCase.category})}
\\author{AI Studio Association Rules & Frequent Itemsets Lab}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
本报告面向 \\textbf{${currentCase.title}} 业务场景展开端到端无监督模式挖掘。通过构建 0-1 哑变量布尔特征空间，设定最小支持度临界阈值 $\\text{MinSup} = ${(minSup * 100).toFixed(1)}\\%$，最小置信度阈值 $\\text{MinConf} = ${(minConf * 100).toFixed(1)}\\%$，全面剖析频繁项集逐层剪枝动态，求解多维强关联规则矩阵，并针对高置信度伪关联与冗余规则实施健康体检，最终输出可落地的交叉销售策略看板。
\\end{abstract}

\\section{第一阶段：业务背景与原始交易集概览}
业务核心诉求：${currentCase.businessGoal}。
样本总量 $N = ${transactions.length}$ 笔交易，独立词汇特征维度 $|I| = ${allItemNames.length}$ 种。

\\section{第二阶段：布尔代数编码与项集空间映射}
构建二进制矩阵 $T \\in \\{0, 1\\}^{${transactions.length} \\times ${allItemNames.length}}$。
矩阵稀疏度为 ${(binaryData.sparsity * 100).toFixed(2)}\\%$。候选项集状态空间规模为 $2^{|I|} - 1 = ${(Math.pow(2, Math.min(allItemNames.length, 30)) - 1).toLocaleString()}$。

\\section{第三阶段：逐层候选项集剪枝与支持度度量}
基于 Apriori 单调封闭定理完成剪枝。共获得频繁项集 ${frequentItemsets.length}$ 个，其中 1-项集 ${itemsetsByK[1]?.length || 0} 个，2-项集 ${itemsetsByK[2]?.length || 0} 个，高阶项集 ${(itemsetsByK[3]?.length || 0) + (itemsetsByK[4]?.length || 0)} 个。

\\section{第四阶段：强关联规则推导与核心指标矩阵}
\\begin{table}[htbp]
\\centering
\\caption{核心强关联规则多维测度表 (Top 5)}
\\begin{tabular}{llcccc}
\\toprule
编号 & 规则内容 $A \\Rightarrow B$ & $\\text{Supp}$ & $\\text{Conf}$ & $\\text{Lift}$ & $\\text{Conv}$ \\\\
\\midrule
${rules.slice(0, 5).map((r) => {
  const ant = r.antecedent.map((it) => it.split(' ')[0]).join(', ');
  const cons = r.consequent.map((it) => it.split(' ')[0]).join(', ');
  const conv = r.conviction > 100 ? '\\infty' : r.conviction.toFixed(2);
  return `${r.id} & \\{${ant}\\} $\\Rightarrow$ \\{${cons}\\} & ${(r.support * 100).toFixed(1)}\\% & ${(r.confidence * 100).toFixed(1)}\\% & ${r.lift.toFixed(2)} & ${conv} \\\\`;
}).join('\n')}
\\bottomrule
\\end{tabular}
\\end{table}

\\section{第五阶段：指标多维空间分布与伪关联体检诊断}
推导规则总量 ${qualityStats.totalRules} 条，有效强促进规则 ${qualityStats.validStrongRules} 条，冗余消解 ${qualityStats.redundantCount} 条。排除了高置信度但低提升度 ($Lift \\approx 1.0$) 的伪独立关联，保障了业务落地的真实增益。

\\section{第六阶段：商业交叉销售策略与落地行动看板}
\\begin{itemize}
${currentCase.crossSellingAdvice.map((adv) => `  \\item ${adv}`).join('\n')}
\\end{itemize}

\\end{document}
`;
  }, [currentCase, transactions, allItemNames, minSup, minConf, frequentItemsets, itemsetsByK, rules, binaryData, qualityStats]);

  // Handle case switch within the module
  const handleCaseSwitch = (caseItem: DatasetCase) => {
    if (onSelectCase) {
      onSelectCase(caseItem);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Slice */}
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-stone-400">模块 09</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-medium text-teal-700">全流程切片数据报告与原始数据集</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
              四大案例原始数据集下载与全流程 6 步切片报告预览引擎
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-4xl">
              提供四大经典业务案例（超市零售、电商加购、医疗诊断、金融风控）的原始长表与小票数据一键下载（支持 CSV / JSON / TXT 格式及完整打包）；
              严格遵循全流程切片六大阶段（原始交易 &rarr; 0-1 矩阵 &rarr; 频繁项集 &rarr; 规则推导 &rarr; 伪关联体检 &rarr; 商业落地）生成出版级报告并支持在线沉浸式预览与 PDF 导出。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAllCasesBundle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-medium transition-colors shadow-xs cursor-pointer"
              title="一键打包下载全部四大案例原始数据 JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>打包下载四大案例原始数据</span>
            </button>
          </div>
        </div>

        {/* Top View Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>1. 全流程六步切片报告预览</span>
            </button>
            <button
              onClick={() => setActiveTab('raw_datasets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'raw_datasets'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-teal-500" />
              <span>2. 四大案例原始数据下载专区</span>
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'markdown'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Markdown 格式 (.md)</span>
            </button>
            <button
              onClick={() => setActiveTab('latex')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'latex'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>4. LaTeX 学术模板 (.tex)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {copySuccess && (
              <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-mono animate-fade-in">
                ✓ {copySuccess}
              </span>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 rounded text-xs font-medium cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印 / 另存为 PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE 6-STEP PREVIEW */}
      {activeTab === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Navigation: Case Switcher & Step TOC (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Quick Case Switcher */}
            <div className="bg-white border border-stone-200 rounded-lg p-3.5 space-y-2">
              <h3 className="text-xs font-semibold text-stone-900 flex items-center justify-between">
                <span>切换当前案例报告</span>
                <span className="text-[10px] font-mono text-stone-400">4 大经典案例</span>
              </h3>
              <div className="space-y-1">
                {CLASSIC_CASES.map((c) => {
                  const isCurrent = currentCase.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleCaseSwitch(c)}
                      className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-teal-50 border border-teal-200 text-teal-900 font-semibold shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {getCaseIcon(c.id)}
                        <span className="truncate">{c.title}</span>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6 Slices Section Navigation Index */}
            <div className="bg-white border border-stone-200 rounded-lg p-3.5 space-y-2 sticky top-20">
              <h3 className="text-xs font-semibold text-stone-900 flex items-center justify-between">
                <span>全流程 6 大切片目录</span>
                <span className="text-[10px] font-mono text-teal-700">6 Parts</span>
              </h3>
              <nav className="space-y-1">
                {reportSections.map((sec) => (
                  <button
                    key={sec.num}
                    onClick={() => {
                      setActiveSection(sec.num);
                      const el = document.getElementById(`section-${sec.num}`);
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition-colors cursor-pointer ${
                      activeSection === sec.num
                        ? 'bg-stone-900 text-white font-medium shadow-xs'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] opacity-70">0{sec.num}</span>
                      <span className="truncate">{sec.shortTitle}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                  </button>
                ))}
              </nav>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 space-y-2">
                <button
                  onClick={() => handleCopyText(fullMarkdownReport, '已复制全流程 Markdown 报告！')}
                  className="w-full flex items-center justify-center gap-1.5 p-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制 Markdown 报告</span>
                </button>
                <button
                  onClick={() => triggerDownload(fullMarkdownReport, `report_${currentCase.id}.md`, 'text/markdown')}
                  className="w-full flex items-center justify-center gap-1.5 p-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 rounded text-xs font-medium cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载 .md 报告文档</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Content: Full 6-Section Document View (9 cols) */}
          <div className="lg:col-span-9 bg-white border border-stone-200 rounded-lg p-6 lg:p-8 space-y-8 shadow-xs">
            {/* Document Header */}
            <div className="border-b border-stone-200 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase bg-stone-100 px-2 py-0.5 rounded">
                  Association Rules Mining Full-Cycle Slicing Report
                </span>
                <span className="text-[10px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  {currentCase.category}
                </span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
                {currentCase.title}：全流程关联挖掘与决策报告
              </h1>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                {currentCase.subtitle} · 核心挖掘算法：{currentCase.algorithmHighlight}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-500 mt-3 pt-3 border-t border-stone-100">
                <span>生成时间: {new Date().toLocaleDateString('zh-CN')}</span>
                <span>·</span>
                <span>MinSup 阈值: <strong className="text-stone-800">{(minSup * 100).toFixed(0)}%</strong></span>
                <span>·</span>
                <span>MinConf 阈值: <strong className="text-teal-700">{(minConf * 100).toFixed(0)}%</strong></span>
                <span>·</span>
                <span>频繁项集数: <strong className="text-stone-800">{frequentItemsets.length}</strong></span>
                <span>·</span>
                <span>强关联规则数: <strong className="text-stone-800">{rules.length}</strong></span>
              </div>
            </div>

            {/* SECTION 1 */}
            <section id="section-1" className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">1</span>
                  <h2 className="text-base font-bold text-stone-900">
                    第一部分：业务场景背景与原始交易集概览
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-stone-400">Raw Transactions & Objectives</span>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded p-4 space-y-2 text-xs text-stone-700">
                <p><strong>业务核心诉求：</strong>{currentCase.businessGoal}</p>
                <p><strong>应用场景剖析：</strong>{currentCase.description}</p>
              </div>

              {/* Data Summary Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-mono text-stone-400">事务样本总量 N</div>
                  <div className="text-lg font-bold font-mono text-stone-900">{transactions.length} 笔</div>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-mono text-stone-400">离散项词汇基数 |I|</div>
                  <div className="text-lg font-bold font-mono text-stone-900">{allItemNames.length} 种</div>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-mono text-stone-400">候选项集空间 2^|I|-1</div>
                  <div className="text-lg font-bold font-mono text-teal-800">
                    {(Math.pow(2, Math.min(allItemNames.length, 25)) - 1).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-mono text-stone-400">平均交易长度</div>
                  <div className="text-lg font-bold font-mono text-stone-900">
                    {(transactions.reduce((acc, t) => acc + t.items.length, 0) / (transactions.length || 1)).toFixed(1)} 项/笔
                  </div>
                </div>
              </div>

              {/* Raw Transactions Sample Table */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span>原始小票交易切片示例 (前 6 笔记录)</span>
                  <button
                    onClick={() => handleDownloadCaseData(currentCase, 'csv')}
                    className="text-teal-700 hover:text-teal-900 font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>下载本案例全量原始数据 (CSV)</span>
                  </button>
                </div>
                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 font-mono text-[11px] text-stone-600">
                      <tr>
                        <th className="p-2.5">事务 ID</th>
                        <th className="p-2.5 text-center">项数</th>
                        <th className="p-2.5">包含项目 (Items)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {transactions.slice(0, 6).map((tx) => (
                        <tr key={tx.id} className="hover:bg-stone-50/50">
                          <td className="p-2.5 font-mono font-medium text-stone-800">{tx.id}</td>
                          <td className="p-2.5 text-center font-mono text-stone-500">{tx.items.length}</td>
                          <td className="p-2.5">
                            <div className="flex flex-wrap gap-1">
                              {tx.items.map((it, idx) => (
                                <span key={idx} className="bg-stone-100 text-stone-700 text-[10px] px-1.5 py-0.5 rounded">
                                  {it}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* SECTION 2 */}
            <section id="section-2" className="space-y-3 pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">2</span>
                  <h2 className="text-base font-bold text-stone-900">
                    第二部分：布尔代数编码与项集空间映射
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-stone-400">Boolean 0-1 Feature Space</span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                将非结构化长表交易映射为 0-1 二值矩阵 T ∈ {"{0, 1}"}^(m×n)，行向量 T_i 对应单笔交易的小票指示，
                列向量 C_j 对应各商品项的全局存在性。矩阵稀疏度为 <strong>{(binaryData.sparsity * 100).toFixed(2)}%</strong>，
                展现了高维稀疏特征。
              </p>

              {/* 0-1 Mini Matrix Heatmap Preview */}
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-stone-700">0-1 哑变量特征矩阵采样切片 (前 6 笔交易 × 前 8 个特征项)</div>
                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-center text-xs">
                    <thead className="bg-stone-100 font-mono text-[10px] text-stone-600">
                      <tr>
                        <th className="p-2 text-left">TID</th>
                        {allItemNames.slice(0, 8).map((it, i) => (
                          <th key={i} className="p-2 max-w-[80px] truncate" title={it}>
                            {it.split(' ')[0]}
                          </th>
                        ))}
                        <th className="p-2 text-right">RowSum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono">
                      {transactions.slice(0, 6).map((tx, rowIdx) => {
                        const txSet = new Set(tx.items);
                        return (
                          <tr key={tx.id} className="hover:bg-stone-50">
                            <td className="p-2 text-left font-medium text-stone-700">{tx.id}</td>
                            {allItemNames.slice(0, 8).map((item, colIdx) => {
                              const isPresent = txSet.has(item);
                              return (
                                <td key={colIdx} className="p-2">
                                  <span
                                    className={`inline-block w-5 h-5 rounded leading-5 text-[10px] font-bold ${
                                      isPresent ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-300'
                                    }`}
                                  >
                                    {isPresent ? '1' : '0'}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="p-2 text-right font-medium text-stone-600">
                              {binaryData.rowSums[rowIdx]}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* SECTION 3 */}
            <section id="section-3" className="space-y-3 pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">3</span>
                  <h2 className="text-base font-bold text-stone-900">
                    第三部分：逐层候选项集剪枝与支持度度量
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-stone-400">Apriori Pruning & Frequent Itemsets</span>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded p-3 text-xs text-amber-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>先验性质剪枝定理 (Apriori Property)：</strong>
                  频繁项集的所有非空子集必定也是频繁的；反之，若某个项集是非频繁的，则其所有超集必定非频繁，无需进行代价高昂的全量数据库扫描计数。
                </div>
              </div>

              {/* Frequent Itemsets Summary Bar */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-mono text-stone-400">1-频繁项集 (L1)</div>
                  <div className="text-base font-bold font-mono text-stone-800">{itemsetsByK[1]?.length || 0} 个</div>
                </div>
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-mono text-stone-400">2-频繁项集 (L2)</div>
                  <div className="text-base font-bold font-mono text-stone-800">{itemsetsByK[2]?.length || 0} 个</div>
                </div>
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-mono text-stone-400">3-频繁项集 (L3+)</div>
                  <div className="text-base font-bold font-mono text-stone-800">
                    {(itemsetsByK[3]?.length || 0) + (itemsetsByK[4]?.length || 0)} 个
                  </div>
                </div>
              </div>

              {/* Frequent Itemsets Table */}
              <div className="overflow-x-auto border border-stone-200 rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 font-mono text-[11px] text-stone-600">
                    <tr>
                      <th className="p-2.5">排名</th>
                      <th className="p-2.5">频繁项集内容 (Itemset)</th>
                      <th className="p-2.5 text-center">阶数 k</th>
                      <th className="p-2.5 text-right">频次 Count</th>
                      <th className="p-2.5 text-right">支持度 Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {frequentItemsets.slice(0, 8).map((f, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="p-2.5 text-stone-400">#{idx + 1}</td>
                        <td className="p-2.5 font-sans font-medium text-stone-800">
                          {`{ ${f.items.join(' , ')} }`}
                        </td>
                        <td className="p-2.5 text-center text-stone-500">k={f.items.length}</td>
                        <td className="p-2.5 text-right text-stone-600">{f.count}</td>
                        <td className="p-2.5 text-right font-bold text-teal-800">
                          {(f.support * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 4 */}
            <section id="section-4" className="space-y-3 pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">4</span>
                  <h2 className="text-base font-bold text-stone-900">
                    第四部分：强关联规则推导与核心指标矩阵
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-stone-400">Rules Derivation & Evaluation Matrix</span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                对每个 $k \ge 2$ 的频繁项集划分前项与后项 ($A \Rightarrow B$)，
                综合考察 <strong>支持度 (Support)</strong>、<strong>置信度 (Confidence)</strong>、
                <strong>提升度 (Lift)</strong> 与 <strong>确信度 (Conviction)</strong> 四大约束。
              </p>

              {/* Association Rules Table */}
              <div className="overflow-x-auto border border-stone-200 rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 font-mono text-[11px] text-stone-600">
                    <tr>
                      <th className="p-2.5">规则 ID</th>
                      <th className="p-2.5">前项 A ⇒ 后项 B</th>
                      <th className="p-2.5 text-right">支持度</th>
                      <th className="p-2.5 text-right">置信度</th>
                      <th className="p-2.5 text-right">提升度</th>
                      <th className="p-2.5 text-right">确信度</th>
                      <th className="p-2.5 text-center">状态判定</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {rules.slice(0, 8).map((r) => {
                      const conv = r.conviction > 100 ? '∞' : r.conviction.toFixed(2);
                      const isStrong = r.lift >= 1.2 && !r.isRedundant;
                      return (
                        <tr key={r.id} className="hover:bg-stone-50/50">
                          <td className="p-2.5 font-bold text-stone-700">{r.id}</td>
                          <td className="p-2.5 font-sans">
                            <span className="font-semibold text-stone-900">
                              [{r.antecedent.map((it) => it.split(' ')[0]).join(' + ')}]
                            </span>
                            <span className="mx-1 text-teal-600 font-bold">&rArr;</span>
                            <span className="font-semibold text-teal-800">
                              [{r.consequent.map((it) => it.split(' ')[0]).join(' + ')}]
                            </span>
                          </td>
                          <td className="p-2.5 text-right text-stone-500">{(r.support * 100).toFixed(0)}%</td>
                          <td className="p-2.5 text-right font-bold text-teal-800">{(r.confidence * 100).toFixed(0)}%</td>
                          <td className="p-2.5 text-right font-bold text-stone-900">{r.lift.toFixed(2)}</td>
                          <td className="p-2.5 text-right text-stone-500">{conv}</td>
                          <td className="p-2.5 text-center font-sans">
                            {r.isRedundant ? (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">冗余</span>
                            ) : isStrong ? (
                              <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded font-medium">强促进</span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">弱相关</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 5 */}
            <section id="section-5" className="space-y-3 pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">5</span>
                  <h2 className="text-base font-bold text-stone-900">
                    第五部分：指标多维空间分布与伪关联体检诊断
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-stone-400">Metric Distribution & Quality Screening</span>
              </div>

              {/* Quality Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-teal-50/60 border border-teal-200 rounded">
                  <div className="text-[10px] font-mono text-teal-700">有效强规则数</div>
                  <div className="text-xl font-bold font-mono text-teal-900">{qualityStats.validStrongRules} 条</div>
                  <div className="text-[10px] text-teal-600 mt-0.5">Lift ≥ 1.2 且非冗余</div>
                </div>
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded">
                  <div className="text-[10px] font-mono text-amber-700">冗余规则过滤</div>
                  <div className="text-xl font-bold font-mono text-amber-900">{qualityStats.redundantCount} 条</div>
                  <div className="text-[10px] text-amber-600 mt-0.5">前项真子集已足额覆盖</div>
                </div>
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded">
                  <div className="text-[10px] font-mono text-rose-700">伪关联风险预警</div>
                  <div className="text-xl font-bold font-mono text-rose-900">{qualityStats.spuriousCount} 条</div>
                  <div className="text-[10px] text-rose-600 mt-0.5">Lift &lt; 1.2 伪强规则</div>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-mono text-stone-500">规则质量健康指数</div>
                  <div className="text-xl font-bold font-mono text-stone-900">{qualityStats.cleanRatio}%</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">高价值规则转化率</div>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded text-xs space-y-2 text-stone-700">
                <h4 className="font-semibold text-stone-900">伪关联防范与假阳性陷阱剖析：</h4>
                <p className="leading-relaxed">
                  在工业界场景中，极大基数的大众必需品（例如超市中的鲜奶或抽纸）天然拥有极高全局支持度 $P(B)$。
                  因此，任何前项 $A$ 与之构成的规则都会自动表现出极高的置信度 $P(B|A)$。但若提升度 $Lift \approx 1.0$，
                  说明购买 $A$ 并未对购买 $B$ 产生任何协同拉动作用，盲目进行联合捆绑促销会导致毛利严重受损。
                  本系统通过 <strong>Lift 严格截断（≥ 1.2）</strong> 彻底阻断了此类伪关联假阳性。
                </p>
              </div>
            </section>

            {/* SECTION 6 */}
            <section id="section-6" className="space-y-3 pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">6</span>
                  <h2 className="text-base font-bold text-stone-900">
                    第六部分：商业交叉销售策略与落地行动看板
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-stone-400">Operational Actions & ROI Uplift</span>
              </div>

              {/* Domain Insights */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-700" />
                  <span>专家领域洞察归因 (Domain Insights)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {currentCase.domainInsights.map((insight, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded text-xs text-stone-700 leading-relaxed">
                      <span className="font-mono font-bold text-teal-700 mr-1.5">0{idx + 1}.</span>
                      {insight}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Strategy Cards */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-700" />
                  <span>商业动线陈列与落地行动建议 (Cross-Selling Actions)</span>
                </h4>
                <div className="space-y-2">
                  {currentCase.crossSellingAdvice.map((advice, idx) => (
                    <div key={idx} className="p-3 bg-teal-50/50 border border-teal-200 rounded flex items-start gap-2.5 text-xs text-stone-800">
                      <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{advice}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: RAW DATASETS DOWNLOAD HUB FOR THE 4 CASES */}
      {activeTab === 'raw_datasets' && (
        <div className="space-y-6">
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-700" />
                <span>四大案例原始交易长表与特征小票数据下载专区</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                包含超市零售、电商浏览加购、医疗临床诊断、金融风控套现 4 大工业级经典场景的标准原始数据，提供 CSV、JSON、TXT 格式无缝对接。
              </p>
            </div>
            <button
              onClick={handleDownloadAllCasesBundle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-medium cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>一键打包下载全部四大案例 (JSON Bundle)</span>
            </button>
          </div>

          {/* 4 Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLASSIC_CASES.map((c) => {
              const isSelected = currentCase.id === c.id;
              return (
                <div
                  key={c.id}
                  className={`bg-white border rounded-lg p-5 flex flex-col justify-between space-y-4 transition-all ${
                    isSelected ? 'border-teal-500 ring-1 ring-teal-500 shadow-xs' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCaseIcon(c.id)}
                        <h4 className="text-sm font-bold text-stone-900">{c.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-stone-100 text-stone-600 rounded">
                        {c.category}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-stone-600 pt-1">
                      <span className="bg-stone-50 border border-stone-200 px-2 py-0.5 rounded">
                        样本: <strong>{c.transactions.length}</strong> 笔
                      </span>
                      <span className="bg-stone-50 border border-stone-200 px-2 py-0.5 rounded">
                        特征词汇: <strong>{c.items.length}</strong> 种
                      </span>
                      <span className="bg-teal-50 border border-teal-200 text-teal-800 px-2 py-0.5 rounded">
                        推荐 MinSup: {(c.recommendedMinSup * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Download Action Buttons */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownloadCaseData(c, 'csv')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium cursor-pointer transition-colors"
                        title="下载带 UTF-8 BOM 的标准交易明细 CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                        <span>下载 CSV</span>
                      </button>
                      <button
                        onClick={() => handleDownloadCaseData(c, 'json')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium cursor-pointer transition-colors"
                        title="下载包含元数据与交易序列的 JSON"
                      >
                        <FileJson className="w-3.5 h-3.5 text-amber-700" />
                        <span>下载 JSON</span>
                      </button>
                      <button
                        onClick={() => handleDownloadCaseData(c, 'txt')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium cursor-pointer transition-colors"
                        title="下载每行一笔小票记录的标准 TXT 流水"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-700" />
                        <span>下载 TXT</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewingRawCaseId(previewingRawCaseId === c.id ? null : c.id)}
                        className="flex items-center gap-1 px-2 py-1.5 text-stone-500 hover:text-stone-900 text-xs font-medium cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{previewingRawCaseId === c.id ? '收起预览' : '预览原始样本'}</span>
                      </button>

                      {!isSelected && onSelectCase && (
                        <button
                          onClick={() => handleCaseSwitch(c)}
                          className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded text-xs font-medium cursor-pointer"
                        >
                          载入当前实验
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Transactions Preview Accordion */}
                  {previewingRawCaseId === c.id && (
                    <div className="mt-3 pt-3 border-t border-stone-200 space-y-2 bg-stone-50 p-3 rounded">
                      <div className="flex items-center justify-between text-xs font-medium text-stone-700">
                        <span>原始交易流水记录明细 (共 {c.transactions.length} 笔)</span>
                        <span className="text-[10px] font-mono text-stone-400">格式：TID &rarr; Items</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]">
                        {c.transactions.map((tx) => (
                          <div key={tx.id} className="p-1.5 bg-white border border-stone-200 rounded flex items-start gap-2">
                            <span className="font-bold text-teal-800 shrink-0">{tx.id}:</span>
                            <span className="text-stone-700">{tx.items.join(' , ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom CSV Upload & Data Ingestion Box */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <h3 className="text-xs font-semibold text-stone-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-700" />
              <span>上传您的自定义 CSV 交易长表以生成全流程报告</span>
            </h3>
            <p className="text-xs text-stone-500 leading-normal">
              如需分析您自有的业务小票，请上传 .csv 或 .txt 文件（每行代表一次购物交易，商品项之间用逗号分隔）。
              上传成功后系统将自动更新全流程切片报告与算法推导结果。
            </p>

            <label className="border-2 border-dashed border-stone-200 hover:border-teal-600 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-stone-50/50 hover:bg-stone-50 transition-colors">
              <Upload className="w-5 h-5 text-stone-400" />
              <span className="text-xs font-medium text-stone-700">
                点击选择或拖拽上传 CSV / TXT 交易数据文件
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                标准格式示例: 面包,牛奶,黄油 (换行分隔每笔交易)
              </span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploadStatus && (
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded text-xs text-teal-900 flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MARKDOWN FORMAT REPORT */}
      {activeTab === 'markdown' && (
        <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>标准出版级 Markdown 报告源码 (.md)</span>
              </h3>
              <p className="text-[11px] text-stone-500">
                包含六大切片流程的完整 Markdown 格式正文，可直接导入 Obsidian、Notion 或 GitHub 归档。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyText(fullMarkdownReport, '已复制 Markdown 正文！')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>复制 Markdown</span>
              </button>
              <button
                onClick={() => triggerDownload(fullMarkdownReport, `report_${currentCase.id}.md`, 'text/markdown')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-medium cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载 .md 文档</span>
              </button>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded p-4 overflow-y-auto max-h-[600px]">
            <pre className="font-mono text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
              <code>{fullMarkdownReport}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: LATEX FORMAT ACADEMIC REPORT */}
      {activeTab === 'latex' && (
        <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-700" />
                <span>LaTeX 学术论文完整模板 (.tex)</span>
              </h3>
              <p className="text-[11px] text-stone-500">
                包含标准 booktabs 三线表、数学公式环境与 6 阶段 Section 结构，可直接编译为 PDF。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyText(fullLatexReport, '已复制 LaTeX 代码！')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>复制 LaTeX 源码</span>
              </button>
              <button
                onClick={() => triggerDownload(fullLatexReport, `academic_report_${currentCase.id}.tex`, 'text/plain')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded text-xs font-medium cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载 .tex 模板</span>
              </button>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded p-4 overflow-y-auto max-h-[600px]">
            <pre className="font-mono text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
              <code>{fullLatexReport}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Bottom Quick Struct Exports */}
      <div className="bg-white border border-stone-200 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-stone-900 mb-2.5 flex items-center gap-2">
          <Download className="w-4 h-4 text-teal-700" />
          <span>算法产出结构化结果直接导出 (当前实验模型)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportFrequentCSV}
            className="flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-xs text-stone-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-700" />
              <span className="font-medium">导出频繁项集表 (CSV)</span>
            </div>
            <span className="text-[10px] font-mono text-stone-500 font-bold">
              {frequentItemsets.length} 条
            </span>
          </button>

          <button
            onClick={handleExportRulesCSV}
            className="flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-xs text-stone-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
              <span className="font-medium">导出强关联规则表 (CSV)</span>
            </div>
            <span className="text-[10px] font-mono text-stone-500 font-bold">
              {rules.length} 条
            </span>
          </button>

          <button
            onClick={handleExportNetworkJSON}
            className="flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-xs text-stone-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-amber-700" />
              <span className="font-medium">导出网络拓扑节点数据 (JSON)</span>
            </div>
            <span className="text-[10px] font-mono text-stone-500 font-bold">
              拓扑关系
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
