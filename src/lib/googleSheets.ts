import { calculateNextServiceDate } from './dates';

// ─── Types ───────────────────────────────────────────────────
export interface ClientRecord {
  rowIndex?: number;
  clientName: string;
  lastServiceDate: string;
  frequency: number;
  task: string;
  phone: string;
  nextDate?: string;
  status?: string;
  notifiedAt?: string;
}

interface AppsScriptResponse {
  estado: string;
  mensaje?: string;
  clientes?: AppsScriptClient[];
}

interface AppsScriptClient {
  rowIndex: number;
  clientName: string;
  lastServiceDate: string;
  frequency: string | number;
  taskDescription: string;
  phoneNumber: string;
  nextDate: string;
  status: string;
  notifiedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function getAppsScriptUrl(): string {
  const url = process.env.GOOGLE_PRIVATE_URL;
  if (!url) {
    throw new Error(
      'Google Sheets not configured. Missing GOOGLE_PRIVATE_URL in your .env file. ' +
      'See docs/googleDataSheet/explicacion.md for setup instructions.'
    );
  }
  return url;
}

/**
 * Follows redirects manually because Google Apps Script returns a 302
 * redirect to the actual response URL, and the native `fetch` in
 * Next.js (undici) may strip the body on redirect depending on the
 * runtime. By setting `redirect: 'follow'` we let the runtime handle
 * it transparently in most cases.
 */
async function appsScriptFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(
      `Apps Script request failed (${response.status}): ${response.statusText}`
    );
  }

  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Apps Script returned invalid JSON. Raw response: ${text.slice(0, 200)}`
    );
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Registers a new client by sending data to the Google Apps Script.
 * Automatically calculates `nextDate` from `lastServiceDate` + `frequency`.
 */
export async function addClient(client: ClientRecord): Promise<AppsScriptResponse> {
  const url = getAppsScriptUrl();

  const nextServiceDate = calculateNextServiceDate(
    client.lastServiceDate,
    client.frequency
  );

  const payload = {
    clientName: client.clientName,
    lastServiceDate: client.lastServiceDate,
    frequency: client.frequency,
    taskDescription: client.task,
    phoneNumber: client.phone,
    nextDate: nextServiceDate ? nextServiceDate.toISOString().split('T')[0] : '', // Allow empty
  };

  const result = await appsScriptFetch<AppsScriptResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (result.estado !== 'success') {
    throw new Error(result.mensaje || 'Apps Script returned an error on addClient');
  }

  return result;
}

/**
 * Retrieves every client row from the Google Sheet via the Apps
 * Script `doGet` handler.
 */
export async function getAllClients(): Promise<ClientRecord[]> {
  const url = getAppsScriptUrl();

  const result = await appsScriptFetch<AppsScriptResponse>(url, {
    method: 'GET',
  });

  if (result.estado !== 'success') {
    throw new Error(result.mensaje || 'Apps Script returned an error on getAllClients');
  }

  if (!result.clientes) {
    return [];
  }

  return result.clientes.map((c) => ({
    rowIndex: c.rowIndex,
    clientName: c.clientName,
    lastServiceDate: String(c.lastServiceDate),
    frequency: typeof c.frequency === 'number' ? c.frequency : parseInt(String(c.frequency), 10) || 0,
    task: c.taskDescription,
    phone: c.phoneNumber,
    nextDate: String(c.nextDate),
    status: c.status || 'Pending',
    notifiedAt: c.notifiedAt || '',
  }));
}

/**
 * Updates the Status and Notified At columns of an existing row
 * via the Apps Script `doPost` handler with `_action: 'updateStatus'`.
 */
export async function updateClientStatus(
  rowIndex: number,
  status: string
): Promise<void> {
  const url = getAppsScriptUrl();

  const payload = {
    _action: 'updateStatus',
    rowIndex,
    status,
    notifiedAt: new Date().toISOString(),
  };

  const result = await appsScriptFetch<AppsScriptResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (result.estado !== 'success') {
    throw new Error(
      result.mensaje || `Apps Script returned an error updating row ${rowIndex}`
    );
  }
}
