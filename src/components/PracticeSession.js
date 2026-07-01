'use client'

import { useState } from 'react'
import { X, FileText, Download, CheckCircle2 } from 'lucide-react'
import { saveQuizAttempt } from '@/lib/firebase'

// A lightweight self-marking practice flow for a saved topical: the student
// attempts the extracted Question Paper, reveals the Mark Scheme, then rates
// how it went. There is no OCR/structured question data available from the
// extraction pipeline (it works at the PDF-page level), so this is an honest
// self-check rather than automated grading — the rating still feeds the
// progress dashboard and spaced-repetition reminders.
const RATINGS = [
  { value: 3, label: 'Nailed it', color: '#22c55e' },
  { value: 2, label: 'Mostly OK', color: '#f59e0b' },
  { value: 1, label: 'Struggled', color: '#ef4444' },
]

export default function PracticeSession({ topical, userId, onClose, onSaved }) {
  const [step, setStep] = useState('attempt') // 'attempt' | 'rate' | 'done'
  const [saving, setSaving] = useState(false)

  const handleRate = async (rating) => {
    setSaving(true)
    try {
      await saveQuizAttempt(userId, {
        subjectCode: topical.subjectCode,
        topic: topical.topic,
        topicalId: topical.id,
        rating,
      })
      setStep('done')
      onSaved && onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg-panel, #0f1520)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', padding: '30px', maxWidth: '480px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ background: 'rgba(96,165,250,0.15)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '2px' }}>{topical.subjectCode}</span>
            <h3 style={{ margin: '8px 0 0', color: 'var(--text-primary)', fontSize: '1.2rem' }}>{topical.topic}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {step === 'attempt' && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Open the question paper and attempt it on paper (or a doc). When you're done, reveal the mark scheme to check your work.
            </p>
            {topical.qpUrl && (
              <a href={topical.qpUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: 'var(--accent-primary)', borderRadius: '2px', textDecoration: 'none', marginBottom: '12px', fontWeight: 600 }}>
                <Download size={16} /> Open Question Paper
              </a>
            )}
            <button
              type="button"
              onClick={() => setStep('rate')}
              style={{ width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, #ef5a2b, #c93f17)', border: 'none', color: 'white', fontWeight: 700, borderRadius: '2px', cursor: 'pointer' }}
            >
              I've attempted it — reveal Mark Scheme
            </button>
          </>
        )}

        {step === 'rate' && (
          <>
            {topical.msUrl && (
              <a href={topical.msUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#ef5a2b', borderRadius: '2px', textDecoration: 'none', marginBottom: '20px', fontWeight: 600 }}>
                <FileText size={16} /> Open Mark Scheme
              </a>
            )}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '14px' }}>How did it go, honestly?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {RATINGS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  disabled={saving}
                  onClick={() => handleRate(r.value)}
                  style={{ flex: 1, padding: '12px 8px', borderRadius: '2px', border: `1px solid ${r.color}55`, background: `${r.color}18`, color: r.color, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={40} color="#22c55e" style={{ marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '20px' }}>Logged! This feeds your progress dashboard and revisit reminders.</p>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '2px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
