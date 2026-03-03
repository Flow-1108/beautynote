import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { OfflineDetector } from "@/components/pwa/offline-detector";
import { SplashScreen } from "@/components/pwa/splash-screen";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BeautyNote",
  description: "Gestion de salon — Rendez-vous, clients et paiements",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BeautyNote",
  },
};

export const viewport: Viewport = {
  themeColor: "#4A314C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${playfair.variable} ${montserrat.variable} antialiased`}
      >
        <SplashScreen />
        <OfflineDetector />
        {children}
      </body>
    </html>
  );
}
