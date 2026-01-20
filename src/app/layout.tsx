import type { Metadata } from "next";
import { Shippori_Antique, Inter } from "next/font/google";
import "./globals.css";

const shipporiAntique = Shippori_Antique({
  variable: "--font-shippori-antique",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Howl Learning Platform",
  description: "北さんコミュニティ専用の学習プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${shipporiAntique.variable} ${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

