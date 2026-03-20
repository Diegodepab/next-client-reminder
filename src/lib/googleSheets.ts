import { calculateNextServiceDate } from './dates';
import { CLIENT_STATUS } from './clientStatus';

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

async function appsScriptFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('Accept', 'application/json');

  const response = await fetch(url, {
    ...options,
    redirect: 'follow',
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Apps Script request failed (${response.status}): ${response.statusText}`
    );
  }

  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  try {
    return JSON.parse(text) as T;
  } catch {
    const trimmed = text.trim();
    const looksLikeHtml =
      trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html');
    const isValidationMessage =
      trimmed.includes('El script de validacion esta funcionando') ||
      trimmed.includes('script de validacion esta funcionando');

    if (looksLikeHtml) {
      throw new Error(
        'Apps Script returned HTML instead of JSON. ' +
          'This usually means the Web App is not deployed with access set to "Anyone" (or you are hitting the wrong URL). ' +
          `Content-Type: ${contentType || 'unknown'}. ` +
          `Raw response: ${trimmed.slice(0, 200)}`
      );
    }

    if (isValidationMessage) {
      throw new Error(
        'Apps Script returned a plain-text validation message instead of JSON. ' +
          'Your current Web App deployment likely does not include the expected doGet() implementation. ' +
          'Replace the Apps Script code with docs/googleDataSheet/script.js, then deploy a new Web app ' +
          '(Execute as: Me, Who has access: Anyone) and update GOOGLE_PRIVATE_URL with the new /exec URL. ' +
          `Raw response: ${trimmed.slice(0, 200)}`
      );
    }

    throw new Error(
      `Apps Script returned invalid JSON. Content-Type: ${contentType || 'unknown'}. Raw response: ${trimmed.slice(0, 200)}`
    );
  }
}

export async function addClient(client: ClientRecord): Promise<AppsScriptResponse> {
  const url = getAppsScriptUrl();

  const providedNextDate = (client.nextDate || '').trim();
  const nextServiceDate = providedNextDate
    ? null
    : calculateNextServiceDate(client.lastServiceDate, client.frequency);

  const payload = {
    clientName: client.clientName,
    lastServiceDate: client.lastServiceDate,
    frequency: client.frequency,
    taskDescription: client.task,
    phoneNumber: client.phone,
    nextDate: providedNextDate
      ? providedNextDate
      : nextServiceDate
        ? nextServiceDate.toISOString().split('T')[0]
        : '',
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
    phone: String(c.phoneNumber ?? ''),
    nextDate: String(c.nextDate),
    status: c.status || CLIENT_STATUS.pending,
    notifiedAt: c.notifiedAt || '',
  }));
}

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

export async function updateClient(
  client: ClientRecord & { rowIndex: number }
): Promise<AppsScriptResponse> {
  const url = getAppsScriptUrl();

  const providedNextDate = (client.nextDate || '').trim();
  const nextServiceDate = providedNextDate
    ? null
    : calculateNextServiceDate(client.lastServiceDate, client.frequency);

  const payload = {
    _action: 'updateClient',
    rowIndex: client.rowIndex,
    clientName: client.clientName,
    lastServiceDate: client.lastServiceDate,
    frequency: client.frequency,
    taskDescription: client.task,
    phoneNumber: client.phone,
    nextDate: providedNextDate
      ? providedNextDate
      : nextServiceDate
        ? nextServiceDate.toISOString().split('T')[0]
        : '',
  };

  const result = await appsScriptFetch<AppsScriptResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (result.estado !== 'success') {
    throw new Error(result.mensaje || 'Apps Script returned an error on updateClient');
  }

  return result;
}

export async function deleteClient(rowIndex: number): Promise<void> {
  const url = getAppsScriptUrl();

  const payload = {
    _action: 'deleteClient',
    rowIndex,
  };

  const result = await appsScriptFetch<AppsScriptResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (result.estado !== 'success') {
    throw new Error(
      result.mensaje || `Apps Script returned an error deleting row ${rowIndex}`
    );
  }
}
