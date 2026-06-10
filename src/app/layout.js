import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import { AuthProvider } from '@/components/AuthContext'

export const metadata = {
  title: 'AceurExam | The AI Cambridge Study Companion',
  description: 'Unlock your Cambridge potential. Generate topical past paper packages, get examiner notes, and study with an active AI Tutor.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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
