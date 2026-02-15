export function calculateNextServiceDate(lastServiceDateStr: string, frequencyMonths: number): Date {
  const lastServiceDate = new Date(lastServiceDateStr);
  const nextServiceDate = new Date(lastServiceDate);
  nextServiceDate.setUTCMonth(nextServiceDate.getUTCMonth() + frequencyMonths);
  return nextServiceDate;
}

export function calculateReminderDate(nextServiceDate: Date): Date {
  const reminderDate = new Date(nextServiceDate);
  reminderDate.setUTCDate(reminderDate.getUTCDate() - 7);
  reminderDate.setUTCHours(0, 0, 0, 0);
  return reminderDate;
}

export function shouldNotify(reminderDate: Date, today: Date = new Date()): boolean {
  const checkDate = new Date(today);
  checkDate.setUTCHours(0, 0, 0, 0);
  return checkDate.getTime() >= reminderDate.getTime();
}
