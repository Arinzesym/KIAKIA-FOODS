import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDeliveryMetrics, calculateShoppingBudgetMetrics } from '../marginEngine';

test('calculateShoppingBudgetMetrics computes business margin with runner bonus', () => {
  const metrics = calculateShoppingBudgetMetrics(10000, 8000, 10);

  assert.equal(metrics.allocatedBudget, 10000);
  assert.equal(metrics.actualSpend, 8000);
  assert.equal(metrics.shoppingMargin, 2000);
  assert.equal(metrics.runnerBonus, 800);
  assert.equal(metrics.businessMargin, 1200);
});

test('calculateShoppingBudgetMetrics defaults invalid numbers to zero', () => {
  const metrics = calculateShoppingBudgetMetrics(Number.NaN, Number.POSITIVE_INFINITY, Number.NaN);

  assert.equal(metrics.allocatedBudget, 0);
  assert.equal(metrics.actualSpend, 0);
  assert.equal(metrics.shoppingMargin, 0);
  assert.equal(metrics.runnerBonus, 0);
  assert.equal(metrics.businessMargin, 0);
});

test('calculateDeliveryMetrics calculates delivery margin safely', () => {
  const metrics = calculateDeliveryMetrics(3000, 2200);

  assert.equal(metrics.collectedDeliveryFees, 3000);
  assert.equal(metrics.dispatchCost, 2200);
  assert.equal(metrics.deliveryMargin, 800);
});
