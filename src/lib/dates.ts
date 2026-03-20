export function calculateNextServiceDate(lastServiceDateStr: string, frequencyMonths: number | null): Date | null {
  if (!frequencyMonths || isNaN(frequencyMonths) || frequencyMonths === 0) {
    return null;
  }

  const lastServiceDate = new Date(lastServiceDateStr);
  const nextServiceDate = new Date(lastServiceDate);
  nextServiceDate.setUTCMonth(nextServiceDate.getUTCMonth() + frequencyMonths);
  return nextServiceDate;
}

export function calculateReminderDate(nextServiceDate: Date | null): Date | null {
  if (!nextServiceDate) return null;
  const reminderDate = new Date(nextServiceDate);
  reminderDate.setUTCDate(reminderDate.getUTCDate() - 7);
  reminderDate.setUTCHours(0, 0, 0, 0);
  return reminderDate;
}

export function shouldNotify(reminderDate: Date | null, today: Date = new Date()): boolean {
  if (!reminderDate) return false;
  const checkDate = new Date(today);
  checkDate.setUTCHours(0, 0, 0, 0);
  return checkDate.getTime() >= reminderDate.getTime();
}
