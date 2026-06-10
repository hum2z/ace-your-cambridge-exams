'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function Header() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path) => pathname === path

  return (
    <header className={`glass-header ${scrolled ? 'scrolled' : ''}`}>
      <Link href="/" className="brand-mark" aria-label="AceurExam home">
        <span className="brand-icon" aria-hidden="true"></span>
        <span className="brand-name">AceurExam</span>
      </Link>

      <nav className="nav-links" aria-label="Primary navigation">
        <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} id="nav-link-home">
          Home
        </Link>
        <Link href="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} id="nav-link-study">
          Study
        </Link>
        <Link href="/subscription" className={`nav-link ${isActive('/subscription') ? 'active' : ''}`} id="nav-link-sub">
          Pricing
        </Link>
        <Link href="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`} id="nav-link-about">
          About
        </Link>
      </nav>

      <div className="header-actions">
        {user ? (
          <div className="header-user">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Profile'}
                className="header-avatar"
                id="header-user-avatar"
              />
            )}
            <span className="header-name" id="header-user-name">
              {user.displayName?.split(' ')[0] || 'User'}
            </span>
            <button type="button" onClick={logout} className="btn-ghost" id="header-logout-btn">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn-primary" id="nav-cta-login">
            <LogIn size={14} /> Sign In
          </Link>
        )}
      </div>
    </header>
  )
}
