import React, { useState, useEffect } from 'react';
import { LLMConfig, LLMProvider } from '../types';
import { 
  X, 
  Key, 
  Sparkles, 
  Cpu, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Zap, 
  CheckCircle2, 
  RotateCcw,
  ShieldCheck,
  Server
} from 'lucide-react';
import { testLLMConnection } from '../services/aiService';
import { saveStoredLLMConfig, clearStoredLLMConfig } from '../services/llmConfig';

interface LLMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSave: (newConfig: LLMConfig) => void;
}

export const LLMSettingsModal: React.FC<LLMSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(config.provider || 'gemini');
  const [apiKey, setApiKey] = useState<string>(config.apiKey || '');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>(config.baseUrl || 'https://api.deepseek.com/v1');
  const [customModel, setCustomModel] = useState<string>(config.model || '');
  
  // Test state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedProvider(config.provider || 'gemini');
      setApiKey(config.apiKey || '');
      setBaseUrl(config.baseUrl || 'https://api.deepseek.com/v1');
      setCustomModel(
        config.model || (config.provider === 'deepseek' ? 'deepseek-chat' : 'gemini-2.5-flash')
      );
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleProviderChange = (provider: LLMProvider) => {
    setSelectedProvider(provider);
    setTestResult(null);
    if (provider === 'gemini') {
      setCustomModel('gemini-2.5-flash');
    } else {
      setCustomModel('deepseek-chat');
      if (!baseUrl) {
        setBaseUrl('https://api.deepseek.com/v1');
      }
    }
  };

  const handleTestConnection = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setTestResult({
        success: false,
        message: '请先在下方手工输入 API Key 后再进行连接测试。',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testConf: LLMConfig = {
      provider: selectedProvider,
      model: customModel || (selectedProvider === 'gemini' ? 'gemini-2.5-flash' : 'deepseek-chat'),
      apiKey: trimmedKey,
      baseUrl: baseUrl.trim() || undefined,
      isConfirmed: true,
    };

    const res = await testLLMConnection(testConf);
    setIsTesting(false);
    setTestResult({
      success: res.success,
      message: res.message,
    });
  };

  const handleConfirmSave = () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setTestResult({
        success: false,
        message: '项目部署在 GitHub 静态环境（浏览器直接运行），必须输入 API-Key 才能调用大模型！',
      });
      return;
    }

    const newConfig: LLMConfig = {
      provider: selectedProvider,
      model: customModel.trim() || (selectedProvider === 'gemini' ? 'gemini-2.5-flash' : 'deepseek-chat'),
      apiKey: trimmedKey,
      baseUrl: selectedProvider === 'deepseek' ? baseUrl.trim() || 'https://api.deepseek.com/v1' : undefined,
      isConfirmed: true,
    };

    saveStoredLLMConfig(newConfig);
    onSave(newConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClearKey = () => {
    clearStoredLLMConfig();
    setApiKey('');
    setTestResult(null);
    onSave({
      provider: selectedProvider,
      model: selectedProvider === 'gemini' ? 'gemini-2.5-flash' : 'deepseek-chat',
      apiKey: '',
      baseUrl: 'https://api.deepseek.com/v1',
      isConfirmed: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-800/80 flex items-center justify-center border border-teal-600/40">
              <Sparkles className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                <span>大模型配置中心</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-900 text-teal-200 border border-teal-700/60 font-mono">
                  GitHub 静态部署适配
                </span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                手工配置个人 API Key，支持纯浏览器端直接调用大模型
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-md hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-800 text-xs leading-relaxed">
          {/* GitHub Deployment Alert Notice */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg p-3.5 flex items-start gap-3 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-xs text-amber-950">
                GitHub 静态部署说明：必须输入 API-Key 才能调用大模型
              </p>
              <p className="text-[11px] text-amber-800">
                本项目可直接发布部署至 GitHub Pages 等静态托管平台。由于纯浏览器环境无后端常驻密钥服务，<strong>必须在此手工输入您的个人 API Key</strong> 才能调用大模型完成规则体检与随诊问答。
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-stone-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>安全说明：密钥仅加密保存于您当前浏览器的 localStorage 中，绝不会泄露或上传至第三方服务器。</span>
              </div>
            </div>
          </div>

          {/* Step 2: Choose Model (选择大模型) */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center text-[11px] font-mono font-bold">1</span>
                <span>选择大模型服务 (Model Selection)</span>
              </span>
              <span className="text-[11px] font-normal text-stone-500">支持 Google Gemini 与 DeepSeek 深度求索</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Gemini 3 flash */}
              <div
                onClick={() => handleProviderChange('gemini')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedProvider === 'gemini'
                    ? 'border-teal-700 bg-teal-50/40 shadow-xs ring-1 ring-teal-700'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-teal-700 text-white flex items-center justify-center font-bold text-[10px]">
                      G
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">Gemini 3 flash</h4>
                      <p className="text-[10px] font-mono text-stone-500">gemini-2.5-flash</p>
                    </div>
                  </div>
                  {selectedProvider === 'gemini' && (
                    <div className="w-4 h-4 rounded-full bg-teal-700 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 mt-2.5">
                  Google 官方超高速模型，延迟低至毫秒级，强大多模态与关联推演能力。
                </p>
                <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px]">
                  <span className="text-teal-800 font-medium">推荐首选</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-stone-500 hover:text-teal-700 flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>免费获取 Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Option 2: DeepSeek-V4-Pro */}
              <div
                onClick={() => handleProviderChange('deepseek')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedProvider === 'deepseek'
                    ? 'border-indigo-700 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-700'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-indigo-700 text-white flex items-center justify-center font-bold text-[10px]">
                      D
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">DeepSeek-V4-Pro</h4>
                      <p className="text-[10px] font-mono text-stone-500">deepseek-chat</p>
                    </div>
                  </div>
                  {selectedProvider === 'deepseek' && (
                    <div className="w-4 h-4 rounded-full bg-indigo-700 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 mt-2.5">
                  DeepSeek 顶尖推理模型，擅长统计代数严密论证与复杂商业交叉策略解读。
                </p>
                <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px]">
                  <span className="text-indigo-800 font-medium">深度推理</span>
                  <a
                    href="https://platform.deepseek.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-stone-500 hover:text-indigo-700 flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>开放平台获取</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Manual API Key Input (手工输入 API-Key) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center text-[11px] font-mono font-bold">2</span>
                <span>手工输入 API-Key (必须输入才能调用)</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-stone-500">
                {selectedProvider === 'gemini' ? '格式示例: AIzaSy...' : '格式示例: sk-...'}
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder={
                  selectedProvider === 'gemini'
                    ? '请输入您的 Google Gemini API Key (以 AIzaSy 开头)'
                    : '请输入您的 DeepSeek API Key (以 sk- 开头)'
                }
                className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-xs font-mono transition-all outline-hidden ${
                  !apiKey.trim()
                    ? 'border-amber-400 bg-amber-50/20 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                    : 'border-stone-300 bg-white focus:border-teal-700 focus:ring-1 focus:ring-teal-700'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                title={showKey ? '隐藏密钥' : '显示明文'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {!apiKey.trim() && (
              <p className="text-[11px] text-amber-700 flex items-center gap-1">
                <span>⚠️ 当前尚未输入 API Key。未输入时无法向大模型发起规则体检与随诊请求。</span>
              </p>
            )}
          </div>

          {/* DeepSeek Base URL setting if deepseek selected */}
          {selectedProvider === 'deepseek' && (
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-stone-700 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-stone-500" />
                  <span>API Base URL (端点配置，默认官方端点)</span>
                </label>
                <span className="text-[10px] text-stone-400 font-mono">兼容 OpenAI 格式</span>
              </div>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.deepseek.com/v1"
                className="w-full px-3 py-1.5 bg-white rounded border border-stone-300 text-xs font-mono text-stone-800 outline-hidden focus:border-indigo-600"
              />
              <p className="text-[10px] text-stone-500">
                支持官方端点，亦支持自建反代、SiliconFlow 或第三方 OpenAI 兼容网关。
              </p>
            </div>
          )}

          {/* Test Result Message Box */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 animate-in fade-in duration-150 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-semibold">
                  {testResult.success ? '连接测试通过' : '连接测试失败'}
                </span>
                <p className="text-[11px] leading-relaxed break-all opacity-90">
                  {testResult.message}
                </p>
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>大模型选择与 API Key 已成功确认并写入本地浏览器缓存！</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-600 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? '正在测试连接...' : '测试大模型连接'}</span>
            </button>

            {apiKey && (
              <button
                type="button"
                onClick={handleClearKey}
                className="text-stone-500 hover:text-rose-600 text-xs px-2 py-1 transition-colors cursor-pointer"
                title="清空已保存的密钥"
              >
                清除密钥
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-stone-600 hover:text-stone-900 text-xs font-medium cursor-pointer"
            >
              取消
            </button>

            {/* Step 3: Confirm Button (确认大模型选择) */}
            <button
              type="button"
              onClick={handleConfirmSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-teal-800 hover:bg-teal-900 text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>确认大模型选择并保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
