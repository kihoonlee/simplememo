import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import AppGate from "@/components/AppGate";

export const metadata: Metadata = {
  title: "SimpleMemo",
  description: "모바일 메모 — 구글 드라이브에 .md로 저장",
  applicationName: "SimpleMemo",
  appleWebApp: { capable: true, title: "SimpleMemo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-neutral-50 text-neutral-900 antialiased">
        <Providers>
          <AppGate>{children}</AppGate>
        </Providers>
      </body>
    </html>
  );
}
