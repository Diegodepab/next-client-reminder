import { formatDisplayDate } from './dates';
import type { ClientRecord } from './googleSheets';

/**
 * Required environment variables:
 * - WHATSAPP_TOKEN
 * - WHATSAPP_PHONE_ID
 * - WHATSAPP_TO_NUMBER
 */

const WHATSAPP_API_VERSION = 'v22.0';
const WHATSAPP_TEMPLATE_NAME = 'client_reminder';
const WHATSAPP_TEMPLATE_LANGUAGE = 'es';
const WHATSAPP_FALLBACK_TEMPLATE_NAME = 'hello_world';
const WHATSAPP_FALLBACK_TEMPLATE_LANGUAGE = 'en_US';

type WhatsAppTextMessagePayload = {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: {
    preview_url: false;
    body: string;
  };
};

type WhatsAppTemplateMessagePayload = {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: 'client_reminder' | 'hello_world';
    language: {
      code: 'es' | 'en_US';
    };
    components: Array<{
      type: 'body';
      parameters: Array<{
        type: 'text';
        text: string;
      }>;
    }>;
  };
};

type WhatsAppTemplateFallbackPayload = {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: 'hello_world';
    language: {
      code: 'en_US';
    };
  };
};

type WhatsAppErrorResponse = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

export class WhatsAppSendError extends Error {
  readonly status?: number;
  readonly details?: string;

  constructor(message: string, options?: { status?: number; details?: string }) {
    super(message);
    this.name = 'WhatsAppSendError';
    this.status = options?.status;
    this.details = options?.details;
  }
}

function getWhatsAppConfig() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const toNumber = process.env.WHATSAPP_TO_NUMBER;

  if (!token || !phoneId || !toNumber) {
    const missing = [
      !token ? 'WHATSAPP_TOKEN' : null,
      !phoneId ? 'WHATSAPP_PHONE_ID' : null,
      !toNumber ? 'WHATSAPP_TO_NUMBER' : null,
    ].filter(Boolean);

    throw new WhatsAppSendError(
      `WhatsApp configuration is incomplete. Missing: ${missing.join(', ')}`
    );
  }

  return { token, phoneId, toNumber };
}

async function postWhatsAppPayload(
  payload: WhatsAppTextMessagePayload | WhatsAppTemplateMessagePayload | WhatsAppTemplateFallbackPayload
): Promise<void> {
  const { token, phoneId } = getWhatsAppConfig();
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const rawBody = await response.text();
      let details = rawBody;

      try {
        const parsed = JSON.parse(rawBody) as WhatsAppErrorResponse;
        if (parsed.error) {
          details = [
            parsed.error.message,
            parsed.error.type,
            typeof parsed.error.code === 'number' ? `code=${parsed.error.code}` : '',
            typeof parsed.error.error_subcode === 'number' ? `subcode=${parsed.error.error_subcode}` : '',
            parsed.error.fbtrace_id ? `trace=${parsed.error.fbtrace_id}` : '',
          ]
            .filter(Boolean)
            .join(' | ');
        }
      } catch {
        // Keep raw body when Meta does not return valid JSON.
      }

      console.error('WhatsApp Cloud API request failed:', {
        status: response.status,
        statusText: response.statusText,
        details,
      });

      throw new WhatsAppSendError('Failed to send WhatsApp message.', {
        status: response.status,
        details,
      });
    }
  } catch (error) {
    if (error instanceof WhatsAppSendError) {
      throw error;
    }

    console.error('Unexpected WhatsApp send error:', error);

    throw new WhatsAppSendError(
      error instanceof Error ? error.message : 'Unknown WhatsApp send error.'
    );
  }
}

export async function sendWhatsAppMessage(text: string): Promise<void> {
  if (!text.trim()) {
    throw new WhatsAppSendError('WhatsApp message text cannot be empty.');
  }

  const { toNumber } = getWhatsAppConfig();

  const payload: WhatsAppTextMessagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toNumber,
    type: 'text',
    text: {
      preview_url: false,
      body: text,
    },
  };

  await postWhatsAppPayload(payload);
}

export function buildWhatsAppReminderStrings(clients: ClientRecord[]) {
  const totalClientesString = String(clients.length);
  const listaClientesString = clients
    .map((client, index) => {
      const dateLabel = formatDisplayDate(client.nextDate || null, 'es');
      const notaAdicional = (client.task || 'Sin nota').trim();
      return `${index + 1}. ${client.clientName || '-'} - ${dateLabel} | ${notaAdicional}`;
    })
    .join('\n');

  return { totalClientesString, listaClientesString };
}

export async function sendWhatsAppClientReminderTemplate(clients: ClientRecord[]): Promise<void> {
  const { toNumber } = getWhatsAppConfig();
  const { totalClientesString, listaClientesString } = buildWhatsAppReminderStrings(clients);

  const primaryPayload: WhatsAppTemplateMessagePayload = {
    messaging_product: 'whatsapp',
    to: toNumber,
    type: 'template',
    template: {
      name: WHATSAPP_TEMPLATE_NAME,
      language: {
        code: WHATSAPP_TEMPLATE_LANGUAGE,
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: totalClientesString,
            },
            {
              type: 'text',
              text: listaClientesString,
            },
          ],
        },
      ],
    },
  };

  const fallbackPayload: WhatsAppTemplateFallbackPayload = {
    messaging_product: 'whatsapp',
    to: toNumber,
    type: 'template',
    template: {
      name: WHATSAPP_FALLBACK_TEMPLATE_NAME,
      language: {
        code: WHATSAPP_FALLBACK_TEMPLATE_LANGUAGE,
      },
    },
  };

  try {
    await postWhatsAppPayload(primaryPayload);
  } catch (error) {
    const details = error instanceof WhatsAppSendError
      ? error.details || error.message
      : error instanceof Error
        ? error.message
        : String(error);

    console.warn('WhatsApp primary template failed. Falling back to hello_world.', {
      template: WHATSAPP_TEMPLATE_NAME,
      details,
    });

    await postWhatsAppPayload(fallbackPayload);
  }
}

/**
 * Example usage from any API route or cron:
 *
 * import { getUpcomingClients } from '@/lib/notifications';
 * import { getAllClients, getNotificationSettings } from '@/lib/googleSheets';
 * import { sendWhatsAppClientReminderTemplate } from '@/lib/whatsapp';
 *
 * const settings = await getNotificationSettings();
 * const clients = await getAllClients();
 * const upcomingClients = getUpcomingClients(clients, settings.daysAhead, new Date(), settings.timeZone);
 *
 * try {
 *   await sendWhatsAppClientReminderTemplate(upcomingClients);
 * } catch (error) {
 *   console.error('WhatsApp template reminder failed:', error);
 * }
 */
