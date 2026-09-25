import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { AppProviders } from "@/components/providers/app-providers";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// خط زخرفي احتفالي — محصور ببطاقة الطالب فقط (انظر --font-script في globals.css)
const yearOfHandicrafts = localFont({
  src: "../fonts/TheYearOfHandicrafts-Regular.otf",
  variable: "--font-year-of-handicrafts",
  display: "swap",
});

export const metadata: Metadata = {
  title: "حلقات ابن الجوزي",
  description: "نظام إدارة برنامج حلقات ابن الجوزي — مسجد الطرباق",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e6b4f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} ${yearOfHandicrafts.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
