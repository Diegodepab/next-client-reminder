import { NextResponse } from 'next/server';
import { getAllClients, getNotificationSettings, updateNotificationSettings } from '@/lib/googleSheets';
import { sendUpcomingClientsDigest, getUpcomingClients } from '@/lib/notifications';
import { shouldRunNotificationWindow } from '@/lib/dates';

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

    const settings = await getNotificationSettings();

    if (!settings.enabled) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Notifications are disabled',
      });
    }

    if (!settings.sendTelegram && !settings.sendEmail && !settings.sendWhatsApp) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'No notification channel enabled',
      });
    }

    if (!shouldRunNotificationWindow(settings)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Outside configured notification window',
        settings,
      });
    }

    const now = new Date();
    const clients = await getAllClients();
    const upcomingClients = getUpcomingClients(clients, settings.daysAhead, now, settings.timeZone);
    const sendResult = await sendUpcomingClientsDigest(upcomingClients, settings, 'es');

    if (upcomingClients.length > 0 && !sendResult.telegramSent && !sendResult.emailSent && !sendResult.whatsappSent) {
      return NextResponse.json(
        {
          error: 'No reminder channel could send the digest',
          upcoming: upcomingClients.length,
          attemptedTelegram: sendResult.attemptedTelegram,
          attemptedEmail: sendResult.attemptedEmail,
          attemptedWhatsApp: sendResult.attemptedWhatsApp,
        },
        { status: 500 }
      );
    }

    await updateNotificationSettings({
      ...settings,
      lastTriggeredAt: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      checked: clients.length,
      upcoming: upcomingClients.length,
      telegramSent: sendResult.telegramSent,
      emailSent: sendResult.emailSent,
      whatsappSent: sendResult.whatsappSent,
      attemptedTelegram: sendResult.attemptedTelegram,
      attemptedEmail: sendResult.attemptedEmail,
      attemptedWhatsApp: sendResult.attemptedWhatsApp,
      settings,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}
