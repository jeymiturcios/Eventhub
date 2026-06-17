import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/login'
import Register from './pages/register'
import Home from './pages/home'
import Dashboard from './pages/dashboard'
import EventDetail from './pages/eventdetail'
import Perfil from './pages/perfil'
import MisEntradas from './pages/misentradas'

const ORGANIZER_ROLES = ['organizador', 'admin']
const ASSISTANT_ROLES = ['asistente']

function rutaInicialPorRol(rol) {
  if (!rol) return '/perfil'
  return ORGANIZER_ROLES.includes(rol) ? '/dashboard' : '/'
}

function LoadingScreen() {
  return (
    <div className="page-shell flex items-center justify-center">
      <div className="spinner" />
    </div>
  )
}

function ProtectedRoute({ children, roles }) {
  const { user, perfil, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(perfil?.rol)) {
    return <Navigate to={rutaInicialPorRol(perfil?.rol)} replace />
  }
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, perfil, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to={rutaInicialPorRol(perfil?.rol)} replace />
  return children
}

function LegacyEventRedirect() {
  const { id } = useParams()
  return <Navigate to={`/evento/${id}`} replace />
}

function RoleRedirect() {
  const { user, perfil, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return <Navigate to={user ? rutaInicialPorRol(perfil?.rol) : '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/" element={<ProtectedRoute roles={[...ASSISTANT_ROLES, ...ORGANIZER_ROLES]}><Home /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path="/mis-entradas" element={<ProtectedRoute roles={ASSISTANT_ROLES}><MisEntradas /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute roles={ORGANIZER_ROLES}><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/eventos" element={<ProtectedRoute roles={ORGANIZER_ROLES}><Dashboard vistaInicial="eventos" /></ProtectedRoute>} />
          <Route path="/dashboard/ventas" element={<ProtectedRoute roles={ORGANIZER_ROLES}><Navigate to="/dashboard/reportes" replace /></ProtectedRoute>} />
          <Route path="/dashboard/reportes" element={<ProtectedRoute roles={ORGANIZER_ROLES}><Dashboard vistaInicial="reportes" /></ProtectedRoute>} />
          <Route path="/evento/:id" element={<ProtectedRoute roles={[...ASSISTANT_ROLES, ...ORGANIZER_ROLES]}><EventDetail /></ProtectedRoute>} />
          <Route path="/eventos/:id" element={<LegacyEventRedirect />} />
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
