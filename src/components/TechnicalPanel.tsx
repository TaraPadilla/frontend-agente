import {
  ArrowRight,
  ChartNoAxesCombined,
  FileCheck2,
  Sparkles,
  X,
} from 'lucide-react'
import type { QueryResponse, Source } from '../types/api'
import { SourcesPanel } from './SourcesPanel'
import { TechnicalMetrics } from './TechnicalMetrics'

interface TechnicalPanelProps {
  isVisitor: boolean
  open: boolean
  sources: Source[]
  query: QueryResponse | null
  onClose: () => void
  onRegister: () => void
}

function VisitorTechnicalCta({ onRegister }: { onRegister: () => void }) {
  return (
    <section className="relative flex min-h-full flex-1 flex-col justify-center overflow-hidden rounded-2xl border border-cyan-300/25 bg-gradient-to-b from-[#102c3d] via-[#0b2032] to-[#091827] px-5 py-8 shadow-[0_18px_60px_rgba(2,8,19,0.3)]">
      <div
        aria-hidden="true"
        className="absolute -right-14 -top-16 size-40 rounded-full bg-cyan-300/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-16 size-44 rounded-full bg-blue-500/10 blur-3xl"
      />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] text-cyan-200 uppercase">
          <Sparkles className="size-3.5" />
          Tu empresa + IA
        </span>

        <div className="mt-5 grid size-12 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_30px_rgba(88,229,234,0.12)]">
          <ChartNoAxesCombined className="size-6" />
        </div>

        <h3 className="mt-5 text-xl leading-tight font-extrabold text-white">
          Mira los resultados de tu propio agente
        </h3>
        <p className="mt-3 text-xs leading-5 text-slate-300">
          Registra tu empresa y prueba respuestas creadas con tu información
          autorizada.
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
              <FileCheck2 className="size-4" />
            </span>
            <span className="text-[11px] leading-4 font-semibold text-slate-100">
              Respuestas con tus propias fuentes
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
              <ChartNoAxesCombined className="size-4" />
            </span>
            <span className="text-[11px] leading-4 font-semibold text-slate-100">
              Métricas de cada respuesta
            </span>
          </div>
        </div>

        <button
          className="primary-button mt-6 w-full shadow-[0_12px_30px_rgba(88,229,234,0.15)]"
          onClick={onRegister}
          type="button"
        >
          Ver cómo funcionaría con mi información
          <ArrowRight className="size-4" />
        </button>
        <p className="mt-3 text-center text-[10px] font-medium text-slate-400">
          Empieza sin datos de pago
        </p>
      </div>
    </section>
  )
}

function PanelContent({
  isVisitor,
  sources,
  query,
  onRegister,
}: Pick<
  TechnicalPanelProps,
  'isVisitor' | 'sources' | 'query' | 'onRegister'
>) {
  return (
    <div className="technical-panel-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      {isVisitor ? (
        <VisitorTechnicalCta onRegister={onRegister} />
      ) : (
        <>
          <SourcesPanel sources={sources} />
          <TechnicalMetrics query={query} />
        </>
      )}
    </div>
  )
}

export function TechnicalPanel({
  isVisitor,
  open,
  sources,
  query,
  onClose,
  onRegister,
}: TechnicalPanelProps) {
  return (
    <>
      <aside className="hidden min-h-0 w-[320px] shrink-0 flex-col border-l border-slate-700/55 bg-[#081525] xl:flex">
        <PanelContent
          isVisitor={isVisitor}
          onRegister={onRegister}
          query={query}
          sources={sources}
        />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            aria-label="Cerrar detalles técnicos"
            className="absolute inset-0 bg-[#02060d]/75 backdrop-blur-sm"
            onClick={onClose}
            type="button"
          />
          <aside className="absolute inset-y-0 right-0 flex w-[340px] max-w-[92vw] flex-col border-l border-slate-600/50 bg-[#081525] shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-700/60 px-4 py-4">
              <h2 className="text-sm font-bold text-white">Evidencia RAG</h2>
              <button
                aria-label="Cerrar detalles técnicos"
                className="icon-button"
                onClick={onClose}
                type="button"
              >
                <X className="size-5" />
              </button>
            </header>
            <PanelContent
              isVisitor={isVisitor}
              onRegister={onRegister}
              query={query}
              sources={sources}
            />
          </aside>
        </div>
      )}
    </>
  )
}
