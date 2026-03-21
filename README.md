# Client Reminder System

A lightweight, zero-cost maintenance tracking system. It provides a simple web interface to register clients and automatically schedules and sends reminders via Telegram or Email based on their maintenance frequency.

It uses a Serverless Next.js architecture, leveraging a Google Sheet as a database to keep hosting completely free.

## 🚀 Architecture

- **Frontend & Backend**: [Next.js 15 (App Router)](https://nextjs.org/) + React 19 + Tailwind CSS
- **Database**: [Google Sheets API](https://developers.google.com/sheets/api) (Functions as a free, NoSQL database)
- **Notifications**: Telegram (via `telegraf`) & Email (via `nodemailer`)
- **Automation**: Vercel Cron Jobs (Runs daily to check for due remainders)

### Data Flow

1. **Registration**: User registers a client via the web UI. Data is appended to a row in Google Sheets with a `Pending` status.
2. **Cron Job**: A daily Vercel Cron Job triggers the `/api/cron` endpoint.
3. **Evaluation**: The system reads the Google Sheet. For each client, it calculates if `NextDate (LastServiceDate + Frequency) - 7 days` equals today.
4. **Notification**: If a reminder is due, notifications are sent (Telegram/Email), and the sheet row status updates to `Notified`.

## 🛠 Features

- **Mobile-First UI**: Simple, responsive form to register and manage clients.
- **Zero-Cost Database**: No traditional database required; easily view and edit your data directly on Google Sheets.
- **Multi-Channel Reminders**: Support for both Telegram messages and Email notifications.
- **Automated**: Fully automated daily checks for upcoming maintenance requests.

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
- **Email (Optional)**: `EMAIL_USER`, `EMAIL_PASS`
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
3. **Important Configuration**: Your code is located in the `src` folder, so Vercel needs to know the **Root Directory**:
   - By default, the `vercel.json` in the root will force the build inside `src` and output `src/.next`.
   - **Recommended Approach**: For a smoother deployment, go to your Vercel Project Settings > General > **Root Directory**, set it to `src`. Then, move the `vercel.json` file inside the `src` folder so Vercel natively handles the Next.js routing and crons correctly.
4. Deploy the project. The cron job will automatically run every day at 9 AM based on the `vercel.json` configuration.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
