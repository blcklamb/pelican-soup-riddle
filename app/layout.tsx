import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/lib/query-client";

export const metadata: Metadata = {
  title: "Turtle Soup AI",
  description: "AI 게임 마스터와 함께 푸는 바다거북 스프 추리 게임",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0c11",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
