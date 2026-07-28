import type { Profile } from '../types/api'

interface DiagnosticsBarProps {
  company: string
  profile: Profile
  model: string
  embeddingModel: string
  fragments: number
  elapsedSeconds: number | null
}

const labels: Record<Profile, string> = {
  public: 'Public',
  internal: 'Internal',
}

export function DiagnosticsBar({
  company,
  profile,
  model,
  embeddingModel,
  fragments,
  elapsedSeconds,
}: DiagnosticsBarProps) {
  const items = [
    ['Empresa', company || '—'],
    ['Perfil', labels[profile]],
    ['Modelo', model || '—'],
    ['Embeddings', embeddingModel || '—'],
    ['Fragmentos', String(fragments)],
    ['Tiempo total', elapsedSeconds === null ? '—' : `${elapsedSeconds.toFixed(2)} s`],
  ]

  return (
    <section
      aria-label="Diagnóstico de la consulta"
      className="diagnostics-grid overflow-hidden rounded-xl border border-violet-400/30 bg-[#091023]"
    >
      {items.map(([label, value]) => (
        <div
          className="min-w-0 border-b border-r border-violet-400/20 px-3 py-2.5 last:border-r-0"
          key={label}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#82b9e9]">
            {label}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white" title={value}>
            {value}
          </p>
        </div>
      ))}
    </section>
  )
}
