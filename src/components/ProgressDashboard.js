'use client'

import { TrendingUp, Target } from 'lucide-react'

const RATING_LABEL = { 3: 'Nailed it', 2: 'Mostly OK', 1: 'Struggled' }
const RATING_COLOR = { 3: '#22c55e', 2: '#f59e0b', 1: '#ef4444' }

function groupByTopic(attempts) {
  const groups = new Map()
  for (const a of attempts) {
    const key = `${a.subjectCode}::${a.topic}`
    if (!groups.has(key)) {
      groups.set(key, { subjectCode: a.subjectCode, topic: a.topic, ratings: [], lastAttemptedAt: a.attemptedAt })
    }
    const g = groups.get(key)
    g.ratings.push(a.rating)
    if (new Date(a.attemptedAt) > new Date(g.lastAttemptedAt)) g.lastAttemptedAt = a.attemptedAt
  }
  return Array.from(groups.values()).map(g => ({
    ...g,
    avgRating: g.ratings.reduce((s, r) => s + r, 0) / g.ratings.length,
    attempts: g.ratings.length,
  }))
}

export default function ProgressDashboard({ quizAttempts }) {
  if (!quizAttempts || quizAttempts.length === 0) return null

  const topics = groupByTopic(quizAttempts)
  const overallAvg = quizAttempts.reduce((s, a) => s + a.rating, 0) / quizAttempts.length
  const weakest = [...topics].sort((a, b) => a.avgRating - b.avgRating).slice(0, 3)

  return (
    <section style={{ maxWidth: '900px', margin: '28px auto 0' }} className="fade-in">
      <div style={{ padding: '30px', borderRadius: '2px', background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <TrendingUp size={22} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Your Progress</h3>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{quizAttempts.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Practice attempts logged</div>
          </div>
          <div style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: RATING_COLOR[Math.round(overallAvg)] || 'var(--text-primary)' }}>{overallAvg.toFixed(1)}/3</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overall self-rating</div>
          </div>
          <div style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{topics.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Topics practiced</div>
          </div>
        </div>

        {weakest.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              <Target size={14} /> Focus areas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {weakest.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '2px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{t.subjectCode}</span> · {t.topic}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: RATING_COLOR[Math.round(t.avgRating)], fontWeight: 700 }}>
                    {RATING_LABEL[Math.round(t.avgRating)]} · {t.attempts} attempt{t.attempts !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
