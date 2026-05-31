import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { NavigationProgress } from '@/components/navigation/NavigationProgress'
import { PWARegister } from '@/components/PWARegister'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { ReactPolyfill } from '@/components/ReactPolyfill'
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
  description: 'Inteligência de mercado brasileiro com dados Brapi PRO para profissionais financeiros',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0C0F15',
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
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${inter.className}`}>
        <ReactPolyfill />
        <NavigationProgress />
        <PWARegister />
        <RootProvider
          theme={{
            defaultTheme: 'dark',
            forcedTheme: 'dark',
            enableSystem: false,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  )
}

