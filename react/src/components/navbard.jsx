import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const esOrganizador = perfil?.rol === 'organizador' || perfil?.rol === 'admin'
  const links = esOrganizador
    ? [
        { to: '/', label: 'Explorar' },
        { to: '/perfil', label: 'Perfil' },
        { to: '/dashboard', label: 'Dashboard' },
      ]
    : [
        { to: '/', label: 'Explorar' },
        { to: '/mis-entradas', label: 'Mis Entradas' },
        { to: '/perfil', label: 'Perfil' },
      ]

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#2a3444]/80 bg-[#0c0f14]/90 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-emerald-400 font-bold text-lg tracking-tight shrink-0"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-sm">EH</span>
          EventHub
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {perfil?.nombre && (
            <span className="text-slate-400 text-sm truncate max-w-[140px]">{perfil.nombre}</span>
          )}
          {perfil?.rol && (
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                perfil.rol === 'organizador'
                  ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25'
                  : 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25'
              }`}
            >
              {perfil.rol}
            </span>
          )}
          <button type="button" onClick={handleLogout} className="btn-ghost px-2 py-1 rounded-lg hover:bg-red-500/10 hover:text-red-400">
            Salir
          </button>
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-[#2a3444] px-4 py-3 space-y-1 bg-[#0c0f14]">
          {links.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5">
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#2a3444] flex items-center justify-between">
            <span className="text-slate-400 text-sm">{perfil?.nombre}</span>
            <button type="button" onClick={handleLogout} className="text-sm text-red-400">
              Salir
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
