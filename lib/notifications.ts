import { Telegraf } from 'telegraf';
import nodemailer from 'nodemailer';

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

export async function sendEmailNotification(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  try {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.warn('Gmail credentials not configured');
      return false;
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

    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

export async function sendMaintenanceReminder(
  clientName: string,
  task: string,
  nextDate: string,
  phone?: string
) {
  const message = `🔔 <b>Maintenance Reminder</b>\n\n` +
    `<b>Client:</b> ${clientName}\n` +
    `<b>Task:</b> ${task}\n` +
    `<b>Due Date:</b> ${nextDate}\n` +
    (phone ? `<b>Phone:</b> ${phone}\n` : '');

  const telegramSent = await sendTelegramNotification(message);

  let emailSent = false;
  if (process.env.ADMIN_EMAIL) {
    const emailText = `Maintenance Reminder\n\n` +
      `Client: ${clientName}\n` +
      `Task: ${task}\n` +
      `Due Date: ${nextDate}\n` +
      (phone ? `Phone: ${phone}\n` : '');

    const emailHtml = `
      <h2>🔔 Maintenance Reminder</h2>
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Task:</strong> ${task}</p>
      <p><strong>Due Date:</strong> ${nextDate}</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
    `;

    emailSent = await sendEmailNotification(
      process.env.ADMIN_EMAIL,
      `Maintenance Due: ${clientName}`,
      emailText,
      emailHtml
    );
  }

  return { telegramSent, emailSent };
}
