import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/**
 * Brand typography.
 *
 * The design system uses three typefaces with distinct jobs:
 * Space Grotesk for display copy, Inter for body text, and IBM Plex Mono
 * for anything numeric (prices, PnL, percentages). Keeping numbers in a
 * monospace face matters here specifically because this is a trading
 * product: figures need to align in tables and stay legible at a glance,
 * which proportional fonts don't do well.
 *
 * We load these through next/font instead of a <link> tag or an @import
 * in CSS. next/font self-hosts the font files at build time and inlines
 * the necessary @font-face rules, so there's no runtime request to
 * fonts.googleapis.com, no render-blocking network call, and no flash of
 * unstyled text. The tradeoff is that font resolution happens at build
 * time, so this step requires network access during `next build`.
 *
 * Each font is exposed as a CSS custom property matching the variable
 * names already defined in globals.css (--font-display, --font-body,
 * --font-mono), so the rest of the stylesheet doesn't need to know these
 * are next/font instances at all.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Relay | Social trading, unified across chains",
  description:
    "Follow verified on-chain traders, copy their trades, and trade alongside the sharpest people in the market.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/*
        The three font variable classes are applied at the body level so
        every descendant can reference var(--font-display) etc. without
        each component needing to import a font module directly.
      */}
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
