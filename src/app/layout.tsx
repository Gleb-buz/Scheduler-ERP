import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { ReactQueryProvider } from "@/providers/query-client-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { OutboxProvider } from "@/providers/outbox-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP Planner",
  description: "ERP Planner front-end for Google Sheets backend",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ReactQueryProvider>
          <ThemeProvider>
            <ToastProvider>
              <OutboxProvider>{children}</OutboxProvider>
            </ToastProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
