import { useState } from 'react'
import Navbar from '../components/navbard'
import { useAuth } from '../hooks/useAuth'

export default function Perfil() {
  const { user, perfil, actualizarPerfil } = useAuth()
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('ok')

  const valores = form || {
    nombre: perfil?.nombre || '',
    ciudad: perfil?.ciudad || '',
    intereses: normalizarIntereses(perfil?.intereses),
  }

  async function guardarPerfil(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const { error, warning } = await actualizarPerfil({
      nombre: valores.nombre.trim(),
      ciudad: valores.ciudad.trim(),
      intereses: valores.intereses.trim(),
    })

    if (error) {
      setTipoMensaje('error')
      setMensaje(`No se pudo guardar el perfil: ${error.message}`)
    } else {
      setTipoMensaje(warning ? 'warning' : 'ok')
      setMensaje(warning || 'Perfil actualizado correctamente.')
    }

    setGuardando(false)
  }

  return (
    <div className="page-shell">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <p className="text-emerald-400/90 text-sm font-medium">Cuenta</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Mi perfil</h1>
        </div>

        <div className="grid lg:grid-cols-[0.8fr_1.4fr] gap-5">
          <section className="card p-5 h-fit">
            <div className="h-20 w-20 rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25 flex items-center justify-center text-2xl font-bold">
              {iniciales(perfil?.nombre || user?.email)}
            </div>
            <h2 className="text-white font-semibold mt-4">{perfil?.nombre || 'Perfil'}</h2>
            <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
            {perfil?.rol && (
              <span className="inline-flex mt-4 text-xs px-2.5 py-1 rounded-full font-medium capitalize bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25">
                {perfil.rol}
              </span>
            )}
          </section>

          <section className="card p-5">
            <form onSubmit={guardarPerfil} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2" htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  required
                  value={valores.nombre}
                  onChange={e => setForm({ ...valores, nombre: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2" htmlFor="ciudad">Ciudad</label>
                <input
                  id="ciudad"
                  value={valores.ciudad}
                  onChange={e => setForm({ ...valores, ciudad: e.target.value })}
                  placeholder="Ej. Tegucigalpa"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2" htmlFor="intereses">Intereses</label>
                <textarea
                  id="intereses"
                  rows="4"
                  value={valores.intereses}
                  onChange={e => setForm({ ...valores, intereses: e.target.value })}
                  placeholder="Conciertos, teatro, conferencias..."
                  className="input-field resize-none"
                />
              </div>

              {mensaje && (
                <p className={`text-xs p-3 rounded-xl border ${
                  tipoMensaje === 'error'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : tipoMensaje === 'warning'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {mensaje}
                </p>
              )}

              <button type="submit" disabled={guardando} className="btn-primary">
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}

function normalizarIntereses(intereses) {
  if (Array.isArray(intereses)) return intereses.join(', ')
  return intereses || ''
}

function iniciales(texto = '') {
  return texto
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0]?.toUpperCase())
    .join('') || 'EH'
}
