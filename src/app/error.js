'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App render error:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        gap: '16px',
      }}
    >
      <h2 style={{ fontSize: '1.6rem', margin: 0, color: 'var(--text-primary)' }}>
        Something went wrong
      </h2>
      <p style={{ maxWidth: '460px', color: 'var(--text-secondary)', margin: 0 }}>
        We hit a snag rendering this content. This usually clears up on a retry.
      </p>
      <button
        onClick={() => reset()}
        style={{
          marginTop: '8px',
          padding: '10px 24px',
          borderRadius: '2px',
          border: '1px solid rgba(0,230,118,0.4)',
          background: 'rgba(0,230,118,0.08)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.95rem',
        }}
      >
        Try again
      </button>
    </div>
  )
}
