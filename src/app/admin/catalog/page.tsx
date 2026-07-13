'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProductCatalogEntry } from '@/lib/types';
import { mockProductCatalog } from '@/lib/mockData';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import {
  createCatalogEntry,
  deleteCatalogEntry,
  fetchCatalogEntries,
  updateCatalogEntry
} from '@/lib/catalogApi';

function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;
}

export default function AdminCatalogPage() {
  const [entries, setEntries] = useState<ProductCatalogEntry[]>(mockProductCatalog);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [lineFilter, setLineFilter] = useState<'All' | 'Weekly Groceries' | 'Specialty Items'>('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    line: 'Weekly Groceries' as 'Weekly Groceries' | 'Specialty Items',
    unitPrice: 0,
    category: '',
    description: '',
    photo: '',
    availability: 'In Stock' as 'In Stock' | 'Low Stock' | 'Out of Stock',
    leadTimeDays: 1,
    minimumQuantity: 1
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesLine = lineFilter === 'All' || entry.line === lineFilter;
      const haystack = `${entry.name} ${entry.specialty?.category ?? ''} ${entry.specialty?.description ?? ''}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesLine && matchesSearch;
    });
  }, [entries, lineFilter, search]);

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      try {
        const data = await fetchCatalogEntries();
        if (active) {
          setEntries(data.length > 0 ? data : mockProductCatalog);
        }
      } catch {
        if (active) {
          setEntries(mockProductCatalog);
          setNotice('Showing local fallback catalog.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  const addEntry = async () => {
    if (!form.name.trim()) {
      return;
    }

    const nextEntry: ProductCatalogEntry = {
      id: generateId(form.line === 'Specialty Items' ? 'CAT-SP' : 'CAT-WG'),
      name: form.name.trim(),
      line: form.line,
      unitPrice: Number(form.unitPrice),
      active: true,
      specialty: form.line === 'Specialty Items'
        ? {
          id: generateId('SP'),
          name: form.name.trim(),
          category: form.category,
          description: form.description,
          photo: form.photo,
          availability: form.availability,
          leadTimeDays: Number(form.leadTimeDays),
          minimumQuantity: Number(form.minimumQuantity),
          unitPrice: Number(form.unitPrice),
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        : undefined
    };

    try {
      const created = await createCatalogEntry({
        name: form.name.trim(),
        line: form.line,
        unitPrice: Number(form.unitPrice),
        active: true,
        specialty: form.line === 'Specialty Items'
          ? {
            category: form.category,
            description: form.description,
            photo: form.photo,
            availability: form.availability,
            leadTimeDays: Number(form.leadTimeDays),
            minimumQuantity: Number(form.minimumQuantity)
          }
          : undefined
      });
      setEntries((current) => [created, ...current]);
      setNotice('Catalog item saved to database.');
    } catch {
      setEntries((current) => [nextEntry, ...current]);
      setNotice('Saved locally. Database sync failed.');
    }

    setForm({
      name: '',
      line: 'Weekly Groceries',
      unitPrice: 0,
      category: '',
      description: '',
      photo: '',
      availability: 'In Stock',
      leadTimeDays: 1,
      minimumQuantity: 1
    });
  };

  const toggleActive = async (id: string) => {
    const target = entries.find((entry) => entry.id === id);
    if (!target) {
      return;
    }

    const nextActive = !target.active;
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, active: nextActive } : entry));
    try {
      await updateCatalogEntry(id, { active: nextActive });
    } catch {
      setNotice('Status changed locally only. Database sync failed.');
    }
  };

  const deleteEntry = async (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    try {
      await deleteCatalogEntry(id);
    } catch {
      setNotice('Delete applied locally only. Database sync failed.');
    }
  };

  return (
    <div className="space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Product catalog</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Weekly Groceries and Specialty Items</h1>
        <p className="mt-2 text-slate-600">Manage item availability, lead times, and minimum quantities for runner sourcing.</p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-semibold text-slate-950">Add Product</h2>
        {notice ? <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">{notice}</p> : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <label className="block text-sm font-medium text-slate-700">
            Product line
            <select
              value={form.line}
              onChange={(event) => setForm((current) => ({ ...current, line: event.target.value as 'Weekly Groceries' | 'Specialty Items' }))}
              className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2"
            >
              <option value="Weekly Groceries">Weekly Groceries</option>
              <option value="Specialty Items">Specialty Items</option>
            </select>
          </label>
          <Input label="Unit price (NGN)" type="number" value={String(form.unitPrice)} onChange={(event) => setForm((current) => ({ ...current, unitPrice: Number(event.target.value) }))} />
          <div className="self-end">
            <Button type="button" className="w-full" onClick={addEntry}>Add Product</Button>
          </div>
        </div>

        {form.line === 'Specialty Items' ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Input label="Category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
            <Input label="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            <Input label="Photo URL" value={form.photo} onChange={(event) => setForm((current) => ({ ...current, photo: event.target.value }))} />
            <label className="block text-sm font-medium text-slate-700">
              Availability
              <select
                value={form.availability}
                onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value as 'In Stock' | 'Low Stock' | 'Out of Stock' }))}
                className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2"
              >
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </label>
            <Input label="Lead time (days)" type="number" value={String(form.leadTimeDays)} onChange={(event) => setForm((current) => ({ ...current, leadTimeDays: Number(event.target.value) }))} />
            <Input label="Minimum quantity" type="number" value={String(form.minimumQuantity)} onChange={(event) => setForm((current) => ({ ...current, minimumQuantity: Number(event.target.value) }))} />
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Catalog List</h2>
            <p className="text-sm text-slate-600">Responsive table on desktop and cards on mobile.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product" />
            <label className="block text-sm font-medium text-slate-700">
              Filter line
              <select
                value={lineFilter}
                onChange={(event) => setLineFilter(event.target.value as 'All' | 'Weekly Groceries' | 'Specialty Items')}
                className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2"
              >
                <option value="All">All</option>
                <option value="Weekly Groceries">Weekly Groceries</option>
                <option value="Specialty Items">Specialty Items</option>
              </select>
            </label>
          </div>
        </div>

        {loading ? <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Loading catalog...</div> : null}

        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Line</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Lead Time</th>
                <th className="px-4 py-3">Min Qty</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{entry.name}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.line}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.specialty?.category ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.specialty?.availability ?? 'In Stock'}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.specialty?.leadTimeDays ?? 0} day(s)</td>
                  <td className="px-4 py-3 text-slate-600">{entry.specialty?.minimumQuantity ?? 1}</td>
                  <td className="px-4 py-3 text-slate-900">{formatCurrency(entry.unitPrice)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => toggleActive(entry.id)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                        {entry.active ? 'Disable' : 'Enable'}
                      </button>
                      <button type="button" onClick={() => deleteEntry(entry.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-3 lg:hidden">
          {filtered.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{entry.name}</p>
                  <p className="text-xs text-slate-500">{entry.line}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(entry.unitPrice)}</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">{entry.specialty?.description ?? 'Weekly catalog item'}</p>
              <p className="mt-1 text-xs text-slate-500">{entry.specialty?.availability ?? 'In Stock'} • Lead {entry.specialty?.leadTimeDays ?? 0} day(s)</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => toggleActive(entry.id)} className="min-h-11 rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-700">
                  {entry.active ? 'Disable' : 'Enable'}
                </button>
                <button type="button" onClick={() => deleteEntry(entry.id)} className="min-h-11 rounded-xl bg-rose-50 px-3 text-xs font-semibold text-rose-700">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
