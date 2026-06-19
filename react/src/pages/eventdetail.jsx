import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/navbard'

export default function EventDetail() {
  const { id } = useParams()
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const esAsistente = perfil?.rol === 'asistente'

  const [evento, setEvento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comprando, setComprando] = useState(false)
  const [tipoSel, setTipoSel] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => { cargarEvento() }, [id])

  async function cargarEvento() {
    setLoading(true)
    const { data, error } = await supabase
      .from('eventos')
      .select(`
        *,
        categorias      (nombre),
        lugares         (nombre, direccion, ciudad, coordenadas),
        tipos_entrada   (tipo_entrada_id, nombre, precio, cupo_disponible, descripcion),
        evento_artistas (hora_presentacion, orden_escenario, artistas (nombre_artistico, genero_musical, foto_url))
      `)
      .eq('evento_id', id)
      .single()

    if (error) navigate('/')
    else {
      setEvento(data)
      // seleccionar por defecto el primer tipo de entrada disponible
      setTipoSel(data?.tipos_entrada?.[0]?.tipo_entrada_id || null)
    }
    setLoading(false)
  }

  async function comprar() {
    if (!esAsistente) return setMensaje('Solo los asistentes pueden comprar entradas')
    if (!perfil?.usuario_id) return setMensaje('No se encontró tu perfil de usuario')
    if (!tipoSel) return setMensaje('Selecciona un tipo de entrada')

    const tipo = evento.tipos_entrada.find(t => t.tipo_entrada_id === tipoSel)
    if (tipo.cupo_disponible < cantidad) return setMensaje('No hay suficientes entradas disponibles')

    setComprando(true)
    setMensaje('')

    try {
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('usuario_id')
        .eq('usuario_id', perfil.usuario_id)
        .single()

      if (usuarioError || !usuarioData) {
        setMensaje('Error al identificar el usuario')
        return
      }

      const response = await fetch('http://localhost:3001/api/comprar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: perfil.usuario_id, tipo_entrada_id: tipoSel, cantidad })
      })

      const resultado = await response.json()

      if (!response.ok) setMensaje(resultado.error || 'Error al procesar la compra')
      else {
        setMensaje(`Compra exitosa. Código QR: ${resultado.compra.codigo_qr}`)
        cargarEvento()
      }
    } catch {
      setMensaje('Error de conexión con el servidor')
    } finally {
      setComprando(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!evento) return null

  const fecha = new Date(evento.fecha_inicio).toLocaleDateString('es-HN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const tipoElegido = evento.tipos_entrada?.find(t => t.tipo_entrada_id === tipoSel)

  return (
    <div className="page-shell">
      <Navbar />

      <div className="h-56 sm:h-72 bg-[#151a23] relative overflow-hidden">
        {evento.imagen_banner ? (
          <img src={evento.imagen_banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-[#1a2130] to-[#0c0f14]">🎵</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f14] via-[#0c0f14]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-4 sm:px-6 pb-6">
          <Link to={esAsistente ? '/' : '/dashboard'} className="text-slate-400 hover:text-white text-sm mb-3 inline-block transition-colors">
            ← Volver
          </Link>
          {evento.categorias?.nombre && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block mb-2">
              {evento.categorias.nombre}
            </span>
          )}
          <h1 className="text-white text-2xl sm:text-3xl font-bold">{evento.titulo}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 space-y-3">
            <p className="text-slate-300 text-sm flex items-center gap-2">
              <span className="text-slate-500">📅</span>
              <span className="capitalize">{fecha}</span>
            </p>
            <p className="text-slate-300 text-sm flex items-center gap-2">
              <span className="text-slate-500">📍</span>
              {evento.lugares?.nombre} · {evento.lugares?.ciudad}
            </p>
            {evento.lugares?.direccion && (
              <p className="text-slate-500 text-sm pl-6">{evento.lugares.direccion}</p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-white font-semibold mb-3">Sobre el evento</h2>
            <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{evento.descripcion}</p>
          </div>

          {evento.evento_artistas?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-white font-semibold mb-4">Lineup</h2>
              <div className="space-y-3">
                {[...evento.evento_artistas]
                  .sort((a, b) => (a.orden_escenario || 99) - (b.orden_escenario || 99))
                  .map((ea, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#151a23] overflow-hidden ring-1 ring-[#2a3444] flex-shrink-0">
                        {ea.artistas?.foto_url ? (
                          <img src={ea.artistas.foto_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🎤</div>
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{ea.artistas?.nombre_artistico}</p>
                        <p className="text-slate-400 text-xs">
                          {ea.artistas?.genero_musical}
                          {ea.hora_presentacion && ` · ${ea.hora_presentacion}`}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card p-5 lg:sticky lg:top-20">
            <h2 className="text-white font-semibold mb-4">Entradas</h2>

            <div className="space-y-2 mb-4">
              {evento.tipos_entrada?.map(tipo => (
                <button
                  key={tipo.tipo_entrada_id}
                  type="button"
                  onClick={() => setTipoSel(tipo.tipo_entrada_id)}
                  disabled={tipo.cupo_disponible === 0}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    tipoSel === tipo.tipo_entrada_id
                      ? 'border-emerald-500/60 bg-emerald-500/10'
                      : tipo.cupo_disponible === 0
                        ? 'border-[#2a3444] opacity-50 cursor-not-allowed'
                        : 'border-[#2a3444] hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white text-sm font-medium">{tipo.nombre}</span>
                    <span className="text-emerald-400 text-sm font-bold shrink-0">
                      L. {Number(tipo.precio).toLocaleString('es-HN')}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    {tipo.cupo_disponible > 0 ? `${tipo.cupo_disponible} disponibles` : 'Agotado'}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-slate-400 text-sm">Cantidad</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="w-8 h-8 rounded-lg bg-[#151a23] border border-[#2a3444] text-white text-sm hover:border-slate-500"
                >
                  −
                </button>
                <span className="text-white w-6 text-center text-sm">{cantidad}</span>
                <button
                  type="button"
                  onClick={() => setCantidad(cantidad + 1)}
                  className="w-8 h-8 rounded-lg bg-[#151a23] border border-[#2a3444] text-white text-sm hover:border-slate-500"
                >
                  +
                </button>
              </div>
            </div>

            {tipoElegido && (
              <div className="border-t border-[#2a3444] pt-3 mb-4 flex justify-between">
                <span className="text-slate-400 text-sm">Total</span>
                <span className="text-emerald-400 font-bold">
                  L. {(Number(tipoElegido.precio) * cantidad).toLocaleString('es-HN')}
                </span>
              </div>
            )}

            {mensaje && (
              <p
                className={`text-xs mb-3 p-3 rounded-xl ${
                  mensaje.startsWith('Compra')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {mensaje}
              </p>
            )}

            {esAsistente ? (
              <button
                type="button"
                onClick={comprar}
                disabled={comprando || !tipoSel}
                className="btn-primary"
              >
                {comprando ? 'Procesando...' : 'Comprar entrada'}
              </button>
            ) : (
              <p className="text-xs p-3 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20">
                Vista de organizador: puedes revisar el evento, pero la compra de entradas es solo para asistentes.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}