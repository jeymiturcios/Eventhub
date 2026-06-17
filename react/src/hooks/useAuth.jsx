/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [perfil,  setPerfil]  = useState(null)
  const [loading, setLoading] = useState(true)

  const cargarPerfil = async (currentUser) => {
    if (!currentUser) {
      setPerfil(null)
      setLoading(false)
      return null
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', currentUser.email)
      .maybeSingle()

    if (error) {
      console.error('Error cargando perfil:', error.message)
      setPerfil(null)
      setLoading(false)
      return null
    }

    setPerfil(data)
    setLoading(false)
    return data
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) cargarPerfil(currentUser)
      else setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) cargarPerfil(currentUser)
      else { setPerfil(null); setLoading(false) }
    })

    return () => authListener?.subscription?.unsubscribe()
  }, [])

  // Funciones de auth 

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { data, error }

    const perfilActual = await cargarPerfil(data.user)
    return { data, error: null, perfil: perfilActual }
  }

  async function register(email, password, nombre, rol = 'asistente') {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }

    // usuarios.usuario_id es SERIAL; Supabase Auth queda relacionado por email.
    const { error: errorPerfil } = await supabase
      .from('usuarios')
      .insert({
        nombre,
        email,
        rol,
        password_hash: ''   // Supabase Auth maneja el hash real
      })

    if (errorPerfil) return { error: errorPerfil }
    return { data }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function actualizarPerfil(cambios) {
    if (!user || !perfil) {
      return { error: { message: 'No hay un perfil activo para actualizar.' } }
    }

    const payload = {
      nombre: cambios.nombre,
      ciudad: cambios.ciudad || null,
      intereses: cambios.intereses || null,
    }

    const guardar = (datos) => supabase
      .from('usuarios')
      .update(datos)
      .eq('usuario_id', perfil.usuario_id)
      .select()
      .single()

    let { data, error } = await guardar(payload)

    if (error && error.message?.toLowerCase().includes('intereses')) {
      const sinIntereses = { nombre: payload.nombre, ciudad: payload.ciudad }
      const respuesta = await guardar(sinIntereses)
      data = respuesta.data
      error = respuesta.error

      if (!error) {
        setPerfil(data)
        return {
          data,
          warning: 'Nombre y ciudad guardados. Para guardar intereses agrega la columna intereses a usuarios.',
        }
      }
    }

    if (!error) setPerfil(data)
    return { data, error }
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, register, logout, actualizarPerfil, recargarPerfil: () => cargarPerfil(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar en cualquier componente
export function useAuth() {
  return useContext(AuthContext)
}

export default AuthContext
