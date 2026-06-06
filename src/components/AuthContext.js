'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, googleProvider, getSubscription, isSubscriptionActive, saveSubscription } from '@/lib/firebase'
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

const AuthContext = createContext({
  user: null,
  loading: true,
  isPremium: false,
  subscription: null,
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshSubscription: async () => {}
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [subscription, setSubscription] = useState(null)

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

      // Grant a 30-day trial subscription automatically
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const trialSub = {
        status: 'active',
        plan: 'trial',
        startDate: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
        grantedAutomatically: true
      }

      try {
        await saveSubscription(newUser.uid, trialSub)
        console.log('30-day trial subscription created for new user:', newUser.uid)
      } catch (subError) {
        console.error('Failed to create trial subscription:', subError)
      }

      // Also cache locally for instant premium access
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`pastpaper_subscription_${newUser.uid}`, JSON.stringify(trialSub))
        } catch (cacheErr) {
          console.warn('Failed to cache trial subscription locally:', cacheErr)
        }
      }

      setSubscription(trialSub)
      setIsPremium(true)

      return newUser
    } catch (error) {
      console.error("Error signing up with email:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

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
    <AuthContext.Provider value={{ user, loading, isPremium, subscription, setIsPremium, setSubscription, loginWithGoogle, loginWithEmail, signUpWithEmail, logout, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
