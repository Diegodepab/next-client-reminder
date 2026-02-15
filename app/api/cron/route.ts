import { NextResponse } from 'next/server';
import { getAllClients, updateClientStatus } from '@/lib/googleSheets';
import { sendMaintenanceReminder } from '@/lib/notifications';

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = [];

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];

      if (client.status === 'Notified') {
        continue;
      }

      const lastServiceDate = new Date(client.lastServiceDate);
      const frequencyMs = client.frequency * 30 * 24 * 60 * 60 * 1000;
      const nextServiceDate = new Date(lastServiceDate.getTime() + frequencyMs);
      
      const reminderDate = new Date(nextServiceDate);
      reminderDate.setDate(reminderDate.getDate() - 7);
      reminderDate.setHours(0, 0, 0, 0);

      if (today.getTime() === reminderDate.getTime()) {
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
