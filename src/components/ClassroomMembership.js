'use client'

import { useState, useEffect } from 'react'
import { Users, LogOut, KeyRound } from 'lucide-react'
import { useAuth } from './AuthContext'
import { getClassroom } from '@/lib/firebase'

// Accepts either the full invite link (https://.../login?classId=X&code=Y)
// or a bare "classId:code" pair typed by hand.
function parseInviteInput(input) {
  const trimmed = input.trim()
  try {
    const url = new URL(trimmed)
    const classId = url.searchParams.get('classId')
    const inviteCode = url.searchParams.get('code')
    if (classId && inviteCode) return { classId, inviteCode }
  } catch {
    // not a URL, fall through
  }
  const parts = trimmed.split(/[\s:]+/).filter(Boolean)
  if (parts.length === 2) return { classId: parts[0], inviteCode: parts[1] }
  return null
}

// Joining here is an explicit, deliberate action by an already-authenticated
// user (unlike the ?classId=&code= auto-capture on /login, which is gated to
// brand-new signups only to avoid silently enrolling someone via a stale
// invite link left in localStorage on a shared computer).
export default function ClassroomMembership() {
  const { user, subscription, refreshSubscription } = useAuth()
  const [classroom, setClassroom] = useState(null)
  const [inviteInput, setInviteInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const classroomId = subscription?.classroomId

  useEffect(() => {
    if (!classroomId) {
      setClassroom(null)
      return
    }
    getClassroom(classroomId).then(setClassroom)
  }, [classroomId])

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    const parsed = parseInviteInput(inviteInput)
    if (!parsed) {
      setError("Paste your teacher's full invite link, or enter it as classId:code.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/classroom/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, classId: parsed.classId, inviteCode: parsed.inviteCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join classroom.')
      setInviteInput('')
      await refreshSubscription(user.uid)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Leave this classroom? You will lose access once your own plan expires.')) return
    setBusy(true)
    try {
      await fetch('/api/classroom/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, classId: classroomId }),
      })
      await refreshSubscription(user.uid)
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  return (
    <section style={{ maxWidth: '900px', margin: '28px auto 0' }} className="fade-in">
      <div style={{ padding: '20px 24px', borderRadius: '2px', background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Users size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>Classroom</h3>
        </div>

        {classroomId ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              You&apos;re a member of <strong style={{ color: 'var(--text-primary)' }}>{classroom?.name || 'a classroom'}</strong>.
            </span>
            <button
              type="button"
              onClick={handleLeave}
              disabled={busy}
              style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626', borderRadius: '2px', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LogOut size={14} /> Leave classroom
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoin} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="search-input"
              placeholder="Have a teacher's invite link? Paste it here to join."
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              style={{ flex: 1, minWidth: '220px' }}
            />
            <button
              type="submit"
              disabled={busy || !inviteInput.trim()}
              style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', color: 'var(--accent-primary)', borderRadius: '2px', padding: '10px 16px', fontSize: '0.8rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <KeyRound size={14} /> Join
            </button>
          </form>
        )}
        {error && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 10 }}>{error}</p>}
      </div>
    </section>
  )
}
