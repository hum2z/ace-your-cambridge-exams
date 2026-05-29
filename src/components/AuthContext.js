'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { auth, googleProvider } from '@/lib/firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext({
  user: null,
  loading: true,
  isMockMode: false,
  loginWithGoogle: async () => {},
  logout: async () => {}
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMockMode, setIsMockMode] = useState(false)

  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth not initialized");
      setLoading(false)
      return
    }

    // Standard Firebase Auth observer
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    }, (error) => {
      console.error("Auth state observer error:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isMockMode, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
