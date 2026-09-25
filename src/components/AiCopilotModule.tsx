import React, { useState, useEffect } from 'react';
import { DatasetCase, Transaction, AssociationRule, LLMConfig } from '../types';
import { 
  requestAIDiagnosis, 
  invokeLLM, 
  AIDiagnosisResult, 
  generateHeuristicDiagnosis 
} from '../services/aiService';
import { getStoredLLMConfig } from '../services/llmConfig';
import { LLMSettingsModal } from './LLMSettingsModal';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2, 
  RefreshCw,
  TrendingUp,
  Sliders,
  Settings,
  Key,
  Cpu,
  Info
} from 'lucide-react';

interface AiCopilotModuleProps {
  currentCase: DatasetCase;
  transactions: Transaction[];
  rules: AssociationRule[];
  minSup: number;
  minConf: number;
  setMinSup: (val: number) => void;
  setMinConf: (val: number) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export const AiCopilotModule: React.FC<AiCopilotModuleProps> = ({
  currentCase,
  transactions,
  rules,
  minSup,
  minConf,
  setMinSup,
  setMinConf,
}) => {
  // LLM Configuration state
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(getStoredLLMConfig());
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const [diagnosis, setDiagnosis] = useState<AIDiagnosisResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `您好！我是您的关联分析随诊专家。当前正在分析案例【${currentCase.title}】。您可以随时提问关于支持度截断、置信度伪关联、Lift提升度解释或交叉销售落地策略。`,
      timestamp: '刚刚',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState<boolean>(false);

  // Refresh config from storage on mount
  useEffect(() => {
    setLlmConfig(getStoredLLMConfig());
  }, []);

  // Update active model config
  const handleSaveConfig = (newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
  };

  // Run AI Health Check
  const handleRunDiagnosis = async () => {
    // Enforce API key check for GitHub static deployment
    if (!llmConfig.apiKey || !llmConfig.apiKey.trim()) {
      setShowSettingsModal(true);
      return;
    }

    setIsDiagnosing(true);
    try {
      const res = await requestAIDiagnosis(currentCase, minSup, minConf, rules, transactions, llmConfig);
      setDiagnosis(res);
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes('MISSING_API_KEY') || e?.message === 'MISSING_API_KEY') {
        setShowSettingsModal(true);
      } else {
        // Fallback with informative message
        const spuriousSuspects = rules.filter((r) => r.confidence > 0.7 && Math.abs(r.lift - 1.0) < 0.15);
        const heuristic = generateHeuristicDiagnosis(currentCase, minSup, minConf, rules, transactions, spuriousSuspects);
        heuristic.thresholdEvaluation += `\n(注: 大模型直连失败[${e?.message || '网络连接受限'}]，已启动实验室高保真启发式引擎接管)`;
        setDiagnosis(heuristic);
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Quick Questions
  const quickPrompts = [
    '为什么有些规则置信度高达 90% 但提升度却仅有 1.0？',
    '当前最小支持度设置是否存在组合爆炸或遗漏长尾规则？',
    '如何根据挖掘结果重新规划商品货架摆放动线？',
    '什么是确信度 (Conviction)？它与提升度有何本质不同？',
  ];

  // Send message
  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q) return;

    // Enforce API Key requirement for GitHub deployment
    if (!llmConfig.apiKey || !llmConfig.apiKey.trim()) {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const alertMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️【未检测到 API Key】：当前实验室适配 GitHub 纯前端静态部署。调用大模型必须输入个人 API-Key（支持 Gemini 3 flash 与 DeepSeek-V4-Pro）。\n\n请点击标题右侧的小齿轮 ⚙️ 图标手工输入并确认您的 API Key。`,
        timestamp: '刚刚',
        isError: true,
      };
      setMessages((prev) => [...prev, userMsg, alertMsg]);
      setInputQuestion('');
      setShowSettingsModal(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsAnswering(true);

    try {
      const prompt = `基于频繁项集与关联分析实验室：当前案例【${currentCase.title}】(${currentCase.category})，用户提问：“${q}”。当前挖掘参数：MinSup=${(minSup * 100).toFixed(0)}%, MinConf=${(minConf * 100).toFixed(0)}%，挖掘出有效规则 ${rules.length} 条。请给出淡雅严谨、结构清晰、数学结合业务实操的专业解答。`;
      const systemInstruction = '你是一位世界级数据挖掘教授与零售分析专家。回答要条理分明，用中文简体，结合代数推导与实操建议，切片化总结。';

      const result = await invokeLLM(prompt, systemInstruction, llmConfig);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: result.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      console.error(e);
      let errorDesc = e?.message || '大模型网络连接异常';
      
      // Fallback intelligent answers for common association rules questions
      let fallbackText = '';
      if (q.includes('置信度高达 90%') || q.includes('提升度却仅有 1.0')) {
        fallbackText = `【高置信度伪关联陷阱 (Spurious Association)】：
当结论件 B 本身在整个交易集中极为高频（例如超市里的塑料袋、抽纸或结账口水），则无论前件 A 为何，P(B|A) 都会自然偏高！
但这并不代表 A 促进了 B。根据代数公式 Lift(A⇒B) = Conf(A⇒B) / Supp(B)。当 Lift ≈ 1.0 时，说明 P(B|A) ≈ P(B)，两者在统计学上完全独立！盲目捆绑促销不仅无法带来增量销售，还会白白损失利润。`;
      } else if (q.includes('组合爆炸') || q.includes('支持度设置')) {
        fallbackText = `【阈值权衡与格空间控制】：
若 MinSup 过低（如 < 10%），由 L1 连接生成 C2、C3 候选集时，搜索空间按指数级 2^|I| 暴涨，将导致 I/O 与内存双重瓶颈。
若 MinSup 过高（如 > 50%），虽然计算极速，但会误删那些高客单价、低频次但高置信度的极高附加值规则。建议采用“阶梯探索法”：先以 25%~30% 快速锚定核心项，再定向针对特定品类降低阈值挖掘。`;
      } else if (q.includes('货架摆放') || q.includes('动线')) {
        fallbackText = `【货架与动线陈列策略】：
1. 强关联正向协同 (Lift > 1.4)：将互补品（如啤酒与纸尿裤、面包与黄油）相隔适度距离置于主通道两侧，促使顾客拉长动线，增加沿途对其他冲动型商品的曝光。
2. 替代互斥品 (Lift < 0.8)：同一品类的不同品牌竞品应紧邻对比陈列，方便顾客比价与挑选。
3. 高频带动低频：将高支持度基础品（牛奶）放在卖场最深处，途中陈列与牛奶搭配的高毛利烘焙果酱。`;
      } else {
        fallbackText = `关于您的问题【${q}】：在关联规则体系中，核心在于平衡普遍性（Support）与因果可靠性（Confidence），并以独立性检验指标（Lift > 1.0）排除虚假相关。建议结合当前案例的 Top 强规则与网络拓扑结构共同制定业务落地方案。`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `[提示: ${errorDesc}]\n\n${fallbackText}`,
          timestamp: '刚刚',
        },
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Slice with Gear Settings Icon on Title */}
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-stone-400">模块 07</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-medium text-teal-700">AI 规则随诊与大模型交互</span>
            </div>
            
            {/* Title with Gear Settings Icon on the right */}
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                AI 动态规则体检、伪关联防范与商业交叉销售顾问
              </h2>

              {/* 小齿轮设置大模型图标 */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 rounded-md border border-stone-200 transition-all cursor-pointer shadow-2xs group"
                title="设置大模型与手工输入 API Key (支持 Gemini 3 flash / DeepSeek-V4-Pro)"
              >
                <Settings className="w-3.5 h-3.5 text-stone-600 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-semibold text-stone-800">大模型设置</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-teal-800 font-mono border border-stone-200 font-medium">
                  {llmConfig.provider === 'deepseek' ? 'DeepSeek-V4-Pro' : 'Gemini 3 flash'}
                </span>
                {llmConfig.apiKey ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>已配置</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>必须输入 Key</span>
                  </span>
                )}
              </button>
            </div>

            <p className="text-xs text-stone-500 mt-1.5 max-w-3xl">
              结合当前数据矩阵与挖掘状态，大模型 Copilot 实时评估参数截断边界、甄别高置信度伪关联陷阱，
              并为业务端输出精准的货架动线陈列与交叉销售（Cross-selling）策略。已支持 GitHub 纯浏览器端直连 <strong>Gemini 3 flash</strong> 与 <strong>DeepSeek-V4-Pro</strong>。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded border border-stone-200 cursor-pointer transition-colors"
              title="设置大模型与 API-Key"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleRunDiagnosis}
              disabled={isDiagnosing}
              className="flex items-center gap-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
              <span>{isDiagnosing ? '智能诊断推演中...' : '一键 AI 规则体检'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notice Banner if API Key is not yet configured for GitHub deployment */}
      {!llmConfig.apiKey && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3.5 flex items-center justify-between gap-3 text-amber-950 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-900">
                GitHub 静态部署提醒：必须输入 API-Key 才能调用大模型
              </span>
              <p className="text-[11px] text-amber-800">
                本项目已完全适配 GitHub 静态页面环境。调用大模型时，浏览器需通过个人 API Key 向 Gemini 或 DeepSeek 发起请求。
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>输入 API Key 并选择模型</span>
          </button>
        </div>
      )}

      {/* Main Grid: Diagnosis Slices on Left, Interactive Chat on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Health Check Diagnostic Slices (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {diagnosis ? (
            <div className="space-y-4">
              {/* Threshold Evaluation Slice */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-stone-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-700" />
                    <span>1. 阈值设定合理性评估 (Threshold Suitability)</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {diagnosis.modelUsed && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                        {diagnosis.modelUsed}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-stone-400">
                      MinSup: {(minSup * 100).toFixed(0)}% · Conf: {(minConf * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-2.5 rounded border border-stone-100">
                  {diagnosis.thresholdEvaluation}
                </p>
              </div>

              {/* Spurious Correlation Warning Slice */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                <h3 className="text-xs font-semibold text-stone-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>2. 伪关联与高置信度假象警示 (Spurious Correlation Watch)</span>
                </h3>
                <div className="space-y-1.5">
                  {diagnosis.spuriousCorrelationWarnings.map((warn, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded text-xs text-amber-950 leading-relaxed"
                    >
                      {warn}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-selling Strategy Slice */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                <h3 className="text-xs font-semibold text-stone-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-700" />
                  <span>3. 交叉销售与货架动线优化策略 (Cross-selling & Shelving)</span>
                </h3>
                <div className="space-y-2">
                  {diagnosis.crossSellingStrategy.map((strat, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-stone-50 border border-stone-100 rounded text-xs text-stone-700 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>{strat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Recommendations Slice */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
                <h3 className="text-xs font-semibold text-stone-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-teal-700" />
                  <span>4. 专家落地实施建议 (Actionable Next Steps)</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-stone-600 list-disc list-inside">
                  {diagnosis.actionableRecommendations.map((rec, i) => (
                    <li key={i} className="leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-lg p-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-teal-600 mx-auto" />
              <h3 className="text-sm font-semibold text-stone-900">
                尚未生成全面规则体检报告
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                点击右上角「一键 AI 规则体检」，大模型将自动对当前数据集、项集格空间剪枝效率和强规则质量进行四维深度诊断。
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={handleRunDiagnosis}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-medium cursor-pointer"
                >
                  立即开始诊断
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-3 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded text-xs font-medium cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>配置大模型</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Interactive Chat Window (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-stone-200 rounded-lg p-4 flex flex-col h-[580px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-semibold text-stone-900 flex items-center gap-2">
                <span>AI 对话随诊窗口</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                  {llmConfig.provider === 'deepseek' ? 'DeepSeek-V4-Pro' : 'Gemini 3 flash'}
                </span>
              </h3>
            </div>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-[11px] text-stone-500 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              title="切换模型或修改 API Key"
            >
              <Settings className="w-3 h-3" />
              <span>设置</span>
            </button>
          </div>

          {/* Quick Prompts Chips */}
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-stone-100">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="text-[10px] bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded px-2.5 py-1 whitespace-nowrap cursor-pointer transition-colors"
              >
                {qp.slice(0, 18)}...
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-mono ${
                    m.isError ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                  }`}>
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-stone-900 text-white'
                      : m.isError
                      ? 'bg-amber-50 border border-amber-200 text-amber-950'
                      : 'bg-stone-50 border border-stone-200 text-stone-800'
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[9px] mt-1 text-right font-mono ${
                      m.sender === 'user' ? 'text-stone-400' : 'text-stone-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 text-xs font-mono">
                    我
                  </div>
                )}
              </div>
            ))}
            {isAnswering && (
              <div className="flex items-center gap-2 text-stone-400 text-xs p-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                <span>[{llmConfig.provider === 'deepseek' ? 'DeepSeek-V4-Pro' : 'Gemini 3 flash'}] 专家推演中...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="pt-2 border-t border-stone-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={
                llmConfig.apiKey
                  ? `向 ${llmConfig.provider === 'deepseek' ? 'DeepSeek-V4-Pro' : 'Gemini 3 flash'} 提问关联分析疑问...`
                  : '请先点击齿轮图标输入 API-Key 即可向大模型提问...'
              }
              className="flex-1 bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
            />
            <button
              type="submit"
              disabled={isAnswering || !inputQuestion.trim()}
              className="p-2 bg-stone-900 hover:bg-stone-800 text-white rounded cursor-pointer disabled:opacity-40"
              title="发送提问"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* LLM Settings Modal */}
      <LLMSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        config={llmConfig}
        onSave={handleSaveConfig}
      />
    </div>
  );
};
