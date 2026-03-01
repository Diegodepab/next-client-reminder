/**
 * Google Apps Script — Puente entre Next.js y Google Sheets.
 *
 * Columnas esperadas (Fila 1 = cabecera):
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

// ─────────────────────────────────────────────
//  GET  →  Devuelve todos los clientes en JSON
// ─────────────────────────────────────────────
function doGet() {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var datos = hoja.getDataRange().getValues(); // todas las filas, incluida la cabecera

    if (datos.length <= 1) {
        // Solo hay cabecera (o está vacía)
        return ContentService
            .createTextOutput(JSON.stringify({ estado: 'success', clientes: [] }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    var clientes = [];

    for (var i = 1; i < datos.length; i++) {
        var fila = datos[i];
        clientes.push({
            rowIndex: i,                    // Índice real en la hoja (útil para updates)
            timestamp: fila[0] || '',
            clientName: fila[1] || '',
            lastServiceDate: fila[2] || '',
            frequency: fila[3] || '',
            taskDescription: fila[4] || '',
            phoneNumber: fila[5] || '',
            nextDate: fila[6] || '',
            status: fila[7] || 'Pending',
            notifiedAt: fila[8] || ''
        });
    }

    return ContentService
        .createTextOutput(JSON.stringify({ estado: 'success', clientes: clientes }))
        .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────
//  POST  →  Escribe una fila nueva o actualiza
// ─────────────────────────────────────────────
function doPost(e) {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 1. Parsear el body
    try {
        var datos = JSON.parse(e.postData.contents);
    } catch (error) {
        return _jsonResponse({ estado: 'error', mensaje: 'JSON no válido.' });
    }

    // 2. Router: ¿es una actualización de estado o un alta nueva?
    var action = datos._action || 'addClient';

    if (action === 'updateStatus') {
        return _handleUpdateStatus(hoja, datos);
    }

    // ── Acción por defecto: añadir cliente ──
    return _handleAddClient(hoja, datos);
}

// ─────────────────────────────────────────────
//  Handlers internos
// ─────────────────────────────────────────────

/**
 * Añade una fila nueva con los datos del cliente.
 */
function _handleAddClient(hoja, datos) {
    var fila = [
        new Date(),                       // A: Timestamp
        datos.clientName || '',      // B: Client Name
        datos.lastServiceDate || '',      // C: Last Service Date
        datos.frequency || '',      // D: Frequency (in months)
        datos.taskDescription || '',      // E: Task description
        datos.phoneNumber || '',      // F: Phone number
        datos.nextDate || '',      // G: Next Date
        'Pending',                        // H: Status
        ''                                // I: Notified At
    ];

    hoja.appendRow(fila);

    return _jsonResponse({
        estado: 'success',
        mensaje: 'Cliente registrado en la fila ' + hoja.getLastRow()
    });
}

/**
 * Actualiza las columnas Status (H) y Notified At (I) de una fila existente.
 * Espera: { _action: 'updateStatus', rowIndex: <int>, status: <string>, notifiedAt: <string> }
 */
function _handleUpdateStatus(hoja, datos) {
    var rowIndex = parseInt(datos.rowIndex, 10);

    if (!rowIndex || rowIndex < 2) {
        return _jsonResponse({ estado: 'error', mensaje: 'rowIndex inválido.' });
    }

    var ultimaFila = hoja.getLastRow();
    if (rowIndex > ultimaFila) {
        return _jsonResponse({ estado: 'error', mensaje: 'La fila ' + rowIndex + ' no existe.' });
    }

    // Columna H = 8, Columna I = 9
    hoja.getRange(rowIndex, 8).setValue(datos.status || 'Notified');
    hoja.getRange(rowIndex, 9).setValue(datos.notifiedAt || new Date().toISOString());

    return _jsonResponse({
        estado: 'success',
        mensaje: 'Fila ' + rowIndex + ' actualizada a "' + (datos.status || 'Notified') + '".'
    });
}

// ─────────────────────────────────────────────
//  Utilidades
// ─────────────────────────────────────────────
function _jsonResponse(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}
