'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, LogOut, LogIn } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function Header() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isActive = (path) => pathname === path

  return (
    <header className="glass-header">
      <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 style={{ fontSize: '1.5rem', letterSpacing: '-1px', margin: 0, cursor: 'pointer' }}>
            PAST<span style={{ color: 'var(--accent-primary)' }}>PAPER</span>
          </h1>
        </Link>
      </div>

      <nav className="nav-links">
        <Link 
          href="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
          id="nav-link-home"
        >
          Home
        </Link>
        <Link 
          href="/dashboard" 
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
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
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* User profile picture */}
            {user.photoURL && (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'Profile'} 
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                id="header-user-avatar"
              />
            )}
            
            {/* Display Name */}
            <span style={{ fontSize: '0.85rem', color: '#e0e0e0', fontWeight: '500', display: 'none', md: 'block' }} id="header-user-name">
              {user.displayName?.split(' ')[0] || 'User'}
            </span>

            {/* Logout CTA */}
            <button 
              onClick={logout}
              style={{
                background: 'rgba(255, 25, 25, 0.08)',
                border: '1px solid rgba(255, 25, 25, 0.15)',
                color: '#ff4d4d',
                borderRadius: '50px',
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 25, 25, 0.15)' }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255, 25, 25, 0.08)' }}
              id="header-logout-btn"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        ) : (
          <Link href="/login">
            <button 
              className="btn-primary" 
              id="nav-cta-login"
              style={{ 
                borderRadius: '50px', 
                padding: '10px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
              }}
            >
              <LogIn size={14} />
              Sign In
            </button>
          </Link>
        )}
      </div>
    </header>
  )
}
