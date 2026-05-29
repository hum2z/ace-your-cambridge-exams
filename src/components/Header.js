'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()

  const isActive = (path) => pathname === path

  return (
    <header className="glass-header">
      <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 style={{ fontSize: '1.5rem', letterSpacing: '-1px', margin: 0, cursor: 'pointer' }}>
            PAST<span style={{ color: '#0070f3' }}>PAPER</span>
          </h1>
        </Link>
      </div>

      <nav className="nav-links">
        <Link 
          href="/home" 
          className={`nav-link ${isActive('/home') ? 'active' : ''}`}
          id="nav-link-home"
        >
          Home
        </Link>
        <Link 
          href="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
          id="nav-link-study"
        >
          Study Companion
        </Link>
        <Link 
          href="/subscription" 
          className={`nav-link ${isActive('/subscription') ? 'active' : ''}`}
          id="nav-link-sub"
        >
          Premium
        </Link>
        <Link 
          href="/about" 
          className={`nav-link ${isActive('/about') ? 'active' : ''}`}
          id="nav-link-about"
        >
          About
        </Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Link href="/">
          <button 
            className="btn-primary" 
            id="nav-cta-study"
            style={{ 
              borderRadius: '50px', 
              padding: '10px 20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            <Sparkles size={14} />
            Launch App
          </button>
        </Link>
      </div>
    </header>
  )
}
