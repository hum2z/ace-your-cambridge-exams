'use client'

import { useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useRouter } from 'next/navigation'

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Glowing glass loader container */}
        <div style={{
          padding: '40px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(0, 112, 243, 0.1)',
            borderLeftColor: '#0070f3',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ fontSize: '0.9rem', color: '#a0a0a0', letterSpacing: '1px', fontWeight: '500' }}>
            VERIFYING SESSION...
          </span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}
