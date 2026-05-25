import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { NavigationProgress } from '@/components/navigation/NavigationProgress'
import { PWARegister } from '@/components/PWARegister'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'BCAP',
  description: 'Radar de inteligência para o mercado brasileiro',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0D0B14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${playfair.variable} ${inter.className}`}>
        <NavigationProgress />
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
