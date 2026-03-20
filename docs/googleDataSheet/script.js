/**
 * Google Apps Script - Bridge between Next.js and Google Sheets.
 *
 * Expected columns (Row 1 = header):
 *   A: Timestamp
 *   B: Client Name
 *   C: Last Service Date
 *   D: Frequency (in months)
 *   E: Task description
 *   F: Phone number
 *   G: Next Date
 *   H: Status
 *   I: Notified At
 */

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return _jsonResponse({ estado: 'success', clientes: [] });
  }

  var clientes = [];

  // values[0] is the header row. values[1] corresponds to sheet row 2.
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var sheetRowIndex = i + 1;

    clientes.push({
      rowIndex: sheetRowIndex,
      timestamp: row[0] || '',
      clientName: row[1] || '',
      lastServiceDate: row[2] || '',
      frequency: row[3] || '',
      taskDescription: row[4] || '',
      phoneNumber: row[5] || '',
      nextDate: row[6] || '',
      status: row[7] || 'Pending',
      notifiedAt: row[8] || '',
    });
  }

  return _jsonResponse({ estado: 'success', clientes: clientes });
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    return _jsonResponse({ estado: 'error', mensaje: 'JSON no valido.' });
  }

  var action = data._action || 'addClient';

  if (action === 'updateStatus') {
    return _handleUpdateStatus(sheet, data);
  }

  if (action === 'deleteClient') {
    return _handleDeleteClient(sheet, data);
  }

  if (action === 'updateClient') {
    return _handleUpdateClient(sheet, data);
  }

  return _handleAddClient(sheet, data);
}

function _handleAddClient(sheet, data) {
  var row = [
    new Date(),
    data.clientName || '',
    data.lastServiceDate || '',
    data.frequency || '',
    data.taskDescription || '',
    data.phoneNumber || '',
    data.nextDate || '',
    'Pending',
    '',
  ];

  sheet.appendRow(row);

  return _jsonResponse({
    estado: 'success',
    mensaje: 'Cliente registrado en la fila ' + sheet.getLastRow(),
  });
}

/**
 * Expected: { _action: 'updateStatus', rowIndex: <int>, status: <string>, notifiedAt: <string> }
 */
function _handleUpdateStatus(sheet, data) {
  var rowIndex = parseInt(data.rowIndex, 10);

  if (!rowIndex || rowIndex < 2) {
    return _jsonResponse({ estado: 'error', mensaje: 'rowIndex invalido.' });
  }

  var lastRow = sheet.getLastRow();
  if (rowIndex > lastRow) {
    return _jsonResponse({ estado: 'error', mensaje: 'La fila ' + rowIndex + ' no existe.' });
  }

  // Column H = 8, Column I = 9
  sheet.getRange(rowIndex, 8).setValue(data.status || 'Notified');
  sheet.getRange(rowIndex, 9).setValue(data.notifiedAt || new Date().toISOString());

  return _jsonResponse({
    estado: 'success',
    mensaje: 'Fila ' + rowIndex + ' actualizada a "' + (data.status || 'Notified') + '".',
  });
}

/**
 * Expected: { _action: 'deleteClient', rowIndex: <int> }
 */
function _handleDeleteClient(sheet, data) {
  var rowIndex = parseInt(data.rowIndex, 10);

  if (!rowIndex || rowIndex < 2) {
    return _jsonResponse({ estado: 'error', mensaje: 'rowIndex invalido.' });
  }

  var lastRow = sheet.getLastRow();
  if (rowIndex > lastRow) {
    return _jsonResponse({ estado: 'error', mensaje: 'La fila ' + rowIndex + ' no existe.' });
  }

  sheet.deleteRow(rowIndex);

  return _jsonResponse({
    estado: 'success',
    mensaje: 'Fila ' + rowIndex + ' eliminada correctamente.',
  });
}

/**
 * Expected:
 *   {
 *     _action: 'updateClient',
 *     rowIndex: <int>,
 *     clientName: <string>,
 *     lastServiceDate: <string>,
 *     frequency: <string|number>,
 *     taskDescription: <string>,
 *     phoneNumber: <string>,
 *     nextDate: <string>
 *   }
 */
function _handleUpdateClient(sheet, data) {
  var rowIndex = parseInt(data.rowIndex, 10);

  if (!rowIndex || rowIndex < 2) {
    return _jsonResponse({ estado: 'error', mensaje: 'rowIndex invalido.' });
  }

  var lastRow = sheet.getLastRow();
  if (rowIndex > lastRow) {
    return _jsonResponse({ estado: 'error', mensaje: 'La fila ' + rowIndex + ' no existe.' });
  }

  var range = sheet.getRange(rowIndex, 1, 1, 9);
  var current = range.getValues()[0];

  // Keep Timestamp (A), Status (H) and Notified At (I)
  current[1] = (typeof data.clientName === 'undefined') ? current[1] : (data.clientName || '');
  current[2] = (typeof data.lastServiceDate === 'undefined') ? current[2] : (data.lastServiceDate || '');
  current[3] = (typeof data.frequency === 'undefined') ? current[3] : (data.frequency || '');
  current[4] = (typeof data.taskDescription === 'undefined') ? current[4] : (data.taskDescription || '');
  current[5] = (typeof data.phoneNumber === 'undefined') ? current[5] : (data.phoneNumber || '');
  current[6] = (typeof data.nextDate === 'undefined') ? current[6] : (data.nextDate || '');

  range.setValues([current]);

  return _jsonResponse({
    estado: 'success',
    mensaje: 'Fila ' + rowIndex + ' actualizada correctamente.',
  });
}

function _jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}