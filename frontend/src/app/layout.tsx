import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bless Canteen - Weekly Meal Ordering System",
  description: "Order your weekly meals easily with Bless Canteen. Fresh, delicious food delivered daily to our school community.",
  keywords: ["Bless Canteen", "Meal Ordering", "School Canteen", "Weekly Orders", "Food Service"],
  authors: [{ name: "Bless Canteen Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Bless Canteen - Weekly Meal Ordering",
    description: "Order your weekly meals easily with Bless Canteen",
    siteName: "Bless Canteen",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
