import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function rutaInicialPorRol(rol) {
  if (!rol) return '/perfil'
  return rol === 'organizador' || rol === 'admin' ? '/dashboard' : '/'
}

function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#151a23] items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-violet-600/10" />
        <div className="relative max-w-md text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-2xl font-bold text-emerald-400 mb-6">
            EH
          </div>
          <h2 className="text-3xl font-bold text-white">EventHub</h2>
          <p className="text-slate-400 mt-4 leading-relaxed">
            La plataforma para descubrir eventos, comprar entradas y organizar experiencias en Honduras y Centroamérica.
          </p>
        </div>
      </div>

      <div className="flex-1 page-shell flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err, perfil } = await login(email, password)

    if (err) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
    } else {
      navigate(rutaInicialPorRol(perfil?.rol), { replace: true })
    }
  }

  return (
    <AuthShell>
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-400">EventHub</h1>
        <p className="text-slate-400 text-sm mt-1">Eventos en Honduras y Centroamérica</p>
      </div>

      <div className="card p-8 shadow-xl">
        <h2 className="text-white text-xl font-semibold mb-1">Iniciar sesión</h2>
        <p className="text-slate-500 text-sm mb-6">Accede a tu cuenta para explorar eventos</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-slate-300 text-sm mb-1.5 block">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="tu@correo.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-slate-300 text-sm mb-1.5 block">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Regístrate
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
//Es un comentario prueba//
