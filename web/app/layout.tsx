import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "秋秋内容引擎｜内容排期、选题与复盘",
  description: "秋秋很开心的内容工作台：排期、选题、数据与历史内容资产。",
  openGraph: {
    title: "秋秋内容引擎",
    description: "内容排期、选题、复盘",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "秋秋内容引擎",
    description: "内容排期、选题、复盘",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
