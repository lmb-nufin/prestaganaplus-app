
import type { Metadata } from "next";
import { Inter, Poppins, PT_Sans } from "next/font/google";
import "./globals.css";
import { NotificationsProvider } from "@/context/notifications-context";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });
const ptSans = PT_Sans({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-pt-sans" });

export const metadata: Metadata = {
  title: "PrestaGana",
  description: "Plataforma de gestión de personal y contratistas",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>)
{
  return (
    <html lang="es" className={`${poppins.variable} ${ptSans.variable}`}>
      <body className={inter.className}>
        <NotificationsProvider>
          {children}
        </NotificationsProvider>
      </body>
    </html>
  );
}
