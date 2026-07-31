import type { Metadata } from "next";
import localFont from "next/font/local";

import { QueryProvider } from "@/components/providers/query-provider";
import { SiteFooter } from "@/components/site-footer";
import { AuthProvider } from "@/hooks/use-auth";
import { PreferencesProvider } from "@/hooks/use-preferences";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "CampusConnect — 发现你的校园",
    template: "%s | CampusConnect",
  },
  description:
    "CampusConnect 是面向高中生和大学生的校园社区平台：发现活动、寻找学习伙伴、组建团队、交换资源。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <PreferencesProvider>
            <AuthProvider>
              <div className="flex min-h-screen flex-col">
                <div className="flex flex-1 flex-col">{children}</div>
                <SiteFooter />
              </div>
            </AuthProvider>
          </PreferencesProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
