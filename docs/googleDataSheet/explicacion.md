# Integración con Google Sheets

Para que nuestra aplicación Next.js guarde y lea datos de un Google Sheet, usamos un Google Apps Script como puente. El script soporta tanto **escritura** (POST) como **lectura** (GET).

Sigue estos pasos detallados:

## 1. Crear el Google Sheet y los Nombres de Columna

1. Ve a [Google Sheets](https://sheets.google.com) y crea una nueva hoja de cálculo en blanco.
2. Nómbrala algo como **"Next Client Reminder Data"**.
3. En la **primera fila** (Fila 1), escribe exactamente estos encabezados (columnas A–I):

   | Columna | Encabezado |  Descripción |
   |---------|-----------|-------|
   | **A** | `Timestamp` | Fecha/hora automática de registro |
   | **B** | `Client Name` | Nombre del cliente |
   | **C** | `Last Service Date` | Última fecha de servicio |
   | **D** | `Frequency (in months)` | Cada cuántos meses |
   | **E** | `Task description` | Descripción del mantenimiento |
   | **F** | `Phone number` | Teléfono de contacto |
   | **G** | `Next Date` | Próxima fecha (calculada automáticamente) |
   | **H** | `Status` | Estado (`Pending` / `Notified`) |
   | **I** | `Notified At` | Fecha en que se envió el aviso |

4. Puedes poner la fila en negrita y fijarla para que siempre esté visible.

## 2. Crear el Puente (El Código en Google Apps Script)

1. En tu Google Sheet abierto, ve al menú superior: **Extensiones > Apps Script**.
2. Se abrirá una nueva pestaña con un archivo llamado `Código.gs`.
3. **Borra el código que viene por defecto** (`function myFunction() {}`).
4. **Pega** el código que se encuentra en el archivo [`script.js`](./script.js) de este mismo repositorio.
5. Haz clic en el ícono de **Guardar** (el disquete) o presiona `Ctrl+S`.

> **Nota:** Si ya tenías un script anterior, debes reemplazarlo completamente con la nueva versión. El nuevo script incluye soporte para leer todos los clientes (GET), registrar nuevos (POST) y actualizar estados (POST con `_action: 'updateStatus'`).

## 3. Desplegar como Aplicación Web

1. Haz clic en el botón azul **Implementar** > **Nueva implementación**.
2. Selecciona tipo: **Aplicación web**.
3. Configuración:
   - **Ejecutar como:** **"Yo (tu correo)"**
   - **Quién tiene acceso:** **"Cualquiera"**
4. Haz clic en **Implementar**.
5. La primera vez, Google te pedirá "Autorizar acceso". Sigue los pasos.
6. **Copia la URL** de la aplicación web (termina en `/exec`).

> **⚠️ Importante:** Cada vez que modifiques el código del Apps Script, debes crear una **Nueva implementación** (o editar la existente) para que los cambios se reflejen.

## 4. Conectar con Next.js (Variable de Entorno)

1. En tu archivo `.env` (en la carpeta `src/`), pega la URL:
   ```env
   GOOGLE_PRIVATE_URL="https://script.google.com/macros/s/.../exec"
   ```

2. La variable **no** lleva prefijo `NEXT_PUBLIC_`, por lo que solo es accesible desde el servidor (API Routes). Esto es lo correcto por seguridad.

3. La app ya está configurada para usar esta variable automáticamente:
   - **Registrar clientes:** `POST /api/clients` → envía datos al Apps Script.
   - **Leer clientes:** La librería `lib/googleSheets.ts` hace `GET` al Apps Script.
   - **Actualizar estado:** El cron job (`/api/cron`) marca clientes como notificados vía `POST` con acción especial.

## 5. Qué hace cada función del Apps Script

| Función | Método | Qué hace |
|---------|--------|----------|
| `doGet()` | GET | Lee todas las filas y devuelve un JSON con los clientes |
| `doPost()` — addClient | POST | Añade una nueva fila con los datos del cliente |
| `doPost()` — updateStatus | POST (`_action: 'updateStatus'`) | Actualiza las columnas Status y Notified At |
