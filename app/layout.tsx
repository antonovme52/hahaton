import type { Metadata } from "next";

import "./globals.css";

import { Providers } from "@/app/providers";

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
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
