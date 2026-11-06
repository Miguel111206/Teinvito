import { Link, Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import { AuthProvider, RequireAdmin } from './admin/auth'
import Layout from './admin/Layout'
import Login from './admin/Login'
import Dashboard from './admin/Dashboard'
import InvitationsList from './admin/InvitationsList'
import Sent from './admin/Sent'
import Detail from './admin/Detail'
import Builder from './admin/builder/Builder'
import InvitePage from './pages/InvitePage'
import { isConfigured } from './lib/supabase'

function Root() {
  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl bg-white p-6 shadow">
          <h1 className="mb-2 text-lg font-bold">Falta configurar Supabase</h1>
          <p className="text-sm text-gray-600">Define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> (ver .env.example y el README) y vuelve a compilar.</p>
        </div>
      </div>
    )
  }
  return <Outlet />
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <div className="mb-2 text-5xl" aria-hidden>🔍</div>
        <h1 className="mb-2 text-xl font-bold">Página no encontrada</h1>
        <Link to="/admin" className="text-rose-600 underline">Ir al panel</Link>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <Navigate to="/admin" replace /> },
      { path: '/invite/:token', element: <InvitePage /> },
      {
        // El AuthProvider solo envuelve el panel; la invitación pública no usa sesión.
        element: <AuthProvider><Outlet /></AuthProvider>,
        children: [
          { path: '/admin/login', element: <Login /> },
          {
            element: <RequireAdmin />,
            children: [
              {
                element: <Layout />,
                children: [
                  { path: '/admin', element: <Dashboard /> },
                  { path: '/admin/invitaciones', element: <InvitationsList /> },
                  { path: '/admin/invitaciones/:id', element: <Builder /> },
                  { path: '/admin/invitaciones/:id/detalle', element: <Detail /> },
                  { path: '/admin/enviadas', element: <Sent /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
