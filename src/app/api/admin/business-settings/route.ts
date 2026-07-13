import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { defaultBusinessSettings } from '@/lib/businessSettings';
import type { BusinessSettings } from '@/lib/types';
import { isAdminRole, normalizeRole } from '@/lib/access';

function isAdminRequest() {
  return isAdminRole(normalizeRole(cookies().get('auth-role')?.value));
}

function mergeSettings(
  businessSettingsRow: Record<string, unknown> | null,
  adminSettingsRow: Record<string, unknown> | null
) {
  return {
    businessName: String(adminSettingsRow?.business_name ?? defaultBusinessSettings.businessName),
    whatsappNumber: String(adminSettingsRow?.whatsapp_number ?? defaultBusinessSettings.whatsappNumber),
    businessAccountNumber: String(adminSettingsRow?.business_account_number ?? defaultBusinessSettings.businessAccountNumber),
    serviceFee: Number(businessSettingsRow?.service_fee ?? adminSettingsRow?.service_fee ?? defaultBusinessSettings.serviceFee),
    defaultDeliveryFee: Number(businessSettingsRow?.default_delivery_fee ?? adminSettingsRow?.delivery_fee ?? defaultBusinessSettings.defaultDeliveryFee),
    customDeliveryFee: Number(businessSettingsRow?.custom_delivery_fee ?? defaultBusinessSettings.customDeliveryFee),
    runnerBonusPercentage: Number(businessSettingsRow?.runner_bonus_percentage ?? defaultBusinessSettings.runnerBonusPercentage),
    marketDays: Array.isArray(businessSettingsRow?.market_days) && (businessSettingsRow?.market_days as unknown[]).length > 0
      ? (businessSettingsRow?.market_days as BusinessSettings['marketDays'])
      : defaultBusinessSettings.marketDays,
    deliveryWindows: Array.isArray(businessSettingsRow?.delivery_windows) && (businessSettingsRow?.delivery_windows as unknown[]).length > 0
      ? (businessSettingsRow?.delivery_windows as string[])
      : defaultBusinessSettings.deliveryWindows,
    currency: String(businessSettingsRow?.currency ?? defaultBusinessSettings.currency)
  } satisfies BusinessSettings;
}

export async function GET() {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ settings: defaultBusinessSettings, source: 'local-fallback' });
  }

  const { data: businessSettingsData, error } = await supabase
    .from('business_settings')
    .select('id, service_fee, default_delivery_fee, custom_delivery_fee, runner_bonus_percentage, market_days, delivery_windows, currency')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: adminSettingsData } = await supabase
    .from('admin_settings')
    .select('id, business_name, whatsapp_number, business_account_number, service_fee, delivery_fee')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ settings: defaultBusinessSettings, source: 'local-fallback', warning: error.message });
  }

  if (!businessSettingsData && !adminSettingsData) {
    return NextResponse.json({ settings: defaultBusinessSettings, source: 'default' });
  }

  return NextResponse.json({
    settings: mergeSettings(
      (businessSettingsData ?? null) as Record<string, unknown> | null,
      (adminSettingsData ?? null) as Record<string, unknown> | null
    ),
    source: 'database'
  });
}

export async function PUT(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json() as { settings?: BusinessSettings };
  const settings = body.settings;

  if (!settings) {
    return NextResponse.json({ error: 'Settings payload is required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured. Add Supabase env vars first.' }, { status: 503 });
  }

  const { data: existingRow } = await supabase
    .from('business_settings')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    id: String(existingRow?.id ?? randomUUID()),
    service_fee: settings.serviceFee,
    default_delivery_fee: settings.defaultDeliveryFee,
    custom_delivery_fee: settings.customDeliveryFee,
    runner_bonus_percentage: settings.runnerBonusPercentage,
    market_days: settings.marketDays,
    delivery_windows: settings.deliveryWindows,
    currency: settings.currency.toUpperCase(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('business_settings').upsert(payload, { onConflict: 'id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: existingAdminSettings } = await supabase
    .from('admin_settings')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const adminPayload = {
    id: String(existingAdminSettings?.id ?? randomUUID()),
    business_name: settings.businessName,
    whatsapp_number: settings.whatsappNumber,
    business_account_number: settings.businessAccountNumber,
    service_fee: settings.serviceFee,
    delivery_fee: settings.defaultDeliveryFee,
    updated_at: new Date().toISOString()
  };

  const { error: adminSettingsError } = await supabase.from('admin_settings').upsert(adminPayload, { onConflict: 'id' });
  if (adminSettingsError) {
    return NextResponse.json({ error: adminSettingsError.message }, { status: 500 });
  }

  return NextResponse.json({ settings, source: 'database' });
}
