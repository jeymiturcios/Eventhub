import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/navbard'

export default function Dashboard() {
  const { user, perfil } = useAuth()
  const navigate = useNavigate()

  const [eventos, setEventos] = useState([])
  const [stats, setStats] = useState({ totalEventos: 0, totalVentas: 0, totalIngresos: 0 })
  const [loading, setLoading] = useState(true)

  const [categorias, setCategorias] = useState([])
  const [lugares, setLugares] = useState([])

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
  const [msgForm, setMsgForm] = useState('')

  useEffect(() => {
    if (user) {
      cargarDatos()
      cargarCatalogos()
    }
  }, [user])

  // 🔥 FIX STATS REAL
  async function cargarDatos() {
    setLoading(true)

    const { data: misEventos } = await supabase
      .from('eventos')
      .select(`
        *,
        categorias(nombre),
        lugares(nombre, ciudad),
        tipos_entrada(*)
      `)
      .eq('organizador_id', user.id)
      .order('fecha_creacion', { ascending: false })

    setEventos(misEventos || [])

    const ids = (misEventos || []).map(e => e.evento_id)

    const { data: compras } = await supabase
      .from('compras')
      .select(`
        cantidad,
        precio_total,
        tipos_entrada!inner(evento_id)
      `)

    const filtradas = (compras || []).filter(c =>
      ids.includes(c.tipos_entrada?.evento_id)
    )

    const totalVentas = filtradas.reduce((a, c) => a + c.cantidad, 0)
    const totalIngresos = filtradas.reduce((a, c) => a + Number(c.precio_total), 0)

    setStats({
      totalEventos: ids.length,
      totalVentas,
      totalIngresos
    })

    setLoading(false)
  }

  async function cargarCatalogos() {
    const [{ data: cats }, { data: lug }] = await Promise.all([
      supabase.from('categorias').select('*'),
      supabase.from('lugares').select('*')
    ])

    setCategorias(cats || [])
    setLugares(lug || [])
  }

  // 🔥 CREATE EVENT + ENTRADAS
  async function crearEvento(e) {
    e.preventDefault()
    setGuardando(true)

    const { data: evento } = await supabase
      .from('eventos')
      .insert({
        ...form,
        organizador_id: user.id,
        estado: 'publicado'
      })
      .select()
      .single()

    const entradasInsert = entradas.map(t => ({
      evento_id: evento.evento_id,
      nombre: t.nombre,
      precio: t.precio,
      cupo_total: t.cupo_total,
      cupo_disponible: t.cupo_total
    }))

    await supabase.from('tipos_entrada').insert(entradasInsert)

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

  async function guardarEdicion() {
    await supabase
      .from('eventos')
      .update(form)
      .eq('evento_id', editingEvent.evento_id)

    setEditingEvent(null)
    resetForm()
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

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4">🎪 {stats.totalEventos}</div>
          <div className="card p-4">🎟️ {stats.totalVentas}</div>
          <div className="card p-4">💰 L {stats.totalIngresos}</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* FORM */}
          <div className="card p-5">
            <h2 className="text-white mb-3">
              {editingEvent ? 'Editar evento' : 'Crear evento'}
            </h2>

            <form onSubmit={editingEvent ? guardarEdicion : crearEvento}>

              <input placeholder="Título"
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                className="input-field" />

              <textarea placeholder="Descripción"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                className="input-field mt-2" />

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

              <button className="btn-primary mt-3 w-full">
                {editingEvent ? 'Guardar cambios' : 'Crear evento'}
              </button>
            </form>
          </div>

          {/* LIST */}
          <div className="card p-5">
            <h2 className="text-white mb-3">Mis eventos</h2>

            {eventos.map(ev => (
              <div key={ev.evento_id} className="border p-3 mb-2 rounded">

                <p className="text-white">{ev.titulo}</p>
                <p className="text-xs text-gray-400">{ev.estado}</p>

                <div className="flex gap-2 mt-2 flex-wrap">

                  <button onClick={() => abrirEditar(ev)}
                    className="text-blue-400 text-xs">
                    Editar
                  </button>

                  <button onClick={() => cancelarEvento(ev.evento_id)}
                    className="text-red-400 text-xs">
                    Cancelar
                  </button>

                  <button onClick={() => finalizarEvento(ev.evento_id)}
                    className="text-yellow-400 text-xs">
                    Finalizar
                  </button>

                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}