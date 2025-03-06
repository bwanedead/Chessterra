import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chessterra - Chess Analytics",
  description: "Analyze chess games with advanced heatmaps and visualizations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-b from-chess-gray/10 to-white dark:from-gray-900 dark:to-black`}>
        {children}
      </body>
    </html>
  );
}
