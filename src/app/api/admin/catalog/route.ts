import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import type { ProductCatalogEntry } from '@/lib/types';
import { isAdminRole, normalizeRole } from '@/lib/access';

type CatalogInput = {
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

function isAdminRequest() {
  return isAdminRole(normalizeRole(cookies().get('auth-role')?.value));
}

function mapCatalogRows(products: Record<string, unknown>[], specialtyRows: Record<string, unknown>[]) {
  const specialtyByProductId = new Map<string, Record<string, unknown>>();
  specialtyRows.forEach((row) => {
    specialtyByProductId.set(String(row.product_id ?? ''), row);
  });

  const entries: ProductCatalogEntry[] = products.map((row) => {
    const productId = String(row.id ?? '');
    const specialty = specialtyByProductId.get(productId);

    return {
      id: productId,
      name: String(row.name ?? ''),
      line: String(row.line ?? 'Weekly Groceries') as ProductCatalogEntry['line'],
      unitPrice: Number(row.unit_price ?? 0),
      active: Boolean(row.active ?? true),
      specialty: specialty
        ? {
          id: String(specialty.id ?? ''),
          name: String(row.name ?? ''),
          category: String(specialty.category ?? ''),
          description: String(specialty.description ?? ''),
          photo: String(specialty.photo ?? ''),
          availability: String(specialty.availability ?? 'In Stock') as NonNullable<ProductCatalogEntry['specialty']>['availability'],
          leadTimeDays: Number(specialty.lead_time_days ?? 1),
          minimumQuantity: Number(specialty.minimum_quantity ?? 1),
          unitPrice: Number(row.unit_price ?? 0),
          active: Boolean(row.active ?? true),
          createdAt: String(specialty.created_at ?? ''),
          updatedAt: String(specialty.updated_at ?? '')
        }
        : undefined
    };
  });

  return entries;
}

export async function GET() {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ entries: [] });
  }

  const productsResult = await supabase
    .from('products')
    .select('id, name, line, unit_price, active')
    .order('created_at', { ascending: false });

  if (productsResult.error) {
    return NextResponse.json({ entries: [], warning: productsResult.error.message });
  }

  const productIds = (productsResult.data ?? []).map((row) => String(row.id ?? '')).filter(Boolean);

  let specialtyRows: Record<string, unknown>[] = [];
  if (productIds.length > 0) {
    const specialtyResult = await supabase
      .from('specialty_products')
      .select('id, product_id, category, description, photo, availability, lead_time_days, minimum_quantity, created_at, updated_at')
      .in('product_id', productIds);

    specialtyRows = (specialtyResult.data ?? []) as Record<string, unknown>[];
  }

  const entries = mapCatalogRows((productsResult.data ?? []) as Record<string, unknown>[], specialtyRows);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json() as CatalogInput;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured. Add Supabase env vars first.' }, { status: 503 });
  }

  const productId = randomUUID();
  const specialtyId = randomUUID();
  const now = new Date().toISOString();

  const { error: productError } = await supabase.from('products').insert({
    id: productId,
    name: body.name.trim(),
    line: body.line,
    unit_price: Number(body.unitPrice ?? 0),
    active: body.active ?? true,
    created_at: now,
    updated_at: now
  });

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (body.line === 'Specialty Items' && body.specialty) {
    const { error: specialtyError } = await supabase.from('specialty_products').insert({
      id: specialtyId,
      product_id: productId,
      category: body.specialty.category,
      description: body.specialty.description,
      photo: body.specialty.photo,
      availability: body.specialty.availability,
      lead_time_days: body.specialty.leadTimeDays,
      minimum_quantity: body.specialty.minimumQuantity,
      created_at: now,
      updated_at: now
    });

    if (specialtyError) {
      return NextResponse.json({ error: specialtyError.message }, { status: 500 });
    }
  }

  const entry: ProductCatalogEntry = {
    id: productId,
    name: body.name.trim(),
    line: body.line,
    unitPrice: Number(body.unitPrice ?? 0),
    active: body.active ?? true,
    specialty: body.line === 'Specialty Items' && body.specialty
      ? {
        id: specialtyId,
        name: body.name.trim(),
        category: body.specialty.category,
        description: body.specialty.description,
        photo: body.specialty.photo,
        availability: body.specialty.availability,
        leadTimeDays: body.specialty.leadTimeDays,
        minimumQuantity: body.specialty.minimumQuantity,
        unitPrice: Number(body.unitPrice ?? 0),
        active: body.active ?? true,
        createdAt: now,
        updatedAt: now
      }
      : undefined
  };

  return NextResponse.json({ entry }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json() as { id?: string; patch?: Partial<CatalogInput> };
  const id = String(body.id ?? '').trim();
  if (!id) {
    return NextResponse.json({ error: 'Catalog id is required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured. Add Supabase env vars first.' }, { status: 503 });
  }

  const patch = body.patch ?? {};
  const now = new Date().toISOString();
  const productPatch: Record<string, unknown> = { updated_at: now };

  if (typeof patch.name === 'string') productPatch.name = patch.name.trim();
  if (typeof patch.line === 'string') productPatch.line = patch.line;
  if (typeof patch.unitPrice === 'number') productPatch.unit_price = patch.unitPrice;
  if (typeof patch.active === 'boolean') productPatch.active = patch.active;

  const { error: productError } = await supabase.from('products').update(productPatch).eq('id', id);
  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (patch.specialty) {
    const specialtyPatch: Record<string, unknown> = {
      category: patch.specialty.category,
      description: patch.specialty.description,
      photo: patch.specialty.photo,
      availability: patch.specialty.availability,
      lead_time_days: patch.specialty.leadTimeDays,
      minimum_quantity: patch.specialty.minimumQuantity,
      updated_at: now
    };

    const { data: existingSpecialty } = await supabase
      .from('specialty_products')
      .select('id')
      .eq('product_id', id)
      .maybeSingle();

    if (existingSpecialty?.id) {
      const { error } = await supabase.from('specialty_products').update(specialtyPatch).eq('id', String(existingSpecialty.id));
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from('specialty_products').insert({
        id: randomUUID(),
        product_id: id,
        ...specialtyPatch,
        created_at: now
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  const productsResult = await supabase
    .from('products')
    .select('id, name, line, unit_price, active')
    .eq('id', id)
    .limit(1);

  if (productsResult.error || !productsResult.data || productsResult.data.length === 0) {
    return NextResponse.json({ error: productsResult.error?.message ?? 'Unable to read updated product.' }, { status: 500 });
  }

  const specialtyResult = await supabase
    .from('specialty_products')
    .select('id, product_id, category, description, photo, availability, lead_time_days, minimum_quantity, created_at, updated_at')
    .eq('product_id', id);

  const entries = mapCatalogRows(
    productsResult.data as Record<string, unknown>[],
    (specialtyResult.data ?? []) as Record<string, unknown>[]
  );

  return NextResponse.json({ entry: entries[0] });
}

export async function DELETE(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json() as { id?: string };
  const id = String(body.id ?? '').trim();
  if (!id) {
    return NextResponse.json({ error: 'Catalog id is required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured. Add Supabase env vars first.' }, { status: 503 });
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
