import { Transaction, AssociationRule, FrequentItemset } from '../types';

export function getAllUniqueItems(transactions: Transaction[]): string[] {
  const itemSet = new Set<string>();
  transactions.forEach((t) => t.items.forEach((item) => itemSet.add(item)));
  return Array.from(itemSet).sort();
}

export function buildBinaryMatrix(
  transactions: Transaction[],
  allItems: string[]
): {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
  rowSums: number[];
  colSums: number[];
  sparsity: number;
} {
  const matrix: number[][] = [];
  const rowSums: number[] = [];
  const colSums: number[] = new Array(allItems.length).fill(0);
  let totalOnes = 0;

  transactions.forEach((tx) => {
    const txSet = new Set(tx.items);
    let rSum = 0;
    const row = allItems.map((item, colIdx) => {
      const val = txSet.has(item) ? 1 : 0;
      if (val === 1) {
        rSum += 1;
        colSums[colIdx] += 1;
        totalOnes += 1;
      }
      return val;
    });
    matrix.push(row);
    rowSums.push(rSum);
  });

  const totalCells = transactions.length * allItems.length;
  const sparsity = totalCells > 0 ? 1 - totalOnes / totalCells : 0;

  return {
    matrix,
    rowLabels: transactions.map((t) => t.id),
    colLabels: allItems,
    rowSums,
    colSums,
    sparsity,
  };
}

export function countItemsetInTransactions(
  itemset: string[],
  transactions: Transaction[]
): number {
  if (itemset.length === 0) return transactions.length;
  const searchSet = new Set(itemset);
  let count = 0;
  for (const tx of transactions) {
    let hasAll = true;
    const tSet = new Set(tx.items);
    for (const item of searchSet) {
      if (!tSet.has(item)) {
        hasAll = false;
        break;
      }
    }
    if (hasAll) count++;
  }
  return count;
}

export function calculateRuleMetrics(
  antecedent: string[],
  consequent: string[],
  transactions: Transaction[]
): {
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
  leverage: number;
  count: number;
  suppA: number;
  suppB: number;
} {
  const n = transactions.length;
  if (n === 0) {
    return {
      support: 0,
      confidence: 0,
      lift: 1,
      conviction: 1,
      leverage: 0,
      count: 0,
      suppA: 0,
      suppB: 0,
    };
  }

  const unionSet = Array.from(new Set([...antecedent, ...consequent]));
  const countAB = countItemsetInTransactions(unionSet, transactions);
  const countA = countItemsetInTransactions(antecedent, transactions);
  const countB = countItemsetInTransactions(consequent, transactions);

  const suppAB = countAB / n;
  const suppA = countA / n;
  const suppB = countB / n;

  const confidence = suppA > 0 ? suppAB / suppA : 0;
  const lift = suppA * suppB > 0 ? suppAB / (suppA * suppB) : 1;
  const leverage = suppAB - suppA * suppB;

  let conviction = 1;
  if (confidence >= 0.99999) {
    conviction = 999; // Represents infinity when confidence approaches 100%
  } else if (1 - confidence > 0) {
    conviction = (1 - suppB) / (1 - confidence);
  }

  return {
    support: suppAB,
    confidence,
    lift,
    conviction,
    leverage,
    count: countAB,
    suppA,
    suppB,
  };
}

export function generateAllSubsets<T>(array: T[]): T[][] {
  const result: T[][] = [];
  const total = 1 << array.length;
  for (let i = 1; i < total; i++) {
    const subset: T[] = [];
    for (let j = 0; j < array.length; j++) {
      if ((i & (1 << j)) !== 0) {
        subset.push(array[j]);
      }
    }
    result.push(subset);
  }
  return result;
}
