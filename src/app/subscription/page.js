'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, ChevronDown, CreditCard, Crown, Shield, Zap } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'
import { subscriptionFaqs as faqs } from '@/lib/faqs'

const features = [
  'Unlimited past paper scans',
  'AI weakness analysis reports',
  'Unlimited topical snippet extractions',
  'Authentic past paper downloads',
  'Priority server speed',
]

export default function SubscriptionPage() {
  const { user, isPremium, subscription } = useAuth()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  const isCancelled = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cancelled')
  const daysRemaining = subscription?.expiresAt
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0

  const handleActivatePremium = async () => {
    setErrorMsg('')

    if (!user) {
      router.push('/login')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      if (data.redirect_url) {
        window.location.href = data.redirect_url
      } else {
        throw new Error('No redirect URL received from payment service')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setErrorMsg(error.message || 'Something went wrong. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <div className="site-page">
      <section className="site-section split-section">
        <div>
          <p className="section-kicker">Pricing</p>
          <h1 className="section-heading">Full access, simple price.</h1>
          <p className="section-copy">
            Keep every paper scan, weakness analysis, and topical pack available for a focused 30-day exam sprint.
          </p>
        </div>

        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
            <div>
              <span className="section-kicker" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {isPremium ? <Crown size={16} /> : <Zap size={16} />}
                {isPremium ? 'Active' : 'Pro study pass'}
              </span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginTop: 10 }}>Premium</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', lineHeight: 0.86, fontWeight: 900 }}>$5</div>
              <div style={{ color: 'var(--text-muted)', fontWeight: 700, marginTop: 8 }}>USD / 30 days</div>
            </div>
          </div>

          {isPremium && (
            <div className="tool-row" style={{ marginTop: 24, borderColor: 'rgba(36, 209, 142, 0.35)' }}>
              <strong style={{ color: 'var(--success)' }}>Premium active</strong>
              <span style={{ color: 'var(--text-secondary)' }}>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</span>
              {subscription?.expiresAt && (
                <div className="tool-meta" style={{ gridColumn: '1 / -1' }}>
                  Expires {new Date(subscription.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>
          )}

          <ul className="feature-list">
            {features.map((feature) => (
              <li key={feature} className="feature-item">
                <Check size={18} color="var(--success)" /> {feature}
              </li>
            ))}
          </ul>

          {errorMsg && (
            <div className="tool-row" style={{ borderColor: 'rgba(255, 59, 48, 0.35)', marginBottom: 16 }}>
              <AlertCircle size={18} color="var(--danger)" />
              <span style={{ color: 'var(--danger)' }}>{errorMsg}</span>
            </div>
          )}

          <button type="button" className="btn-apple-pay" onClick={handleActivatePremium} disabled={processing} id="apple-pay-trigger-btn">
            {processing ? 'Connecting...' : 'Pay with Apple Pay'}
          </button>
          <button
            type="button"
            className="btn-premium"
            onClick={handleActivatePremium}
            disabled={processing}
            id="checkout-trigger-btn"
            style={{ width: '100%', marginTop: 12 }}
          >
            <CreditCard size={18} /> {processing ? 'Connecting...' : isPremium ? 'Renew Premium' : 'Pay with Card / Google Pay'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            <Shield size={15} color="var(--success)" /> Secure payments via Ziina
          </div>

          {!user && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 12 }}>
              You will be asked to sign in before checkout.
            </p>
          )}
        </div>
      </section>

      {isCancelled && (
        <section className="site-section" style={{ paddingTop: 28 }}>
          <div className="panel" style={{ borderColor: 'rgba(15, 118, 110, 0.42)' }}>
            <AlertCircle size={18} color="var(--accent-soft)" />
            <p style={{ marginTop: 10, color: 'var(--text-secondary)' }}>Payment was cancelled. You can try again whenever you are ready.</p>
          </div>
        </section>
      )}

      <section className="site-section" style={{ paddingTop: 82 }}>
        <p className="section-kicker">FAQ</p>
        <h2 className="section-heading">A few practical details.</h2>
        <div className="faq-container">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index
            return (
              <div key={faq.q} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => setOpenFaq(isOpen ? null : index)} id={`faq-btn-${index}`}>
                  <span>{faq.q}</span>
                  <ChevronDown size={18} color={isOpen ? 'var(--accent-soft)' : 'currentColor'} aria-hidden="true" />
                </button>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
