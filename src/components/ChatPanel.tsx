import { Bot } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { ChatComposer } from './ChatComposer'
import { ChatMessage, type ChatMessageData } from './ChatMessage'

interface ChatPanelProps {
  messages: ChatMessageData[]
  loading: boolean
  onSubmit: (question: string) => Promise<void>
  onFeedback: (messageId: string, feedback: 'up' | 'down') => void
}

const suggestions = [
  '¿Cuáles son los principales servicios de la empresa?',
  '¿Qué tecnologías utiliza la empresa?',
  '¿Cómo es el proceso de trabajo?',
]

export function ChatPanel({
  messages,
  loading,
  onSubmit,
  onFeedback,
}: ChatPanelProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading])

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#ebe8e1]">
      <div className="chat-canvas conversation-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
        <div className="mx-auto flex min-h-full max-w-4xl flex-col">
          <div className="mb-5 flex justify-center">
            <span className="rounded-full bg-[#7f7b74]/60 px-3 py-1 text-[10px] font-semibold text-white">
              Hoy
            </span>
          </div>

          <div className="space-y-4 pb-7">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onFeedback={onFeedback}
              />
            ))}

            {messages.length === 1 && !loading && (
              <div className="mx-auto grid w-full max-w-2xl gap-2 pt-2 sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button
                    className="rounded-xl border border-white/70 bg-white/65 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-cyan-500/40 hover:text-cyan-800"
                    key={suggestion}
                    onClick={() => void onSubmit(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="message-bubble message-bubble-assistant flex items-center gap-2 text-xs text-slate-500">
                  <Bot className="size-4 text-cyan-700" />
                  Consultando los documentos
                  <span className="loading-dots" aria-label="Cargando">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>
      </div>

      <ChatComposer loading={loading} onSubmit={onSubmit} />
    </section>
  )
}
