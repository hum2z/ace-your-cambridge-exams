import './globals.css'

export const metadata = {
  title: 'Antigravity Past Papers',
  description: 'The ultimate study companion for Cambridge students',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="glass-header">
          <div className="logo">
            <h1 style={{ fontSize: '1.5rem', letterSpacing: '-1px' }}>
              PAST<span style={{ color: '#0070f3' }}>PAPER</span>
            </h1>
          </div>
          <nav>
            {/* Wallet button removed per user request */}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
