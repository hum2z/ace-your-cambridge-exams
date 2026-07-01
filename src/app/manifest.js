export default function manifest() {
  return {
    name: 'AceurExam — Cambridge & Edexcel Past Paper Study Tools',
    short_name: 'AceurExam',
    description: 'Topical past paper extraction, examiner notes, and AI tutoring for Cambridge and Edexcel exam prep.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#06101d',
    theme_color: '#ef5a2b',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/logo-square.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
