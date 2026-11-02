import type { Metadata, Viewport } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";

// Both fonts are SIL Open Font License. next/font downloads them at build
// time and serves them from this site, so no request goes to Google.
const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "700"],
  display: "swap",
});

const ui = Source_Sans_3({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Toast Name Generator",
  description:
    "An unofficial, fan-inspired generator of convincingly ridiculous British names. Runs entirely in your browser.",
};

export const viewport: Viewport = {
  themeColor: "#f5eedf",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className={`${display.variable} ${ui.variable} antialiased`}>{children}</body>
    </html>
  );
}
