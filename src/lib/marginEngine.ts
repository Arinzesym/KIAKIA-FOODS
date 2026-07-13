import type { DeliveryMetrics, ShoppingBudgetMetrics } from '@/lib/types';

export function calculateShoppingBudgetMetrics(allocatedBudget: number, actualSpend: number, runnerBonusPercentage: number): ShoppingBudgetMetrics {
  const safeBudget = Number.isFinite(allocatedBudget) ? allocatedBudget : 0;
  const safeSpend = Number.isFinite(actualSpend) ? actualSpend : 0;
  const safeBonusRate = Number.isFinite(runnerBonusPercentage) ? runnerBonusPercentage : 0;

  const shoppingMargin = safeBudget - safeSpend;
  const runnerBonus = safeSpend * (safeBonusRate / 100);
  const businessMargin = shoppingMargin - runnerBonus;

  return {
    allocatedBudget: safeBudget,
    actualSpend: safeSpend,
    shoppingMargin,
    runnerBonus,
    businessMargin
  };
}

export function calculateDeliveryMetrics(collectedDeliveryFees: number, dispatchCost: number): DeliveryMetrics {
  const safeFees = Number.isFinite(collectedDeliveryFees) ? collectedDeliveryFees : 0;
  const safeCost = Number.isFinite(dispatchCost) ? dispatchCost : 0;

  return {
    collectedDeliveryFees: safeFees,
    dispatchCost: safeCost,
    deliveryMargin: safeFees - safeCost
  };
}
