import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartTurril - Monitoreo de Nivel de Agua",
  description: "Sistema IoT de monitoreo de nivel de agua para tanques y turriles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
