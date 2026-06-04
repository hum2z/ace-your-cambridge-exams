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
        <div style={{ padding: '40px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(0,112,243,0.1)', borderLeftColor: '#0070f3', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ fontSize: '0.9rem', color: '#a0a0a0', letterSpacing: '1px', fontWeight: '500' }}>LOADING...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (!isPremium) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div className="grid-bg"></div>
        <div className="grid-lines"></div>
        
        <div className="glow-card" style={{ width: '100%', maxWidth: '500px', padding: '48px', textAlign: 'center', background: 'rgba(5,5,5,0.9)', boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0,112,243,0.08)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,112,243,0.1), rgba(121,40,202,0.1))', marginBottom: '24px' }}>
            <Lock size={32} color="#0070f3" />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(121,40,202,0.1)', border: '1px solid rgba(121,40,202,0.2)', borderRadius: '50px', padding: '6px 14px', color: '#a855f7', fontSize: '0.8rem', fontWeight: '600', marginBottom: '20px' }}>
            <Crown size={12} /> PREMIUM REQUIRED
          </div>

          <h2 style={{ fontSize: '2rem', letterSpacing: '-1px', marginBottom: '12px', background: 'linear-gradient(to right, #ffffff, #a0a0a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Unlock the Study Engine
          </h2>
          <p style={{ color: '#a0a0a0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px', maxWidth: '380px', margin: '0 auto 32px' }}>
            Get unlimited access to Topical Extraction, AI Tutor, Examiner Reports, and Mega-PDF compiling with a Premium Pass.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '28px', textAlign: 'left' }}>
            {['Unlimited Topical Extractions', 'AI Study Tutor 24/7', 'Examiner Intelligence Reports', 'Priority Server Speed'].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', color: '#e0e0e0', fontSize: '0.85rem' }}>
                <Sparkles size={14} color="#0070f3" /> {f}
              </div>
            ))}
          </div>

          <Link href="/subscription">
            <button className="btn-premium" style={{ width: '100%', padding: '15px 28px' }}>
              <Crown size={18} /> Upgrade to Premium — $5/month
            </button>
          </Link>

          <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '16px' }}>
            Secure payment via Ziina · Cancel anytime
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
