import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entre Rios | Tempo e ambiente em Teresina",
  description: "Clima, qualidade do ar e rios de Teresina.",
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
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
