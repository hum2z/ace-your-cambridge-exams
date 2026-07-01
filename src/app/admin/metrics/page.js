'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthContext'
import { Users, Crown, Sparkles, Gift, GraduationCap } from 'lucide-react'

function StatTile({ icon, label, value }) {
  return (
    <div style={{ padding: '18px 22px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{value}</div>
    </div>
  )
}

export default function AdminMetricsPage() {
  const { user, loading, loginWithGoogle } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      setFetching(true)
      setError(null)
      try {
        const idToken = await user.getIdToken()
        const res = await fetch('/api/admin/metrics', {
          headers: { Authorization: `Bearer ${idToken}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load metrics.')
        setMetrics(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [user])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '60px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Admin metrics</h1>
        <p style={{ color: '#999', marginBottom: 32, fontSize: '0.9rem' }}>Aggregate counts only — no per-user data is shown here.</p>

        {!user && !loading && (
          <button
            onClick={loginWithGoogle}
            style={{ background: 'white', color: 'black', border: 'none', borderRadius: '2px', padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}
          >
            Sign in with Google
          </button>
        )}

        {fetching && <p style={{ color: '#999' }}>Loading...</p>}
        {error && <p style={{ color: '#f87171' }}>{error}</p>}

        {metrics && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
              <StatTile icon={<Users size={14} />} label="Total signups" value={metrics.totalSignups} />
              <StatTile icon={<Crown size={14} />} label="Active premium" value={metrics.activePremium} />
              <StatTile icon={<Sparkles size={14} />} label="On trial" value={metrics.onTrial} />
              <StatTile icon={<Gift size={14} />} label="Successful referrals" value={metrics.successfulReferrals} />
            </div>

            <h2 style={{ fontSize: '1.2rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={18} /> Classrooms
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <StatTile icon={<GraduationCap size={14} />} label="Total classrooms" value={metrics.classrooms.total} />
              <StatTile icon={<Crown size={14} />} label="Active classrooms" value={metrics.classrooms.active} />
              <StatTile icon={<Users size={14} />} label="Total seats sold" value={metrics.classrooms.totalSeats} />
              <StatTile icon={<Users size={14} />} label="Students enrolled" value={metrics.classrooms.studentsEnrolled} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
