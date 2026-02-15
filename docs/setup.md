# Setup Guide

## Google Cloud Setup (for Google Sheets)

1.  **Go to Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a Project**: Name it something like "Client Reminder".
3.  **Enable Sheets API**:
    *   Search for "Google Sheets API" in the search bar.
    *   Click "Enable".
4.  **Create Service Account**:
    *   Go to **IAM & Admin** > **Service Accounts**.
    *   Click **Create Service Account**.
    *   Name it (e.g., `sheets-editor`).
    *   Grant it the **Editor** role (or specifically Sheets Editor).
    *   Click **Done**.
5.  **Generate Keys**:
    *   Click on the newly created service account email.
    *   Go to the **Keys** tab.
    *   Click **Add Key** > **Create New Key** > **JSON**.
    *   A `.json` file will download. **Keep this safe!**
6.  **Share the Sheet**:
    *   Open your Google Sheet.
    *   Click **Share**.
    *   Paste the **client_email** from the JSON file you just downloaded.
    *   Give it **Editor** access.

## Telegram Setup (Optional)

1.  Open Telegram and search for **@BotFather**.
2.  Send the command `/newbot`.
3.  Follow the instructions to name your bot.
4.  Copy the **HTTP API Token** provided.
5.  To get your Chat ID:
    *   Start a chat with your new bot.
    *   Send a message (e.g., "Hello").
    *   Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
    *   Look for `"chat":{"id":123456789...}` in the response.

## Environment Variables (.env.local)

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SHEET_ID=your-sheet-id-from-url
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_CHAT_ID=your-chat-id
CRON_SECRET=random-secret-for-security
```
