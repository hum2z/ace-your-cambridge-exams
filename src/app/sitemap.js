const SITE_URL = 'https://aceurexam.com'

export default function sitemap() {
  const lastModified = new Date()

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/dashboard`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/subscription`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/login`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
