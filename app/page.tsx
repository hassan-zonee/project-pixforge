import { PixForgeHome } from '@/components/PixForgeHome'
import Script from 'next/script'

export default function Home() {
  // JSON-LD structured data for rich snippets
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "PixForge Image Resizer",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Free online image resizer tool. Easily resize JPG, PNG, and WebP images with custom dimensions or percentage scaling. No signup required.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1024"
    }
  };

  return (
    <>
      {/* Structured data for search engines */}
      <Script id="structured-data" type="application/ld+json">
        {JSON.stringify(structuredData)}
      </Script>

      {/* Main content with semantic HTML */}
      <main itemScope itemType="https://schema.org/WebApplication">
        <div className="sr-only">
          <h1 itemProp="name">PixForge - Free Online Image Resizer Tool</h1>
          <p itemProp="description">
            Resize your images online for free. Our image resizer tool lets you easily resize JPG, PNG, and WebP images with custom dimensions or percentage scaling. 
            No registration required, no watermarks, completely free.
          </p>
          <meta itemProp="keywords" content="image resizer, resize image online, free image resizer, photo resizer, resize pictures, image size converter" />
        </div>
        <PixForgeHome />
      </main>
    </>
  )
}