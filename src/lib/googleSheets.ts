import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export interface ClientRecord {
  clientName: string;
  lastServiceDate: string;
  frequency: number;
  task: string;
  phone: string;
  status?: string;
  notifiedAt?: string;
}

export async function getSpreadsheet() {

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID as string,
    serviceAccountAuth
  );

  await doc.loadInfo();
  
  return doc;
}

export async function getOrCreateSheet() {
  const doc = await getSpreadsheet();
  
  let sheet = doc.sheetsByIndex[0];
  
  if (!sheet) {
    sheet = await doc.addSheet({ headerValues: [
      'Client Name',
      'Last Service Date',
      'Frequency (months)',
      'Task',
      'Phone',
      'Status',
      'Notified At'
    ]});
  } else {
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    
    if (!headers.includes('Client Name')) {
      await sheet.setHeaderRow([
        'Client Name',
        'Last Service Date',
        'Frequency (months)',
        'Task',
        'Phone',
        'Status',
        'Notified At'
      ]);
    }
  }
  
  return sheet;
}

export async function addClient(client: ClientRecord) {
  const sheet = await getOrCreateSheet();
  
  const row = await sheet.addRow({
    'Client Name': client.clientName,
    'Last Service Date': client.lastServiceDate,
    'Frequency (months)': client.frequency,
    'Task': client.task,
    'Phone': client.phone,
    'Status': 'Pending',
    'Notified At': ''
  });
  
  return row;
}

export async function getAllClients(): Promise<ClientRecord[]> {
  const sheet = await getOrCreateSheet();
  const rows = await sheet.getRows();
  
  return rows.map(row => ({
    clientName: row.get('Client Name') || '',
    lastServiceDate: row.get('Last Service Date') || '',
    frequency: parseInt(row.get('Frequency (months)') || '0', 10),
    task: row.get('Task') || '',
    phone: row.get('Phone') || '',
    status: row.get('Status') || 'Pending',
    notifiedAt: row.get('Notified At') || '',
  }));
}

export async function updateClientStatus(rowIndex: number, status: string) {
  const sheet = await getOrCreateSheet();
  const rows = await sheet.getRows();
  
  if (rowIndex < rows.length) {
    const row = rows[rowIndex];
    row.set('Status', status);
    row.set('Notified At', new Date().toISOString());
    await row.save();
  }
}
