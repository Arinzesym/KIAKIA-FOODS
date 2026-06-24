'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { mockCustomers, mockEstateBatches, mockOrders, mockRiderAssignments, mockRunnerTasks } from './mockData';
import type { CustomerProfile, EstateBatch, OrderRecord, RiderAssignment, RunnerTask } from './types';

interface OMSStore {
  orders: OrderRecord[];
  customers: CustomerProfile[];
  estateBatches: EstateBatch[];
  runnerTasks: RunnerTask[];
  riderAssignments: RiderAssignment[];
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
}

const StoreContext = createContext<OMSStore | undefined>(undefined);
const STORAGE_KEY = 'kiakia-oms-store-v2';

function loadInitialState() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return {
      orders: parsed.orders ?? mockOrders,
      customers: parsed.customers ?? mockCustomers,
      estateBatches: parsed.estateBatches ?? mockEstateBatches,
      runnerTasks: parsed.runnerTasks ?? mockRunnerTasks,
      riderAssignments: parsed.riderAssignments ?? mockRiderAssignments
    };
  } catch {
    return null;
  }
}

async function fetchOmsSnapshot() {
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
    riderAssignments: (result.riderAssignments ?? []) as RiderAssignment[]
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderRecord[]>(mockOrders);
  const [customers, setCustomers] = useState<CustomerProfile[]>(mockCustomers);
  const [estateBatches, setEstateBatches] = useState<EstateBatch[]>(mockEstateBatches);
  const [runnerTasks, setRunnerTasks] = useState<RunnerTask[]>(mockRunnerTasks);
  const [riderAssignments, setRiderAssignments] = useState<RiderAssignment[]>(mockRiderAssignments);
  const [usingFallback, setUsingFallback] = useState(false);

  const runMutation = (payload: Record<string, unknown>) => {
    if (usingFallback) {
      return;
    }

    void postOmsMutation(payload).catch(() => {
      setUsingFallback(true);
    });
  };

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const snapshot = await fetchOmsSnapshot();
        if (!active) return;

        setOrders(snapshot.orders);
        setCustomers(snapshot.customers);
        setEstateBatches(snapshot.estateBatches);
        setRunnerTasks(snapshot.runnerTasks);
        setRiderAssignments(snapshot.riderAssignments);
        setUsingFallback(false);
      } catch {
        if (!active) return;

        const initialState = loadInitialState();
        if (initialState) {
          setOrders(initialState.orders);
          setCustomers(initialState.customers);
          setEstateBatches(initialState.estateBatches);
          setRunnerTasks(initialState.runnerTasks);
          setRiderAssignments(initialState.riderAssignments);
        }
        setUsingFallback(true);
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const snapshot = {
      orders,
      customers,
      estateBatches,
      runnerTasks,
      riderAssignments
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [orders, customers, estateBatches, runnerTasks, riderAssignments]);

  const value = useMemo(
    () => ({
      orders,
      customers,
      estateBatches,
      runnerTasks,
      riderAssignments,
      addOrder(order: OrderRecord) {
        setOrders((current) => [order, ...current]);
        runMutation({ resource: 'orders', action: 'create', payload: order });
      },
      updateOrder(orderId: string, patch: Partial<OrderRecord>) {
        setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, ...patch } : order)));
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
      }
    }),
    [orders, customers, estateBatches, runnerTasks, riderAssignments, usingFallback]
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
