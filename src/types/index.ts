export interface Transaction {
  id: string;
  items: string[];
  customer?: string;
  timestamp?: string;
}

export interface ItemMeta {
  id: string;
  name: string;
  category: string;
  price?: number;
  icon?: string;
}

export interface DatasetCase {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  algorithmHighlight: string;
  description: string;
  businessGoal: string;
  items: ItemMeta[];
  transactions: Transaction[];
  recommendedMinSup: number;
  recommendedMinConf: number;
  recommendedMinLift: number;
  domainInsights: string[];
  crossSellingAdvice: string[];
}

export interface AssociationRule {
  id: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
  leverage: number;
  count: number;
  isRedundant?: boolean;
}

export interface FrequentItemset {
  items: string[];
  support: number;
  count: number;
  k: number;
}

export interface AprioriStepStage {
  k: number;
  phase: 'candidate_generation' | 'support_counting' | 'pruning' | 'frequent_final';
  candidates: {
    items: string[];
    count: number;
    support: number;
    isFrequent: boolean;
    prunedByApriori?: boolean;
    pruneReason?: string;
  }[];
  frequent: FrequentItemset[];
  description: string;
}

export interface FPNode {
  id: string;
  name: string;
  count: number;
  parentId: string | null;
  children: FPNode[];
  nodeLink?: string | null;
  depth: number;
}

export interface HeaderTableEntry {
  item: string;
  count: number;
  headNodeId?: string;
  nodeIds: string[];
}

export interface ConditionalPattern {
  item: string;
  paths: {
    prefix: string[];
    count: number;
  }[];
  conditionalFPTreeItems: { item: string; count: number }[];
  minedRules: string[];
}

export interface TidListEntry {
  item: string;
  tids: number[];
  support: number;
  count: number;
}

export type LLMProvider = 'gemini' | 'deepseek';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  isConfirmed: boolean;
}
