import './globals.css'
import type { Metadata } from 'next'
import { Inter, Poppins, Montserrat } from 'next/font/google'
import { OpenCVProvider } from '@/components/OpenCVProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins'
})
const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-montserrat'
})

export const metadata: Metadata = {
  metadataBase: new URL('https://pixforge.vercel.app'),
  title: 'PixForge - Free Online Image Resizer | Resize Images Easily',
  description: 'Free online image resizer tool. Resize your JPG, PNG, and WebP images easily with custom dimensions or percentage scaling. No signup required, instant download.',
  keywords: 'image resizer, resize image, image resizer online, free image resizer, resize photos, image size converter, online image resizer, resize pictures, photo resizer, resize image online free',
  authors: [{ name: 'PixForge' }],
  creator: 'PixForge',
  publisher: 'PixForge',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pixforge.vercel.app',
    title: 'PixForge - Free Online Image Resizer | Resize Images Easily',
    description: 'Free online image resizer tool. Resize your JPG, PNG, and WebP images easily with custom dimensions or percentage scaling. No signup required, instant download.',
    siteName: 'PixForge',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PixForge - Free Online Image Resizer'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixForge - Free Online Image Resizer | Resize Images Easily',
    description: 'Free online image resizer tool. Resize your JPG, PNG, and WebP images easily with custom dimensions or percentage scaling. No signup required, instant download.',
    images: ['/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://pixforge.vercel.app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} ${montserrat.variable} font-sans`}>
        <OpenCVProvider>
          {children}
        </OpenCVProvider>
      </body>
    </html>
  )
}