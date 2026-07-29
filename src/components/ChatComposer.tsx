import { Paperclip, SendHorizontal, Smile } from 'lucide-react'
import { useState } from 'react'

interface ChatComposerProps {
  loading: boolean
  disabled?: boolean
  onSubmit: (question: string) => Promise<void>
}

export function ChatComposer({
  loading,
  disabled = false,
  onSubmit,
}: ChatComposerProps) {
  const [question, setQuestion] = useState('')

  async function send() {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || loading || disabled) return
    setQuestion('')
    await onSubmit(cleanQuestion)
  }

  return (
    <form
      className="chat-composer flex items-end gap-2 border-t border-[#d8d5cd] bg-[#f0eee9] p-3"
      onSubmit={(event) => {
        event.preventDefault()
        void send()
      }}
    >
      <button
        aria-label="Emojis no disponibles"
        className="composer-icon"
        disabled
        title="La selección de emojis aún no está disponible"
        type="button"
      >
        <Smile className="size-5" />
      </button>

      <div className="flex min-h-11 flex-1 items-end rounded-2xl border border-[#d7d3cb] bg-white px-4 shadow-sm">
        <label className="sr-only" htmlFor="chat-question">
          Escribe tu pregunta
        </label>
        <textarea
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          disabled={loading || disabled}
          id="chat-question"
          maxLength={4000}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void send()
            }
          }}
          placeholder={
            disabled
              ? 'El chat no está disponible temporalmente'
              : 'Escribe tu pregunta...'
          }
          rows={1}
          value={question}
        />
        <button
          aria-label="Adjuntar archivo no disponible"
          className="composer-icon mb-1"
          disabled
          title="El chat todavía no admite archivos adjuntos"
          type="button"
        >
          <Paperclip className="size-5" />
        </button>
      </div>

      <button
        aria-label="Enviar pregunta"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-[#149e9e] text-white shadow-md transition hover:bg-[#108989] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={loading || disabled || !question.trim()}
        type="submit"
      >
        <SendHorizontal className="size-[18px]" />
      </button>
    </form>
  )
}
