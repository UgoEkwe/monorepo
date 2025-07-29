import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Modular AI Scaffold - AI Content Generator',
  description: 'A modular AI-powered content generation platform built with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-inter min-h-screen bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="max-w-screen-lg mx-auto px-4 min-h-screen">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}