import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAllClients } from '@/lib/googleSheets';
import { type SupportedLocale } from '@/lib/dates';
import { sendWhatsAppClientReminderTemplate, WhatsAppSendError } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('auth_token')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const locale: SupportedLocale = body && body.locale === 'en' ? 'en' : 'es';

    const clients = await getAllClients();
    const sortedClients = [...clients].sort((a, b) => a.clientName.localeCompare(b.clientName));
    await sendWhatsAppClientReminderTemplate(sortedClients);
    return NextResponse.json({ success: true, count: sortedClients.length, locale }, { status: 200 });
  } catch (error) {
    const details = error instanceof WhatsAppSendError
      ? error.details || error.message
      : error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      { error: 'Failed to send WhatsApp summary', details },
      { status: 500 }
    );
  }
}
