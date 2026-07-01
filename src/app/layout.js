import './globals.css'
import Script from 'next/script'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import { AuthProvider } from '@/components/AuthContext'

const SITE_URL = 'https://aceurexam.com'
const GA_MEASUREMENT_ID = 'G-V4PDPXBNPQ'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AceurExam | Cambridge Past Papers by Topic, Examiner Notes & AI Tutor',
    template: '%s | AceurExam',
  },
  description:
    'Build topical Cambridge past paper packs in seconds. Search AS & A-Level papers (Maths 9709, Physics 9702, Chemistry 9701, Biology 9700) by topic, get examiner notes, and study with an AI tutor.',
  applicationName: 'AceurExam',
  keywords: [
    // Brand
    'AceurExam',
    'aceurexam',
    'ace ur exam',
    'ace your exam',
    'ace your exams',
    'aceurexam.com',
    'AceurExam topicals',
    // Topical / product
    'topicals',
    'topical questions',
    'topical past papers',
    'topical past paper packs',
    'past papers by topic',
    'topical question bank',
    'A Level topicals',
    'AS Level topicals',
    'IGCSE topicals',
    // Past papers
    'Cambridge past papers',
    'CAIE past papers',
    'CIE past papers',
    'A Level past papers',
    'AS Level past papers',
    'A Level past papers by topic',
    'Cambridge International past papers',
    // Subjects
    'Maths 9709 past papers',
    'Physics 9702 past papers',
    'Chemistry 9701 past papers',
    'Biology 9700 past papers',
    'Maths 9709 topicals',
    'Physics 9702 topicals',
    'Chemistry 9701 topicals',
    'Biology 9700 topicals',
    // Study tools
    'examiner report notes',
    'examiner notes',
    'mark scheme notes',
    'AI tutor Cambridge',
    'AI exam tutor',
    'Cambridge revision',
    'A Level revision',
    'exam preparation',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'AceurExam',
    title: 'AceurExam | Cambridge Past Papers by Topic, Examiner Notes & AI Tutor',
    description:
      'Build topical Cambridge past paper packs in seconds, read examiner intelligence, and study with an AI tutor — all in one workspace.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AceurExam — Cambridge past papers by topic, examiner notes & AI tutor',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AceurExam | Cambridge Past Papers by Topic',
    description:
      'Topical Cambridge past paper packs, examiner notes, and an AI tutor in one workspace.',
    images: ['/og-image.png'],
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
  category: 'education',
}

export const viewport = {
  themeColor: '#14110e',
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'AceurExam',
      url: SITE_URL,
      logo: `${SITE_URL}/logo-square.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'AceurExam',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'AceurExam',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      description:
        'A Cambridge revision workspace: topical past paper extraction, examiner notes, and an AI tutor for AS & A-Level subjects.',
      offers: {
        '@type': 'Offer',
        price: '5.00',
        priceCurrency: 'USD',
        description: '30 days of premium access',
      },
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <ScrollReveal />
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  )
}
