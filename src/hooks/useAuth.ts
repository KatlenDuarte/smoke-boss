import { useState, useEffect } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth' // <-- Adicionado "type" antes de User
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Escuta mudanças no estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Defina seu e-mail de admin aqui
  const isAdmin = user?.email === 'admin@smokeboss.com'

  return { 
    user, 
    loading, 
    isAuthenticated, 
    isAdmin 
  }
}