'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, googleProvider, getSubscription, isSubscriptionActive, saveSubscription, getClassroom, isClassroomActive } from '@/lib/firebase'
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, getAdditionalUserInfo } from 'firebase/auth'

const REFERRAL_STORAGE_KEY = 'pastpaper_referral_code'
const CLASSROOM_JOIN_STORAGE_KEY = 'pastpaper_classroom_join'

async function redeemReferralIfPresent(newUserUid) {
  if (typeof window === 'undefined') return
  const referrerUid = localStorage.getItem(REFERRAL_STORAGE_KEY)
  if (!referrerUid || referrerUid === newUserUid) return
  localStorage.removeItem(REFERRAL_STORAGE_KEY)
  try {
    await fetch('/api/referral/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUserUid, referrerUid }),
    })
  } catch (err) {
    console.warn('Referral redemption failed:', err)
  }
}

async function joinClassroomIfPresent(uid) {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem(CLASSROOM_JOIN_STORAGE_KEY)
  if (!raw) return
  localStorage.removeItem(CLASSROOM_JOIN_STORAGE_KEY)
  try {
    const { classId, inviteCode } = JSON.parse(raw)
    if (!classId || !inviteCode) return
    await fetch('/api/classroom/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, classId, inviteCode }),
    })
  } catch (err) {
    console.warn('Classroom join failed:', err)
  }
}

const AuthContext = createContext({
  user: null,
  loading: true,
  isPremium: false,
  isTrial: false,
  subscription: null,
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshSubscription: async () => {},
  consumeTrialUse: async () => false,
})

const TRIAL_LIMITS = { topicalUsesRemaining: 1, notesUsesRemaining: 1 }
const isTrialSub = (sub) => !!sub && sub.status === 'trial'
const trialHasUse = (sub, kind) => isTrialSub(sub) && (sub[`${kind}UsesRemaining`] ?? 0) > 0

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const isTrial = isTrialSub(subscription)

  const refreshSubscription = useCallback(async (userId) => {
    if (!userId) {
      setIsPremium(false)
      setSubscription(null)
      return
    }

    // Check local cache first
    let localActive = false;
    let cachedSub = null;
    if (typeof window !== 'undefined') {
      try {
        const cachedStr = localStorage.getItem(`pastpaper_subscription_${userId}`);
        if (cachedStr) {
          cachedSub = JSON.parse(cachedStr);
          if (isSubscriptionActive(cachedSub)) {
            setSubscription(cachedSub);
            setIsPremium(true);
            localActive = true;
            console.log("Subscription loaded from local cache:", cachedSub);
          }
        }
      } catch (cacheErr) {
        console.warn("Error reading subscription from localStorage:", cacheErr);
      }
    }

    try {
      const sub = await getSubscription(userId)
      if (sub) {
        let effectiveSub = sub
        let active = isSubscriptionActive(sub)

        // Students who joined a teacher's classroom inherit premium access
        // from the classroom's active status rather than their own doc.
        if (!active && sub.classroomId) {
          const classroom = await getClassroom(sub.classroomId)
          if (isClassroomActive(classroom)) {
            active = true
            effectiveSub = { ...sub, status: 'active', expiresAt: classroom.expiresAt, viaClassroom: true }
          }
        }

        setSubscription(effectiveSub)
        setIsPremium(active)

        if (typeof window !== 'undefined') {
          if (active) {
            localStorage.setItem(`pastpaper_subscription_${userId}`, JSON.stringify(effectiveSub))
          } else {
            localStorage.removeItem(`pastpaper_subscription_${userId}`)
          }
        }
      } else {
        // If getSubscription returned null (e.g. database read failed or is empty),
        // fallback to local active cache if it exists, otherwise reset premium.
        if (!localActive) {
          setSubscription(null)
          setIsPremium(false)
        }
      }
    } catch (err) {
      console.error("Error checking subscription:", err)
      if (!localActive) {
        setIsPremium(false)
        setSubscription(null)
      }
    }
  }, [])

  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth not initialized");
      setLoading(false)
      return
    }

    // Standard Firebase Auth observer
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        await refreshSubscription(currentUser.uid)
      } else {
        setIsPremium(false)
        setSubscription(null)
      }
      setLoading(false)
    }, (error) => {
      console.error("Auth state observer error:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [refreshSubscription])

  const loginWithGoogle = async () => {
    try {
      setLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      if (getAdditionalUserInfo(result)?.isNewUser) {
        await redeemReferralIfPresent(result.user.uid)
      }
      await joinClassroomIfPresent(result.user.uid)
      return result.user
    } catch (error) {
      console.error("Error signing in with Google:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginWithEmail = async (email, password) => {
    try {
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)
      await joinClassroomIfPresent(result.user.uid)
      return result.user
    } catch (error) {
      console.error("Error signing in with email:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email, password) => {
    try {
      setLoading(true)
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = result.user

      // Grant a limited trial: 1 topical extraction + 1 notes generation.
      // status is 'trial' (NOT 'active') so isSubscriptionActive/isPremium stay false.
      const now = new Date()
      const trialSub = {
        status: 'trial',
        plan: 'trial',
        startDate: now.toISOString(),
        createdAt: now.toISOString(),
        grantedAutomatically: true,
        ...TRIAL_LIMITS,
      }

      try {
        await saveSubscription(newUser.uid, trialSub)
        console.log('Trial subscription created for new user:', newUser.uid)
      } catch (subError) {
        console.error('Failed to create trial subscription:', subError)
      }

      await redeemReferralIfPresent(newUser.uid)
      await joinClassroomIfPresent(newUser.uid)
      // Re-fetch so any referral/classroom bonus applied server-side is reflected immediately.
      await refreshSubscription(newUser.uid)

      return newUser
    } catch (error) {
      console.error("Error signing up with email:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const consumeTrialUse = useCallback(async (kind) => {
    // kind: 'topical' | 'notes'
    if (!user || !subscription) return false
    if (!trialHasUse(subscription, kind)) return false
    const field = `${kind}UsesRemaining`
    const next = { ...subscription, [field]: Math.max(0, (subscription[field] ?? 0) - 1) }
    setSubscription(next)
    try {
      await saveSubscription(user.uid, { [field]: next[field] })
    } catch (err) {
      console.error('Failed to persist trial decrement:', err)
    }
    return true
  }, [user, subscription])

  const logout = async () => {
    try {
      setLoading(true)
      await signOut(auth)
      setUser(null)
      setIsPremium(false)
      setSubscription(null)
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isPremium, isTrial, subscription, setIsPremium, setSubscription, loginWithGoogle, loginWithEmail, signUpWithEmail, logout, refreshSubscription, consumeTrialUse }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
