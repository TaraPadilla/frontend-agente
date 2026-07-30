import { Building2, Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Company } from '../types/api'

interface CompanySelectorProps {
  companies: Company[]
  company: string
  onChange: (company: string) => void
}

export function CompanySelector({
  companies,
  company,
  onChange,
}: CompanySelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedCompany = companies.find(
    (item) => item.knowledge_key === company,
  )
  const disabled = companies.length === 0

  useEffect(() => {
    if (!open) return

    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls="public-company-options"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Empresa pública"
        className={`group flex min-h-[72px] w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left shadow-sm transition ${
          open
            ? 'border-cyan-300/55 bg-[#0d2035] ring-2 ring-cyan-300/10'
            : 'border-slate-600/45 bg-[#0b1a2d] hover:border-cyan-300/35 hover:bg-[#0d2035]'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
          }
        }}
        role="combobox"
        type="button"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/8 text-cyan-200">
          <Building2 className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">
            Empresa pública
          </span>
          <span className="mt-1 block truncate text-sm font-bold text-white">
            {selectedCompany?.name ?? 'Cargando empresas…'}
          </span>
        </span>
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition group-hover:bg-white/5 group-hover:text-cyan-200 ${
            open ? 'bg-white/5 text-cyan-200' : ''
          }`}
        >
          <ChevronDown
            className={`size-[18px] transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          aria-label="Empresa pública"
          className="absolute bottom-[calc(100%+0.5rem)] left-0 z-50 w-full overflow-hidden rounded-xl border border-cyan-300/25 bg-[#0a1727] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
          id="public-company-options"
          role="listbox"
        >
          <p className="px-3 pb-2 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">
            Selecciona una empresa
          </p>
          <div className="max-h-56 overflow-y-auto">
            {companies.map((item) => {
              const selected = item.knowledge_key === company
              return (
                <button
                  aria-selected={selected}
                  className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                    selected
                      ? 'bg-cyan-300/12 font-bold text-cyan-100'
                      : 'text-slate-200 hover:bg-white/5 hover:text-white'
                  }`}
                  key={item.knowledge_key}
                  onClick={() => {
                    onChange(item.knowledge_key)
                    setOpen(false)
                  }}
                  role="option"
                  type="button"
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-md ${
                      selected
                        ? 'bg-cyan-300/15 text-cyan-200'
                        : 'bg-slate-700/45 text-slate-400'
                    }`}
                  >
                    <Building2 className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {selected && <Check className="size-4 shrink-0 text-cyan-300" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
