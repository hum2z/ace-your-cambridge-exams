'use client'

import { useState } from 'react'
import { Check, CreditCard, Shield, X, CheckCircle, Sparkles, ChevronDown, ChevronUp, Lock } from 'lucide-react'

export default function SubscriptionPage() {
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [processing, setProcessing] = useState(false)

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const handleCheckoutSubmit = (e) => {
    e.preventDefault()
    if (!checkoutEmail || !cardName || !cardNumber) return
    
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setPaymentSuccess(true)
    }, 2000)
  }

  const resetCheckout = () => {
    setShowCheckout(false)
    setPaymentSuccess(false)
    setCheckoutEmail('')
    setCardName('')
    setCardNumber('')
    setCardExpiry('')
    setCardCvc('')
  }

  const faqs = [
    {
      q: "What does the Premium Study Pass include?",
      a: "The Premium Study Pass unlocks absolute, unrestricted access to the entire Past Paper ecosystem. You get unlimited Topical Snippet extractions (all subjects, all variants, all years), instant Examiner Intelligence Reports, 24/7 AI Tutor chat interactions, and unlimited Authentic Mega-PDF compiles."
    },
    {
      q: "Can I cancel my subscription?",
      a: "Yes! There are absolutely no contracts or obligations. You can cancel your subscription at any time with a single click from your profile settings. Your access will remain active until the end of your billing cycle."
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
      a: "Absolutely. When we launch our backend processing, all billing will be handled by leading enterprise processors like Stripe. None of your card credentials touch our servers directly. For this mock portal, no actual charges are processed."
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
          Accelerate your AS/A-Level exam grades with fully unlocked AI synthesis and paper compiling. One simple plan. Cancel anytime.
        </p>
      </section>

      {/* Premium Pricing Card */}
      <section style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
        <div className="glow-card" style={{ 
          width: '100%', 
          maxWidth: '480px', 
          padding: '40px',
          border: '1px solid rgba(0, 112, 243, 0.25)',
          background: 'rgba(5, 5, 5, 0.85)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,112,243,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <span style={{ 
                background: 'rgba(0,112,243,0.15)', 
                border: '1px solid rgba(0,112,243,0.3)',
                borderRadius: '50px',
                padding: '6px 12px',
                color: '#0070f3',
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                PRO STUDY PASS
              </span>
              <h2 style={{ fontSize: '2rem', marginTop: '12px', marginBottom: 0, color: 'white' }}>Full Access Pass</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.8rem', fontWeight: '800', color: 'white', lineHeight: '1' }}>$5</div>
              <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginTop: '4px' }}>USD / monthly</div>
            </div>
          </div>

          <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '30px', lineHeight: '1.5' }}>
            Empowers you with unlimited AI tutor requests, rapid topical extractions, and priority server merges.
          </p>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '30px' }}></div>

          <ul className="feature-list">
            <li className="feature-item">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,112,243,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={12} color="#0070f3" />
              </div>
              <span>Unlimited Topical Snippet extractions</span>
            </li>
            <li className="feature-item">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,112,243,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={12} color="#0070f3" />
              </div>
              <span>Unlimited Examiner Intel Report compiles</span>
            </li>
            <li className="feature-item">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,112,243,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={12} color="#0070f3" />
              </div>
              <span>24/7 Unlimited AI Study Tutor workspace</span>
            </li>
            <li className="feature-item">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,112,243,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={12} color="#0070f3" />
              </div>
              <span>Authentic past paper downloads (all years)</span>
            </li>
            <li className="feature-item">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,112,243,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={12} color="#0070f3" />
              </div>
              <span>Priority server speed (no waiting queues)</span>
            </li>
          </ul>

          <button 
            type="button" 
            className="btn-premium" 
            onClick={() => setShowCheckout(true)}
            style={{ marginTop: '20px' }}
            id="checkout-trigger-btn"
          >
            <CreditCard size={18} /> Activate Premium Pass
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px', color: '#a0a0a0', fontSize: '0.8rem' }}>
            <Shield size={14} color="#00e676" /> Secure 256-Bit SSL Encryption
          </div>
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

      {/* Mock Checkout Modal Pop-up */}
      {showCheckout && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="premium-card" style={{ 
            width: '100%', 
            maxWidth: '480px', 
            padding: '30px', 
            background: '#090909', 
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative'
          }}>
            {/* Close button */}
            <button 
              onClick={resetCheckout}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}
              id="checkout-close-btn"
            >
              <X size={20} />
            </button>

            {!paymentSuccess ? (
              <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} id="mock-checkout-form">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Lock size={18} color="#0070f3" />
                  <h3 style={{ fontSize: '1.4rem', margin: 0, color: 'white' }}>Pro Checkout</h3>
                </div>

                <p style={{ color: '#a0a0a0', fontSize: '0.85rem', margin: 0 }}>
                  Activating **Pro Study Pass** at **$5.00 USD/mo**. No money will be billed in this mock state.
                </p>

                {/* Email Address */}
                <div>
                  <p style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '6px' }}>Email Address:</p>
                  <input
                    type="email"
                    required
                    className="search-input"
                    placeholder="you@domain.com"
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    style={{ padding: '12px 20px', fontSize: '0.95rem', borderRadius: '12px' }}
                    id="checkout-field-email"
                  />
                </div>

                {/* Name on Card */}
                <div>
                  <p style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '6px' }}>Cardholder Name:</p>
                  <input
                    type="text"
                    required
                    className="search-input"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    style={{ padding: '12px 20px', fontSize: '0.95rem', borderRadius: '12px' }}
                    id="checkout-field-name"
                  />
                </div>

                {/* Credit Card Input */}
                <div>
                  <p style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '6px' }}>Card Credentials:</p>
                  <input
                    type="text"
                    required
                    className="search-input"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    style={{ padding: '12px 20px', fontSize: '0.95rem', borderRadius: '12px' }}
                    id="checkout-field-card"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <p style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '6px' }}>Expiry Date:</p>
                    <input
                      type="text"
                      required
                      className="search-input"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      style={{ padding: '12px 20px', fontSize: '0.95rem', borderRadius: '12px' }}
                      id="checkout-field-expiry"
                    />
                  </div>
                  <div>
                    <p style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '6px' }}>CVC Code:</p>
                    <input
                      type="text"
                      required
                      className="search-input"
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      style={{ padding: '12px 20px', fontSize: '0.95rem', borderRadius: '12px' }}
                      id="checkout-field-cvc"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-premium"
                  disabled={processing}
                  style={{ marginTop: '10px' }}
                  id="checkout-submit-btn"
                >
                  {processing ? (
                    <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderLeftColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> Processing Payment...</>
                  ) : (
                    <>Authorize & Upgrade ($5.00)</>
                  )}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }} className="fade-in" id="mock-checkout-success">
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0,230,118,0.1)', marginBottom: '24px' }}>
                  <CheckCircle size={36} color="#00e676" />
                </div>
                <h3 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '12px' }}>Welcome to Pro!</h3>
                <p style={{ color: '#a0a0a0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '30px' }}>
                  Congratulations, you have unlocked the **Pro Study Pass**! Your free simulation upgrade is active. Get ready to excel in your Cambridge studies.
                </p>
                <button 
                  onClick={resetCheckout} 
                  className="btn-primary"
                  style={{ width: '100%', borderRadius: '14px', padding: '14px 28px' }}
                  id="checkout-success-close-btn"
                >
                  Explore Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
