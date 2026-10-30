import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

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
    <html lang="es" className={roboto.variable} suppressHydrationWarning>
      <body className={roboto.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
