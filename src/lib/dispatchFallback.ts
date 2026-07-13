import type { DispatchStatus, OrderRecord } from '@/lib/types';

export function mapDispatchStatusToOrderStatus(status: DispatchStatus | string): OrderRecord['status'] {
  if (status === 'Unassigned') return 'Awaiting Rider';
  if (status === 'Assigned') return 'Assigned';
  if (status === 'Picked Up') return 'Picked Up';
  if (status === 'In Transit') return 'In Transit';
  if (status === 'Delivered') return 'Delivered';
  if (status === 'Completed') return 'Completed';
  return 'Failed';
}

export function mapOrderStatusToDispatchStatus(status: OrderRecord['status']): DispatchStatus {
  if (status === 'Assigned') return 'Assigned';
  if (status === 'Picked Up') return 'Picked Up';
  if (status === 'In Transit') return 'In Transit';
  if (status === 'Delivered') return 'Delivered';
  if (status === 'Completed') return 'Completed';
  if (status === 'Failed' || status === 'Cancelled') return 'Failed';
  return 'Unassigned';
}

export function buildDispatchFallbackUpdate(status: DispatchStatus | string, updatedAt: string, assignedRiderId?: string | null) {
  const payload: Record<string, unknown> = {
    status: mapDispatchStatusToOrderStatus(status),
    updated_at: updatedAt
  };

  if (assignedRiderId) {
    payload.assigned_rider_id = assignedRiderId;
  }

  return payload;
}
