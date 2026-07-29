import { ShieldCheck } from 'lucide-react'
import type { QueryResponse } from '../types/api'

interface TechnicalMetricsProps {
  query: QueryResponse | null
}

function metricValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return 'No disponible'
  }
  return String(value)
}

export function TechnicalMetrics({ query }: TechnicalMetricsProps) {
  const metrics = [
    ['Modelo (LLM)', metricValue(query?.model)],
    [
      'Fragmentos recuperados',
      metricValue(query?.diagnostics.retrieved_fragments),
    ],
    [
      'Tiempo de respuesta',
      query ? `${query.diagnostics.elapsed_seconds.toFixed(2)} s` : 'No disponible',
    ],
  ]

  const grounded = query?.answer.information_found
  const statusText =
    grounded === true
      ? 'Respuesta fundamentada en los documentos'
      : grounded === false
        ? 'No se encontró evidencia documental suficiente'
        : 'Esperando una respuesta del agente'

  return (
    <section className="overflow-hidden rounded-xl border border-slate-600/50 bg-[#0b192b]">
      <header className="border-b border-slate-700/60 px-4 py-3">
        <h3 className="text-xs font-bold text-white">Métricas técnicas</h3>
      </header>

      <dl className="space-y-3 px-4 py-4">
        {metrics.map(([label, value]) => (
          <div className="flex items-start justify-between gap-3" key={label}>
            <dt className="text-[10px] text-slate-400">{label}</dt>
            <dd
              className="max-w-[58%] break-words text-right text-[10px] font-semibold text-slate-100"
              title={value}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div
        className={`flex items-start gap-2 border-t px-4 py-3 text-[10px] font-medium ${
          grounded === true
            ? 'border-emerald-400/20 text-emerald-300'
            : grounded === false
              ? 'border-amber-300/20 text-amber-200'
              : 'border-slate-700/60 text-slate-400'
        }`}
      >
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        <span>{statusText}</span>
      </div>
    </section>
  )
}
