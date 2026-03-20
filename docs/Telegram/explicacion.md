# Configuración de Notificaciones con Telegram

Este documento explica cómo configurar un bot de Telegram para que el servidor envíe recordatorios automatizados, sin usar bots de terceros para obtener credenciales.

## 1. Crear el Bot y obtener el Token

1. En Telegram, busca a **@BotFather**.
2. Envía el comando `/newbot` y sigue las instrucciones para darle un nombre y un nombre de usuario (debe terminar en `bot`).
3. BotFather te devolverá un **Token HTTP API**  que es el del .env.

## 2. Obtener tu Chat ID (Método API Directa)

Para que el bot sepa a quién escribirle, necesitas tu ID de chat personal.

1. Busca tu nuevo bot en Telegram y **envíale cualquier mensaje** (ej. "Hola"). *Los bots no pueden iniciar conversaciones por política de antispam.*
2. Abre tu navegador web y entra en la siguiente URL (reemplaza `TU_TOKEN` por el token real que obtuviste en el paso 1):
   `https://api.telegram.org/botTU_TOKEN/getUpdates`
3. Verás una respuesta en formato JSON. Busca el bloque `"chat"` y copia el número del campo `"id"`.
   ```json
   "chat": {
     "id": 830885332, 
     "first_name": "nombreCliente",
     ...
   }