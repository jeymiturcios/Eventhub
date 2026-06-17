/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/navbard'
import EventCard from '../components/eventcard'

export default function Home() {
  const { perfil } = useAuth()
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precioMax, setPrecioMax] = useState('')
  const [eventoMapaId, setEventoMapaId] = useState(null)
  const puedeVerFiltros = perfil?.rol === 'organizador' || perfil?.rol === 'admin'

  const cargarEventos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('eventos')
      .select(`
        *,
        categorias (nombre),
        lugares (nombre, ciudad, direccion, coordenadas),
        tipos_entrada (precio, cupo_disponible)
      `)
      .eq('estado', 'publicado')
      .order('fecha_inicio', { ascending: true })

    if (!error) setEventos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    cargarEventos()
  }, [cargarEventos])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return eventos.filter(ev =>
      (!q ||
        ev.titulo?.toLowerCase().includes(q) ||
        ev.categorias?.nombre?.toLowerCase().includes(q) ||
        ev.lugares?.ciudad?.toLowerCase().includes(q)) &&
      (!ciudad || ev.lugares?.ciudad === ciudad) &&
      (!categoria || ev.categorias?.nombre === categoria) &&
      (!precioMax || obtenerPrecioMinimo(ev) <= Number(precioMax))
    )
  }, [eventos, busqueda, ciudad, categoria, precioMax])

  const ciudades = useMemo(() => valoresUnicos(eventos.map(ev => ev.lugares?.ciudad)), [eventos])
  const categorias = useMemo(() => valoresUnicos(eventos.map(ev => ev.categorias?.nombre)), [eventos])

  const eventosConCoordenadas = useMemo(
    () => filtrados.map(ev => ({ ...ev, puntoMapa: parseCoordenadas(ev.lugares?.coordenadas) })).filter(ev => ev.puntoMapa),
    [filtrados]
  )
  const eventoMapa = eventosConCoordenadas.find(ev => ev.evento_id === eventoMapaId) || eventosConCoordenadas[0]
  const mapaUrl = eventoMapa
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${eventoMapa.puntoMapa.lng - 0.03}%2C${eventoMapa.puntoMapa.lat - 0.02}%2C${eventoMapa.puntoMapa.lng + 0.03}%2C${eventoMapa.puntoMapa.lat + 0.02}&layer=mapnik&marker=${eventoMapa.puntoMapa.lat}%2C${eventoMapa.puntoMapa.lng}`
    : ''

  function limpiarFiltros() {
    setBusqueda('')
    setCiudad('')
    setCategoria('')
    setPrecioMax('')
  }

  return (
    <div className="page-shell">
      <Navbar />

      <section className="relative overflow-hidden border-b border-[#2a3444]/60">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-violet-600/5 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 relative">
          <p className="text-emerald-400/90 text-sm font-medium mb-2">Honduras y Centroamérica</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight max-w-xl">
            {perfil?.nombre ? `Hola, ${perfil.nombre.split(' ')[0]}` : 'Explora'} — encuentra tu próximo evento
          </h1>
          <p className="text-slate-400 mt-3 max-w-lg text-sm sm:text-base">
            Conciertos, festivales y más. Compra entradas en un solo lugar.
          </p>

          {puedeVerFiltros && (
            <div className="mt-8 grid lg:grid-cols-[1.3fr_0.85fr_0.85fr_0.7fr_auto] gap-3 items-end">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
                <input
                  type="search"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, categoria o ciudad..."
                  className="input-field pl-11"
                />
              </div>
              <select value={ciudad} onChange={e => setCiudad(e.target.value)} className="input-field">
                <option value="">Todas las ciudades</option>
                {ciudades.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="input-field">
                <option value="">Todas las categorias</option>
                {categorias.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              <input
                type="number"
                min="0"
                value={precioMax}
                onChange={e => setPrecioMax(e.target.value)}
                placeholder="Precio max."
                className="input-field"
              />
              <button type="button" onClick={limpiarFiltros} className="btn-ghost px-3 py-3 rounded-xl border border-[#2a3444] hover:border-slate-500">
                Limpiar
              </button>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Eventos publicados
            {!loading && (
              <span className="text-slate-500 font-normal text-sm ml-2">({filtrados.length})</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-4">🎭</p>
            <p className="text-white font-medium">No hay eventos para mostrar</p>
            <p className="text-slate-500 text-sm mt-2">
              {busqueda ? 'Prueba con otra búsqueda.' : 'Vuelve pronto o crea uno desde el dashboard si eres organizador.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtrados.map(ev => (
              <EventCard key={ev.evento_id} evento={ev} />
            ))}
          </div>
        )}

        {!loading && eventosConCoordenadas.length > 0 && (
          <section className="mt-10 grid lg:grid-cols-[1.5fr_0.9fr] gap-5">
            <div className="card overflow-hidden min-h-[340px]">
              <iframe
                title="Mapa de eventos"
                src={mapaUrl}
                className="w-full h-[340px] border-0"
                loading="lazy"
              />
            </div>
            <div className="card p-4">
              <h2 className="text-white font-semibold mb-3">Eventos en el mapa</h2>
              <div className="space-y-2 max-h-[290px] overflow-auto pr-1">
                {eventosConCoordenadas.map(ev => (
                  <button
                    key={ev.evento_id}
                    type="button"
                    onClick={() => setEventoMapaId(ev.evento_id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      eventoMapa?.evento_id === ev.evento_id
                        ? 'border-emerald-500/60 bg-emerald-500/10'
                        : 'border-[#2a3444] hover:border-slate-500'
                    }`}
                  >
                    <p className="text-white text-sm font-medium">{ev.titulo}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {ev.lugares?.nombre} · {ev.lugares?.ciudad}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function obtenerPrecioMinimo(evento) {
  if (!evento.tipos_entrada?.length) return 0
  return Math.min(...evento.tipos_entrada.map(tipo => Number(tipo.precio) || 0))
}

function valoresUnicos(valores) {
  return [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
}

function parseCoordenadas(coordenadas) {
  if (!coordenadas) return null

  const partes = coordenadas
    .split(',')
    .map(valor => Number(valor.trim()))

  if (partes.length < 2 || partes.some(Number.isNaN)) return null

  const [lat, lng] = partes
  return { lat, lng }
}
