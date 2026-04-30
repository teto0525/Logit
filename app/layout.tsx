import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { BottomNav } from "./components/BottomNav";
import { SwRegister } from "./components/SwRegister";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Logit",
  description: "내 방의 작은 책상 위 노트 — 가치에서 하루까지",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Logit",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F7F5F0",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${fraunces.variable} ${dmSans.variable} ${notoSansKR.variable} antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body>
        <SwRegister />
        <div className="app-shell">
          <div className="main-content">{children}</div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
