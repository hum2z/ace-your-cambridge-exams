'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { Suspense } from 'react'
import { useAuth } from '@/components/AuthContext'
import { saveSubscription } from '@/lib/firebase'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, setIsPremium, setSubscription, refreshSubscription } = useAuth()
  const [status, setStatus] = useState('verifying') // verifying | success | failed
  const [expiresAt, setExpiresAt] = useState(null)
  const [isClassroom, setIsClassroom] = useState(false)

  useEffect(() => {
    // If running inside an iframe (the checkout modal), redirect the top-level parent page to this success page URL
    if (typeof window !== 'undefined' && window.self !== window.top) {
      window.top.location.href = window.location.href;
      return;
    }

    const pi = searchParams.get('pi')
    const uid = searchParams.get('uid')
    const classId = searchParams.get('classId')

    if (!pi) {
      setStatus('failed')
      return
    }

    const verifyPayment = async () => {
      try {
        const query = classId ? `pi=${pi}&classId=${classId}` : `pi=${pi}&uid=${uid}`
        const res = await fetch(`/api/verify-payment?${query}`)
        const data = await res.json()

        if (data.completed && classId) {
          // Teacher bulk purchase — the classroom (not the teacher's own
          // subscription) is what becomes active; students inherit access
          // from it once they join via the invite link.
          setStatus('success')
          setExpiresAt(data.expiresAt)
          setIsClassroom(true)
          return
        }

        if (data.completed) {
          setStatus('success')
          setExpiresAt(data.expiresAt)

          // Instantly activate premium locally in client state to bypass any database replication lag
          setIsPremium(true)
          const newSub = {
            status: 'active',
            expiresAt: data.expiresAt
          }
          setSubscription(newSub)

          const targetUid = uid || user?.uid
          if (targetUid) {
            // Persist to localStorage first for instant reliability
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(`pastpaper_subscription_${targetUid}`, JSON.stringify(newSub))
                console.log("Subscription saved to localStorage successfully.");
              } catch (localErr) {
                console.warn("Failed to write subscription to localStorage:", localErr);
              }
            }

            // Save subscription status directly to Firestore from the client side
            try {
              const now = new Date();
              const expiresAtDate = new Date(data.expiresAt || (now.getTime() + 30 * 24 * 60 * 60 * 1000));
              await saveSubscription(targetUid, {
                status: "active",
                paymentIntentId: pi,
                activatedAt: now.toISOString(),
                expiresAt: expiresAtDate.toISOString(),
                updatedAt: now.toISOString()
              });
              console.log("Subscription successfully persisted to Firestore from client-side.");
            } catch (dbError) {
              console.error("Failed to write subscription from client-side:", dbError);
            }
            // Refresh from Firestore database to ensure persistence is fully synced
            await refreshSubscription(targetUid)
          }
        } else {
          setStatus('failed')
        }
      } catch (err) {
        console.error('Payment verification error:', err)
        setStatus('failed')
      }
    }

    verifyPayment()
  }, [searchParams, user, refreshSubscription])

  if (status === 'verifying') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '80px', height: '80px', borderRadius: '2px',
          background: 'rgba(96, 165, 250, 0.08)', marginBottom: '28px'
        }}>
          <div style={{
            width: '36px', height: '36px', border: '3px solid rgba(96, 165, 250,0.2)',
            borderLeftColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Verifying your payment...
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Please wait while we confirm your transaction with Ziina.
        </p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(255, 23, 68, 0.08)', marginBottom: '28px'
        }}>
          <XCircle size={42} color="#dc2626" />
        </div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Payment Not Confirmed
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 30px' }}>
          We couldn't confirm your payment. This may be temporary — if you were charged, your subscription will activate automatically within a few minutes.
        </p>
        <button
          onClick={() => router.push('/subscription')}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          Return to Subscription <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  // Success state
  const expDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  }) : null

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }} className="fade-in">
      {/* Success glow animation */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '90px', height: '90px', borderRadius: '2px',
        background: 'rgba(0, 230, 118, 0.08)',
        boxShadow: '0 0 40px rgba(0, 230, 118, 0.15)',
        marginBottom: '28px',
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        <CheckCircle size={48} color="#ef5a2b" />
      </div>

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.2)',
        borderRadius: '2px', padding: '8px 12px', color: '#ef5a2b',
        fontSize: '0.8rem', fontWeight: '800', marginBottom: '20px'
      }}>
        <Sparkles size={12} /> {isClassroom ? 'CLASSROOM ACTIVATED' : 'PREMIUM ACTIVATED'}
      </div>

      <h2 style={{ fontSize: '2.2rem', color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '0' }}>
        {isClassroom ? 'Your classroom is live!' : 'Welcome to Pro!'}
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '440px', margin: '0 auto 16px' }}>
        {isClassroom
          ? 'Your seats are active. Head to your teacher dashboard to copy the invite link and share it with your students.'
          : 'Your Pro Study Pass is now active. You have full unlimited access to all Past Paper tools, AI Tutor sessions, and examiner reports.'}
      </p>

      {expDate && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '30px' }}>
          Your access is valid until <strong style={{ color: 'var(--text-secondary)' }}>{expDate}</strong>
        </p>
      )}

      {/* Feature summary */}
      {!isClassroom && (
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '2px', padding: '24px', maxWidth: '380px', margin: '0 auto 30px',
        textAlign: 'left'
      }}>
        {['Unlimited Topical Extractions', 'Unlimited AI Tutor Sessions', 'Examiner Intelligence Reports', 'Priority Server Speed'].map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <CheckCircle size={16} color="#ef5a2b" />
            {feature}
          </div>
        ))}
      </div>
      )}

      <button
        onClick={() => router.push(isClassroom ? '/teacher' : '/')}
        className="btn-premium"
        style={{ padding: '14px 32px' }}
        id="success-goto-dashboard"
      >
        <ArrowRight size={18} /> {isClassroom ? 'Go to Teacher Dashboard' : 'Go to Study Dashboard'}
      </button>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="site-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="grid-bg"></div>
      <div className="grid-lines"></div>

      <div className="panel" style={{ width: '100%', maxWidth: '540px' }}>
        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '36px', height: '36px', border: '3px solid rgba(96, 165, 250,0.2)',
              borderLeftColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
