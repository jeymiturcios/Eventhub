import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const estadoStyles = {
  publicado: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
  borrador: 'bg-amber-500/20 text-amber-300 ring-amber-500/30',
  cancelado: 'bg-red-500/20 text-red-300 ring-red-500/30',
  finalizado: 'bg-slate-500/20 text-slate-400 ring-slate-500/30',
}

export default function EventCard({ evento }) {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const esOrganizador = perfil?.rol === 'organizador' || perfil?.rol === 'admin'

  const precioMin = evento.tipos_entrada?.length
    ? Math.min(...evento.tipos_entrada.map(t => Number(t.precio)))
    : null

  const fecha = new Date(evento.fecha_inicio).toLocaleDateString('es-HN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const badgeClass = estadoStyles[evento.estado] || estadoStyles.borrador

  function editarEvento(e) {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/dashboard?editar=${evento.evento_id}`)
  }

  return (
    <Link to={`/eventos/${evento.evento_id}`} className="group block h-full">
      <article className="card h-full overflow-hidden transition-all duration-200 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/30 hover:-translate-y-0.5">
        <div className="aspect-[16/10] bg-[#151a23] overflow-hidden relative">
          {evento.imagen_banner ? (
            <img
              src={evento.imagen_banner}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2130] to-[#0c0f14] text-5xl opacity-80">
              🎵
            </div>
          )}
          <span className={`absolute top-3 right-3 text-[10px] uppercase tracking-wide px-2 py-1 rounded-full font-semibold ring-1 ${badgeClass}`}>
            {evento.estado}
          </span>
        </div>

        <div className="p-4 flex flex-col flex-1">
          {evento.categorias?.nombre && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/90">
              {evento.categorias.nombre}
            </span>
          )}

          <h3 className="text-white font-semibold text-base leading-snug mt-1 line-clamp-2 group-hover:text-emerald-300 transition-colors">
            {evento.titulo}
          </h3>

          <ul className="mt-3 space-y-1.5 text-slate-400 text-xs flex-1">
            <li className="flex items-center gap-2">
              <span className="text-slate-500" aria-hidden>📅</span>
              {fecha}
            </li>
            {evento.lugares?.ciudad && (
              <li className="flex items-center gap-2">
                <span className="text-slate-500" aria-hidden>📍</span>
                {evento.lugares.nombre} · {evento.lugares.ciudad}
              </li>
            )}
          </ul>

          <div className="mt-4 pt-3 border-t border-[#2a3444] flex items-center justify-between gap-3">
            <span className="text-emerald-400 font-bold text-sm">
              {precioMin !== null ? `Desde L. ${precioMin.toLocaleString('es-HN')}` : 'Consultar precio'}
            </span>
            {esOrganizador ? (
              <button
                type="button"
                onClick={editarEvento}
                className="text-blue-400 text-xs hover:text-blue-300"
              >
                Editar
              </button>
            ) : (
              <span className="text-slate-500 text-xs group-hover:text-emerald-400/80 transition-colors">
                Ver detalle →
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
