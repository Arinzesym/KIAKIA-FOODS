'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  mockCustomers,
  mockDispatches,
  mockEstateBatches,
  mockEstates,
  mockNotifications,
  mockOrders,
  mockRiderAssignments,
  mockRunnerTasks
} from '@/lib/mockData';
import { supabaseClient } from '@/lib/supabaseClient';
import type {
  CustomerProfile,
  DispatchRecord,
  DispatchStatus,
  EstateBatch,
  EstateRecord,
  NotificationRecord,
  NotificationType,
  OrderRecord,
  RiderAssignment,
  RunnerTask
} from '@/lib/types';

type StoreResource =
  | 'orders'
  | 'customers'
  | 'runnerTasks'
  | 'estateBatches'
  | 'riderAssignments'
  | 'dispatches'
  | 'estates'
  | 'notifications';

interface OMSStore {
  orders: OrderRecord[];
  customers: CustomerProfile[];
  estateBatches: EstateBatch[];
  runnerTasks: RunnerTask[];
  riderAssignments: RiderAssignment[];
  dispatches: DispatchRecord[];
  estates: EstateRecord[];
  notifications: NotificationRecord[];
  isConnected: boolean;
  addOrder: (order: OrderRecord) => void;
  updateOrder: (orderId: string, patch: Partial<OrderRecord>) => void;
  deleteOrder: (orderId: string) => void;
  addCustomer: (customer: CustomerProfile) => void;
  deleteCustomer: (customerId: string) => void;
  addRunnerTask: (task: RunnerTask) => void;
  updateRunnerTask: (taskId: string, patch: Partial<RunnerTask>) => void;
  deleteRunnerTask: (taskId: string) => void;
  addEstateBatch: (batch: EstateBatch) => void;
  updateEstateBatch: (batchId: string, patch: Partial<EstateBatch>) => void;
  deleteEstateBatch: (batchId: string) => void;
  updateRiderAssignment: (assignmentId: string, patch: Partial<RiderAssignment>) => void;
  deleteRiderAssignment: (assignmentId: string) => void;
  sendToDispatch: (orderId: string, assignedRider: string) => void;
  updateDispatchStatus: (dispatchId: string, nextStatus: DispatchStatus, patch?: Partial<DispatchRecord>) => void;
  createNotification: (type: NotificationType, title: string, message: string, refs?: { orderId?: string; batchId?: string }) => void;
  markNotificationRead: (notificationId: string) => void;
  refreshSnapshot: () => Promise<void>;
}

type Snapshot = {
  orders: OrderRecord[];
  customers: CustomerProfile[];
  estateBatches: EstateBatch[];
  runnerTasks: RunnerTask[];
  riderAssignments: RiderAssignment[];
  dispatches: DispatchRecord[];
  estates: EstateRecord[];
  notifications: NotificationRecord[];
};

const StoreContext = createContext<OMSStore | undefined>(undefined);
const STORAGE_KEY = 'kiakia-oms-store-v3';

function loadInitialState(): Snapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }
    const parsed = JSON.parse(saved) as Partial<Snapshot>;
    return {
      orders: parsed.orders ?? mockOrders,
      customers: parsed.customers ?? mockCustomers,
      estateBatches: parsed.estateBatches ?? mockEstateBatches,
      runnerTasks: parsed.runnerTasks ?? mockRunnerTasks,
      riderAssignments: parsed.riderAssignments ?? mockRiderAssignments,
      dispatches: parsed.dispatches ?? mockDispatches,
      estates: parsed.estates ?? mockEstates,
      notifications: parsed.notifications ?? mockNotifications
    };
  } catch {
    return null;
  }
}

async function fetchOmsSnapshot(): Promise<Snapshot> {
  const response = await fetch('/api/oms', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch OMS snapshot.');
  }

  const result = await response.json();
  return {
    orders: (result.orders ?? []) as OrderRecord[],
    customers: (result.customers ?? []) as CustomerProfile[],
    estateBatches: (result.estateBatches ?? []) as EstateBatch[],
    runnerTasks: (result.runnerTasks ?? []) as RunnerTask[],
    riderAssignments: (result.riderAssignments ?? []) as RiderAssignment[],
    dispatches: (result.dispatches ?? []) as DispatchRecord[],
    estates: (result.estates ?? []) as EstateRecord[],
    notifications: (result.notifications ?? []) as NotificationRecord[]
  };
}

async function postOmsMutation(payload: Record<string, unknown>) {
  const response = await fetch('/api/oms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(bodyText || 'Failed to save OMS mutation.');
  }
}

