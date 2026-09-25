import { Transaction, FPNode, HeaderTableEntry, ConditionalPattern } from '../types';
import { countItemsetInTransactions, getAllUniqueItems } from './core';

export interface FPTreeResult {
  root: FPNode;
  headerTable: HeaderTableEntry[];
  filteredTransactions: { id: string; original: string[]; sorted: string[] }[];
  conditionalBases: Record<string, ConditionalPattern>;
}

export function buildFPTree(
  transactions: Transaction[],
  minSup: number
): FPTreeResult {
  const n = transactions.length;
  const uniqueItems = getAllUniqueItems(transactions);

  // 1. Calculate frequency and filter by minSup
  const itemCounts = uniqueItems.map((item) => {
    const count = countItemsetInTransactions([item], transactions);
    const support = n > 0 ? count / n : 0;
    return { item, count, support };
  });

  const frequentItems = itemCounts
    .filter((entry) => entry.support >= minSup)
    .sort((a, b) => b.count - a.count || a.item.localeCompare(b.item));

  const orderMap = new Map<string, number>();
  frequentItems.forEach((entry, idx) => orderMap.set(entry.item, idx));

  // 2. Prepare Header Table
  const headerTable: HeaderTableEntry[] = frequentItems.map((entry) => ({
    item: entry.item,
    count: entry.count,
    nodeIds: [],
  }));
  const headerTableMap = new Map<string, HeaderTableEntry>();
  headerTable.forEach((h) => headerTableMap.set(h.item, h));

  // 3. Filter and sort transactions
  const filteredTransactions = transactions.map((tx) => {
    const sorted = tx.items
      .filter((item) => orderMap.has(item))
      .sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0));
    return {
      id: tx.id,
      original: tx.items,
      sorted,
    };
  });

  // 4. Build Tree
  let nodeCounter = 0;
  const root: FPNode = {
    id: 'node-root',
    name: 'ROOT',
    count: 0,
    parentId: null,
    children: [],
    depth: 0,
  };

  const nodeMap = new Map<string, FPNode>();
  nodeMap.set('node-root', root);

  function insertTree(items: string[], parent: FPNode, depth: number) {
    if (items.length === 0) return;
    const currentItem = items[0];
    const remaining = items.slice(1);

    let child = parent.children.find((c) => c.name === currentItem);
    if (child) {
      child.count += 1;
    } else {
      nodeCounter++;
      const newId = `node-${nodeCounter}-${currentItem.replace(/[^a-zA-Z0-9]/g, '_')}`;
      child = {
        id: newId,
        name: currentItem,
        count: 1,
        parentId: parent.id,
        children: [],
        depth,
      };
      parent.children.push(child);
      nodeMap.set(newId, child);

      // Register into Header Table
      const hEntry = headerTableMap.get(currentItem);
      if (hEntry) {
        hEntry.nodeIds.push(newId);
        if (!hEntry.headNodeId) {
          hEntry.headNodeId = newId;
        }
      }
    }

    insertTree(remaining, child, depth + 1);
  }

  filteredTransactions.forEach((tx) => {
    if (tx.sorted.length > 0) {
      root.count += 1;
      insertTree(tx.sorted, root, 1);
    }
  });

  // 5. Build Conditional Pattern Bases for all frequent items (bottom-up in header table)
  const conditionalBases: Record<string, ConditionalPattern> = {};

  // Traverse header table in reverse order (least frequent first)
  const reversedHeader = [...headerTable].reverse();

  reversedHeader.forEach((hEntry) => {
    const item = hEntry.item;
    const paths: { prefix: string[]; count: number }[] = [];

    hEntry.nodeIds.forEach((nodeId) => {
      let current = nodeMap.get(nodeId);
      if (!current) return;
      const count = current.count;
      const prefix: string[] = [];

      let parentId = current.parentId;
      while (parentId && parentId !== 'node-root') {
        const pNode = nodeMap.get(parentId);
        if (pNode) {
          prefix.unshift(pNode.name);
          parentId = pNode.parentId;
        } else {
          break;
        }
      }

      if (prefix.length > 0) {
        paths.push({ prefix, count });
      }
    });

    // Tally item counts in prefixes
    const prefixItemCounts: Record<string, number> = {};
    paths.forEach((p) => {
      p.prefix.forEach((it) => {
        prefixItemCounts[it] = (prefixItemCounts[it] || 0) + p.count;
      });
    });

    const conditionalFPTreeItems = Object.entries(prefixItemCounts)
      .filter(([_, count]) => count / n >= minSup)
      .map(([it, count]) => ({ item: it, count }))
      .sort((a, b) => b.count - a.count);

    const minedRules = conditionalFPTreeItems.map(
      (c) => `{${c.item}, ${item}} (频数: ${c.count}, 支持度: ${(c.count / n).toFixed(2)})`
    );

    conditionalBases[item] = {
      item,
      paths,
      conditionalFPTreeItems,
      minedRules,
    };
  });

  return {
    root,
    headerTable,
    filteredTransactions,
    conditionalBases,
  };
}
