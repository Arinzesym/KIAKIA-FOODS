import type { ProductCatalogEntry } from '@/lib/types';

export type CatalogMutationInput = {
  name: string;
  line: 'Weekly Groceries' | 'Specialty Items';
  unitPrice: number;
  active?: boolean;
  specialty?: {
    category: string;
    description: string;
    photo?: string;
    availability: 'In Stock' | 'Low Stock' | 'Out of Stock';
    leadTimeDays: number;
    minimumQuantity: number;
  };
};

export async function fetchCatalogEntries() {
  const response = await fetch('/api/admin/catalog', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load product catalog');
  }

  const payload = await response.json() as { entries: ProductCatalogEntry[] };
  return payload.entries;
}

export async function createCatalogEntry(input: CatalogMutationInput) {
  const response = await fetch('/api/admin/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Failed to create catalog entry' }));
    throw new Error(String(data.error ?? 'Failed to create catalog entry'));
  }

  const payload = await response.json() as { entry: ProductCatalogEntry };
  return payload.entry;
}

export async function updateCatalogEntry(id: string, patch: Partial<CatalogMutationInput>) {
  const response = await fetch('/api/admin/catalog', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, patch })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Failed to update catalog entry' }));
    throw new Error(String(data.error ?? 'Failed to update catalog entry'));
  }

  const payload = await response.json() as { entry: ProductCatalogEntry };
  return payload.entry;
}

export async function deleteCatalogEntry(id: string) {
  const response = await fetch('/api/admin/catalog', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Failed to delete catalog entry' }));
    throw new Error(String(data.error ?? 'Failed to delete catalog entry'));
  }
}
