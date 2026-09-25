export type LLMProvider = 'gemini' | 'deepseek';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  isConfirmed: boolean;
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  apiKey: '',
  baseUrl: 'https://api.deepseek.com/v1',
  isConfirmed: false,
};

const STORAGE_KEY = 'association_rules_lab_llm_config';

export function getStoredLLMConfig(): LLMConfig {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { ...DEFAULT_LLM_CONFIG };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        provider: parsed.provider === 'deepseek' ? 'deepseek' : 'gemini',
        model: parsed.model || (parsed.provider === 'deepseek' ? 'deepseek-chat' : 'gemini-2.5-flash'),
        apiKey: parsed.apiKey || '',
        baseUrl: parsed.baseUrl || 'https://api.deepseek.com/v1',
        isConfirmed: Boolean(parsed.isConfirmed && parsed.apiKey),
      };
    }
  } catch (e) {
    console.warn('Failed to load LLM config from localStorage:', e);
  }
  return { ...DEFAULT_LLM_CONFIG };
}

export function saveStoredLLMConfig(config: LLMConfig): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save LLM config to localStorage:', e);
  }
}

export function clearStoredLLMConfig(): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear LLM config:', e);
  }
}
