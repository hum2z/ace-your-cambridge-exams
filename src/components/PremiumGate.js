'use client'

import { useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Crown, Lock, ArrowRight, Sparkles } from 'lucide-react'

export default function PremiumGate({ children }) {
  const { user, loading, isPremium } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(37, 99, 235,0.1)', borderLeftColor: '#2563eb', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '800' }}>LOADING...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (!isPremium) {
    return (
      <div className="site-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="grid-bg"></div>
        <div className="grid-lines"></div>
        
        <div className="panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', borderRadius: '8px', background: 'rgba(37, 99, 235,0.14)', marginBottom: '24px' }}>
            <Lock size={32} color="#2563eb" />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 118, 110,0.12)', border: '1px solid rgba(15, 118, 110,0.24)', borderRadius: '8px', padding: '8px 12px', color: '#0f766e', fontSize: '0.8rem', fontWeight: '800', marginBottom: '20px' }}>
            <Crown size={12} /> PREMIUM REQUIRED
          </div>

          <h2 style={{ fontSize: '2rem', letterSpacing: '0', marginBottom: '12px' }}>
            Unlock the Study Engine
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px', maxWidth: '380px', margin: '0 auto 32px' }}>
            Get unlimited access to Topical Extraction, AI Tutor, Examiner Reports, and Mega-PDF compiling with a Premium Pass.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px', marginBottom: '28px', textAlign: 'left' }}>
            {['Unlimited Topical Extractions', 'AI Study Tutor 24/7', 'Examiner Intelligence Reports', 'Priority Server Speed'].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Sparkles size={14} color="#2563eb" /> {f}
              </div>
            ))}
          </div>

          <Link href="/subscription" style={{ textDecoration: 'none' }}>
            <button className="btn-premium" style={{ width: '100%' }}>
              <Crown size={18} /> Upgrade to Premium — $5/month
            </button>
          </Link>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '16px' }}>
            Secure payment via Ziina · Cancel anytime
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
