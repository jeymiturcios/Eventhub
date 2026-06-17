import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function rutaInicialPorRol(rol) {
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
          <h2 className="text-3xl font-bold text-white">Únete a EventHub</h2>
          <p className="text-slate-400 mt-4 leading-relaxed">
            Regístrate como asistente para comprar entradas o como organizador para publicar tus eventos.
          </p>
        </div>
      </div>

      <div className="flex-1 page-shell flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

const rolBtn = (active) =>
  active
    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
    : 'bg-[#151a23] border-[#2a3444] text-slate-400 hover:border-slate-500'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('asistente')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    const { error: err } = await register(email, password, nombre, rol)

    if (err) {
      setError(err.message || 'Error al crear la cuenta')
      setLoading(false)
    } else {
      navigate(rutaInicialPorRol(rol), { replace: true })
    }
  }

  return (
    <AuthShell>
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-400">EventHub</h1>
      </div>

      <div className="card p-8 shadow-xl">
        <h2 className="text-white text-xl font-semibold mb-1">Crear cuenta</h2>
        <p className="text-slate-500 text-sm mb-6">Completa tus datos para empezar</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="text-slate-300 text-sm mb-1.5 block">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              className="input-field"
              placeholder="Juan Pérez"
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <span className="text-slate-300 text-sm mb-2 block">Tipo de cuenta</span>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRol('asistente')} className={`py-3 px-3 rounded-xl text-sm font-medium border transition-all ${rolBtn(rol === 'asistente')}`}>
                Asistente
              </button>
              <button type="button" onClick={() => setRol('organizador')} className={`py-3 px-3 rounded-xl text-sm font-medium border transition-all ${rolBtn(rol === 'organizador')}`}>
                Organizador
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
