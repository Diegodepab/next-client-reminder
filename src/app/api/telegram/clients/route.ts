import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAllClients } from '@/lib/googleSheets';
import { sendTelegramNotification } from '@/lib/notifications';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('auth_token')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const locale = body && typeof body.locale === 'string' ? body.locale : 'es';

    const clients = await getAllClients();
    const sortedClients = [...clients].sort((a, b) => {
      const dateA = parseDate(a.nextDate);
      const dateB = parseDate(b.nextDate);
      if (!dateA && !dateB) return a.clientName.localeCompare(b.clientName);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });

    const lines = sortedClients.map((client, index) => {
      const nextDate = parseDate(client.nextDate);
      const nextDateLabel = nextDate
        ? nextDate.toLocaleDateString(locale)
        : (locale === 'en' ? 'Unscheduled' : 'Sin fecha');
      const phone = client.phone ? ` | Tel: ${escapeHtml(client.phone.startsWith("'") ? client.phone.slice(1) : client.phone)}` : '';
      const task = client.task ? ` | ${escapeHtml(client.task)}` : '';
      return `${index + 1}. <b>${escapeHtml(client.clientName || '-')}</b> - ${escapeHtml(nextDateLabel)}${phone}${task}`;
    });

    const title = locale === 'en' ? 'Clients ordered by next review' : 'Clientes ordenados por proxima revision';
    const emptyMessage = locale === 'en' ? 'No clients available.' : 'No hay clientes registrados.';
    const message = sortedClients.length > 0
      ? `<b>${title}</b>\n\n${lines.join('\n')}`
      : `<b>${title}</b>\n\n${emptyMessage}`;

    const telegramSent = await sendTelegramNotification(message);
    if (!telegramSent) {
      return NextResponse.json({ error: 'Telegram send failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: sortedClients.length }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send Telegram summary', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
