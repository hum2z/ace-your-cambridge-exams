'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'
import { LogIn, Sparkles, AlertCircle, Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const { user, loading, loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'signup'
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

  // Clear messages when switching tabs
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
      setSuccessMsg('Account created! Redirecting...')
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
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#0070f3', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  // Shared input styles
  const inputWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    transition: 'all 0.25s ease',
    overflow: 'hidden'
  }

  const inputStyle = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '15px 16px 15px 48px',
    color: 'white',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'Inter, sans-serif'
  }

  const inputIconStyle = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#666',
    pointerEvents: 'none',
    transition: 'color 0.2s'
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div className="grid-bg"></div>
      <div className="grid-lines"></div>

      <div className="glow-card" style={{
        width: '100%',
        maxWidth: '460px',
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
          {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '28px', lineHeight: '1.5' }}>
          {activeTab === 'login'
            ? 'Sign in to access your topical past paper compiling tools, examiner reports, and your custom AI Tutor sessions.'
            : 'Sign up to get 30 days of free premium access — topical extractions, AI tutor, and examiner reports.'}
        </p>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <button
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: '10px',
              background: activeTab === 'login' ? 'rgba(0,112,243,0.15)' : 'transparent',
              color: activeTab === 'login' ? '#0070f3' : '#666',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            id="tab-sign-in"
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: '10px',
              background: activeTab === 'signup' ? 'rgba(0,230,118,0.12)' : 'transparent',
              color: activeTab === 'signup' ? '#00e676' : '#666',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            id="tab-register"
          >
            <UserPlus size={14} /> Register
          </button>
        </div>

        {/* 30-day trial badge for signup tab */}
        {activeTab === 'signup' && (
          <div style={{
            background: 'rgba(0,230,118,0.06)',
            border: '1px solid rgba(0,230,118,0.15)',
            borderRadius: '12px',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <Sparkles size={14} color="#00e676" />
            <span style={{ fontSize: '0.8rem', color: '#00e676', fontWeight: '600' }}>
              30 days of free Premium access included with every new account
            </span>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.08)',
            border: '1px solid rgba(255, 23, 68, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <AlertCircle size={16} color="#ff1744" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#ff1744', lineHeight: '1.4' }}>{errorMsg}</p>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div style={{
            background: 'rgba(0,230,118,0.08)',
            border: '1px solid rgba(0,230,118,0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <Sparkles size={16} color="#00e676" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#00e676', lineHeight: '1.4' }}>{successMsg}</p>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={activeTab === 'login' ? handleEmailLogin : handleEmailSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {/* Email Field */}
          <div
            style={inputWrapperStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,112,243,0.4)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,112,243,0.1)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Mail size={16} style={inputIconStyle} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              autoComplete="email"
              id="email-input"
              aria-label="Email address"
            />
          </div>

          {/* Password Field */}
          <div
            style={inputWrapperStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,112,243,0.4)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,112,243,0.1)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Lock size={16} style={inputIconStyle} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
              id="password-input"
              aria-label="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0 14px',
                cursor: 'pointer',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#aaa'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              id="toggle-password-btn"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Confirm Password (only for signup) */}
          {activeTab === 'signup' && (
            <div
              style={{ ...inputWrapperStyle, animation: 'fadeIn 0.3s ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,112,243,0.4)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,112,243,0.1)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <Lock size={16} style={inputIconStyle} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
                autoComplete="new-password"
                id="confirm-password-input"
                aria-label="Confirm password"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={processing}
            style={{
              width: '100%',
              background: activeTab === 'login'
                ? 'linear-gradient(135deg, #0070f3, #0051a8)'
                : 'linear-gradient(135deg, #00c853, #00897b)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '15px 20px',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: processing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.25s ease',
              boxShadow: activeTab === 'login'
                ? '0 4px 15px rgba(0,112,243,0.3)'
                : '0 4px 15px rgba(0,200,83,0.3)',
              opacity: processing ? 0.7 : 1,
              marginTop: '4px'
            }}
            onMouseEnter={(e) => { if (!processing) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = activeTab === 'login' ? '0 6px 20px rgba(0,112,243,0.4)' : '0 6px 20px rgba(0,200,83,0.4)' } }}
            onMouseLeave={(e) => { if (!processing) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = activeTab === 'login' ? '0 4px 15px rgba(0,112,243,0.3)' : '0 4px 15px rgba(0,200,83,0.3)' } }}
            id="email-auth-submit-btn"
          >
            {processing ? (
              <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderLeftColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            ) : (
              <>
                {activeTab === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '6px 0 20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
          <span style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={processing}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '14px 20px',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: processing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { if (!processing) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          onMouseLeave={(e) => { if (!processing) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          id="google-login-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: 'middle' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
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
