import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <Link href="/" className="brand-mark" aria-label="AceurExam home">
            <span className="brand-icon" aria-hidden="true"></span>
            <span className="brand-name">AceurExam</span>
          </Link>
          <p className="footer-tagline">
            Quiet tools for ambitious students — topical packs, examiner notes, and an AI tutor in one workspace.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <p className="footer-heading">Explore</p>
          <ul className="footer-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/dashboard">Study workspace</Link></li>
            <li><Link href="/subscription">Pricing</Link></li>
            <li><Link href="/about">About</Link></li>
          </ul>
        </nav>

        <div>
          <p className="footer-heading">Coverage</p>
          <ul className="footer-links">
            <li>Mathematics 9709</li>
            <li>Physics 9702</li>
            <li>Chemistry 9701</li>
            <li>Biology 9700</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} AceurExam</span>
        <span>52.2053° N / 0.1218° E · Cambridge archive</span>
      </div>
    </footer>
  )
}
