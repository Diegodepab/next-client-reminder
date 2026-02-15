# Client Reminder - Maintenance Tracking System

Sistema automatizado "Zero-Cost" para gestión de mantenimiento preventivo. Permite registrar clientes en una interfaz web amigable conectada a Google Sheets. Incluye un motor de cron jobs (Vercel) que calcula fechas de revisión (Fecha + Frecuencia - 7 días) y dispara notificaciones vía Telegram/Email.

## 🚀 Features

- **Mobile-First UI**: Responsive form to register clients with maintenance details
- **Google Sheets Database**: Store client data in Google Sheets (no database needed)
- **Automated Notifications**: Send reminders via Telegram and/or Gmail
- **Cron Job Integration**: Automatic daily checks for upcoming maintenance
- **Secure**: All sensitive data stored in environment variables

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Google Spreadsheet
- **Notifications**: Telegraf (Telegram), Nodemailer (Gmail)
- **Deployment**: Vercel with Cron Jobs

## 📋 Prerequisites

Before you begin, ensure you have:

1. Node.js 18+ installed
2. A Google Cloud Platform account
3. A Google Sheet created
4. (Optional) A Telegram Bot Token
5. (Optional) A Gmail account with App Password

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/Diegodepab/next-client-reminder.git
cd next-client-reminder
npm install
```

### 2. Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name and click "Create"
   - Grant it "Editor" role
   - Click "Done"
5. Create a key for the service account:
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose JSON format
   - Save the file
6. Create a Google Sheet and share it with the service account email

### 3. Telegram Setup (Optional)

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Get your bot token
3. Start a chat with your bot
4. Get your chat ID by visiting: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`

### 4. Gmail Setup (Optional)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a password for "Mail"

### 5. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:

```env
# Required
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-google-sheet-id

# Optional - Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# Optional - Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@example.com

# Optional - Cron Security
CRON_SECRET=your-random-secret-string
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🚀 Deployment to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy!

The cron job will run automatically every day at 9 AM (configured in `vercel.json`).

## 📝 How It Works

### User Registration Flow

1. User fills the form with:
   - Client Name
   - Last Service Date
   - Frequency (in months)
   - Task description
   - Phone number

2. Data is saved to Google Sheets with status "Pending"

### Cron Job Flow

1. Runs daily at 9 AM (configured in `vercel.json`)
2. Fetches all clients from Google Sheets
3. For each client:
   - Calculates: `NextDate = LastServiceDate + Frequency (months)`
   - Calculates: `ReminderDate = NextDate - 7 days`
   - If today equals ReminderDate and status is not "Notified":
     - Sends notification via Telegram and/or Gmail
     - Updates status to "Notified"

## 🔒 Security

- All sensitive credentials are stored in environment variables
- Cron endpoint can be protected with `CRON_SECRET`
- Google Sheets access is restricted to service account
- No sensitive data is exposed to the client

## 📱 API Endpoints

### POST `/api/clients`

Register a new client.

**Request Body:**
```json
{
  "clientName": "John Doe",
  "lastServiceDate": "2024-01-15",
  "frequency": "3",
  "task": "Oil change and inspection",
  "phone": "+1234567890"
}
```

### GET `/api/cron`

Trigger the cron job manually (protected by `CRON_SECRET` if configured).

**Headers:**
```
Authorization: Bearer your-cron-secret
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 💡 Tips

- The cron job schedule can be modified in `vercel.json`
- You can configure both Telegram and Gmail notifications or just one
- The reminder is sent 7 days before the next maintenance date
- Test the cron job locally by visiting `/api/cron` in your browser

## 🐛 Troubleshooting

- **Google Sheets not working**: Make sure the service account email has edit access to your sheet
- **Notifications not sending**: Check that your Telegram/Gmail credentials are correct
- **Private key error**: Make sure to preserve newlines in the private key (`\n`)
- **Build errors**: Run `npm install` to ensure all dependencies are installed

## 📞 Support

For issues or questions, please open an issue on GitHub.
