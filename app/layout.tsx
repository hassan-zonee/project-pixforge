import './globals.css'
import type { Metadata } from 'next'
import { Inter, Poppins, Montserrat } from 'next/font/google'

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
  title: 'PixForge - Image Resizing Tool',
  description: 'Resize your images with ease using PixForge',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} ${montserrat.variable} font-sans`}>{children}</body>
    </html>
  )
}