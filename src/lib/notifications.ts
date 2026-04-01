import { Telegraf } from 'telegraf';
import nodemailer from 'nodemailer';
import type { ClientRecord, NotificationSettings } from './googleSheets';
import { formatDisplayDate, getDaysUntilDate, type SupportedLocale } from './dates';
import { sendWhatsAppClientReminderTemplate, WhatsAppSendError } from './whatsapp';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || process.env.notification_EMAIL || '';
}

export async function sendTelegramNotification(message: string) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn('Telegram credentials not configured');
      return false;
    }

    const bot = new Telegraf(botToken);
    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML',
    });

    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

export async function sendEmailNotificationResult(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      const error = 'Gmail credentials not configured. Check GMAIL_USER and GMAIL_APP_PASSWORD.';
      console.warn(error);
      return { ok: false, error };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: user,
      to,
      subject,
      text,
      html: html || text,
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to send email notification:', error);
    return { ok: false, error: message };
  }
}

export async function sendEmailNotification(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const result = await sendEmailNotificationResult(to, subject, text, html);
  return result.ok;
}

export async function sendMaintenanceReminder(
  clientName: string,
  task: string,
  nextDate: string,
  phone?: string,
  confirmationUrl?: string
) {
  const safeClientName = escapeHtml(clientName);
  const safeTask = escapeHtml(task);
  const safeNextDate = escapeHtml(nextDate);
  const safePhone = phone ? escapeHtml(phone) : '';
  const safeConfirmationUrl = confirmationUrl ? escapeHtml(confirmationUrl) : '';

  const message = `<b>Maintenance Reminder</b>\n\n` +
    `<b>Client:</b> ${safeClientName}\n` +
    `<b>Task:</b> ${safeTask}\n` +
    `<b>Due Date:</b> ${safeNextDate}\n` +
    (safePhone ? `<b>Phone:</b> ${safePhone}\n` : '') +
    (safeConfirmationUrl ? `\n<a href="${safeConfirmationUrl}">Mark client as notified</a>` : '');

  const telegramSent = await sendTelegramNotification(message);

  let emailSent = false;
  const adminEmail = getAdminEmail();
  if (adminEmail) {
    const emailText = `Maintenance Reminder\n\n` +
      `Client: ${clientName}\n` +
      `Task: ${task}\n` +
      `Due Date: ${nextDate}\n` +
      (phone ? `Phone: ${phone}\n` : '') +
      (confirmationUrl ? `\nConfirm client: ${confirmationUrl}\n` : '');

    const emailHtml = `
      <h2>Maintenance Reminder</h2>
      <p><strong>Client:</strong> ${safeClientName}</p>
      <p><strong>Task:</strong> ${safeTask}</p>
      <p><strong>Due Date:</strong> ${safeNextDate}</p>
      ${safePhone ? `<p><strong>Phone:</strong> ${safePhone}</p>` : ''}
      ${safeConfirmationUrl ? `<p><a href="${safeConfirmationUrl}">Mark client as notified</a></p>` : ''}
    `;

    emailSent = await sendEmailNotification(
      adminEmail,
      `Maintenance Due: ${clientName}`,
      emailText,
      emailHtml
    );
  }

  return { telegramSent, emailSent };
}

function buildUpcomingClientsText(
  clients: Array<ClientRecord & { daysUntil: number }>,
  locale: SupportedLocale
) {
  return clients.map((client, index) => {
    const dateLabel = formatDisplayDate(client.nextDate, locale);
    const dayLabel = locale === 'en'
      ? `${client.daysUntil} day(s)`
      : `${client.daysUntil} dia(s)`;
    const task = client.task ? ` | ${client.task}` : '';
    return `${index + 1}. ${client.clientName || '-'} - ${dateLabel} (${dayLabel})${task}`;
  });
}

function buildUpcomingClientsHtml(
  clients: Array<ClientRecord & { daysUntil: number }>,
  locale: SupportedLocale
) {
  return clients.map((client) => {
    const dateLabel = escapeHtml(formatDisplayDate(client.nextDate, locale));
    const dayLabel = locale === 'en'
      ? `${client.daysUntil} day(s)`
      : `${client.daysUntil} dia(s)`;
    const task = client.task ? ` | ${escapeHtml(client.task)}` : '';
    return `<li><strong>${escapeHtml(client.clientName || '-')}</strong> - ${dateLabel} (${escapeHtml(dayLabel)})${task}</li>`;
  });
}

export function getUpcomingClients(
  clients: ClientRecord[],
  daysAhead: number,
  now: Date,
  timeZone: string
) {
  return clients
    .map((client) => {
      const daysUntil = getDaysUntilDate(client.nextDate || '', now, timeZone);
      return { client, daysUntil };
    })
    .filter((entry): entry is { client: ClientRecord; daysUntil: number } => (
      entry.daysUntil !== null && entry.daysUntil >= 0 && entry.daysUntil <= daysAhead
    ))
    .sort((a, b) => a.daysUntil - b.daysUntil || a.client.clientName.localeCompare(b.client.clientName))
    .map(({ client, daysUntil }) => ({ ...client, daysUntil }));
}

export async function sendUpcomingClientsDigest(
  clients: Array<ClientRecord & { daysUntil: number }>,
  settings: NotificationSettings,
  locale: SupportedLocale = 'es'
) {
  const title = locale === 'en'
    ? `Upcoming reviews in the next ${settings.daysAhead} day(s)`
    : `Revisiones en los proximos ${settings.daysAhead} dia(s)`;
  const emptyMessage = locale === 'en'
    ? 'No clients are due in the configured time window.'
    : 'No hay clientes con revision en el rango configurado.';

  const telegramMessage = clients.length > 0
    ? `<b>${escapeHtml(title)}</b>\n\n${buildUpcomingClientsText(clients, locale)
        .map((line) => escapeHtml(line))
        .join('\n')}`
    : `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(emptyMessage)}`;

  const textBody = clients.length > 0
    ? `${title}\n\n${buildUpcomingClientsText(clients, locale).join('\n')}`
    : `${title}\n\n${emptyMessage}`;

  const htmlBody = clients.length > 0
    ? `<h2>${escapeHtml(title)}</h2><ol>${buildUpcomingClientsHtml(clients, locale).join('')}</ol>`
    : `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(emptyMessage)}</p>`;
  let telegramSent = false;
  let emailSent = false;
  let whatsappSent = false;

  if (settings.sendTelegram) {
    telegramSent = await sendTelegramNotification(telegramMessage);
  }

  if (settings.sendEmail) {
    const adminEmail = getAdminEmail();
    if (adminEmail) {
      emailSent = await sendEmailNotification(adminEmail, title, textBody, htmlBody);
    }
  }

  if (settings.sendWhatsApp) {
    try {
      await sendWhatsAppClientReminderTemplate(clients);
      whatsappSent = true;
    } catch (error) {
      if (error instanceof WhatsAppSendError) {
        console.error('Failed to send WhatsApp digest:', error.details || error.message);
      } else {
        console.error('Failed to send WhatsApp digest:', error);
      }
    }
  }

  return {
    telegramSent,
    emailSent,
    whatsappSent,
    attemptedTelegram: settings.sendTelegram,
    attemptedEmail: settings.sendEmail,
    attemptedWhatsApp: settings.sendWhatsApp,
  };
}
