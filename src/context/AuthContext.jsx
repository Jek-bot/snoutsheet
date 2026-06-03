import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  async function loadProfile(userId) {
    if (!userId) { setProfile(null); return }
    const { data, error } = await supabase
      .from('user_profiles')
      .select('approved, is_admin')
      .eq('id', userId)
      .maybeSingle()
    if (error) console.error('Profile load error:', error)
    if (!data) console.warn('No profile row found for', userId)
    setProfile(data ?? { approved: false, is_admin: false })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      loadProfile(session?.user?.id ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      loadProfile(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => supabase.auth.signOut()

  const loading = session === undefined || (session !== null && profile === null)

  return (
    <AuthContext.Provider value={{
      session, user, profile,
      signIn, signUp, signOut,
      loading,
      isApproved: profile?.approved ?? false,
      isAdmin: profile?.is_admin ?? false,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
