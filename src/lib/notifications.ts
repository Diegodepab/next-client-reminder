import { Telegraf } from 'telegraf';
import nodemailer from 'nodemailer';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
  const adminEmail = process.env.ADMIN_EMAIL;
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
