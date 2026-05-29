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
    // Check if the API key in env.local is the default template placeholder
    const isMock = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
                   process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'YOUR_FIREBASE_API_KEY'
    
    setIsMockMode(isMock)

    if (isMock) {
      console.warn("Firebase Auth is running in Mock Mode because API keys are not configured.")
      // Read local storage to see if mock user exists
      const savedMockUser = localStorage.getItem('mock_user')
      if (savedMockUser) {
        setUser(JSON.parse(savedMockUser))
      }
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
    if (isMockMode) {
      // Mock Login Flow
      const mockUser = {
        uid: 'mock-user-123',
        email: 'cambridge.student@gmail.com',
        displayName: 'Cambridge Student',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80',
        emailVerified: true
      }
      localStorage.setItem('mock_user', JSON.stringify(mockUser))
      setUser(mockUser)
      return mockUser
    }

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
    if (isMockMode) {
      localStorage.removeItem('mock_user')
      setUser(null)
      return
    }

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
