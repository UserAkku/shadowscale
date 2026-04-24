import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700", "900"], display: "swap" });

export const metadata: Metadata = {
  title: "ShadowScale — Free URL Shortener",
  description: "Anonymous, distributed URL shortener with rich analytics.",
  openGraph: {
    title: "ShadowScale — Free URL Shortener",
    description: "Anonymous, distributed URL shortener with rich analytics.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <ToastProvider>
          <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
        </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
