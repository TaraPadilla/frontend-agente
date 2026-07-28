import { FileText } from 'lucide-react'
import type { Source } from '../types/api'

interface SourcesPanelProps {
  sources: Source[]
}

export function SourcesPanel({ sources }: SourcesPanelProps) {
  return (
    <aside className="sources-panel rounded-2xl border border-cyan-300/20 bg-[#071222] p-5">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-300">
        Documentos consultados
      </p>
      <p className="mt-2 text-xs text-[#84a8d4]">Fuentes de la última respuesta</p>

      {sources.length === 0 ? (
        <p className="mt-4 text-base font-semibold leading-7 text-slate-500">
          Las fuentes aparecerán aquí después de una respuesta.
        </p>
      ) : (
        <div className="mt-4 space-y-2" aria-live="polite">
          {sources.map((source, index) => (
            <article
              className="border-l-4 border-cyan-300 bg-[#0c2135] px-3 py-2.5"
              key={`${source.file}-${source.fragment_reference}-${index}`}
            >
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 size-4 shrink-0 text-slate-200" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-100" title={source.file}>
                    {source.file}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#b8d6ec]">
                    Sección: {source.section || source.fragment_reference}
                  </p>
                  {source.page !== null && (
                    <p className="text-[11px] text-[#7fa4c6]">Página {source.page}</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </aside>
  )
}
