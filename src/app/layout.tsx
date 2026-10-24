
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationsProvider } from "@/context/notifications-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrestaGana",
  description: "Plataforma de gestión de personal y contratistas",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>)
{
  return (
    <html lang="es">
      <body className={inter.className}>
        <NotificationsProvider>
          {children}
        </NotificationsProvider>
      </body>
    </html>
  );
}
