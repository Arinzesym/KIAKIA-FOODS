import type { CartItem } from '@/lib/types';
import { buildWhatsAppLink, generateWhatsAppMessage } from '@/lib/utils';
import type { BusinessSettings } from '@/lib/types';

type WhatsAppOrderPayload = {
  name: string;
  phone: string;
  estate: string;
  address: string;
  items: CartItem[];
  serviceFee: number;
  deliveryFee: number;
  additionalCharges: number;
  orderId?: string;
};

export function buildOrderWhatsAppMessage(payload: WhatsAppOrderPayload, settings: BusinessSettings) {
  return generateWhatsAppMessage({
    ...payload,
    businessName: settings.businessName,
    businessAccountNumber: settings.businessAccountNumber
  });
}

export function createOrderWhatsAppLink(payload: WhatsAppOrderPayload, settings: BusinessSettings) {
  const message = buildOrderWhatsAppMessage(payload, settings);
  const targetPhone = payload.phone || settings.whatsappNumber;
  return buildWhatsAppLink(targetPhone, message);
}
