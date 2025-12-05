import type { Metadata } from "next";
import Script from "next/script";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "2031ai | Predict Human Buying Intent",
  description: "Use AI to evaluate products and predict human buying intent with 95% accuracy. Based on latest research in AI e-commerce behavior.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="a39c6a50-34ac-49ac-958c-37a8029215d9"
        />
        <StackProvider app={stackClientApp}><StackTheme>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </StackTheme></StackProvider></body>
    </html>
  );
}
