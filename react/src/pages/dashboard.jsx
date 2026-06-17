import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/navbard'

export default function Dashboard({ vistaInicial = 'eventos' }) {
  const { perfil } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const editarId = searchParams.get('editar')

  const [eventos, setEventos] = useState([])
  const [comprasEvento, setComprasEvento] = useState([])
  const [resenasEvento, setResenasEvento] = useState([])
  const [categorias, setCategorias] = useState([])
  const [lugares, setLugares] = useState([])
  const [stats, setStats] = useState({ totalEventos: 0, totalVentas: 0, totalIngresos: 0, totalAsistentes: 0, totalResenas: 0 })
  const [loading, setLoading] = useState(true)

  const [editingEvent, setEditingEvent] = useState(null)

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    categoria_id: '',
    lugar_id: '',
    imagen_banner: ''
  })

  const [entradas, setEntradas] = useState([
    { nombre: 'General', precio: 0, cupo_total: 0 }
  ])

  const [guardando, setGuardando] = useState(false)
  const [mensajeForm, setMensajeForm] = useState('')
  const [nuevaEntradaPorEvento, setNuevaEntradaPorEvento] = useState({})
  const [mensajeEntrada, setMensajeEntrada] = useState('')

  useEffect(() => {
    if (perfil?.usuario_id) {
      cargarDatos()
      cargarCatalogos()
    }
  }, [perfil?.usuario_id])

  useEffect(() => {
    if (editarId && perfil?.usuario_id) {
      cargarEventoParaEditar(editarId)
    }
  }, [editarId, perfil?.usuario_id])

  // 🔥 FIX STATS REAL
  async function cargarDatos() {
    setLoading(true)

    const consultaEventos = `
      *,
      categorias(nombre),
      lugares(nombre, ciudad),
      tipos_entrada(*)
    `

    const { data: misEventos } = await supabase
      .from('eventos')
      .select(consultaEventos)
      .eq('organizador_id', perfil.usuario_id)
      .order('fecha_creacion', { ascending: false })

    setEventos(misEventos || [])

    const ids = (misEventos || []).map(e => e.evento_id)

    const { data: compras } = await supabase
      .from('compras')
      .select(`
        compra_id,
        cantidad,
        precio_total,
        fecha_compra,
        estado_pago,
        tipos_entrada!inner(nombre, evento_id, eventos(titulo))
      `)

    const filtradas = (compras || []).filter(c =>
      ids.includes(c.tipos_entrada?.evento_id)
    )
    setComprasEvento(filtradas)

    const { data: resenas } = await supabase
      .from('resenas')
      .select(`
        resena_id,
        calificacion,
        comentario,
        fecha_resena,
        evento_id,
        eventos(titulo),
        usuarios(nombre)
      `)

    const resenasFiltradas = (resenas || []).filter(r => ids.includes(r.evento_id))
    setResenasEvento(resenasFiltradas)

    const totalVentas = filtradas.reduce((a, c) => a + c.cantidad, 0)
    const totalIngresos = filtradas.reduce((a, c) => a + Number(c.precio_total), 0)

    setStats({
      totalEventos: ids.length,
      totalVentas,
      totalIngresos,
      totalAsistentes: totalVentas,
      totalResenas: resenasFiltradas.length
    })

    setLoading(false)
  }

  async function cargarCatalogos() {
    const [{ data: cats }, { data: lug }] = await Promise.all([
      supabase.from('categorias').select('*').order('nombre', { ascending: true }),
      supabase.from('lugares').select('*').order('ciudad', { ascending: true }),
    ])

    setCategorias(cats || [])
    setLugares(lug || [])
  }

  async function cargarEventoParaEditar(eventoId) {
    const { data, error } = await supabase
      .from('eventos')
      .select(`
        *,
        categorias(nombre),
        lugares(nombre, ciudad),
        tipos_entrada(*)
      `)
      .eq('evento_id', eventoId)
      .single()

    if (!error && data) abrirEditar(data)
  }

  // 🔥 CREATE EVENT + ENTRADAS
  async function crearEvento(e) {
    e.preventDefault()
    setMensajeForm('')
    setGuardando(true)

    const { data: evento, error } = await supabase
      .from('eventos')
      .insert({
        ...form,
        organizador_id: perfil.usuario_id,
        estado: 'publicado'
      })
      .select()
      .single()

    if (error) {
      setMensajeForm(error.message || 'No se pudo crear el evento')
      setGuardando(false)
      return
    }

    const entradasInsert = entradas.map(t => ({
      evento_id: evento.evento_id,
      nombre: t.nombre,
      precio: t.precio,
      cupo_total: t.cupo_total,
      cupo_disponible: t.cupo_total
    }))

    const { error: errorEntradas } = await supabase.from('tipos_entrada').insert(entradasInsert)

    if (errorEntradas) {
      setMensajeForm(errorEntradas.message || 'El evento se creó, pero no se pudieron crear las entradas')
      setGuardando(false)
      return
    }

    resetForm()
    cargarDatos()
    setGuardando(false)
  }

  function resetForm() {
    setForm({
      titulo: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      categoria_id: '',
      lugar_id: '',
      imagen_banner: ''
    })
    setEntradas([{ nombre: 'General', precio: 0, cupo_total: 0 }])
  }

  // 🔥 CANCEL EVENT
  async function cancelarEvento(id) {
    await supabase
      .from('eventos')
      .update({ estado: 'cancelado' })
      .eq('evento_id', id)

    cargarDatos()
  }

  // 🔥 FINALIZAR EVENTO
  async function finalizarEvento(id) {
    await supabase
      .from('eventos')
      .update({ estado: 'finalizado' })
      .eq('evento_id', id)

    cargarDatos()
  }

  // 🔥 EDIT EVENT (OPEN MODAL)
  function abrirEditar(ev) {
    setEditingEvent(ev)
    setForm({
      titulo: ev.titulo,
      descripcion: ev.descripcion,
      fecha_inicio: ev.fecha_inicio,
      fecha_fin: ev.fecha_fin,
      categoria_id: ev.categoria_id,
      lugar_id: ev.lugar_id,
      imagen_banner: ev.imagen_banner
    })
  }

  async function guardarEdicion(e) {
    e.preventDefault()
    setMensajeForm('')
    setGuardando(true)

    const { error } = await supabase
      .from('eventos')
      .update(form)
      .eq('evento_id', editingEvent.evento_id)

    if (error) {
      setMensajeForm(error.message || 'No se pudieron guardar los cambios')
      setGuardando(false)
      return
    }

    setEditingEvent(null)
    resetForm()
    cargarDatos()
    setSearchParams({})
    setGuardando(false)
  }

  function cambiarNuevaEntrada(eventoId, campo, valor) {
    setNuevaEntradaPorEvento(prev => ({
      ...prev,
      [eventoId]: {
        nombre: 'General',
        precio: '',
        cupo_total: '',
        ...(prev[eventoId] || {}),
        [campo]: valor,
      },
    }))
  }

  async function crearTipoEntrada(eventoId) {
    const entrada = nuevaEntradaPorEvento[eventoId] || {}
    setMensajeEntrada('')

    if (!entrada.nombre || entrada.precio === '' || entrada.cupo_total === '') {
      setMensajeEntrada('Completa nombre, precio y cupo para crear el tipo de entrada.')
      return
    }

    const cupo = Number(entrada.cupo_total)
    const precio = Number(entrada.precio)

    const { error } = await supabase.from('tipos_entrada').insert({
      evento_id: eventoId,
      nombre: entrada.nombre,
      precio,
      cupo_total: cupo,
      cupo_disponible: cupo,
    })

    if (error) {
      setMensajeEntrada(error.message || 'No se pudo crear el tipo de entrada.')
      return
    }

    setNuevaEntradaPorEvento(prev => ({ ...prev, [eventoId]: { nombre: 'General', precio: '', cupo_total: '' } }))
    setMensajeEntrada('Tipo de entrada creado correctamente.')
    cargarDatos()
  }

  if (perfil?.rol !== 'organizador' && perfil?.rol !== 'admin') {
    return (
      <div className="page-shell">
        <Navbar />
        <p className="text-white text-center mt-10">No autorizado</p>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link to="/dashboard" className={`px-3 py-2 rounded-xl text-sm border ${vistaInicial === 'eventos' ? 'border-emerald-500/60 text-emerald-300 bg-emerald-500/10' : 'border-[#2a3444] text-slate-300 hover:border-slate-500'}`}>
            Mis eventos
          </Link>
          <Link to="/dashboard/reportes" className={`px-3 py-2 rounded-xl text-sm border ${vistaInicial === 'reportes' ? 'border-emerald-500/60 text-emerald-300 bg-emerald-500/10' : 'border-[#2a3444] text-slate-300 hover:border-slate-500'}`}>
            Reportes
          </Link>
        </div>

        {/* STATS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-slate-500 text-xs">Eventos</p>
            <p className="text-white text-xl font-semibold mt-1">{stats.totalEventos}</p>
          </div>
          <div className="card p-4">
            <p className="text-slate-500 text-xs">Ventas</p>
            <p className="text-white text-xl font-semibold mt-1">{stats.totalVentas}</p>
          </div>
          <div className="card p-4">
            <p className="text-slate-500 text-xs">Ingresos</p>
            <p className="text-emerald-400 text-xl font-semibold mt-1">L {Number(stats.totalIngresos).toLocaleString('es-HN')}</p>
          </div>
          <div className="card p-4">
            <p className="text-slate-500 text-xs">Asistentes</p>
            <p className="text-white text-xl font-semibold mt-1">{stats.totalAsistentes}</p>
          </div>
          <div className="card p-4">
            <p className="text-slate-500 text-xs">Reseñas</p>
            <p className="text-white text-xl font-semibold mt-1">{stats.totalResenas}</p>
          </div>
        </div>

        {vistaInicial === 'reportes' && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <section className="card p-5">
              <h2 className="text-white font-semibold mb-3">Ventas</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-[#2a3444] p-3">
                  <p className="text-slate-500 text-xs">Asistentes</p>
                  <p className="text-white text-xl font-semibold">{stats.totalAsistentes}</p>
                </div>
                <div className="rounded-xl border border-[#2a3444] p-3">
                  <p className="text-slate-500 text-xs">Ingresos</p>
                  <p className="text-emerald-400 text-xl font-semibold">L {Number(stats.totalIngresos).toLocaleString('es-HN')}</p>
                </div>
              </div>
              {comprasEvento.length === 0 ? (
                <p className="text-slate-500 text-sm">Aún no hay ventas para tus eventos.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-auto">
                  {comprasEvento.map(compra => (
                    <div key={compra.compra_id} className="rounded-xl border border-[#2a3444] p-3">
                      <p className="text-white text-sm">{compra.tipos_entrada?.eventos?.titulo || 'Evento'}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {compra.cantidad} entrada(s) · L {Number(compra.precio_total).toLocaleString('es-HN')} · {compra.estado_pago}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card p-5">
              <h2 className="text-white font-semibold mb-3">Reseñas</h2>
              <div className="rounded-xl border border-[#2a3444] p-3 mb-4">
                <p className="text-slate-500 text-xs">Total de reseñas</p>
                <p className="text-white text-xl font-semibold">{stats.totalResenas}</p>
              </div>
              {resenasEvento.length === 0 ? (
                <p className="text-slate-500 text-sm">Aún no hay reseñas para tus eventos.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-auto">
                  {resenasEvento.map(resena => (
                    <div key={resena.resena_id} className="rounded-xl border border-[#2a3444] p-3">
                      <p className="text-white text-sm">{resena.eventos?.titulo || 'Evento'} · {resena.calificacion}/5</p>
                      <p className="text-slate-400 text-xs mt-1">{resena.usuarios?.nombre || 'Asistente'}</p>
                      {resena.comentario && <p className="text-slate-300 text-sm mt-2">{resena.comentario}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">

          {/* FORM */}
          <div className="card p-5">
            <h2 className="text-white mb-3">
              {editingEvent ? 'Editar evento' : 'Crear evento'}
            </h2>
            {editingEvent && (
              <p className="text-slate-500 text-xs mb-3">
                Editando evento publicado: {editingEvent.titulo}
              </p>
            )}

            <form onSubmit={editingEvent ? guardarEdicion : crearEvento}>

              <input placeholder="Título"
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                className="input-field" />

              <textarea placeholder="Descripción"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                className="input-field mt-2" />

              <div className="grid md:grid-cols-2 gap-2 mt-2">
                <label className="block">
                  <span className="text-slate-300 text-sm mb-1.5 block">Fecha y hora de inicio</span>
                  <input
                    type="datetime-local"
                    value={normalizarFechaInput(form.fecha_inicio)}
                    onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                    className="input-field"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-slate-300 text-sm mb-1.5 block">Fecha y hora de fin</span>
                  <input
                    type="datetime-local"
                    value={normalizarFechaInput(form.fecha_fin)}
                    onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                    className="input-field"
                    required
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-2 mt-2">
                <select
                  value={form.categoria_id}
                  onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.categoria_id} value={cat.categoria_id}>{cat.nombre}</option>
                  ))}
                </select>
                <select
                  value={form.lugar_id}
                  onChange={e => setForm({ ...form, lugar_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Lugar</option>
                  {lugares.map(lugar => (
                    <option key={lugar.lugar_id} value={lugar.lugar_id}>{lugar.nombre} · {lugar.ciudad}</option>
                  ))}
                </select>
              </div>

              <input
                placeholder="URL de imagen del banner"
                value={form.imagen_banner || ''}
                onChange={e => setForm({ ...form, imagen_banner: e.target.value })}
                className="input-field mt-2"
              />

              {/* ENTRADAS SOLO EN CREACIÓN */}
              {!editingEvent && (
                <div className="mt-3">
                  {entradas.map((t, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                      <input placeholder="Nombre"
                        value={t.nombre}
                        onChange={e => {
                          const copy = [...entradas]
                          copy[i].nombre = e.target.value
                          setEntradas(copy)
                        }}
                        className="input-field" />

                      <input placeholder="Precio" type="number"
                        value={t.precio}
                        onChange={e => {
                          const copy = [...entradas]
                          copy[i].precio = e.target.value
                          setEntradas(copy)
                        }}
                        className="input-field" />

                      <input placeholder="Cupo" type="number"
                        value={t.cupo_total}
                        onChange={e => {
                          const copy = [...entradas]
                          copy[i].cupo_total = e.target.value
                          setEntradas(copy)
                        }}
                        className="input-field" />
                    </div>
                  ))}

                  <button type="button"
                    onClick={() => setEntradas([...entradas, { nombre: '', precio: 0, cupo_total: 0 }])}
                    className="text-emerald-400 text-sm">
                    + Agregar entrada
                  </button>
                </div>
              )}

              {mensajeForm && (
                <p className="text-xs mt-3 p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  {mensajeForm}
                </p>
              )}

              <button className="btn-primary mt-3 w-full">
                {guardando ? 'Guardando...' : editingEvent ? 'Guardar cambios' : 'Crear evento'}
              </button>
              {editingEvent && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null)
                    resetForm()
                    setSearchParams({})
                  }}
                  className="btn-ghost mt-3 w-full py-2 rounded-xl border border-[#2a3444]"
                >
                  Cancelar edición
                </button>
              )}
            </form>
          </div>

          {/* LIST */}
          <div className="card p-5">
            <h2 className="text-white mb-1">Mis eventos</h2>
            <p className="text-slate-500 text-xs mb-3">
              Administra tus eventos publicados: editar, cancelar, finalizar y agregar entradas.
            </p>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="spinner" />
              </div>
            ) : eventos.length === 0 ? (
              <p className="text-slate-500 text-sm">Aún no tienes eventos creados.</p>
            ) : (
              eventos.map(ev => (
                <div key={ev.evento_id} className="border border-[#2a3444] p-3 mb-2 rounded-xl">

                  <p className="text-white">{ev.titulo}</p>
                  <p className={`text-xs mt-1 capitalize ${
                    ev.estado === 'publicado'
                      ? 'text-emerald-400'
                      : ev.estado === 'cancelado'
                        ? 'text-red-400'
                        : ev.estado === 'finalizado'
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                  }`}>
                    {ev.estado}
                  </p>
                  {ev.tipos_entrada?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {ev.tipos_entrada.map(tipo => (
                        <div key={tipo.tipo_entrada_id} className="flex justify-between gap-3 text-xs rounded-lg bg-[#151a23] border border-[#2a3444] px-3 py-2">
                          <span className="text-slate-300">{tipo.nombre}</span>
                          <span className="text-slate-400">
                            L {Number(tipo.precio).toLocaleString('es-HN')} · {tipo.cupo_disponible}/{tipo.cupo_total}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2 flex-wrap">

                    <button onClick={() => abrirEditar(ev)}
                      className="text-blue-400 text-xs">
                      Editar
                    </button>

                    {ev.estado !== 'cancelado' && ev.estado !== 'finalizado' && (
                      <button onClick={() => cancelarEvento(ev.evento_id)}
                        className="text-red-400 text-xs">
                        Cancelar
                      </button>
                    )}

                    {ev.estado !== 'finalizado' && ev.estado !== 'cancelado' && (
                      <button onClick={() => finalizarEvento(ev.evento_id)}
                        className="text-yellow-400 text-xs">
                        Finalizar
                      </button>
                    )}

                  </div>

                  <div className="mt-3 rounded-xl border border-[#2a3444] bg-[#151a23] p-3">
                    <p className="text-slate-300 text-xs font-medium mb-2">Crear tipo de entrada</p>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <input
                        placeholder="Nombre"
                        value={nuevaEntradaPorEvento[ev.evento_id]?.nombre || ''}
                        onChange={e => cambiarNuevaEntrada(ev.evento_id, 'nombre', e.target.value)}
                        className="input-field"
                      />
                      <input
                        placeholder="Precio"
                        type="number"
                        min="0"
                        value={nuevaEntradaPorEvento[ev.evento_id]?.precio || ''}
                        onChange={e => cambiarNuevaEntrada(ev.evento_id, 'precio', e.target.value)}
                        className="input-field"
                      />
                      <input
                        placeholder="Cupo"
                        type="number"
                        min="1"
                        value={nuevaEntradaPorEvento[ev.evento_id]?.cupo_total || ''}
                        onChange={e => cambiarNuevaEntrada(ev.evento_id, 'cupo_total', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <button type="button" onClick={() => crearTipoEntrada(ev.evento_id)} className="mt-2 text-emerald-400 text-xs">
                      + Crear entrada para este evento
                    </button>
                  </div>
                </div>
              ))
            )}
            {mensajeEntrada && (
              <p className={`text-xs mt-3 p-3 rounded-xl border ${
                mensajeEntrada.startsWith('Tipo')
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {mensajeEntrada}
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

function normalizarFechaInput(fecha) {
  if (!fecha) return ''
  return fecha.slice(0, 16)
}
