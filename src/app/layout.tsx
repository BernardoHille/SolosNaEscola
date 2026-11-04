import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const description =
  "Experiência digital interativa de uma exposição educativa sobre solos, desenvolvida a partir de reconstrução tridimensional.";

export const metadata: Metadata = {
  title: "Solos na Escola",
  description,
  applicationName: "Solos na Escola",
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
  themeColor: "#0c0a09",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden bg-black font-sans text-stone-100">{children}</body>
    </html>
  );
}
