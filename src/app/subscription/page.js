'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CreditCard, Shield, ChevronDown, ChevronUp, Crown, Zap, ExternalLink, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

export default function SubscriptionPage() {
  const { user, isPremium, subscription, loading } = useAuth()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState(null)
  const [iframeLoading, setIframeLoading] = useState(true)

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null)
  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index)

  // Check if URL has cancelled param
  const isCancelled = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cancelled')

  const handleActivatePremium = async () => {
    setErrorMsg('')

    // Must be logged in
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
          userEmail: user.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      if (data.redirect_url) {
        // Redirect directly to payment portal to bypass X-Frame-Options / CSP restrictions on iframe embedding
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

  const handleCloseModal = () => {
    setCheckoutUrl(null)
    setIframeLoading(true)
    setProcessing(false)
  }

  // Calculate days remaining for active subscription
  const daysRemaining = subscription?.expiresAt
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0

  const faqs = [
    {
      q: "What does the Premium Study Pass include?",
      a: "The Premium Study Pass unlocks absolute, unrestricted access to the entire Past Paper ecosystem. You get unlimited Topical Snippet extractions (all subjects, all variants, all years), instant Examiner Intelligence Reports, 24/7 AI Tutor chat interactions, and unlimited Authentic Mega-PDF compiles."
    },
    {
      q: "How does billing work?",
      a: "Each payment grants you 30 days of full premium access. When your access expires, you can renew with a single click. Payments are processed securely through Ziina — your card details never touch our servers."
    },
    {
      q: "Is there a money-back guarantee?",
      a: "Yes! We stand behind our companion. We offer a 14-day money-back guarantee. If you are not satisfied with Past Paper's features, contact our support team and we will refund your billing, no questions asked."
    },
    {
      q: "What subjects and paper types are supported?",
      a: "We currently support standard Cambridge AS & A-Level syllabi (including Mathematics 9709, Physics 9702, Chemistry 9701, Biology 9700, and more). More GCSE, IG, and advanced international subject archives are compiled daily."
    },
    {
      q: "Is my payment information secure?",
      a: "Absolutely. All payments are processed through Ziina, a secure and regulated payment gateway. Your card information is handled entirely on Ziina's PCI-compliant servers — none of your payment credentials ever touch our servers."
    }
  ]

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', padding: '0 24px', paddingBottom: '120px' }}>
      {/* Visual background accents */}
      <div className="grid-bg"></div>
      <div className="grid-lines"></div>

      {/* Hero section */}
      <section style={{ maxWidth: '800px', margin: '100px auto 0', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          letterSpacing: '-2px', 
          marginBottom: '16px',
          background: 'linear-gradient(to right, #ffffff, #a0a0a0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Unleash <span style={{ background: 'linear-gradient(to right, #0070f3, #7928ca)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Unlimited Studying</span>
        </h1>
        <p style={{ color: '#a0a0a0', fontSize: '1.1rem', maxWidth: '550px', margin: '0 auto 50px', lineHeight: '1.6' }}>
          Accelerate your AS/A-Level exam grades with fully unlocked AI synthesis and paper compiling. One simple plan. Renew anytime.
        </p>
      </section>

      {/* Cancelled payment notice */}
      {isCancelled && (
        <div style={{
          maxWidth: '480px', margin: '0 auto 24px', padding: '14px 20px',
          background: 'rgba(255, 152, 0, 0.06)', border: '1px solid rgba(255, 152, 0, 0.2)',
          borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px',
          color: '#ff9800', fontSize: '0.85rem'
        }}>
          <AlertCircle size={18} />
          <span>Payment was cancelled. You can try again whenever you're ready.</span>
        </div>
      )}

      {/* Premium Pricing Card */}
      <section style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
        <div className="glow-card" style={{ 
          width: '100%', 
          maxWidth: '480px', 
          padding: '40px',
          border: isPremium ? '1px solid rgba(0, 230, 118, 0.25)' : '1px solid rgba(0, 112, 243, 0.25)',
          background: 'rgba(5, 5, 5, 0.85)',
          boxShadow: isPremium 
            ? '0 30px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,230,118,0.1)' 
            : '0 30px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,112,243,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              {isPremium ? (
                <span style={{ 
                  background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.3)',
                  borderRadius: '50px', padding: '6px 12px', color: '#00e676',
                  fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '5px'
                }}>
                  <Crown size={12} /> ACTIVE
                </span>
              ) : (
                <span style={{ 
                  background: 'rgba(0,112,243,0.15)', border: '1px solid rgba(0,112,243,0.3)',
                  borderRadius: '50px', padding: '6px 12px', color: '#0070f3',
                  fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                  PRO STUDY PASS
                </span>
              )}
              <h2 style={{ fontSize: '2rem', marginTop: '12px', marginBottom: 0, color: 'white' }}>
                Full Access Pass
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.8rem', fontWeight: '800', color: 'white', lineHeight: '1' }}>$5</div>
              <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginTop: '4px' }}>USD / 30 days</div>
            </div>
          </div>

          {/* Active subscription info */}
          {isPremium && (
            <div style={{
              background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.15)',
              borderRadius: '12px', padding: '14px 18px', marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#00e676', fontSize: '0.85rem', fontWeight: '600' }}>
                  Premium Active
                </span>
                <span style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                </span>
              </div>
              {subscription?.expiresAt && (
                <p style={{ color: '#666', fontSize: '0.75rem', margin: '6px 0 0 0' }}>
                  Expires {new Date(subscription.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          )}

          <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '30px', lineHeight: '1.5' }}>
            Empowers you with unlimited AI tutor requests, rapid topical extractions, and priority server merges.
          </p>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '30px' }}></div>

          <ul className="feature-list">
            {[
              'Unlimited Topical Snippet extractions',
              'Unlimited Examiner Intel Report compiles',
              '24/7 Unlimited AI Study Tutor workspace',
              'Authentic past paper downloads (all years)',
              'Priority server speed (no waiting queues)'
            ].map((feature, i) => (
              <li key={i} className="feature-item">
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: isPremium ? 'rgba(0,230,118,0.1)' : 'rgba(0,112,243,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} color={isPremium ? "#00e676" : "#0070f3"} />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* Error message */}
          {errorMsg && (
            <div style={{
              background: 'rgba(255, 23, 68, 0.08)', border: '1px solid rgba(255, 23, 68, 0.2)',
              borderRadius: '12px', padding: '12px 16px', marginTop: '20px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <AlertCircle size={16} color="#ff1744" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#ff1744', lineHeight: '1.4' }}>{errorMsg}</p>
            </div>
          )}

          {/* CTA Buttons */}
          {isPremium ? (
            <button 
              type="button" 
              className="btn-premium" 
              onClick={handleActivatePremium}
              style={{ marginTop: '20px', background: 'linear-gradient(135deg, #00c853, #00897b)' }}
              id="renew-premium-btn"
            >
              <Zap size={18} /> Renew Premium ($5)
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              {/* Apple Pay Button */}
              <button 
                type="button" 
                className="btn-apple-pay" 
                onClick={handleActivatePremium}
                disabled={processing}
                id="apple-pay-trigger-btn"
              >
                {processing ? (
                  <>
                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(0,0,0,0.3)', borderLeftColor: 'black', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 100 100" style={{ width: '20px', height: '20px', fill: 'currentColor', marginRight: '6px' }}>
                      <path d="M78.6,56.8c0-8.9,7.3-13.2,7.6-13.4c-4.1-6.1-10.7-6.9-13-7c-5.5-0.6-10.8,3.3-13.6,3.3c-2.8,0-7.1-3.3-11.7-3.2 c-6,0.1-11.6,3.5-14.7,8.9c-6.3,10.9-1.6,27.1,4.5,35.9c3,4.3,6.5,9.1,11.2,8.9c4.5-0.2,6.2-2.9,11.6-2.9c5.4,0,7,2.9,11.7,2.8 c4.8-0.1,7.9-4.3,10.9-8.7c3.5-5.1,4.9-10,5-10.2C85.5,70.1,78.6,67.5,78.6,56.8z"/>
                      <path d="M68.3,27.7c2.4-3,4.1-7.1,3.6-11.2c-3.5,0.1-7.8,2.4-10.3,5.3c-2.2,2.5-4.1,6.7-3.6,10.7 C61.9,32.7,65.9,30.6,68.3,27.7z"/>
                    </svg>
                    <span>Pay with Apple Pay</span>
                  </>
                )}
              </button>

              {/* General Card/GPay Button */}
              <button 
                type="button" 
                className="btn-premium" 
                onClick={handleActivatePremium}
                disabled={processing}
                id="checkout-trigger-btn"
                style={{ marginTop: 0 }}
              >
                {processing ? (
                  <>
                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderLeftColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} /> Pay with Card / Google Pay
                  </>
                )}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px', color: '#a0a0a0', fontSize: '0.8rem' }}>
            <Shield size={14} color="#00e676" /> Secure payments via Ziina
          </div>

          {!user && (
            <p style={{ textAlign: 'center', color: '#666', fontSize: '0.75rem', marginTop: '12px' }}>
              You'll be asked to sign in before checkout
            </p>
          )}
        </div>
      </section>

      {/* FAQs Section */}
      <section style={{ maxWidth: '800px', margin: '100px auto 0' }}>
        <h2 style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '40px' }}>Frequently Asked Questions</h2>
        
        <div className="faq-container">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index
            return (
              <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button 
                  className="faq-question" 
                  onClick={() => toggleFaq(index)}
                  id={`faq-btn-${index}`}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} color="#0070f3" /> : <ChevronDown size={18} />}
                </button>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Inline Checkout Modal */}
      {checkoutUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            position: 'relative',
            width: '90%',
            maxWidth: '520px',
            height: '80vh',
            maxHeight: '700px',
            background: 'rgba(10, 10, 10, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 35px rgba(0, 112, 243, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(255, 255, 255, 0.01)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={18} color="#0070f3" />
                <span style={{ color: 'white', fontWeight: '600', fontSize: '0.95rem' }}>Secure Checkout</span>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                  outline: 'none'
                }}
                id="close-checkout-btn"
              >
                ✕
              </button>
            </div>

            {/* Iframe container */}
            <div style={{ flex: 1, position: 'relative', background: '#ffffff' }}>
              {iframeLoading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: '#0a0a0a',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(0, 112, 243, 0.1)',
                    borderLeftColor: '#0070f3',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span style={{ fontSize: '0.85rem', color: '#a0a0a0', letterSpacing: '0.5px' }}>Loading secure payment portal...</span>
                </div>
              )}
              
              <iframe
                src={checkoutUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#ffffff'
                }}
                allow="payment"
                onLoad={() => setIframeLoading(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
