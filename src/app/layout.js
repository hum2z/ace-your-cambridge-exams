import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { AuthProvider } from '@/components/AuthContext'

const SITE_URL = 'https://aceurexam.com'

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
    'Cambridge past papers',
    'topical past papers',
    'A Level past papers by topic',
    'CAIE past papers',
    'Maths 9709 past papers',
    'Physics 9702 past papers',
    'Chemistry 9701 past papers',
    'Biology 9700 past papers',
    'examiner report notes',
    'AI tutor Cambridge',
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
        url: '/clean_book.png',
        width: 1024,
        height: 1024,
        alt: 'AceurExam — the Cambridge revision workspace',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AceurExam | Cambridge Past Papers by Topic',
    description:
      'Topical Cambridge past paper packs, examiner notes, and an AI tutor in one workspace.',
    images: ['/clean_book.png'],
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
      logo: `${SITE_URL}/clean_book.png`,
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
      <GoogleAnalytics />
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <ScrollReveal />
        </AuthProvider>
      </body>
    </html>
  )
}
