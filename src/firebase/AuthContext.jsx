import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from './config'

const ALLOWED_DOMAIN = 'aed.cat'
const AuthContext = createContext(null)

function isAllowedEmail(email) {
  return email?.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u && !isAllowedEmail(u.email)) {
        await signOut(auth)
        setUser(null)
      } else {
        setUser(u)
      }
      setLoading(false)
    })
  }, [])

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      hd: ALLOWED_DOMAIN,
      prompt: 'select_account',
    })

    const result = await signInWithPopup(auth, provider)

    if (!isAllowedEmail(result.user.email)) {
      await signOut(auth)
      throw Object.assign(new Error('Només comptes @aed.cat'), { code: 'domain-not-allowed' })
    }

    return result.user
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth s\'ha d\'utilitzar dins d\'AuthProvider')
  return ctx
}
