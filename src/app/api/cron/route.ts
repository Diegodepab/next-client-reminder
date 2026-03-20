import { NextResponse } from 'next/server';
import { getAllClients } from '@/lib/googleSheets';
import { sendMaintenanceReminder } from '@/lib/notifications';
import { buildClientConfirmationUrl } from '@/lib/magicLinks';
import { calculateNextServiceDate, calculateReminderDate, shouldNotify } from '@/lib/dates';
import { isClientNotified } from '@/lib/clientStatus';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clients = await getAllClients();
    const notifications = [];

    for (const client of clients) {
      if (isClientNotified(client.status)) {
        continue;
      }

      const nextServiceDate = calculateNextServiceDate(client.lastServiceDate, client.frequency);
      const reminderDate = calculateReminderDate(nextServiceDate);

      if (!nextServiceDate || !reminderDate) {
        continue;
      }

      if (shouldNotify(reminderDate)) {
        const confirmationUrl = client.rowIndex
          ? buildClientConfirmationUrl(client.rowIndex, request)
          : undefined;

        const result = await sendMaintenanceReminder(
          client.clientName,
          client.task,
          nextServiceDate.toLocaleDateString(),
          client.phone,
          confirmationUrl
        );

        notifications.push({
          client: client.clientName,
          sent: result.telegramSent || result.emailSent,
          telegram: result.telegramSent,
          email: result.emailSent,
          confirmationUrl,
          error: result.telegramSent || result.emailSent ? undefined : 'No notification method configured',
        });
      }
    }

    return NextResponse.json({
      success: true,
      checked: clients.length,
      notifications: notifications.length,
      details: notifications,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}
