import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Source } from '../types/api'

interface SourcesPanelProps {
  sources: Source[]
}

const INITIAL_SOURCE_COUNT = 3

export function SourcesPanel({ sources }: SourcesPanelProps) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(false)
  }, [sources])

  const visibleSources = expanded
    ? sources
    : sources.slice(0, INITIAL_SOURCE_COUNT)
  const remaining = Math.max(0, sources.length - INITIAL_SOURCE_COUNT)

  return (
    <section className="overflow-hidden rounded-xl border border-slate-600/50 bg-[#0b192b]">
      <header className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
        <h3 className="text-xs font-bold text-white">Detalles de la respuesta</h3>
        <ChevronUp className="size-4 text-slate-400" />
      </header>

      <div className="p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-300">
            Fuentes consultadas
          </p>
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-200">
            {sources.length}
          </span>
        </div>

        {sources.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-600/50 px-3 py-5 text-center">
            <p className="text-xs font-medium text-slate-400">
              No hay fuentes para mostrar
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Aparecerán después de una respuesta documental.
            </p>
          </div>
        ) : (
          <div className="space-y-2" aria-live="polite">
            {visibleSources.map((source, index) => (
              <article
                className="rounded-lg border border-slate-700/65 bg-[#14263a] p-3"
                key={`${source.file}-${source.fragment_reference}-${index}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-slate-100/10 text-slate-200">
                    <FileText className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p
                      className="truncate text-[11px] font-bold text-slate-100"
                      title={source.file}
                    >
                      {source.file}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400">
                      Sección: {source.section || source.fragment_reference}
                    </p>
                    {source.page !== null && (
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Página {source.page}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {sources.length > INITIAL_SOURCE_COUNT && (
          <button
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700/70 px-3 py-2 text-[10px] font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            {expanded ? (
              <>
                Mostrar menos <ChevronUp className="size-3.5" />
              </>
            ) : (
              <>
                Ver {remaining} fuente{remaining === 1 ? '' : 's'} más
                <ChevronDown className="size-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    </section>
  )
}
