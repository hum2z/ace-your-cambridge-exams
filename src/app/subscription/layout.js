import { subscriptionFaqs } from '@/lib/faqs'

export const metadata = {
  title: 'Pricing — Premium Study Pass, $5 for 30 Days',
  description:
    'One simple price: $5 USD for 30 days of unlimited topical extractions, examiner intelligence reports, AI tutor access, and past paper downloads.',
  alternates: { canonical: '/subscription' },
}

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: subscriptionFaqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function SubscriptionLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      {children}
    </>
  )
}
