import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export const metadata: Metadata = {
  title: "Barbearia Premium",
  description: "O seu estilo, nossa obra de arte.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Barbearia",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
