import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAllClients } from '@/lib/googleSheets';
import { sendEmailNotificationResult } from '@/lib/notifications';
import { formatDisplayDate, type SupportedLocale } from '@/lib/dates';

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

    const adminEmail = process.env.notification_EMAIL || process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json({ error: 'Missing notification_EMAIL or ADMIN_EMAIL in environment variables' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const locale: SupportedLocale = body && body.locale === 'en' ? 'en' : 'es';

    const clients = await getAllClients();
    const sortedClients = [...clients].sort((a, b) => {
      const dateA = parseDate(a.nextDate);
      const dateB = parseDate(b.nextDate);
      if (!dateA && !dateB) return a.clientName.localeCompare(b.clientName);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });

    const sheetUrl = process.env.SHEET_NORMAL_URL || process.env.sheet_normal_url || '';
    const title = locale === 'en' ? 'Clients ordered by next review' : 'Clientes ordenados por proxima revision';
    const emptyMessage = locale === 'en' ? 'No clients available.' : 'No hay clientes registrados.';

    const textLines = sortedClients.map((client, index) => {
      const nextDate = parseDate(client.nextDate);
      const nextDateLabel = nextDate ? formatDisplayDate(nextDate, locale) : (locale === 'en' ? 'Unscheduled' : 'Sin fecha');
      const phone = client.phone ? ` | Tel: ${client.phone.startsWith("'") ? client.phone.slice(1) : client.phone}` : '';
      const task = client.task ? ` | ${client.task}` : '';
      return `${index + 1}. ${client.clientName || '-'} - ${nextDateLabel}${phone}${task}`;
    });

    const htmlLines = sortedClients.map((client) => {
      const nextDate = parseDate(client.nextDate);
      const nextDateLabel = nextDate ? formatDisplayDate(nextDate, locale) : (locale === 'en' ? 'Unscheduled' : 'Sin fecha');
      const phone = client.phone ? ` | Tel: ${escapeHtml(client.phone.startsWith("'") ? client.phone.slice(1) : client.phone)}` : '';
      const task = client.task ? ` | ${escapeHtml(client.task)}` : '';
      return `<li><strong>${escapeHtml(client.clientName || '-')}</strong> - ${escapeHtml(nextDateLabel)}${phone}${task}</li>`;
    });

    const text = sortedClients.length > 0
      ? `${title}\n\n${textLines.join('\n')}${sheetUrl ? `\n\nSheet: ${sheetUrl}` : ''}`
      : `${title}\n\n${emptyMessage}${sheetUrl ? `\n\nSheet: ${sheetUrl}` : ''}`;

    const html = sortedClients.length > 0
      ? `
        <h2>${escapeHtml(title)}</h2>
        <ol>${htmlLines.join('')}</ol>
        ${sheetUrl ? `<p><a href="${escapeHtml(sheetUrl)}">Abrir Sheet</a></p>` : ''}
      `
      : `
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(emptyMessage)}</p>
        ${sheetUrl ? `<p><a href="${escapeHtml(sheetUrl)}">Abrir Sheet</a></p>` : ''}
      `;

    const emailResult = await sendEmailNotificationResult(
      adminEmail,
      locale === 'en' ? 'Client summary by next review' : 'Resumen de clientes por proxima revision',
      text,
      html
    );

    if (!emailResult.ok) {
      return NextResponse.json({ error: 'Gmail send failed', details: emailResult.error || 'Unknown Gmail error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: sortedClients.length }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send Gmail summary', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
