import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AuthContext from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  const cargarPerfil = async (userId) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario_id', userId)
      .single()

    if (error) {
      console.error('Error cargando perfil:', error.message)
      setPerfil(null)
    } else {
      setPerfil(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) cargarPerfil(currentUser.id)
      else setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) cargarPerfil(currentUser.id)
      else { setPerfil(null); setLoading(false) }
    })

    return () => authListener?.subscription?.unsubscribe()
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function register(email, password, nombre, rol = 'asistente') {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }

    const { error: errorPerfil } = await supabase
      .from('usuarios')
      .insert({
        usuario_id: data.user.id,
        nombre,
        email,
        rol,
        password_hash: ''
      })

    if (errorPerfil) return { error: errorPerfil }
    return { data }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
