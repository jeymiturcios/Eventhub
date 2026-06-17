import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/navbard'

export default function MisEntradas() {
  const { perfil } = useAuth()
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resenas, setResenas] = useState({})
  const [mensajeResena, setMensajeResena] = useState('')

  useEffect(() => {
    if (!perfil?.usuario_id) {
      setLoading(false)
      return
    }

    async function cargarCompras() {
      setLoading(true)
      setError('')

      const { data, error: comprasError } = await supabase
        .from('compras')
        .select(`
          compra_id,
          cantidad,
          precio_total,
          fecha_compra,
          estado_pago,
          codigo_qr,
          tipos_entrada (
            nombre,
            precio,
            eventos (
              evento_id,
              titulo,
              fecha_inicio,
              fecha_fin,
              imagen_banner,
              estado,
              lugares (nombre, ciudad, direccion)
            )
          )
        `)
        .eq('usuario_id', perfil.usuario_id)
        .order('fecha_compra', { ascending: false })

      if (comprasError) {
        setError(comprasError.message || 'No se pudieron cargar tus entradas.')
        setCompras([])
        setLoading(false)
        return
      }

      setCompras(data || [])

      const idsEventos = (data || [])
        .map(compra => compra.tipos_entrada?.eventos?.evento_id)
        .filter(Boolean)

      if (idsEventos.length > 0) {
        const { data: resenasData } = await supabase
          .from('resenas')
          .select('*')
          .eq('usuario_id', perfil.usuario_id)
          .in('evento_id', idsEventos)

        const mapaResenas = {}
        ;(resenasData || []).forEach(resena => {
          mapaResenas[resena.evento_id] = resena
        })
        setResenas(mapaResenas)
      }

      setLoading(false)
    }

    cargarCompras()
  }, [perfil?.usuario_id])

  async function enviarResena(eventoId, valores) {
    setMensajeResena('')

    if (!perfil?.usuario_id || !eventoId) {
      setMensajeResena('No se pudo identificar el evento para guardar la reseña.')
      return
    }

    const { data, error: resenaError } = await supabase
      .from('resenas')
      .insert({
        usuario_id: perfil.usuario_id,
        evento_id: eventoId,
        calificacion: Number(valores.calificacion),
        comentario: valores.comentario.trim() || null,
      })
      .select()
      .single()

    if (resenaError) {
      setMensajeResena(resenaError.message || 'No se pudo guardar la reseña.')
      return
    }

    setResenas(prev => ({ ...prev, [eventoId]: data }))
    setMensajeResena('Reseña guardada correctamente.')
  }

  return (
    <div className="page-shell">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <p className="text-emerald-400/90 text-sm font-medium">Asistente</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Mis entradas</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="card p-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : compras.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-white font-medium">Aun no tienes entradas</p>
            <p className="text-slate-500 text-sm mt-2">
              Cuando compres una entrada aparecera aqui con su codigo QR.
            </p>
            <Link
              to="/"
              className="inline-flex mt-5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-sm font-semibold"
            >
              Explorar eventos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mensajeResena && (
              <p
                className={`text-xs p-3 rounded-xl border ${
                  mensajeResena.startsWith('Reseña')
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {mensajeResena}
              </p>
            )}

            {compras.map(compra => {
              const evento = compra.tipos_entrada?.eventos
              const codigoQr = compra.codigo_qr || `EH-${compra.compra_id}`
              const eventoFinalizado = evento?.fecha_fin && new Date(evento.fecha_fin) < new Date()
              const resenaExistente = resenas[evento?.evento_id]

              return (
                <article key={compra.compra_id} className="card p-4 grid md:grid-cols-[1fr_auto] gap-4">
                  <div className="flex gap-4">
                    <div className="hidden sm:block w-28 h-24 rounded-xl overflow-hidden bg-[#151a23] shrink-0">
                      {evento?.imagen_banner ? (
                        <img src={evento.imagen_banner} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">EH</div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        {formatearFecha(compra.fecha_compra)} - {compra.estado_pago}
                      </p>
                      <h2 className="text-white font-semibold mt-1">{evento?.titulo || 'Evento'}</h2>
                      <p className="text-slate-400 text-sm mt-1">
                        {compra.tipos_entrada?.nombre} - {compra.cantidad} entrada
                        {compra.cantidad > 1 ? 's' : ''}
                      </p>

                      {evento?.lugares && (
                        <p className="text-slate-500 text-sm mt-1">
                          {evento.lugares.nombre} - {evento.lugares.ciudad}
                        </p>
                      )}

                      <p className="text-emerald-400 font-semibold text-sm mt-3">
                        L. {Number(compra.precio_total).toLocaleString('es-HN')}
                      </p>

                      {eventoFinalizado && (
                        <ResenaEvento
                          eventoId={evento.evento_id}
                          resena={resenaExistente}
                          onEnviar={enviarResena}
                        />
                      )}
                    </div>
                  </div>

                  <div className="md:w-56 rounded-xl border border-[#2a3444] bg-[#151a23] p-3">
                    <div className="bg-white rounded-lg p-3">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(codigoQr)}`}
                        alt={`QR ${codigoQr}`}
                        className="w-full aspect-square object-contain"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-slate-500 text-xs text-center mt-2 break-all">{codigoQr}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function ResenaEvento({ eventoId, resena, onEnviar }) {
  const [calificacion, setCalificacion] = useState('5')
  const [comentario, setComentario] = useState('')

  if (resena) {
    return (
      <div className="mt-4 rounded-xl border border-[#2a3444] p-3">
        <p className="text-emerald-400 text-sm font-medium">Reseña enviada: {resena.calificacion}/5</p>
        {resena.comentario && <p className="text-slate-400 text-sm mt-1">{resena.comentario}</p>}
      </div>
    )
  }

  return (
    <form
      className="mt-4 rounded-xl border border-[#2a3444] p-3 space-y-2"
      onSubmit={e => {
        e.preventDefault()
        onEnviar(eventoId, { calificacion, comentario })
      }}
    >
      <div className="grid sm:grid-cols-[120px_1fr] gap-2">
        <select value={calificacion} onChange={e => setCalificacion(e.target.value)} className="input-field">
          <option value="5">5 / 5</option>
          <option value="4">4 / 5</option>
          <option value="3">3 / 5</option>
          <option value="2">2 / 5</option>
          <option value="1">1 / 5</option>
        </select>
        <input
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          className="input-field"
          placeholder="Comentario sobre el evento"
        />
      </div>

      <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-sm font-semibold">
        Enviar reseña
      </button>
    </form>
  )
}

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'

  return new Date(fecha).toLocaleDateString('es-HN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
