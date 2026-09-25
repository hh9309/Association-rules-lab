import React, { useState } from 'react';
import { DatasetCase, Transaction, AssociationRule, LLMConfig } from '../types';
import { 
  Sparkles, 
  X, 
  Minus, 
  Send, 
  Bot, 
  Maximize2,
  Settings 
} from 'lucide-react';
import { invokeLLM } from '../services/aiService';
import { getStoredLLMConfig } from '../services/llmConfig';
import { LLMSettingsModal } from './LLMSettingsModal';

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase: DatasetCase;
  transactions: Transaction[];
  rules: AssociationRule[];
  minSup: number;
  minConf: number;
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  isOpen,
  onClose,
  currentCase,
  transactions,
  rules,
  minSup,
  minConf,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(getStoredLLMConfig());
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `已就绪！您正在浏览【${currentCase.title}】。当前提取出 ${rules.length} 条关联规则 (MinSup: ${(minSup * 100).toFixed(0)}%, MinConf: ${(minConf * 100).toFixed(0)}%)。有任何疑问欢迎随时向我咨询！`,
    },
  ]);
  const [inputVal, setInputVal] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputVal).trim();
    if (!q) return;

    if (!llmConfig.apiKey || !llmConfig.apiKey.trim()) {
      setMessages((prev) => [
        ...prev, 
        { sender: 'user', text: q },
        { 
          sender: 'ai', 
          text: `⚠️【需要配置 API Key】：由于项目部署在 GitHub 静态页面纯浏览器端，必须手工输入 API-Key 才能调用大模型（Gemini 3 flash 或 DeepSeek-V4-Pro）。\n\n请点击右上角小齿轮 ⚙️ 进行配置。` 
        }
      ]);
      setInputVal('');
      setShowSettings(true);
      return;
    }

    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setInputVal('');
    setLoading(true);

    try {
      const prompt = `基于频繁项集与关联分析实验室：当前案例【${currentCase.title}】，用户提问：“${q}”。参数：MinSup=${minSup}, MinConf=${minConf}。请简短精炼、要点分明地解答。`;
      const systemInstruction = '你是一位数据挖掘与无监督学习随诊AI，回答精炼、专业、重在解释业务与统计机理。';
      
      const result = await invokeLLM(prompt, systemInstruction, llmConfig);
      setMessages((prev) => [...prev, { sender: 'ai', text: result.text }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `【随诊提示】: 对于【${q}】，在关联挖掘中，请务必关注 Lift 指标是否大于 1.2。如果 Lift ≈ 1.0，即便置信度高达 90% 也是无用的假性相关。此外，最小支持度可结合二八定律（20%~30%）设定以规避组合爆炸。(备选引擎响应: ${err?.message || '网络连接超时'})`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 w-96 shadow-xl rounded-lg border border-stone-200 bg-white overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="bg-stone-900 text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-semibold">AI 随诊专家 (浮窗)</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-stone-800 text-teal-300 font-mono">
              {llmConfig.provider === 'deepseek' ? 'DeepSeek' : 'Gemini'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white cursor-pointer"
              title="大模型设置 (API-Key)"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white cursor-pointer"
              title={isMinimized ? '展开' : '折叠'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white cursor-pointer"
              title="关闭"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-col h-[380px]">
            {/* Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-stone-900 text-white ml-6'
                      : 'bg-stone-50 border border-stone-200 text-stone-800 mr-4 whitespace-pre-wrap'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="text-[11px] text-stone-400 font-mono animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
                  <span>AI 专家正在分析关联测度...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2 border-t border-stone-100 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={llmConfig.apiKey ? "随时提问挖掘难点..." : "请先配置 API Key 后提问..."}
                className="flex-1 bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
              <button
                type="submit"
                disabled={loading || !inputVal.trim()}
                className="p-1.5 bg-stone-900 text-white rounded hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      <LLMSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={llmConfig}
        onSave={(cfg) => setLlmConfig(cfg)}
      />
    </>
  );
};

