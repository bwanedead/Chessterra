import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chessterra',
  description: 'Chess analytics platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-[rgb(15,23,42)]">
      <body className={`${inter.className} min-h-screen bg-gradient-to-b from-[rgb(15,23,42)] to-[rgb(17,24,39)]`}>
        {children}
      </body>
    </html>
  )
}
