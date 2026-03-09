import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "APEX — Discover Your Hidden Travel Wealth",
  description: "Find out how many points you're leaving on the table every month. Takes 60 seconds.",
  openGraph: {
    title: "APEX — Discover Your Hidden Travel Wealth",
    description: "Find out how many points you're leaving on the table every month. Takes 60 seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
