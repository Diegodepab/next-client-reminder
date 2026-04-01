# Client Reminder System

A lightweight, zero-cost maintenance tracking system. It provides a simple web interface to register clients and automatically schedules and sends reminders via Telegram or Email based on their maintenance frequency.

It uses a Serverless Next.js architecture, leveraging a Google Sheet as a database to keep hosting completely free.

## 🚀 Architecture

- **Frontend & Backend**: [Next.js 15 (App Router)](https://nextjs.org/) + React 19 + Tailwind CSS
- **Database**: [Google Sheets API](https://developers.google.com/sheets/api) (Functions as a free, NoSQL database)
- **Notifications**: Telegram (via `telegraf`) & Email (via `nodemailer`)
- **Notifications**: Telegram, Email and WhatsApp Cloud API
- **Automation**: Vercel Cron Jobs (runs every hour and respects the reminder hour configured in the app)

### Data Flow

1. **Registration**: User registers a client via the web UI. Data is appended to a row in Google Sheets with a `Pending` status.
2. **Cron Job**: An hourly Vercel Cron Job triggers the `/api/cron` endpoint.
3. **Evaluation**: The system reads the `Settings` sheet, checks whether the current hour matches the configured reminder window, and collects clients whose next review falls within the configured number of days.
4. **Notification**: If the reminder window matches, a summary is sent by Telegram and/or Gmail according to the saved settings.

## 🛠 Features

- **Mobile-First UI**: Simple, responsive form to register and manage clients.
- **Zero-Cost Database**: No traditional database required; easily view and edit your data directly on Google Sheets.
- **Multi-Channel Reminders**: Support for both Telegram messages and Email notifications.
- **Automated**: Fully automated checks driven by Vercel Cron plus a settings panel in the UI.

## 💻 Local Development

Before starting, ensure you have Node.js 18+ installed.

### 1. Project Setup

Since the main application resides in the `src` folder, all commands should be run from there or explicitly target it.

```bash
git clone https://github.com/Diegodepab/next-client-reminder.git
cd next-client-reminder/src
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` inside the `src` directory, and fill in the required credentials.

```bash
cp .env.example .env.local
```

**Required Credentials:**
- **Google Sheets**: `GOOGLE_PRIVATE_KEY`, `GOOGLE_CLIENT_EMAIL`, `SPREADSHEET_ID`
- **Telegram (Optional)**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- **Email (Optional)**: `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `ADMIN_EMAIL` or `notification_EMAIL`
- **WhatsApp (Optional)**: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TO_NUMBER`
- **Security**: `CRON_SECRET` (A strong random string to protect the cron endpoint)

### 3. Run Development Server

```bash
cd src
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## ☁️ Deployment (Vercel)

This project is optimized for deployment on [Vercel](https://vercel.com).

1. Push your code to GitHub and import the repository into Vercel.
2. Add all the environment variables from your `.env.local` to the Vercel project settings.
3. **Important Configuration**: Your code is located in the `src` folder, so in Vercel Project Settings > General you should set **Root Directory** to `src`.
4. After deployment, make sure the Google Apps Script code is updated with `docs/googleDataSheet/script.js`. That version creates and manages the `Settings` sheet used by the reminder panel.
5. Deploy the project. The cron job defined in `src/vercel.json` runs every hour, and `/api/cron` decides whether it is the configured time to send the summary.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
