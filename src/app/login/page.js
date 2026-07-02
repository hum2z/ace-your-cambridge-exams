'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, LogIn, Mail, Sparkles, UserPlus } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

export default function LoginPage() {
  const { user, loading, loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    setErrorMsg('')
    setSuccessMsg('')
    setPassword('')
    setConfirmPassword('')
  }, [activeTab])

  const getFirebaseErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try signing in instead.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.'
      case 'auth/user-not-found':
        return 'No account found with this email. Create one first.'
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please try again.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a moment and try again.'
      default:
        return 'Authentication failed. Please try again.'
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.')
      return
    }
    try {
      setProcessing(true)
      setErrorMsg('')
      await loginWithEmail(email, password)
    } catch (err) {
      setErrorMsg(getFirebaseErrorMessage(err.code))
      setProcessing(false)
    }
  }

  const handleEmailSignup = async (e) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }
    try {
      setProcessing(true)
      setErrorMsg('')
      await signUpWithEmail(email, password)
      setSuccessMsg('Account created. Redirecting...')
    } catch (err) {
      setErrorMsg(getFirebaseErrorMessage(err.code))
      setProcessing(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setProcessing(true)
      setErrorMsg('')
      await loginWithGoogle()
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed. Check popup permissions.')
      setProcessing(false)
    }
  }

  if (loading || (user && !processing)) {
    return (
      <div className="site-page" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.12)', width: 36, height: 36, borderRadius: '50%', borderLeftColor: 'var(--accent-primary)' }}></div>
      </div>
    )
  }

  return (
    <div className="site-page">
      <section className="site-section split-section" style={{ alignItems: 'center' }}>
        <div>
          <p className="section-kicker">Study portal</p>
          <h1 className="section-heading">{activeTab === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
          <p className="section-copy">
            Sign in to keep your paper scan analyses and topical packs connected to your study library.
          </p>
        </div>

        <div className="panel">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18 }} className="section-kicker">
            <Sparkles size={15} /> PastPaper access
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            <button type="button" className={activeTab === 'login' ? 'btn-primary' : 'btn-ghost'} onClick={() => setActiveTab('login')} id="tab-sign-in">
              <LogIn size={16} /> Sign In
            </button>
            <button type="button" className={activeTab === 'signup' ? 'btn-primary' : 'btn-ghost'} onClick={() => setActiveTab('signup')} id="tab-register">
              <UserPlus size={16} /> Register
            </button>
          </div>

          {activeTab === 'signup' && (
            <div className="tool-row" style={{ marginBottom: 18, borderColor: 'rgba(36, 209, 142, 0.32)' }}>
              <Sparkles size={16} color="var(--success)" />
              <span style={{ color: 'var(--success)', fontWeight: 800 }}>30 days of free Premium access included.</span>
            </div>
          )}

          {errorMsg && (
            <div className="tool-row" style={{ marginBottom: 18, borderColor: 'rgba(255, 59, 48, 0.34)' }}>
              <AlertCircle size={16} color="var(--danger)" />
              <span style={{ color: 'var(--danger)' }}>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="tool-row" style={{ marginBottom: 18, borderColor: 'rgba(36, 209, 142, 0.32)' }}>
              <Sparkles size={16} color="var(--success)" />
              <span style={{ color: 'var(--success)' }}>{successMsg}</span>
            </div>
          )}

          <form onSubmit={activeTab === 'login' ? handleEmailLogin : handleEmailSignup} style={{ display: 'grid', gap: 12 }}>
            <label style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                id="email-input"
                aria-label="Email address"
                style={{ paddingLeft: 42 }}
              />
            </label>

            <label style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                id="password-input"
                aria-label="Password"
                style={{ paddingLeft: 42, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-ghost"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                id="toggle-password-btn"
                style={{ position: 'absolute', right: 6, top: 6, minHeight: 34, padding: '8px 10px' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </label>

            {activeTab === 'signup' && (
              <label style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  id="confirm-password-input"
                  aria-label="Confirm password"
                  style={{ paddingLeft: 42 }}
                />
              </label>
            )}

            <button type="submit" disabled={processing} className="btn-primary" id="email-auth-submit-btn" style={{ width: '100%' }}>
              {processing ? 'Working...' : (
                <>
                  {activeTab === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                  {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,248,242,0.14)' }}></div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 800 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,248,242,0.14)' }}></div>
          </div>

          <button onClick={handleGoogleSignIn} disabled={processing} className="google-auth-btn" id="google-login-btn" style={{ width: '100%' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p style={{ marginTop: 18, color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5, textAlign: 'center' }}>
            By continuing, you agree to the Terms of Service and Privacy Policy.
          </p>
        </div>
      </section>
    </div>
  )
}
