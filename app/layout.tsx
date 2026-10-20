import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { FilmGrain } from "@/components/film-grain"
import { Toaster } from "@/components/ui/sonner"
import { AdminProvider } from "@/contexts/AdminContext"
import { AdminShortcutListener } from "@/components/AdminShortcutListener"
import { AdminBadge } from "@/components/AdminBadge"
import "./globals.css"
import "@/styles/studio.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CIRCUS17",
  description: "Cinematic storytelling and production",
  generator: "v0.app",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if (matchMedia('(min-width: 768px)').matches &&
              ['/', '/menu', '/videos'].includes(location.pathname) &&
              performance.getEntriesByType('navigation')[0]?.type === 'reload') {
            history.scrollRestoration = 'manual';
            if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
            scrollTo(0, 0);
          }
        ` }} />
      </head>
      <body className={`font-sans antialiased`}>
        <AdminProvider>
          <AdminShortcutListener />
          <AdminBadge />
          {children}
        </AdminProvider>
        <FilmGrain />
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
