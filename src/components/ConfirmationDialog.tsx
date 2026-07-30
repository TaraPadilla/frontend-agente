import { CircleHelp, TriangleAlert, X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

export type ConfirmationTone = 'info' | 'warning' | 'danger'

interface ConfirmationDialogProps {
  title: string
  description: string
  confirmLabel: string
  tone?: ConfirmationTone
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  tone = 'info',
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onCancel])

  const danger = tone === 'danger'
  const warning = tone === 'warning'

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center p-4">
      <button
        aria-label="Cerrar confirmación"
        className="absolute inset-0 bg-[#02060d]/80 backdrop-blur-sm"
        onClick={onCancel}
        type="button"
      />

      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-600/55 bg-[#0b192b] shadow-[0_28px_90px_rgba(0,0,0,0.55)]"
        role="dialog"
      >
        <div
          className={`h-1 ${
            danger
              ? 'bg-rose-400'
              : warning
                ? 'bg-amber-300'
                : 'bg-cyan-300'
          }`}
        />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                danger
                  ? 'bg-rose-400/12 text-rose-300'
                  : warning
                    ? 'bg-amber-300/12 text-amber-200'
                    : 'bg-cyan-300/12 text-cyan-200'
              }`}
            >
              {danger || warning ? (
                <TriangleAlert className="size-5" />
              ) : (
                <CircleHelp className="size-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-extrabold text-white" id={titleId}>
                {title}
              </h2>
              <p
                className="mt-2 text-sm leading-6 text-slate-300"
                id={descriptionId}
              >
                {description}
              </p>
            </div>
            <button
              aria-label="Cerrar diálogo"
              className="icon-button -mr-2 -mt-2 shrink-0"
              onClick={onCancel}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              className="secondary-button sm:min-w-28"
              onClick={onCancel}
              ref={cancelButtonRef}
              type="button"
            >
              Cancelar
            </button>
            <button
              className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-xs font-bold transition sm:min-w-36 ${
                danger
                  ? 'border-rose-300/25 bg-rose-500 text-white hover:bg-rose-400'
                  : warning
                    ? 'border-amber-200/25 bg-amber-300 text-[#241b05] hover:bg-amber-200'
                    : 'border-cyan-200/20 bg-cyan-300 text-[#04101d] hover:bg-cyan-200'
              }`}
              onClick={onConfirm}
              type="button"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