function applyOrderStatusFromDispatch(status: DispatchStatus): OrderRecord['status'] {
  if (status === 'Unassigned') return 'Awaiting Rider';
  if (status === 'Assigned') return 'Assigned';
  if (status === 'Picked Up') return 'Picked Up';
  if (status === 'In Transit') return 'In Transit';
  if (status === 'Delivered') return 'Delivered';
  if (status === 'Completed') return 'Completed';
  return 'Failed';
}

function updateEstateSnapshot(orders: OrderRecord[], estates: EstateRecord[]) {
  return estates.map((estate) => {
    const estateOrders = orders.filter((order) => order.estate === estate.name);
    const completed = estateOrders.filter((order) => order.status === 'Completed').length;
    const failed = estateOrders.filter((order) => order.status === 'Failed').length;
    const pending = estateOrders.filter((order) => !['Completed', 'Failed'].includes(order.status)).length;
    return {
      ...estate,
      numberOfOrders: estateOrders.length,
      dailyDeliveries: estateOrders.length,
      completedDeliveries: completed,
      failedDeliveries: failed,
      pendingDeliveries: pending,
      revenueGenerated: estateOrders.reduce((sum, order) => sum + order.grandTotal, 0),
      updatedAt: new Date().toISOString()
    };
  });
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderRecord[]>(mockOrders);
  const [customers, setCustomers] = useState<CustomerProfile[]>(mockCustomers);
  const [estateBatches, setEstateBatches] = useState<EstateBatch[]>(mockEstateBatches);
  const [runnerTasks, setRunnerTasks] = useState<RunnerTask[]>(mockRunnerTasks);
  const [riderAssignments, setRiderAssignments] = useState<RiderAssignment[]>(mockRiderAssignments);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(mockDispatches);
  const [estates, setEstates] = useState<EstateRecord[]>(mockEstates);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(mockNotifications);
  const [usingFallback, setUsingFallback] = useState(false);

  const isConnected = !usingFallback;

  const runMutation = useCallback((payload: Record<string, unknown>) => {
    if (usingFallback) {
      return;
    }

    void postOmsMutation(payload).catch(() => {
      setUsingFallback(true);
    });
  }, [usingFallback]);

  const applySnapshot = useCallback((snapshot: Snapshot) => {
    setOrders(snapshot.orders);
    setCustomers(snapshot.customers);
    setEstateBatches(snapshot.estateBatches);
    setRunnerTasks(snapshot.runnerTasks);
    setRiderAssignments(snapshot.riderAssignments);
    setDispatches(snapshot.dispatches);
    setEstates(snapshot.estates);
    setNotifications(snapshot.notifications);
  }, []);

  const refreshSnapshot = useCallback(async () => {
    const snapshot = await fetchOmsSnapshot();
    applySnapshot(snapshot);
    setUsingFallback(false);
  }, [applySnapshot]);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const snapshot = await fetchOmsSnapshot();
        if (!active) return;
        applySnapshot(snapshot);
        setUsingFallback(false);
      } catch {
        if (!active) return;

        const initialState = loadInitialState();
        if (initialState) {
          applySnapshot(initialState);
        }
        setUsingFallback(true);
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, [applySnapshot]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const snapshot: Snapshot = {
      orders,
      customers,
      estateBatches,
      runnerTasks,
      riderAssignments,
      dispatches,
      estates,
      notifications
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [orders, customers, estateBatches, runnerTasks, riderAssignments, dispatches, estates, notifications]);

  useEffect(() => {
    if (!supabaseClient || usingFallback) {
      return;
    }

    const client = supabaseClient;

    const channel = client
      .channel('oms-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void refreshSnapshot();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rider_assignments' }, () => {
        void refreshSnapshot();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, () => {
        void refreshSnapshot();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estate_batches' }, () => {
        void refreshSnapshot();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        void refreshSnapshot();
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [refreshSnapshot, usingFallback]);

  useEffect(() => {
    if (!usingFallback) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshSnapshot().catch(() => {
        // Keep local fallback state when backend remains unavailable.
      });
    }, 10000);

    return () => window.clearInterval(interval);
  }, [refreshSnapshot, usingFallback]);

  const value = useMemo(
    () => ({
      orders,
      customers,
      estateBatches,
      runnerTasks,
      riderAssignments,
      dispatches,
      estates,
      notifications,
      isConnected,
      addOrder(order: OrderRecord) {
        const normalizedOrder = {
          ...order,
          orderNumber: order.orderNumber || order.id,
          quantity: order.quantity || order.items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)
        };
        setOrders((current) => [normalizedOrder, ...current]);
        runMutation({ resource: 'orders', action: 'create', payload: normalizedOrder });
      },
      updateOrder(orderId: string, patch: Partial<OrderRecord>) {
        setOrders((current) => {
          const nextOrders = current.map((order) => (order.id === orderId ? { ...order, ...patch } : order));
          setEstates((prev) => updateEstateSnapshot(nextOrders, prev));
          return nextOrders;
        });
        runMutation({ resource: 'orders', action: 'update', id: orderId, payload: patch });
      },
      deleteOrder(orderId: string) {
        setOrders((current) => current.filter((order) => order.id !== orderId));
        runMutation({ resource: 'orders', action: 'delete', id: orderId });
      },
      addCustomer(customer: CustomerProfile) {
        setCustomers((current) => [customer, ...current]);
        runMutation({ resource: 'customers', action: 'create', payload: customer });
      },
      deleteCustomer(customerId: string) {
        setCustomers((current) => current.filter((customer) => customer.id !== customerId));
        runMutation({ resource: 'customers', action: 'delete', id: customerId });
      },
      addRunnerTask(task: RunnerTask) {
        setRunnerTasks((current) => [task, ...current]);
        runMutation({ resource: 'runnerTasks', action: 'create', payload: task });
      },
      updateRunnerTask(taskId: string, patch: Partial<RunnerTask>) {
        setRunnerTasks((current) => current.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
        runMutation({ resource: 'runnerTasks', action: 'update', id: taskId, payload: patch });
      },
      deleteRunnerTask(taskId: string) {
        setRunnerTasks((current) => current.filter((task) => task.id !== taskId));
        runMutation({ resource: 'runnerTasks', action: 'delete', id: taskId });
      },
      addEstateBatch(batch: EstateBatch) {
        setEstateBatches((current) => [batch, ...current]);
        runMutation({ resource: 'estateBatches', action: 'create', payload: batch });
      },
      updateEstateBatch(batchId: string, patch: Partial<EstateBatch>) {
        setEstateBatches((current) => current.map((batch) => (batch.id === batchId ? { ...batch, ...patch } : batch)));
        runMutation({ resource: 'estateBatches', action: 'update', id: batchId, payload: patch });
      },
      deleteEstateBatch(batchId: string) {
        setEstateBatches((current) => current.filter((batch) => batch.id !== batchId));
        runMutation({ resource: 'estateBatches', action: 'delete', id: batchId });
      },
      updateRiderAssignment(assignmentId: string, patch: Partial<RiderAssignment>) {
        setRiderAssignments((current) => current.map((assignment) => (assignment.id === assignmentId ? { ...assignment, ...patch } : assignment)));
        runMutation({ resource: 'riderAssignments', action: 'update', id: assignmentId, payload: patch });
      },
      deleteRiderAssignment(assignmentId: string) {
        setRiderAssignments((current) => current.filter((assignment) => assignment.id !== assignmentId));
        runMutation({ resource: 'riderAssignments', action: 'delete', id: assignmentId });
      },
      sendToDispatch(orderId: string, assignedRider: string) {
        const now = new Date().toISOString();
        const order = orders.find((item) => item.id === orderId);
        if (!order) {
          return;
        }

        const dispatchId = order.dispatchId || `DSP-${Date.now()}`;
        const dispatchStatus: DispatchStatus = assignedRider.trim() ? 'Assigned' : 'Unassigned';

        const dispatchRecord: DispatchRecord = {
          id: dispatchId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          estate: order.estate,
          status: dispatchStatus,
          assignedRider,
          createdAt: now,
          updatedAt: now
        };

        setDispatches((current) => {
          const exists = current.some((item) => item.id === dispatchRecord.id);
          if (exists) {
            return current.map((item) => (item.id === dispatchRecord.id ? dispatchRecord : item));
          }
          return [dispatchRecord, ...current];
        });

        const assignment: RiderAssignment = {
          id: `RA-${dispatchId}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          phone: order.phone,
          address: order.address,
          estate: order.estate,
          status: dispatchStatus,
          assignedRider,
          notes: order.notes ?? '',
          updatedAt: now
        };

        setRiderAssignments((current) => {
          const exists = current.some((item) => item.orderId === order.id);
          if (exists) {
            return current.map((item) => (item.orderId === order.id ? { ...item, ...assignment } : item));
          }
          return [assignment, ...current];
        });

        setOrders((current) => {
          const nextOrders = current.map((item) => item.id === order.id
            ? {
              ...item,
              status: 'Awaiting Rider' as OrderRecord['status'],
              dispatchId,
              assignedRider,
              updatedAt: now
            }
            : item);
          setEstates((prev) => updateEstateSnapshot(nextOrders, prev));
          return nextOrders;
        });

        const notification: NotificationRecord = {
          id: `N-${Date.now()}`,
          type: 'Rider Assignment',
          title: 'Order sent to dispatch',
          message: `${order.orderNumber} moved to dispatch queue${assignedRider ? ` and assigned to ${assignedRider}` : ''}.`,
          orderId: order.id,
          read: false,
          createdAt: now
        };
        setNotifications((current) => [notification, ...current]);

        runMutation({ resource: 'dispatches', action: 'create', payload: dispatchRecord });
        runMutation({ resource: 'riderAssignments', action: 'create', payload: assignment });
        runMutation({ resource: 'orders', action: 'update', id: order.id, payload: { status: 'Awaiting Rider', dispatchId, assignedRider, updatedAt: now } });
        runMutation({ resource: 'notifications', action: 'create', payload: notification });
      },
      updateDispatchStatus(dispatchId: string, nextStatus: DispatchStatus, patch?: Partial<DispatchRecord>) {
        const now = new Date().toISOString();
        const dispatchRecord = dispatches.find((item) => item.id === dispatchId);
        if (!dispatchRecord) {
          return;
        }

        const mergedDispatch = {
          ...dispatchRecord,
          ...patch,
          status: nextStatus,
          updatedAt: now
        };

        setDispatches((current) => current.map((item) => (item.id === dispatchId ? mergedDispatch : item)));
        setRiderAssignments((current) => current.map((assignment) => {
          if (assignment.orderId !== dispatchRecord.orderId) {
            return assignment;
          }

          return {
            ...assignment,
            status: nextStatus,
            assignedRider: mergedDispatch.assignedRider,
            updatedAt: now,
            acceptedAt: nextStatus === 'Assigned' ? now : assignment.acceptedAt,
            pickedUpAt: nextStatus === 'Picked Up' ? now : assignment.pickedUpAt,
            inTransitAt: nextStatus === 'In Transit' ? now : assignment.inTransitAt,
            deliveredAt: nextStatus === 'Delivered' ? now : assignment.deliveredAt,
            completedAt: nextStatus === 'Completed' ? now : assignment.completedAt
          };
        }));

        setOrders((current) => {
          const nextOrders = current.map((order) => {
            if (order.id !== dispatchRecord.orderId) {
              return order;
            }
            return {
              ...order,
              status: applyOrderStatusFromDispatch(nextStatus),
              assignedRider: mergedDispatch.assignedRider,
              updatedAt: now,
              deliveryTimeMinutes: nextStatus === 'Completed' && order.createdAt
                ? Math.max(1, Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000))
                : order.deliveryTimeMinutes
            };
          });
          setEstates((prev) => updateEstateSnapshot(nextOrders, prev));
          return nextOrders;
        });

        const eventType: NotificationType =
          nextStatus === 'In Transit'
            ? 'Delivery Started'
            : nextStatus === 'Delivered' || nextStatus === 'Completed'
              ? 'Delivered'
              : nextStatus === 'Failed'
                ? 'Failed Delivery'
                : 'Rider Assignment';

        const notification: NotificationRecord = {
          id: `N-${Date.now()}`,
          type: eventType,
          title: `Dispatch status: ${nextStatus}`,
          message: `${dispatchRecord.orderNumber} is now ${nextStatus}.`,
          orderId: dispatchRecord.orderId,
          read: false,
          createdAt: now
        };
        setNotifications((current) => [notification, ...current]);

        runMutation({ resource: 'dispatches', action: 'update', id: dispatchId, payload: mergedDispatch });
        runMutation({ resource: 'orders', action: 'update', id: dispatchRecord.orderId, payload: { status: applyOrderStatusFromDispatch(nextStatus), assignedRider: mergedDispatch.assignedRider, updatedAt: now } });
        runMutation({ resource: 'riderAssignments', action: 'updateByOrderId', id: dispatchRecord.orderId, payload: { status: nextStatus, assignedRider: mergedDispatch.assignedRider, updatedAt: now } });
        runMutation({ resource: 'notifications', action: 'create', payload: notification });
      },
      createNotification(type: NotificationType, title: string, message: string, refs?: { orderId?: string; batchId?: string }) {
        const notification: NotificationRecord = {
          id: `N-${Date.now()}`,
          type,
          title,
          message,
          orderId: refs?.orderId,
          batchId: refs?.batchId,
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications((current) => [notification, ...current]);
        runMutation({ resource: 'notifications', action: 'create', payload: notification });
      },
      markNotificationRead(notificationId: string) {
        setNotifications((current) => current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)));
        runMutation({ resource: 'notifications', action: 'update', id: notificationId, payload: { read: true } });
      },
      refreshSnapshot
    }),
    [
      orders,
      customers,
      estateBatches,
      runnerTasks,
      riderAssignments,
      dispatches,
      estates,
      notifications,
      isConnected,
      runMutation,
      refreshSnapshot
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useOMSStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useOMSStore must be used within StoreProvider');
  }
  return context;
}
