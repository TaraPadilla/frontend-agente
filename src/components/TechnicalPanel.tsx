import { X } from 'lucide-react'
import type { QueryResponse, Source } from '../types/api'
import { SourcesPanel } from './SourcesPanel'
import { TechnicalMetrics } from './TechnicalMetrics'

interface TechnicalPanelProps {
  open: boolean
  sources: Source[]
  query: QueryResponse | null
  onClose: () => void
}

function PanelContent({
  sources,
  query,
}: Pick<TechnicalPanelProps, 'sources' | 'query'>) {
  return (
    <div className="technical-panel-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      <SourcesPanel sources={sources} />
      <TechnicalMetrics query={query} />
    </div>
  )
}

export function TechnicalPanel({
  open,
  sources,
  query,
  onClose,
}: TechnicalPanelProps) {
  return (
    <>
      <aside className="hidden min-h-0 w-[320px] shrink-0 flex-col border-l border-slate-700/55 bg-[#081525] xl:flex">
        <PanelContent query={query} sources={sources} />
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
            <PanelContent query={query} sources={sources} />
          </aside>
        </div>
      )}
    </>
  )
}
