/**
 * Google Apps Script - Bridge between Next.js and Google Sheets.
 *
 * Sheets:
 *   - Clients: stores maintenance items
 *   - Settings: stores reminder configuration
 *
 * Clients columns (Row 1 = header):
 *   A: Timestamp
 *   B: Client Name
 *   C: Last Service Date
 *   D: Frequency (in months)
 *   E: Task description
 *   F: Phone number
 *   G: Next Date
 *   H: Status
 *   I: Notified At
 *
 * Settings columns (Row 1 = header, Row 2 = values):
 *   A: enabled
 *   B: sendTelegram
 *   C: sendEmail
 *   D: sendWhatsApp
 *   E: frequency
 *   F: weeklyDay
 *   G: notifyHour
 *   H: daysAhead
 *   I: timeZone
 *   J: lastTriggeredAt
 */

var CLIENTS_SHEET_NAME = 'Clients';
var SETTINGS_SHEET_NAME = 'Settings';

function doGet(e) {
  if (e && e.parameter && e.parameter.settings === '1') {
    return _jsonResponse({ estado: 'success', settings: _readSettings() });
  }

  var sheet = _getClientsSheet();
  var values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return _jsonResponse({ estado: 'success', clientes: [] });
  }

  var clientes = [];

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
  var sheet = _getClientsSheet();

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

  if (action === 'updateSettings') {
    return _handleUpdateSettings(data);
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

function _handleUpdateStatus(sheet, data) {
  var rowIndex = parseInt(data.rowIndex, 10);

  if (!rowIndex || rowIndex < 2) {
    return _jsonResponse({ estado: 'error', mensaje: 'rowIndex invalido.' });
  }

  var lastRow = sheet.getLastRow();
  if (rowIndex > lastRow) {
    return _jsonResponse({ estado: 'error', mensaje: 'La fila ' + rowIndex + ' no existe.' });
  }

  sheet.getRange(rowIndex, 8).setValue(data.status || 'Notified');
  sheet.getRange(rowIndex, 9).setValue(data.notifiedAt || new Date().toISOString());

  return _jsonResponse({
    estado: 'success',
    mensaje: 'Fila ' + rowIndex + ' actualizada a "' + (data.status || 'Notified') + '".',
  });
}

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

  current[1] = (typeof data.clientName === 'undefined') ? current[1] : (data.clientName || '');
  current[2] = (typeof data.lastServiceDate === 'undefined') ? current[2] : (data.lastServiceDate || '');
  current[3] = (typeof data.frequency === 'undefined') ? current[3] : (data.frequency || '');
  current[4] = (typeof data.taskDescription === 'undefined') ? current[4] : (data.taskDescription || '');
  current[5] = (typeof data.phoneNumber === 'undefined') ? current[5] : (data.phoneNumber || '');
  current[6] = (typeof data.nextDate === 'undefined') ? current[6] : (data.nextDate || '');
  current[7] = 'Pending';
  current[8] = '';

  range.setValues([current]);

  return _jsonResponse({
    estado: 'success',
    mensaje: 'Fila ' + rowIndex + ' actualizada correctamente.',
  });
}

function _handleUpdateSettings(data) {
  var sheet = _getSettingsSheet();
  var settings = _normalizeSettings(data.settings || {});

  sheet.getRange(2, 1, 1, 10).setValues([[
    settings.enabled,
    settings.sendTelegram,
    settings.sendEmail,
    settings.sendWhatsApp,
    settings.frequency,
    settings.weeklyDay,
    settings.notifyHour,
    settings.daysAhead,
    settings.timeZone,
    settings.lastTriggeredAt,
  ]]);

  return _jsonResponse({
    estado: 'success',
    settings: settings,
  });
}

function _getClientsSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CLIENTS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.getSheets()[0];
    sheet.setName(CLIENTS_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Client Name',
      'Last Service Date',
      'Frequency',
      'Task description',
      'Phone number',
      'Next Date',
      'Status',
      'Notified At'
    ]);
  }

  return sheet;
}

function _getSettingsSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SETTINGS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SETTINGS_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'enabled',
      'sendTelegram',
      'sendEmail',
      'sendWhatsApp',
      'frequency',
      'weeklyDay',
      'notifyHour',
      'daysAhead',
      'timeZone',
      'lastTriggeredAt'
    ]);
  }

  if (sheet.getLastRow() === 1) {
    var defaults = _normalizeSettings({});
    sheet.appendRow([
      defaults.enabled,
      defaults.sendTelegram,
      defaults.sendEmail,
      defaults.sendWhatsApp,
      defaults.frequency,
      defaults.weeklyDay,
      defaults.notifyHour,
      defaults.daysAhead,
      defaults.timeZone,
      defaults.lastTriggeredAt
    ]);
  }

  return sheet;
}

function _readSettings() {
  var sheet = _getSettingsSheet();
  var values = sheet.getRange(2, 1, 1, 10).getValues()[0];

  return _normalizeSettings({
    enabled: values[0],
    sendTelegram: values[1],
    sendEmail: values[2],
    sendWhatsApp: values[3],
    frequency: values[4],
    weeklyDay: values[5],
    notifyHour: values[6],
    daysAhead: values[7],
    timeZone: values[8],
    lastTriggeredAt: values[9],
  });
}

function _normalizeSettings(settings) {
  return {
    enabled: _toBoolean(settings.enabled, true),
    sendTelegram: _toBoolean(settings.sendTelegram, true),
    sendEmail: _toBoolean(settings.sendEmail, false),
    sendWhatsApp: _toBoolean(settings.sendWhatsApp, false),
    frequency: settings.frequency === 'weekly' ? 'weekly' : 'daily',
    weeklyDay: _toNumber(settings.weeklyDay, 1, 0, 6),
    notifyHour: _toNumber(settings.notifyHour, 9, 0, 23),
    daysAhead: _toNumber(settings.daysAhead, 7, 1, 30),
    timeZone: String(settings.timeZone || 'Europe/Madrid'),
    lastTriggeredAt: String(settings.lastTriggeredAt || ''),
  };
}

function _toBoolean(value, fallback) {
  if (value === true || value === false) return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function _toNumber(value, fallback, min, max) {
  var parsed = parseInt(value, 10);
  if (isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function _jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
