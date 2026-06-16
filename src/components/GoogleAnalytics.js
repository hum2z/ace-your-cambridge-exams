'use client'

import Script from 'next/script'

// Reads your GA4 Measurement ID (looks like G-XXXXXXXXXX) from the environment.
// Set NEXT_PUBLIC_GA_MEASUREMENT_ID in Vercel (and .env.local for local dev).
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function GoogleAnalytics() {
  // Render nothing until a Measurement ID is configured, so dev builds stay clean.
  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  )
}
