'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, googleProvider, getSubscription, isSubscriptionActive } from '@/lib/firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

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
    try {
      const sub = await getSubscription(userId)
      setSubscription(sub)
      setIsPremium(isSubscriptionActive(sub))
    } catch (err) {
      console.error("Error checking subscription:", err)
      setIsPremium(false)
      setSubscription(null)
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
    <AuthContext.Provider value={{ user, loading, isPremium, subscription, loginWithGoogle, logout, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
