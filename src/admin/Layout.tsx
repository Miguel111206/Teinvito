import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth'

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-rose-100 text-rose-700' : 'text-gray-600 hover:bg-gray-100'}`

export default function Layout() {
  const { session, signOut } = useAuth()
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-4 py-2">
          <span className="mr-2 text-lg font-bold">💌 Invitaciones</span>
          <nav className="flex flex-1 flex-wrap gap-1" aria-label="Principal">
            <NavLink end to="/admin" className={link}>Inicio</NavLink>
            <NavLink to="/admin/invitaciones" className={link}>Invitaciones</NavLink>
            <NavLink to="/admin/enviadas" className={link}>Invitaciones enviadas</NavLink>
          </nav>
          <span className="hidden text-xs text-gray-400 sm:inline">{session?.user.email}</span>
          <button className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" onClick={() => void signOut()}>Cerrar sesión</button>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
    </div>
  )
}
