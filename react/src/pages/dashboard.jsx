import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/navbard'

export default function Dashboard() {
  const { user, perfil } = useAuth()
  const navigate = useNavigate()

  const [eventos,  setEventos]  = useState([])
  const [stats,    setStats]    = useState({ totalEventos: 0, totalVentas: 0, totalIngresos: 0 })
  const [loading,  setLoading]  = useState(true)

  // Formulario nuevo evento
  const [categorias, setCategorias] = useState([])
  const [lugares,    setLugares]    = useState([])
  const [form, setForm] = useState({
    titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '',
    categoria_id: '', lugar_id: '', imagen_banner: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [msgForm,   setMsgForm]   = useState('')

  useEffect(() => {
    cargarDatos()
    cargarCatalogos()
  }, [user])

  async function cargarDatos() {
    if (!user) return
    setLoading(true)

    const { data: misEventos } = await supabase
      .from('eventos')
      .select(`*, categorias(nombre), lugares(nombre, ciudad), tipos_entrada(tipo_entrada_id, nombre, precio, cupo_total, cupo_disponible)`)
      .eq('organizador_id', user.id)
      .order('fecha_creacion', { ascending: false })

    setEventos(misEventos || [])

    // Stats básicas
    let totalVentas = 0, totalIngresos = 0
    if (misEventos?.length) {
      const ids = misEventos.map(e => e.evento_id)
      const { data: compras } = await supabase
        .from('compras')
        .select('cantidad, precio_total, tipos_entrada(evento_id)')
        .in('tipos_entrada.evento_id', ids)

      totalVentas   = compras?.reduce((a, c) => a + c.cantidad, 0) || 0
      totalIngresos = compras?.reduce((a, c) => a + Number(c.precio_total), 0) || 0
    }

    setStats({ totalEventos: misEventos?.length || 0, totalVentas, totalIngresos })
    setLoading(false)
  }

  async function cargarCatalogos() {
    const [{ data: cats }, { data: lug }] = await Promise.all([
      supabase.from('categorias').select('*').order('nombre'),
      supabase.from('lugares').select('*').order('nombre'),
    ])
    setCategorias(cats || [])
    setLugares(lug || [])
  }

  async function crearEvento(e) {
    e.preventDefault()
    setGuardando(true)
    setMsgForm('')

    const { error } = await supabase.from('eventos').insert({
      ...form,
      organizador_id: user.id,
      estado: 'publicado',
      creado_con_asistente_ia: false,
    })

    if (error) setMsgForm('Error: ' + error.message)
    else {
      setMsgForm('✅ Evento creado correctamente')
      setForm({ titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '', categoria_id: '', lugar_id: '', imagen_banner: '' })
      cargarDatos()
    }
    setGuardando(false)
  }

  const inputCls = 'input-field py-2.5'

  if (perfil && perfil.rol !== 'organizador' && perfil.rol !== 'admin') {
    return (
      <div className="page-shell">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center card p-8">
          <p className="text-white font-medium">Solo organizadores pueden acceder al dashboard</p>
          <button type="button" onClick={() => navigate('/')} className="btn-primary mt-6 max-w-xs mx-auto">
            Volver a explorar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Bienvenido, {perfil?.nombre}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Mis eventos', value: stats.totalEventos, icon: '🎪' },
            { label: 'Entradas vendidas', value: stats.totalVentas, icon: '🎟️' },
            { label: 'Ingresos totales', value: `L. ${stats.totalIngresos.toLocaleString('es-HN')}`, icon: '💰' },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <p className="text-2xl mb-2">{s.icon}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-slate-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Formulario crear evento */}
          <div className="card p-6">
            <h2 className="text-white font-semibold mb-5">Crear nuevo evento</h2>

            {msgForm && (
              <p className={`text-xs mb-4 p-2 rounded-lg ${msgForm.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {msgForm}
              </p>
            )}

            <form onSubmit={crearEvento} className="space-y-3">
              <input required placeholder="Título del evento" value={form.titulo}
                onChange={e => setForm({...form, titulo: e.target.value})} className={inputCls} />

              <textarea required placeholder="Descripción" value={form.descripcion} rows={3}
                onChange={e => setForm({...form, descripcion: e.target.value})}
                className={inputCls + ' resize-none'} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Fecha inicio</label>
                  <input required type="datetime-local" value={form.fecha_inicio}
                    onChange={e => setForm({...form, fecha_inicio: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Fecha fin</label>
                  <input required type="datetime-local" value={form.fecha_fin}
                    onChange={e => setForm({...form, fecha_fin: e.target.value})} className={inputCls} />
                </div>
              </div>

              <select required value={form.categoria_id}
                onChange={e => setForm({...form, categoria_id: e.target.value})} className={inputCls}>
                <option value="">Seleccionar categoría</option>
                {categorias.map(c => <option key={c.categoria_id} value={c.categoria_id}>{c.nombre}</option>)}
              </select>

              <select required value={form.lugar_id}
                onChange={e => setForm({...form, lugar_id: e.target.value})} className={inputCls}>
                <option value="">Seleccionar lugar</option>
                {lugares.map(l => <option key={l.lugar_id} value={l.lugar_id}>{l.nombre} · {l.ciudad}</option>)}
              </select>

              <input placeholder="URL imagen banner (opcional)" value={form.imagen_banner}
                onChange={e => setForm({...form, imagen_banner: e.target.value})} className={inputCls} />

              <button type="submit" disabled={guardando} className="btn-primary">
                {guardando ? 'Guardando...' : 'Publicar evento'}
              </button>
            </form>
          </div>

          {/* Lista mis eventos */}
          <div>
            <h2 className="text-white font-semibold mb-4">Mis eventos</h2>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : eventos.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">Aún no has creado eventos</p>
            ) : (
              <div className="space-y-3">
                {eventos.map(ev => (
                  <div key={ev.evento_id}
                    onClick={() => navigate(`/eventos/${ev.evento_id}`)}
                    className="card p-4 hover:border-emerald-500/40 cursor-pointer transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white text-sm font-medium">{ev.titulo}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          {ev.categorias?.nombre} · {ev.lugares?.ciudad}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(ev.fecha_inicio).toLocaleDateString('es-HN')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        ev.estado === 'publicado'  ? 'bg-emerald-500/20 text-emerald-300' :
                        ev.estado === 'cancelado'  ? 'bg-red-500/20 text-red-300' :
                        ev.estado === 'finalizado' ? 'bg-slate-500/20 text-slate-400' :
                                                     'bg-yellow-500/20 text-yellow-300'
                      }`}>{ev.estado}</span>
                    </div>
                    {ev.tipos_entrada?.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {ev.tipos_entrada.map(t => (
                          <span key={t.tipo_entrada_id} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                            {t.nombre}: {t.cupo_disponible}/{t.cupo_total}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}