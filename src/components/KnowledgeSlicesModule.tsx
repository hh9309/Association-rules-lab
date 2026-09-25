import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  AlertTriangle, 
  Compass, 
  Layers, 
  Check, 
  Zap, 
  Cpu, 
  Database,
  Calculator,
  ArrowRight
} from 'lucide-react';

export const KnowledgeSlicesModule: React.FC = () => {
  // Counter-example interactive calculator state
  const [suppA, setSuppA] = useState<number>(0.4);
  const [suppB, setSuppB] = useState<number>(0.9); // B is extremely common (e.g. Shopping Bag / Milk)
  const [suppAB, setSuppAB] = useState<number>(0.36); // P(A ∩ B) = 0.36 = 0.4 * 0.9 (independent!)

  const computedConf = suppA > 0 ? suppAB / suppA : 0;
  const computedLift = suppA * suppB > 0 ? suppAB / (suppA * suppB) : 1;
  const computedConv = 1 - computedConf > 0 ? (1 - suppB) / (1 - computedConf) : 999;

  return (
    <div className="space-y-6">
      {/* Header Slice */}
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-stone-400">模块 10</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-medium text-teal-700">关联规则与无监督挖掘知识导引</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
              关联挖掘四大切片体系与算法选型认知图谱
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl">
              系统梳理关联挖掘的统计测度底座、适用条件约束、算法演进瓶颈对比，
              并针对工业实战中最常踩中的“高置信度伪关联”陷阱提供即时验证沙箱。
            </p>
          </div>
        </div>
      </div>

      {/* Four Deep Slices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slice 1: Three Core Metrics */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="text-xs font-mono font-bold bg-teal-800 text-white px-2 py-0.5 rounded">
                切片一
              </span>
              <h3 className="text-sm font-bold text-stone-900">
                关联分析三大核心指标体系
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              {/* Metric 1 */}
              <div className="p-3 bg-stone-50 rounded border border-stone-100">
                <div className="flex items-center justify-between font-semibold text-stone-900 mb-1">
                  <span>1. 支持度 (Support)</span>
                  <span className="text-[11px] font-mono text-teal-800">衡量普遍性</span>
                </div>
                <div className="font-mono text-[11px] text-stone-500 mb-1">
                  Supp(A ⇒ B) = P(A ∩ B) = |&#123;t ∈ T | A ∪ B ⊆ t&#125;| / |T|
                </div>
                <p className="text-stone-600">
                  支持度度量该项集在全体数据中出现的频率。支持度过低意味着该模式可能是极小概率的偶然事件，缺乏商业落地和统计普遍性。
                </p>
              </div>

              {/* Metric 2 */}
              <div className="p-3 bg-stone-50 rounded border border-stone-100">
                <div className="flex items-center justify-between font-semibold text-stone-900 mb-1">
                  <span>2. 置信度 (Confidence)</span>
                  <span className="text-[11px] font-mono text-teal-800">衡量可靠性</span>
                </div>
                <div className="font-mono text-[11px] text-stone-500 mb-1">
                  Conf(A ⇒ B) = P(B | A) = Supp(A ∪ B) / Supp(A)
                </div>
                <p className="text-stone-600">
                  条件概率。在包含 A 的交易集合中，同时包含 B 的比例。度量由此条规则进行预测推断的准确程度。
                </p>
              </div>

              {/* Metric 3 */}
              <div className="p-3 bg-teal-50/70 rounded border border-teal-200">
                <div className="flex items-center justify-between font-bold text-teal-950 mb-1">
                  <span>3. 提升度 (Lift)</span>
                  <span className="text-[11px] font-mono text-teal-900">衡量独立性与强关联</span>
                </div>
                <div className="font-mono text-[11px] text-teal-800 mb-1">
                  Lift(A ⇒ B) = Conf(A ⇒ B) / Supp(B) = P(A ∩ B) / [P(A)·P(B)]
                </div>
                <p className="text-teal-900">
                  <strong>黄金判据：</strong> Lift &gt; 1 代表 A 与 B 存在正向协同互促；Lift = 1 代表两者统计独立，纯属巧合；Lift &lt; 1 代表负相关（互为替代品或冲突禁忌）。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Slice 2: Application Preconditions */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="text-xs font-mono font-bold bg-stone-900 text-white px-2 py-0.5 rounded">
                切片二
              </span>
              <h3 className="text-sm font-bold text-stone-900">
                适用条件与数据工程指南
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              <div className="p-3 bg-stone-50 rounded border border-stone-100">
                <div className="font-semibold text-stone-900 mb-1">
                  适用场景：离散型与交易型项集探索
                </div>
                <p className="text-stone-600">
                  关联挖掘专用于发现离散实体项之间的<strong>并发现象与协同规则</strong>。
                  若面对连续型数值变量（如交易金额、体温、年龄），必须先采用分箱（Binning）技术离散化为名义区间项。
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded border border-stone-100">
                <div className="font-semibold text-stone-900 mb-1">
                  数据要求：强制二值化 (0-1) 矩阵
                </div>
                <p className="text-stone-600">
                  无论是 Apriori、FP-Growth 还是 ECLAT，均以布尔二值矩阵或项目集合列表作为输入规范。
                  不需要标签（Label），纯粹依赖无监督的频数统计与集合论运算。
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded border border-stone-100">
                <div className="font-semibold text-stone-900 mb-1">
                  算法选型决策树：规模与维度权衡
                </div>
                <ul className="space-y-1 text-stone-600 list-disc list-inside">
                  <li><strong>小规模/低维数据 (&lt;1000 项)：</strong> 首选 Apriori，逻辑透明可解释，方便教学与直观核验。</li>
                  <li><strong>海量高维事务 (10万+ 交易)：</strong> 首选 FP-Growth，树图前缀压缩，两次全表扫描即可定局。</li>
                  <li><strong>长项集/倒排检索场景：</strong> 首选 ECLAT，垂直倒排求交，差集 (Diffset) 极速位运算。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Slice 3: Bottlenecks & Evolution Atlas */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="text-xs font-mono font-bold bg-stone-900 text-white px-2 py-0.5 rounded">
                切片三
              </span>
              <h3 className="text-sm font-bold text-stone-900">
                算法瓶颈与选择演进图谱
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              {/* Bottleneck 1 */}
              <div className="p-3 bg-red-50/60 rounded border border-red-100">
                <div className="flex items-center justify-between font-semibold text-red-950 mb-1">
                  <span>瓶颈一：候选集数量指数级暴涨 (2ⁿ 爆炸)</span>
                  <span className="text-[10px] font-mono text-red-700">引出 Apriori 剪枝</span>
                </div>
                <p className="text-red-900">
                  若有 100 项，候选 2-项集为 4950 个，候选 3-项集达 16 万个！
                  <strong>突破口：</strong> Apriori 发现“任何非频繁项集的超集必非频繁”，利用 $(k-1)$ 频繁项集自连接与子集存在性检查，剪掉 80% 以上的无效搜索空间。
                </p>
              </div>

              {/* Bottleneck 2 */}
              <div className="p-3 bg-amber-50/70 rounded border border-amber-100">
                <div className="flex items-center justify-between font-semibold text-amber-950 mb-1">
                  <span>瓶颈二：多次重复扫描数据库 (I/O 瓶颈)</span>
                  <span className="text-[10px] font-mono text-amber-800">引出 FP-Tree 单次压缩</span>
                </div>
                <p className="text-amber-900">
                  Apriori 每推进一阶 $k$，都必须全量扫描一次磁盘中的数据库，I/O 开销呈线性激增。
                  <strong>突破口：</strong> FP-Tree 将所有交易按频次递减重排并折叠在内存树中，仅扫表两次，通过递归条件模式基分治求解，免除了所有候选集生成！
                </p>
              </div>

              {/* Evolution Summary */}
              <div className="p-3 bg-stone-50 rounded border border-stone-100 font-mono text-[11px] text-stone-700">
                <div className="font-bold text-stone-900 mb-1 font-sans text-xs">演进谱系：</div>
                <div>暴力枚举 [O(2ⁿ)] → Apriori (先验剪枝) → FP-Growth (树图前缀压缩) → ECLAT / dEclat (垂直倒排求交)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Slice 4: Traps & False Correlation Warning */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="text-xs font-mono font-bold bg-amber-700 text-white px-2 py-0.5 rounded">
                切片四
              </span>
              <h3 className="text-sm font-bold text-stone-900">
                误区警示与评估陷阱防范
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              <div className="p-3 bg-amber-50/70 rounded border border-amber-200">
                <div className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>陷阱 1：高置信度伪关联 (High Confidence Trap)</span>
                </div>
                <p className="text-amber-900">
                  若后件 $B$（如购物塑料袋）本身的全量支持度高达 90%，那么任意商品 $A$ 推导 $B$ 的置信度必然都在 90% 左右。
                  <strong>致命点：</strong> 此时 Lift = 0.90 / 0.90 = 1.0。买 A 对买 B 毫无促进作用，捆绑陈列毫无增量收益！
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded border border-stone-100">
                <div className="font-semibold text-stone-900 mb-1">
                  陷阱 2：提升度等于 1 的本质含义
                </div>
                <p className="text-stone-600">
                  Lift(A &rArr; B) = 1 代表数学上的统计独立性 P(AB) = P(A)P(B)。两者同时出现纯属自然概率随机相遇，不具备任何因果或连带价值。
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded border border-stone-100">
                <div className="font-semibold text-stone-900 mb-1">
                  陷阱 3：低支持度强规则被误杀
                </div>
                <p className="text-stone-600">
                  高客单价商品（如奢侈品、贵重珠宝或罕见并发症）其全局发生频率很低（Supp &lt; 2%），但其后件购买意愿极强（Conf &gt; 90%, Lift &gt; 5.0）。
                  若将 MinSup 机械设为 20%，这些最具商业暴利或诊断价值的规则将被直接扼杀。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Spurious Association Counter-Example Sandbox */}
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal-700" />
              <span>「高置信度伪关联陷阱」交互式实测验算沙箱</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              调节前项支持度 $P(A)$ 与高频后项支持度 $P(B)$，直观体验置信度飙高但提升度 Lift 为 1.0 的虚假相关现象。
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500">
            验算模型: P(A ∩ B) = P(A) · P(B) (独立假设)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-stone-50 p-4 rounded-lg border border-stone-200">
          {/* Sliders */}
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-600">前项支持度 P(A) (如研磨咖啡):</span>
                <span className="font-mono font-bold text-stone-800">{(suppA * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={suppA}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSuppA(val);
                  setSuppAB(val * suppB);
                }}
                className="w-full accent-teal-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-600">后项本身支持度 P(B) (如购物塑料袋):</span>
                <span className="font-mono font-bold text-amber-800">{(suppB * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.98"
                step="0.02"
                value={suppB}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSuppB(val);
                  setSuppAB(suppA * val);
                }}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Computed Metrics */}
          <div className="space-y-2 text-xs border-y md:border-y-0 md:border-x border-stone-200 px-0 md:px-4 py-2 md:py-0">
            <div className="flex justify-between items-center p-2 bg-white rounded border border-stone-100">
              <span className="text-stone-500">计算置信度 Conf(A ⇒ B):</span>
              <span className="font-mono font-bold text-teal-800 text-sm">
                {(computedConf * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center p-2 bg-white rounded border border-stone-100">
              <span className="text-stone-500">计算提升度 Lift(A ⇒ B):</span>
              <span
                className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                  Math.abs(computedLift - 1.0) < 0.05
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-stone-100 text-stone-800'
                }`}
              >
                {computedLift.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2 bg-white rounded border border-stone-100">
              <span className="text-stone-500">计算确信度 Conv(A ⇒ B):</span>
              <span className="font-mono font-bold text-stone-700 text-sm">
                {computedConv > 100 ? '∞' : computedConv.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Qualitative Verdict */}
          <div className="flex flex-col justify-center text-xs">
            <div
              className={`p-3 rounded border leading-relaxed ${
                Math.abs(computedLift - 1.0) < 0.05
                  ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-medium'
                  : 'bg-teal-50 border-teal-200 text-teal-950'
              }`}
            >
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>判定结论：典型伪关联陷阱！</span>
              </div>
              <div>
                虽然置信度高达 <strong>{(computedConf * 100).toFixed(0)}%</strong>，表面看起来极度可靠，
                但由于提升度 <strong>Lift ≈ 1.00</strong>，买 A 的人买 B 的概率与全量自然购买 B 的概率完全一致。两者在现实中完全独立，切忌盲目捆绑促销！
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
