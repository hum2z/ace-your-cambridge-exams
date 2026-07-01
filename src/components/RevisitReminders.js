'use client'

import { Clock, GraduationCap } from 'lucide-react'

const REVISIT_DAYS = 7

function daysSince(dateStr) {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
}

// Spaced-repetition-style nudge: flags topics that haven't been touched
// (extracted or self-marked) in a while. There's no email/notification
// infra in this app, so this surfaces in-app only.
export default function RevisitReminders({ quizAttempts, savedTopicals, onPractice }) {
  if (!savedTopicals || savedTopicals.length === 0) return null

  const byKey = new Map()
  for (const t of savedTopicals) {
    const key = `${t.subjectCode}::${t.topic}`
    if (!byKey.has(key) || new Date(t.createdAt) > new Date(byKey.get(key).createdAt)) {
      byKey.set(key, t)
    }
  }

  const lastActivity = new Map()
  for (const t of byKey.values()) {
    lastActivity.set(`${t.subjectCode}::${t.topic}`, t.createdAt)
  }
  for (const a of quizAttempts || []) {
    const key = `${a.subjectCode}::${a.topic}`
    const existing = lastActivity.get(key)
    if (!existing || new Date(a.attemptedAt) > new Date(existing)) {
      lastActivity.set(key, a.attemptedAt)
    }
  }

  const due = Array.from(byKey.values())
    .map(t => ({ topical: t, lastActive: lastActivity.get(`${t.subjectCode}::${t.topic}`) }))
    .filter(({ lastActive }) => lastActive && daysSince(lastActive) >= REVISIT_DAYS)
    .sort((a, b) => new Date(a.lastActive) - new Date(b.lastActive))
    .slice(0, 3)

  if (due.length === 0) return null

  return (
    <section style={{ maxWidth: '900px', margin: '28px auto 0' }} className="fade-in">
      <div style={{ padding: '20px 24px', borderRadius: '2px', background: 'rgba(239,90,43,0.06)', border: '1px dashed rgba(239,90,43,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#ef5a2b', fontWeight: 700, fontSize: '0.9rem' }}>
          <Clock size={16} /> Time to revisit
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {due.map(({ topical, lastActive }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{topical.subjectCode}</span> · {topical.topic}
                <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.75rem' }}>
                  {Math.floor(daysSince(lastActive))} day{Math.floor(daysSince(lastActive)) !== 1 ? 's' : ''} ago
                </span>
              </span>
              <button
                type="button"
                onClick={() => onPractice(topical)}
                style={{ background: 'rgba(239,90,43,0.15)', border: '1px solid rgba(239,90,43,0.3)', color: '#ef5a2b', borderRadius: '2px', padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <GraduationCap size={12} /> Practice again
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
