import { Transaction, FrequentItemset, AssociationRule } from '../types';
import { calculateRuleMetrics, generateAllSubsets } from './core';

export function extractAssociationRules(
  frequentItemsets: FrequentItemset[],
  transactions: Transaction[],
  minConf: number = 0.5,
  minLift: number = 1.0
): AssociationRule[] {
  const rules: AssociationRule[] = [];
  let ruleId = 1;

  // Process only itemsets with length >= 2
  const candidateItemsets = frequentItemsets.filter((f) => f.items.length >= 2);

  candidateItemsets.forEach((itemset) => {
    const items = itemset.items;
    const subsets = generateAllSubsets(items);

    // Each proper non-empty subset X -> Y = items \ X
    subsets.forEach((antecedent) => {
      if (antecedent.length === 0 || antecedent.length === items.length) return;

      const antecedentSet = new Set(antecedent);
      const consequent = items.filter((it) => !antecedentSet.has(it));
      if (consequent.length === 0) return;

      const metrics = calculateRuleMetrics(antecedent, consequent, transactions);

      if (metrics.confidence >= minConf && metrics.lift >= minLift) {
        rules.push({
          id: `R${ruleId++}`,
          antecedent,
          consequent,
          support: metrics.support,
          confidence: metrics.confidence,
          lift: metrics.lift,
          conviction: metrics.conviction,
          leverage: metrics.leverage,
          count: metrics.count,
        });
      }
    });
  });

  // Identify redundant rules
  // Rule A + C => B is redundant if there exists A => B such that Conf(A+C=>B) <= Conf(A=>B)
  const ruleMap = new Map<string, AssociationRule>();
  rules.forEach((r) => {
    const key = `${r.antecedent.slice().sort().join('+')}==>${r.consequent.slice().sort().join('+')}`;
    ruleMap.set(key, r);
  });

  rules.forEach((r) => {
    if (r.antecedent.length >= 2) {
      const consKey = r.consequent.slice().sort().join('+');
      // check sub-antecedents
      const subAntecedents = generateAllSubsets(r.antecedent).filter(
        (sub) => sub.length > 0 && sub.length < r.antecedent.length
      );
      for (const subA of subAntecedents) {
        const subKey = `${subA.slice().sort().join('+')}==>${consKey}`;
        const simplerRule = ruleMap.get(subKey);
        if (simplerRule && simplerRule.confidence >= r.confidence - 0.001) {
          r.isRedundant = true;
          break;
        }
      }
    }
  });

  // Sort by Lift descending, then Confidence descending
  return rules.sort((a, b) => b.lift - a.lift || b.confidence - a.confidence);
}
