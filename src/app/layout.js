import './globals.css'
import Header from '@/components/Header'

export const metadata = {
  title: 'Past Paper | The AI Cambridge Study Companion',
  description: 'Unlock your Cambridge potential. Generate topical past paper packages, get examiner notes, and study with an active AI Tutor.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
