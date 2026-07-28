import {
  CircleEllipsis,
  Globe2,
  MessageSquarePlus,
  PanelRightOpen,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface ChatHeaderProps {
  company: string
  connected: boolean | null
  onNewConversation: () => void
  onOpenTechnicalPanel: () => void
}

export function ChatHeader({
  company,
  connected,
  onNewConversation,
  onOpenTechnicalPanel,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const status =
    connected === true
      ? 'Asistente disponible'
      : connected === false
        ? 'Servicio no disponible'
        : 'Conectando'

  return (
    <header className="chat-header flex min-h-[68px] items-center gap-3 border-b border-slate-700/55 bg-[#0b192b] px-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-cyan-200">
            <Globe2 className="size-[17px]" />
          </span>
          <h2 className="truncate text-base font-bold text-white">
            {company || 'Sin empresa seleccionada'}
          </h2>
        </div>
        <div className="ml-[42px] mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
          <span
            className={`size-2 rounded-full ${
              connected === true
                ? 'bg-emerald-400'
                : connected === false
                  ? 'bg-rose-400'
                  : 'bg-amber-300'
            }`}
          />
          <span className="truncate">Asistente Comercial · {status}</span>
        </div>
      </div>

      <button
        className="header-action hidden sm:inline-flex"
        onClick={onNewConversation}
        type="button"
      >
        <MessageSquarePlus className="size-4" />
        Nueva conversación
      </button>

      <button
        aria-label="Abrir detalles técnicos"
        className="icon-button xl:hidden"
        onClick={onOpenTechnicalPanel}
        type="button"
      >
        <PanelRightOpen className="size-5" />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Opciones de conversación"
          className="icon-button"
          onClick={() => setMenuOpen((current) => !current)}
          type="button"
        >
          <CircleEllipsis className="size-5" />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-11 z-20 w-52 rounded-xl border border-slate-600/50 bg-[#0c1b2e] p-1.5 shadow-2xl"
            role="menu"
          >
            <button
              className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-200 hover:bg-cyan-300/10 hover:text-cyan-200"
              onClick={() => {
                onNewConversation()
                setMenuOpen(false)
              }}
              role="menuitem"
              type="button"
            >
              Limpiar conversación
            </button>
            <button
              className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-200 hover:bg-cyan-300/10 hover:text-cyan-200 xl:hidden"
              onClick={() => {
                onOpenTechnicalPanel()
                setMenuOpen(false)
              }}
              role="menuitem"
              type="button"
            >
              Ver detalles técnicos
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
