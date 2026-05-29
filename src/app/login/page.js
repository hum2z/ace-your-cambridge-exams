'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'
import { LogIn, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const { user, loading, loginWithGoogle, isMockMode } = useAuth()
  const router = useRouter()
  const [signingIn, setSigningIn] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // If user is already authenticated, redirect them to the study workspace
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleSignIn = async () => {
    try {
      setSigningIn(true)
      setErrorMsg('')
      await loginWithGoogle()
      // Redirection will be handled by the useEffect above
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Authentication failed. Please check your browser popup permission.')
      setSigningIn(false)
    }
  }

  // If loading or user redirect is active, display the loading spinner
  if (loading || (user && !signingIn)) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#0070f3', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div className="grid-bg"></div>
      <div className="grid-lines"></div>

      <div className="glow-card" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '40px',
        textAlign: 'center',
        background: 'rgba(5, 5, 5, 0.85)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0, 112, 243, 0.05)'
      }}>
        {/* Decorative Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(121, 40, 202, 0.1)',
          border: '1px solid rgba(121, 40, 202, 0.2)',
          borderRadius: '50px',
          padding: '6px 14px',
          color: '#a855f7',
          fontSize: '0.8rem',
          fontWeight: '600',
          marginBottom: '24px'
        }}>
          <Sparkles size={12} /> Study Engine Portal
        </div>

        {/* Heading */}
        <h2 style={{ fontSize: '2.2rem', letterSpacing: '-1.5px', color: 'white', marginBottom: '8px' }}>
          Welcome back
        </h2>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '30px', lineHeight: '1.5' }}>
          Sign in to access your topical past paper compiling tools, examiner reports, and your custom AI Tutor sessions.
        </p>

        {/* Mock Alert Info */}
        {isMockMode && (
          <div style={{ 
            background: 'rgba(0, 112, 243, 0.05)', 
            border: '1px solid rgba(0, 112, 243, 0.2)', 
            borderRadius: '12px', 
            padding: '12px 16px', 
            marginBottom: '24px', 
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <CheckCircle size={16} color="#0070f3" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0070f3', display: 'block', textTransform: 'uppercase' }}>Mock Mode Enabled</span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#a0a0a0', lineHeight: '1.4' }}>
                Firebase config keys are currently empty. Sign-in operates in simulation mode with a mock profile.
              </p>
            </div>
          </div>
        )}

        {/* Errors */}
        {errorMsg && (
          <div style={{ 
            background: 'rgba(255, 23, 68, 0.08)', 
            border: '1px solid rgba(255, 23, 68, 0.2)', 
            borderRadius: '12px', 
            padding: '12px 16px', 
            marginBottom: '24px', 
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertCircle size={16} color="#ff1744" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#ff1744', lineHeight: '1.4' }}>{errorMsg}</p>
          </div>
        )}

        {/* Sign In Button */}
        <button 
          onClick={handleSignIn}
          disabled={signingIn}
          style={{
            width: '100%',
            background: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '14px',
            padding: '14px 20px',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: signingIn ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(255,255,255,0.1)'
          }}
          onMouseEnter={(e) => { if(!signingIn) e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(255,255,255,0.15)' }}
          onMouseLeave={(e) => { if(!signingIn) e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(255,255,255,0.1)' }}
          id="google-login-btn"
        >
          {signingIn ? (
            <div style={{ width: '18px', height: '18px', border: '2px solid rgba(0,0,0,0.1)', borderLeftColor: 'black', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          ) : (
            <>
              {/* SVG Google logo */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: 'middle' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign In with Google
            </>
          )}
        </button>

        {/* Small T&C */}
        <div style={{ marginTop: '24px', fontSize: '0.75rem', color: '#666' }}>
          By continuing, you agree to our Terms of Service <br/>
          and Privacy Policy.
        </div>
      </div>
    </div>
  )
}
