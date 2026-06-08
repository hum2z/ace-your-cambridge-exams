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
        background: 'var(--bg-color)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 70, 26, 0.1)',
            borderLeftColor: '#ff461a',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '800' }}>
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
