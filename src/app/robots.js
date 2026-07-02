const SITE_URL = 'https://aceurexam.com'

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/print-topical-pack',
        '/subscription/success',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
