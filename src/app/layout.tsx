import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Reminder - Maintenance Tracker",
  description: "Automated maintenance tracking system with client notifications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
