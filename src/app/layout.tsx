import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const description =
  "Visita tridimensional e interativa à Exposição Didática de Solos do Programa Solo na Escola, da Universidade Federal do Paraná.";

export const metadata: Metadata = {
  title: "Solos na Escola",
  description,
  applicationName: "Solos na Escola",
  // Aberto pela Tela de Início do iPhone/iPad, ocupa a tela inteira (lá a página não pode pedir
  // tela cheia).
  appleWebApp: { capable: true, title: "Solos na Escola", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Solos na Escola",
    description,
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Evita o zoom da página por pinça: o gesto de pinça é usado pelo viewer.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#171411",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden bg-stone-950 font-sans text-stone-100">{children}</body>
    </html>
  );
}
