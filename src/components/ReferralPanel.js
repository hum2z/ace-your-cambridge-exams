'use client'

import { useEffect, useState } from 'react'
import { Gift, Copy, Check } from 'lucide-react'
import { getReferralCount } from '@/lib/firebase'

export default function ReferralPanel({ userId }) {
  const [count, setCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [link, setLink] = useState('')

  useEffect(() => {
    if (!userId) return
    getReferralCount(userId).then(setCount)
    setLink(`${window.location.origin}/login?ref=${userId}`)
  }, [userId])

  const handleCopy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!userId) return null

  return (
    <section style={{ maxWidth: '900px', margin: '28px auto 0' }} className="fade-in">
      <div style={{ padding: '24px 30px', borderRadius: '2px', background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Gift size={22} color="var(--accent-primary)" />
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Refer a friend, both get a free extraction + notes generation</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{count} successful referral{count !== 1 ? 's' : ''} so far</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{ background: 'rgba(239,90,43,0.12)', border: '1px solid rgba(239,90,43,0.3)', color: '#ef5a2b', borderRadius: '2px', padding: '10px 18px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy invite link'}
        </button>
      </div>
    </section>
  )
}
