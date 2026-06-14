import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/lib/query-client";
import { Analytics } from "@vercel/analytics/next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Turtle Soup AI | 바다거북 스프 추리 게임",
    template: "%s | Turtle Soup AI",
  },
  description:
    "AI 게임 마스터에게 예·아니오 질문을 던지고 숨겨진 사건의 진실을 추리해 보세요.",
  applicationName: "Turtle Soup AI",
  keywords: [
    "바다거북 스프",
    "상황 추리",
    "추리 게임",
    "AI 게임",
    "Turtle Soup",
  ],
  authors: [{ name: "Turtle Soup AI" }],
  creator: "Turtle Soup AI",
  category: "game",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "Turtle Soup AI",
    title: "Turtle Soup AI | 바다거북 스프 추리 게임",
    description: "예·아니오 질문으로 단서를 모아 오늘의 미스터리를 해결하세요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Turtle Soup AI 바다거북 스프 추리 게임",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Turtle Soup AI | 바다거북 스프 추리 게임",
    description: "예·아니오 질문으로 단서를 모아 오늘의 미스터리를 해결하세요.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0c11",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" style={{ background: "#0c0c11" }}>
      <body>
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
