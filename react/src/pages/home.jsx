import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/navbard'
import EventCard from '../components/eventcard'

export default function Home() {
  const { perfil } = useAuth()
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarEventos()
  }, [])

  async function cargarEventos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('eventos')
      .select(`
        *,
        categorias (nombre),
        lugares (nombre, ciudad),
        tipos_entrada (precio, cupo_disponible)
      `)
      .eq('estado', 'publicado')
      .order('fecha_inicio', { ascending: true })

    if (!error) setEventos(data || [])
    setLoading(false)
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return eventos
    return eventos.filter(ev =>
      ev.titulo?.toLowerCase().includes(q) ||
      ev.categorias?.nombre?.toLowerCase().includes(q) ||
      ev.lugares?.ciudad?.toLowerCase().includes(q)
    )
  }, [eventos, busqueda])

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

          <div className="mt-8 max-w-md relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, categoría o ciudad..."
              className="input-field pl-11"
            />
          </div>
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
      </main>
    </div>
  )
}
