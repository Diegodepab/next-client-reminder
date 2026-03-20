export const CLIENT_STATUS = {
  notified: 'Notified',
  pending: 'Pending',
} as const;

export type ClientStatus = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];

export function normalizeClientStatus(status?: string | null): ClientStatus {
  const value = String(status || '').trim().toLowerCase();
  return value === 'notified' ? CLIENT_STATUS.notified : CLIENT_STATUS.pending;
}

export function isClientNotified(status?: string | null): boolean {
  return normalizeClientStatus(status) === CLIENT_STATUS.notified;
}
