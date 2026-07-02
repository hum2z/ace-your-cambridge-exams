'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, googleProvider, getSubscription, isSubscriptionActive, saveSubscription } from '@/lib/firebase'
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

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

const TRIAL_LIMITS = { topicalUsesRemaining: 1, scanUsesRemaining: 1 }
const isTrialSub = (sub) => !!sub && sub.status === 'trial'
// Trial docs created before the paper scanner existed lack scanUsesRemaining;
// treat the missing field as the default allowance of 1.
const trialUseDefault = (kind) => (kind === 'scan' ? 1 : 0)
const trialHasUse = (sub, kind) => isTrialSub(sub) && (sub[`${kind}UsesRemaining`] ?? trialUseDefault(kind)) > 0

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
        setSubscription(sub)
        const active = isSubscriptionActive(sub)
        setIsPremium(active)
        
        if (typeof window !== 'undefined') {
          if (active) {
            localStorage.setItem(`pastpaper_subscription_${userId}`, JSON.stringify(sub))
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

      setSubscription(trialSub)
      setIsPremium(false)

      return newUser
    } catch (error) {
      console.error("Error signing up with email:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const consumeTrialUse = useCallback(async (kind) => {
    // kind: 'topical' | 'scan'
    if (!user || !subscription) return false
    if (!trialHasUse(subscription, kind)) return false
    const field = `${kind}UsesRemaining`
    const next = { ...subscription, [field]: Math.max(0, (subscription[field] ?? trialUseDefault(kind)) - 1) }
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
