export type SupportedLocale = 'es' | 'en';

export interface NotificationSettingsLike {
  frequency: 'daily' | 'weekly';
  weeklyDay: number;
  notifyHour: number;
  daysAhead: number;
  timeZone: string;
  lastTriggeredAt?: string;
}

const LOCALE_MAP: Record<SupportedLocale, string> = {
  es: 'es-ES',
  en: 'en-US',
};

export function calculateNextServiceDate(lastServiceDateStr: string, frequencyMonths: number | null): Date | null {
  if (!frequencyMonths || Number.isNaN(frequencyMonths) || frequencyMonths === 0) {
    return null;
  }

  const lastServiceDate = new Date(lastServiceDateStr);
  if (Number.isNaN(lastServiceDate.getTime())) {
    return null;
  }

  const nextServiceDate = new Date(lastServiceDate);
  nextServiceDate.setUTCMonth(nextServiceDate.getUTCMonth() + frequencyMonths);
  return nextServiceDate;
}

export function calculateReminderDate(nextServiceDate: Date | null, daysBefore = 7): Date | null {
  if (!nextServiceDate) return null;
  const reminderDate = new Date(nextServiceDate);
  reminderDate.setUTCDate(reminderDate.getUTCDate() - daysBefore);
  reminderDate.setUTCHours(0, 0, 0, 0);
  return reminderDate;
}

export function shouldNotify(reminderDate: Date | null, today: Date = new Date()): boolean {
  if (!reminderDate) return false;
  const checkDate = new Date(today);
  checkDate.setUTCHours(0, 0, 0, 0);
  return checkDate.getTime() >= reminderDate.getTime();
}

function getFormatter(locale: SupportedLocale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE_MAP[locale], {
    timeZone: 'UTC',
    ...(options ?? {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  });
}

export function formatDisplayDate(value: string | Date | null | undefined, locale: SupportedLocale = 'es'): string {
  if (!value) return locale === 'en' ? 'Unscheduled' : 'Sin fecha';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return locale === 'en' ? 'Unscheduled' : 'Sin fecha';
  }

  return getFormatter(locale).format(date);
}

export function formatLongDisplayDate(value: string | Date | null | undefined, locale: SupportedLocale = 'es'): string {
  if (!value) return locale === 'en' ? 'Unscheduled' : 'Sin fecha';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return locale === 'en' ? 'Unscheduled' : 'Sin fecha';
  }

  return getFormatter(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  const weekday = get('weekday');
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  };

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: weekdayMap[weekday] ?? date.getUTCDay(),
  };
}

export function getDateKeyForTimeZone(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

export function getDaysUntilDate(target: string | Date, now: Date, timeZone: string): number | null {
  const targetDate = target instanceof Date ? target : new Date(target);
  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  const targetKey = getDateKeyForTimeZone(targetDate, timeZone);
  const nowKey = getDateKeyForTimeZone(now, timeZone);

  const targetUtc = new Date(`${targetKey}T00:00:00Z`);
  const nowUtc = new Date(`${nowKey}T00:00:00Z`);
  const diff = targetUtc.getTime() - nowUtc.getTime();
  return Math.round(diff / 86400000);
}

export function shouldRunNotificationWindow(settings: NotificationSettingsLike, now: Date = new Date()): boolean {
  const parts = getZonedParts(now, settings.timeZone);

  if (parts.hour !== settings.notifyHour) {
    return false;
  }

  if (settings.frequency === 'weekly' && parts.weekday !== settings.weeklyDay) {
    return false;
  }

  if (!settings.lastTriggeredAt) {
    return true;
  }

  const lastTriggeredAt = new Date(settings.lastTriggeredAt);
  if (Number.isNaN(lastTriggeredAt.getTime())) {
    return true;
  }

  return getDateKeyForTimeZone(lastTriggeredAt, settings.timeZone) !== getDateKeyForTimeZone(now, settings.timeZone);
}
