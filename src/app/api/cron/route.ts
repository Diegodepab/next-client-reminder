import { NextResponse } from 'next/server';
import { getAllClients, updateClientStatus } from '@/lib/googleSheets';
import { sendMaintenanceReminder } from '@/lib/notifications';
import { calculateNextServiceDate, calculateReminderDate, shouldNotify } from '@/lib/dates';

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

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];

      if (client.status === 'Notified') {
        continue;
      }

      const nextServiceDate = calculateNextServiceDate(client.lastServiceDate, client.frequency);
      const reminderDate = calculateReminderDate(nextServiceDate);

      if (shouldNotify(reminderDate) && client.status !== 'Notified') {
        const result = await sendMaintenanceReminder(
          client.clientName,
          client.task,
          nextServiceDate.toLocaleDateString(),
          client.phone
        );

        if (result.telegramSent || result.emailSent) {
          await updateClientStatus(i, 'Notified');
          notifications.push({
            client: client.clientName,
            sent: true,
            telegram: result.telegramSent,
            email: result.emailSent,
          });
        } else {
          notifications.push({
            client: client.clientName,
            sent: false,
            error: 'No notification method configured',
          });
        }
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
