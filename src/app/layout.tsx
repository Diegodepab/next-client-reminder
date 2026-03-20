import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Recordatorio de clientes - Mantenimiento',
  description:
    'Sistema de seguimiento de mantenimiento con notificaciones programadas por Telegram y Email.',
  keywords: ['mantenimiento', 'recordatorio', 'clientes', 'seguimiento', 'notificaciones'],
  icons: {
    icon: '/icono.svg',
    shortcut: '/icono.svg',
    apple: '/icono.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

