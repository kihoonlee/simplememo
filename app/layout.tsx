import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import AppGate from "@/components/AppGate";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "SimpleMemo",
  description: "모바일 메모 — 구글 드라이브에 .md로 저장",
  applicationName: "SimpleMemo",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "SimpleMemo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f2f4f6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body className="min-h-full bg-canvas text-ink antialiased">
        <Providers>
          <AppGate>{children}</AppGate>
        </Providers>
        <RegisterSW />
      </body>
    </html>
  );
}
