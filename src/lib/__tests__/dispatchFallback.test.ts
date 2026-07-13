import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDispatchFallbackUpdate,
  mapDispatchStatusToOrderStatus,
  mapOrderStatusToDispatchStatus
} from '../dispatchFallback';

test('mapDispatchStatusToOrderStatus maps all active dispatch states', () => {
  assert.equal(mapDispatchStatusToOrderStatus('Unassigned'), 'Awaiting Rider');
  assert.equal(mapDispatchStatusToOrderStatus('Assigned'), 'Assigned');
  assert.equal(mapDispatchStatusToOrderStatus('Picked Up'), 'Picked Up');
  assert.equal(mapDispatchStatusToOrderStatus('In Transit'), 'In Transit');
  assert.equal(mapDispatchStatusToOrderStatus('Delivered'), 'Delivered');
  assert.equal(mapDispatchStatusToOrderStatus('Completed'), 'Completed');
  assert.equal(mapDispatchStatusToOrderStatus('Failed'), 'Failed');
});

test('mapOrderStatusToDispatchStatus collapses failed and cancelled into dispatch failed', () => {
  assert.equal(mapOrderStatusToDispatchStatus('Failed'), 'Failed');
  assert.equal(mapOrderStatusToDispatchStatus('Cancelled'), 'Failed');
  assert.equal(mapOrderStatusToDispatchStatus('Awaiting Rider'), 'Unassigned');
});

test('buildDispatchFallbackUpdate includes rider only when provided', () => {
  const withRider = buildDispatchFallbackUpdate('Assigned', '2024-01-01T00:00:00.000Z', 'runner-1');
  const withoutRider = buildDispatchFallbackUpdate('Unassigned', '2024-01-01T00:00:00.000Z');

  assert.deepEqual(withRider, {
    status: 'Assigned',
    updated_at: '2024-01-01T00:00:00.000Z',
    assigned_rider_id: 'runner-1'
  });

  assert.deepEqual(withoutRider, {
    status: 'Awaiting Rider',
    updated_at: '2024-01-01T00:00:00.000Z'
  });
});
