import "server-only";
import { toInternationalPhone } from "@/lib/whatsapp";

export interface CloudApiSendResult {
  ok: boolean;
  error?: string;
}

function isCloudApiConfigured() {
  return Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID);
}

export async function sendCloudApiTextMessage(phone: string, message: string): Promise<CloudApiSendResult> {
  if (!isCloudApiConfigured()) {
    return { ok: false, error: "WhatsApp Cloud API غير مُهيّأ (المفاتيح مفقودة)." };
  }

  const phoneNumberId = process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const to = toInternationalPhone(phone);

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { ok: false, error: errBody?.error?.message ?? `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "خطأ في الاتصال" };
  }
}
