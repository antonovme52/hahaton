import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "./globals.css";

import { Providers } from "@/app/providers";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Popub Learn",
  description: "Геймифицированная платформа по цифровой грамотности и основам программирования"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
