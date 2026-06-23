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
  addCustomer: (customer: CustomerProfile) => void;
  addRunnerTask: (task: RunnerTask) => void;
  updateRunnerTask: (taskId: string, patch: Partial<RunnerTask>) => void;
  addEstateBatch: (batch: EstateBatch) => void;
  updateEstateBatch: (batchId: string, patch: Partial<EstateBatch>) => void;
  updateRiderAssignment: (assignmentId: string, patch: Partial<RiderAssignment>) => void;
}

const StoreContext = createContext<OMSStore | undefined>(undefined);
const STORAGE_KEY = 'kiakia-oms-store-v1';

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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderRecord[]>(mockOrders);
  const [customers, setCustomers] = useState<CustomerProfile[]>(mockCustomers);
  const [estateBatches, setEstateBatches] = useState<EstateBatch[]>(mockEstateBatches);
  const [runnerTasks, setRunnerTasks] = useState<RunnerTask[]>(mockRunnerTasks);
  const [riderAssignments, setRiderAssignments] = useState<RiderAssignment[]>(mockRiderAssignments);

  useEffect(() => {
    const initialState = loadInitialState();
    if (initialState) {
      setOrders(initialState.orders);
      setCustomers(initialState.customers);
      setEstateBatches(initialState.estateBatches);
      setRunnerTasks(initialState.runnerTasks);
      setRiderAssignments(initialState.riderAssignments);
    }
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
      },
      updateOrder(orderId: string, patch: Partial<OrderRecord>) {
        setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, ...patch } : order)));
      },
      addCustomer(customer: CustomerProfile) {
        setCustomers((current) => [customer, ...current]);
      },
      addRunnerTask(task: RunnerTask) {
        setRunnerTasks((current) => [task, ...current]);
      },
      updateRunnerTask(taskId: string, patch: Partial<RunnerTask>) {
        setRunnerTasks((current) => current.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
      },
      addEstateBatch(batch: EstateBatch) {
        setEstateBatches((current) => [batch, ...current]);
      },
      updateEstateBatch(batchId: string, patch: Partial<EstateBatch>) {
        setEstateBatches((current) => current.map((batch) => (batch.id === batchId ? { ...batch, ...patch } : batch)));
      },
      updateRiderAssignment(assignmentId: string, patch: Partial<RiderAssignment>) {
        setRiderAssignments((current) => current.map((assignment) => (assignment.id === assignmentId ? { ...assignment, ...patch } : assignment)));
      }
    }),
    [orders, customers, estateBatches, runnerTasks, riderAssignments]
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
