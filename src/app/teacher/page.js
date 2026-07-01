'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Users, Copy, Check, CreditCard, Clock } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/components/AuthContext'
import { createClassroom, getClassroomForTeacher, isClassroomActive, PRICE_PER_SEAT_FILS } from '@/lib/firebase'

const PRICE_PER_SEAT_USD = PRICE_PER_SEAT_FILS / 100

function TeacherDashboard() {
  const { user } = useAuth()
  const [classroom, setClassroom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [seatCount, setSeatCount] = useState(20)
  const [creating, setCreating] = useState(false)
  const [activating, setActivating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)
      const c = await getClassroomForTeacher(user.uid)
      setClassroom(c)
      setLoading(false)
    }
    load()
  }, [user])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim() || seatCount < 1) return
    setCreating(true)
    try {
      const id = await createClassroom(user.uid, name.trim(), Number(seatCount))
      const c = await getClassroomForTeacher(user.uid)
      setClassroom(c)
    } catch (err) {
      setError('Failed to create classroom.')
    } finally {
      setCreating(false)
    }
  }

  const handleActivate = async () => {
    setActivating(true)
    setError('')
    try {
      const res = await fetch('/api/create-classroom-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: classroom.id, teacherUid: user.uid }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.redirect_url
    } catch (err) {
      setError(err.message)
      setActivating(false)
    }
  }

  const inviteLink = classroom ? `${typeof window !== 'undefined' ? window.location.origin : ''}/login?classId=${classroom.id}&code=${classroom.inviteCode}` : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="site-page" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.12)', width: 36, height: 36, borderRadius: '50%', borderLeftColor: 'var(--accent-primary)' }}></div>
      </div>
    )
  }

  return (
    <div className="site-page">
      <div className="grid-bg"></div>
      <div className="grid-lines"></div>

      <section className="site-section split-section" style={{ alignItems: 'end' }}>
        <div>
          <p className="section-kicker">For teachers &amp; schools</p>
          <h1 className="section-heading fade-in">Bulk seats for your class.</h1>
        </div>
        <p className="section-copy fade-in">
          Pay once for a block of seats (${PRICE_PER_SEAT_USD}/seat, 30 days) and share one invite link — every student who joins gets full Premium access.
        </p>
      </section>

      <section style={{ maxWidth: '640px', margin: '28px auto 0' }} className="fade-in">
        {!classroom && (
          <form onSubmit={handleCreate} className="panel" style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GraduationCap size={22} color="var(--accent-primary)" />
              <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Create your classroom</h3>
            </div>
            <label>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Class / school name</p>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 12 Physics" />
            </label>
            <label>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Number of seats</p>
              <input className="form-input" type="number" min={1} max={500} value={seatCount} onChange={(e) => setSeatCount(e.target.value)} />
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Estimated cost: <strong style={{ color: 'var(--text-primary)' }}>${(Number(seatCount) || 0) * PRICE_PER_SEAT_USD}</strong> for {seatCount || 0} seats / 30 days.
            </p>
            <button type="submit" className="btn-primary" disabled={creating || !name.trim()}>
              {creating ? 'Creating...' : 'Create classroom'}
            </button>
          </form>
        )}

        {classroom && classroom.status === 'pending' && (
          <div className="panel" style={{ display: 'grid', gap: 14 }}>
            <h3 style={{ margin: 0 }}>{classroom.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {classroom.seatCount} seats requested — ${classroom.seatCount * (classroom.pricePerSeatFils / 100)} for 30 days.
            </p>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
            <button type="button" className="btn-premium" onClick={handleActivate} disabled={activating}>
              <CreditCard size={18} /> {activating ? 'Connecting...' : 'Pay & activate classroom'}
            </button>
          </div>
        )}

        {classroom && isClassroomActive(classroom) && (
          <div className="panel" style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ margin: 0 }}>{classroom.name}</h3>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: '0.85rem', fontWeight: 700 }}>
                <Clock size={14} /> Active until {new Date(classroom.expiresAt).toLocaleDateString()}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Users size={16} /> {(classroom.studentUids || []).length} / {classroom.seatCount} seats used
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Share this invite link with your students:</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" readOnly value={inviteLink} style={{ flex: 1, fontSize: '0.8rem' }} />
                <button type="button" className="btn-ghost" onClick={handleCopy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <button type="button" className="btn-primary" onClick={handleActivate} disabled={activating}>
              {activating ? 'Connecting...' : 'Renew for another 30 days'}
            </button>
          </div>
        )}

        {classroom && classroom.status === 'active' && !isClassroomActive(classroom) && (
          <div className="panel" style={{ display: 'grid', gap: 14 }}>
            <h3 style={{ margin: 0 }}>{classroom.name}</h3>
            <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>This classroom's seats have expired.</p>
            <button type="button" className="btn-premium" onClick={handleActivate} disabled={activating}>
              <CreditCard size={18} /> {activating ? 'Connecting...' : 'Renew classroom'}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default function TeacherPage() {
  return (
    <AuthGuard>
      <TeacherDashboard />
    </AuthGuard>
  )
}
