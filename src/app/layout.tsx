import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientSessionProvider from "@/components/ClientSessionProvider";
import HandTalk from "@/components/HandTalk";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal do Colaborador - Fretado",
  description: "Sistema de gerenciamento de fretado para colaboradores",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 🔥 SessionProvider dentro de componente client */}
        <ClientSessionProvider>{children}</ClientSessionProvider>
        <HandTalk />
      </body>
    </html>
  );
}
