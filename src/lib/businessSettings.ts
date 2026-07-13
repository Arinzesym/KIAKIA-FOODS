import type { BusinessSettings, MarketDay } from '@/lib/types';

const SETTINGS_KEY = 'kiakia-oms-business-settings-v2';

export const defaultBusinessSettings: BusinessSettings = {
  businessName: 'KiaKia Foods',
  whatsappNumber: '+2348000000000',
  businessAccountNumber: '1234567890',
  serviceFee: 1200,
  defaultDeliveryFee: 1500,
  customDeliveryFee: 3500,
  runnerBonusPercentage: 5,
  marketDays: [
    { key: 'Weekday', label: 'Weekly Groceries', defaultSourcingDay: 'Tuesday' },
    { key: 'Weekend', label: 'Specialty Items', defaultSourcingDay: 'Saturday' }
  ],
  deliveryWindows: ['09:00 - 12:00', '12:00 - 15:00', '15:00 - 18:00'],
  currency: 'NGN'
};

export function loadBusinessSettings(): BusinessSettings {
  if (typeof window === 'undefined') {
    return defaultBusinessSettings;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return defaultBusinessSettings;
    }

    const parsed = JSON.parse(raw) as Partial<BusinessSettings>;
    return {
      ...defaultBusinessSettings,
      ...parsed,
      marketDays: Array.isArray(parsed.marketDays) && parsed.marketDays.length > 0
        ? parsed.marketDays
        : defaultBusinessSettings.marketDays,
      deliveryWindows: Array.isArray(parsed.deliveryWindows) && parsed.deliveryWindows.length > 0
        ? parsed.deliveryWindows
        : defaultBusinessSettings.deliveryWindows
    };
  } catch {
    return defaultBusinessSettings;
  }
}

export function saveBusinessSettings(settings: BusinessSettings) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function fetchBusinessSettingsFromServer() {
  if (typeof window === 'undefined') {
    return defaultBusinessSettings;
  }

  try {
    const response = await fetch('/api/admin/business-settings', { cache: 'no-store' });
    if (!response.ok) {
      return loadBusinessSettings();
    }

    const payload = await response.json() as { settings?: BusinessSettings };
    if (!payload.settings) {
      return loadBusinessSettings();
    }

    saveBusinessSettings(payload.settings);
    return payload.settings;
  } catch {
    return loadBusinessSettings();
  }
}

export async function saveBusinessSettingsToServer(settings: BusinessSettings) {
  saveBusinessSettings(settings);

  if (typeof window === 'undefined') {
    return { ok: true };
  }

  try {
    const response = await fetch('/api/admin/business-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Failed to persist settings to server.' }));
      return { ok: false, error: String(data.error ?? 'Failed to persist settings to server.') };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to persist settings to server.' };
  }
}

export function getMarketDayProductLine(marketDay: MarketDay) {
  return marketDay === 'Weekend' ? 'Specialty Items' : 'Weekly Groceries';
}
