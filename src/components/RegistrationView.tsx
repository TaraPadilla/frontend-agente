import {
  ArrowLeft,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  Globe2,
  MessageCircle,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { PRODUCT_LANDING_URL } from '../config'
import { GitHubIcon, GoogleIcon } from './AuthProviderIcons'

type AuthIntent = 'login' | 'register'
type AuthProvider = 'google' | 'github'

interface RegistrationViewProps {
  onAuthenticate: (
    intent: AuthIntent,
    provider: AuthProvider,
  ) => Promise<void>
  onClose: () => void
}

const benefits = [
  {
    title: 'Tu propio agente empresarial',
    description:
      'Configura una experiencia de atención adaptada a la información, servicios y procesos de tu empresa.',
    icon: Bot,
  },
  {
    title: 'Conocimiento público y privado',
    description:
      'Decide qué información pueden consultar tus clientes y qué contenido queda disponible únicamente para usuarios autorizados.',
    icon: ShieldCheck,
  },
  {
    title: 'Respuestas con fuentes verificables',
    description:
      'El agente responde utilizando los documentos cargados y permite identificar las fuentes consultadas.',
    icon: FileText,
  },
  {
    title: 'Integración en tu sitio web',
    description:
      'Lleva el agente a la página o plataforma de tu empresa para que tus usuarios puedan consultarlo directamente.',
    icon: Globe2,
  },
  {
    title: 'Integración con WhatsApp Business',
    description:
      'Conecta el agente con WhatsApp Business para atender consultas en uno de los canales más utilizados por tus clientes. Alianza F1 es proveedor tecnológico autorizado por Meta.',
    icon: MessageCircle,
  },
  {
    title: 'Administración desde una sola plataforma',
    description:
      'Carga documentos, sincroniza el conocimiento, controla el acceso público y administra la información de tu empresa.',
    icon: Settings,
  },
]

export function RegistrationView({
  onAuthenticate,
  onClose,
}: RegistrationViewProps) {
  const [authIntent, setAuthIntent] = useState<AuthIntent>('register')
  const registering = authIntent === 'register'

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div className="relative min-h-dvh bg-[#030a13] text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 -top-48 size-[520px] rounded-full bg-cyan-300/8 blur-3xl" />
        <div className="absolute -right-48 top-1/3 size-[520px] rounded-full bg-blue-500/8 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#030a13]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="brand-mark scale-90" aria-hidden="true">
              A
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Alianza F1</p>
              <p className="text-[10px] font-medium text-slate-500">
                Agentes empresariales con IA
              </p>
            </div>
          </div>
          <button
            aria-label="Volver al agente público"
            className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-700/70 bg-[#0a1727] px-3 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/35 hover:text-cyan-100"
            onClick={onClose}
            type="button"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Volver al agente público</span>
            <span className="sm:hidden">Volver</span>
          </button>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-[1380px] gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12 lg:px-8 lg:py-12 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-cyan-200">
            <Bot className="size-3.5" />
            Agente empresarial con IA
          </div>
          <h1
            className="mt-5 max-w-4xl text-[1.95rem] font-black leading-[1.03] tracking-[-0.045em] text-white sm:text-[clamp(2.2rem,5vw,4.4rem)]"
            id="registration-title"
          >
            Convierte la información de tu empresa en{' '}
            <span className="text-cyan-300">respuestas inmediatas</span>
          </h1>
          <p className="mt-6 max-w-3xl text-[15px] leading-6 text-slate-300 sm:text-lg sm:leading-8">
            Crea un agente entrenado con los documentos y el conocimiento
            autorizado de tu organización. Atiende clientes, facilita consultas
            internas y mantén la información centralizada en un solo lugar.
          </p>

          <div className="mt-7 flex max-w-3xl items-start gap-3 rounded-2xl border border-cyan-300/25 bg-gradient-to-r from-cyan-300/12 to-blue-500/8 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)] sm:p-5">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-300 text-[#04101d]">
              <CheckCircle2 className="size-5" />
            </span>
            <p className="text-sm font-bold leading-6 text-cyan-50 sm:text-base">
              Empieza creando el espacio de tu empresa y prueba cómo respondería
              el agente con tu propia información.
            </p>
          </div>

          <a
            className="mt-5 inline-flex min-h-14 items-center gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/7 px-4 py-2.5 text-sm font-bold text-cyan-100 shadow-[0_12px_35px_rgba(0,0,0,0.16)] transition hover:border-cyan-300/45 hover:bg-cyan-300/12"
            href="#registration-benefits"
          >
            Descubre todo lo que incluye
            <span className="grid size-10 animate-bounce place-items-center rounded-xl bg-cyan-300 text-[#04101d] shadow-[0_0_24px_rgba(88,229,234,0.28)] motion-reduce:animate-none">
              <ChevronDown className="size-6" strokeWidth={2.5} />
            </span>
          </a>
        </section>

        <aside className="lg:row-span-2">
          <div className="rounded-3xl border border-cyan-200/20 bg-[#0a1727]/95 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:p-7 lg:sticky lg:top-24">
            <div className="hidden size-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 sm:grid">
              {registering ? (
                <Building2 className="size-6" />
              ) : (
                <ShieldCheck className="size-6" />
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:mt-5">
              {registering
                ? 'Crea tu agente empresarial'
                : 'Inicia sesión en tu cuenta'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {registering
                ? 'Elige una cuenta para registrar tu empresa y comenzar la configuración.'
                : 'Continúa con el proveedor que utilizaste para crear tu cuenta.'}
            </p>

            <div className="mt-6 grid gap-3">
              <button
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-white bg-white px-4 text-sm font-bold text-[#17202a] transition hover:bg-slate-100"
                onClick={() => void onAuthenticate(authIntent, 'google')}
                type="button"
              >
                <GoogleIcon />
                Continuar con Google
              </button>
              <button
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-600/70 bg-[#07111f] px-4 text-sm font-bold text-white transition hover:border-cyan-300/45 hover:bg-[#0d2035]"
                onClick={() => void onAuthenticate(authIntent, 'github')}
                type="button"
              >
                <GitHubIcon />
                Continuar con GitHub
              </button>
            </div>

            {registering && (
              <div className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-3.5">
                <p className="flex items-start gap-2 text-xs leading-5 text-slate-300">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                  El registro inicial no requiere datos de pago. Podrás
                  configurar tu empresa y conocer la plataforma antes de definir
                  una implementación o plan de uso.
                </p>
              </div>
            )}

            <div className="my-5 h-px bg-slate-700/60" />
            <button
              className="w-full text-center text-sm font-semibold text-slate-400 transition hover:text-cyan-200"
              onClick={() =>
                setAuthIntent((current) =>
                  current === 'register' ? 'login' : 'register',
                )
              }
              type="button"
            >
              {registering
                ? '¿Ya tienes una cuenta? Iniciar sesión'
                : '¿Aún no tienes una cuenta? Crear mi agente'}
            </button>
          </div>
        </aside>

        <section
          aria-labelledby="benefits-title"
          id="registration-benefits"
        >
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-cyan-300">
                Todo en un solo lugar
              </p>
              <h2
                className="mt-1 text-xl font-extrabold text-white sm:text-2xl"
                id="benefits-title"
              >
                Una base sólida para tu conocimiento empresarial
              </h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <article
                  className="group rounded-2xl border border-slate-700/55 bg-[#081321]/80 p-4 transition hover:border-cyan-300/25 hover:bg-[#0a192a]"
                  key={benefit.title}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-300/8 text-cyan-200 transition group-hover:bg-cyan-300/12">
                      <Icon className="size-[18px]" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {benefit.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-5 text-slate-400">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <article className="mt-3 flex items-start gap-3 rounded-2xl border border-blue-300/15 bg-blue-400/5 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-300/10 text-blue-200">
              <CheckCircle2 className="size-[18px]" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Implementación acompañada
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">
                Alianza F1 puede apoyar la preparación del conocimiento,
                configuración, integración, despliegue y evolución del agente.
              </p>
            </div>
          </article>

          <div className="mt-5 flex flex-col items-start gap-2 border-t border-slate-700/50 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Explora el producto, su funcionamiento y sus casos de uso.
            </p>
            <a
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 underline decoration-slate-600 underline-offset-4 transition hover:text-cyan-200 hover:decoration-cyan-300/60"
              href={PRODUCT_LANDING_URL}
            >
              Conocer más sobre el producto
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>

    </div>
  )
}
