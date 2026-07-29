import {
  Building2,
  ChevronDown,
  Files,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  UserRound,
  X,
} from 'lucide-react'
import type { Company, UserEnvironment } from '../types/api'

export type AppView = 'chat' | 'files' | 'settings'

interface SidebarProps {
  open: boolean
  activeView: AppView
  companies: Company[]
  company: string
  environment: UserEnvironment | null
  onToggle: () => void
  onClose: () => void
  onNavigate: (view: AppView) => void
  onCompanyChange: (company: string) => void
  onAuthenticate: (
    intent: 'login' | 'register',
    provider: 'google' | 'github',
  ) => Promise<void>
  onLogout: () => void
}

const adminNavigation = [
  { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
  { id: 'files' as const, label: 'Archivos', icon: Files },
  { id: 'settings' as const, label: 'Configuración', icon: Settings },
]

export function Sidebar({
  open,
  activeView,
  companies,
  company,
  environment,
  onToggle,
  onClose,
  onNavigate,
  onCompanyChange,
  onAuthenticate,
  onLogout,
}: SidebarProps) {
  const navigation = environment?.membership_role === 'admin'
    ? adminNavigation
    : [{ id: 'chat' as const, label: 'Chat', icon: MessageCircle }]
  return (
    <>
      <button
        aria-label="Abrir menú principal"
        className="fixed left-4 top-4 z-30 grid size-11 place-items-center rounded-xl border border-cyan-300/20 bg-[#0b1728] text-cyan-200 shadow-xl lg:hidden"
        onClick={onToggle}
        type="button"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <button
          aria-label="Cerrar menú principal"
          className="fixed inset-0 z-30 bg-[#02060d]/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}

      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-40 flex w-[280px] max-w-[88vw] flex-col border-r border-cyan-100/10 bg-[#0a1727] transition-transform lg:static lg:z-auto lg:w-[270px] lg:max-w-none lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 pb-7 pt-7">
          <div className="brand-mark" aria-hidden="true">
            A
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-extrabold tracking-tight text-white">
              Alianza F1
            </h1>
            <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
              Asistente de Conocimiento
            </p>
          </div>
          <button
            aria-label="Cerrar menú principal"
            className="icon-button lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Navegación principal" className="space-y-2 px-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = activeView === item.id
            return (
              <button
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                key={item.id}
                onClick={() => {
                  onNavigate(item.id)
                  onClose()
                }}
                type="button"
              >
                <Icon className="size-[18px]" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto px-4 pb-4">
          {environment ? (
            <div className="rounded-xl border border-slate-600/45 bg-[#0b1a2d] p-4">
              <span className="text-[11px] text-slate-400">
                Empresa administrada
              </span>
              <p className="mt-1 flex items-center gap-2 truncate text-sm font-semibold">
                <Building2 className="size-4 text-cyan-300" />
                {environment.company_name}
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                {environment.membership_role} · {environment.platform_role}
              </p>
            </div>
          ) : (
            <>
              <label className="block rounded-xl border border-slate-600/45 bg-[#0b1a2d] px-4 py-3">
                <span className="text-[11px] text-slate-400">
                  Empresa pública
                </span>
                <span className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                  <Building2 className="size-4 text-slate-400" />
                  <select
                    aria-label="Empresa pública"
                    className="min-w-0 flex-1 appearance-none bg-transparent text-white outline-none"
                    disabled={companies.length === 0}
                    onChange={(event) => onCompanyChange(event.target.value)}
                    value={company}
                  >
                    {companies.map((item) => (
                      <option
                        className="bg-[#0b1a2d]"
                        key={item.knowledge_key}
                        value={item.knowledge_key}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="size-4 text-slate-400" />
                </span>
              </label>
              <div className="mt-3 grid gap-2">
                <button
                  className="secondary-button w-full"
                  onClick={() => void onAuthenticate('login', 'google')}
                  type="button"
                >
                  Iniciar sesión con Google
                </button>
                <button
                  className="secondary-button w-full"
                  onClick={() => void onAuthenticate('login', 'github')}
                  type="button"
                >
                  Iniciar sesión con GitHub
                </button>
                <button
                  className="primary-button w-full"
                  onClick={() => void onAuthenticate('register', 'google')}
                  type="button"
                >
                  Registra tu empresa gratis
                </button>
                <button
                  className="secondary-button w-full"
                  onClick={() => void onAuthenticate('register', 'github')}
                  type="button"
                >
                  Registrar con GitHub
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-slate-700/60 px-5 py-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[#0a1727]">
            <UserRound className="size-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {environment ? 'Usuario autenticado' : 'Visitante'}
            </p>
            <p className="text-[11px] text-slate-400">
              {environment ? environment.membership_role : 'viewer'}
            </p>
          </div>
          {environment && (
            <button
              aria-label="Cerrar sesión"
              className="icon-button"
              onClick={onLogout}
              type="button"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
