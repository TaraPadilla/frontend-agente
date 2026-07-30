import {
  ArrowLeft,
  Building2,
  ChevronDown,
  Files,
  LogOut,
  LogIn,
  Menu,
  MessageCircle,
  Plus,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
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

type AuthIntent = 'login' | 'register'

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-[18px]" viewBox="0 0 24 24">
      <path
        d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 5-.9 6.8-2.3l-3.3-2.6c-.9.6-2.1 1-3.5 1a6 6 0 0 1-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.4 14a6 6 0 0 1 0-3.9V7.4H3a10 10 0 0 0 0 9.3L6.4 14Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 3 7.4l3.4 2.7A6 6 0 0 1 12 5.9Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 2.9.9.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.7 3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
    </svg>
  )
}

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
  const [authIntent, setAuthIntent] = useState<AuthIntent | null>(null)
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
              {authIntent ? (
                <section
                  aria-label={
                    authIntent === 'register'
                      ? 'Métodos para crear un agente'
                      : 'Métodos para iniciar sesión'
                  }
                  className="mt-3 rounded-xl border border-cyan-300/15 bg-[#07111f] p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      aria-label="Volver a las opciones de acceso"
                      className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-cyan-200"
                      onClick={() => setAuthIntent(null)}
                      type="button"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <div>
                      <h2 className="text-sm font-bold text-white">
                        {authIntent === 'register'
                          ? 'Crea tu agente empresarial'
                          : 'Inicia sesión'}
                      </h2>
                      <p className="mt-1 text-[11px] leading-4 text-slate-400">
                        {authIntent === 'register'
                          ? 'Elige una cuenta para comenzar la configuración.'
                          : 'Continúa con el proveedor de tu cuenta.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <button
                      className="secondary-button w-full gap-2.5 bg-white text-[#17202a] hover:!border-white/80 hover:!bg-slate-100 hover:!text-[#17202a]"
                      onClick={() =>
                        void onAuthenticate(authIntent, 'google')
                      }
                      type="button"
                    >
                      <GoogleIcon />
                      Continuar con Google
                    </button>
                    <button
                      className="secondary-button w-full gap-2.5"
                      onClick={() =>
                        void onAuthenticate(authIntent, 'github')
                      }
                      type="button"
                    >
                      <GitHubIcon />
                      Continuar con GitHub
                    </button>
                  </div>

                  <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-slate-500">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                    Acceso seguro. No compartimos tu contraseña.
                  </p>
                </section>
              ) : (
                <div className="mt-3 grid gap-2">
                  <button
                    className="primary-button w-full gap-2"
                    onClick={() => setAuthIntent('register')}
                    type="button"
                  >
                    <Plus className="size-[18px]" />
                    Crear un agente para mi empresa
                  </button>
                  <button
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-cyan-200"
                    onClick={() => setAuthIntent('login')}
                    type="button"
                  >
                    <LogIn className="size-4" />
                    Ya tengo una cuenta — Iniciar sesión
                  </button>
                </div>
              )}
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
