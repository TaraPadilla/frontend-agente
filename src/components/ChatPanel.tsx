import { Bot, SendHorizontal, ThumbsDown, ThumbsUp, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

export interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  feedback?: 'up' | 'down'
}

interface ChatPanelProps {
  messages: ChatMessage[]
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
  const [question, setQuestion] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading])

  async function send(value: string) {
    const cleanQuestion = value.trim()
    if (!cleanQuestion || loading) return
    setQuestion('')
    await onSubmit(cleanQuestion)
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="conversation-scroll min-h-[320px] flex-1 overflow-y-auto rounded-2xl border border-cyan-300/20 bg-[#07111f] p-5">
        <div className="space-y-4">
          {messages.map((message) => (
            <article
              className="flex gap-3 rounded-xl border border-slate-700/80 bg-[#0d1830] p-3.5"
              key={message.id}
            >
              <div
                className={`grid size-11 shrink-0 place-items-center rounded-xl border ${
                  message.role === 'user'
                    ? 'border-violet-400/30 bg-violet-400/10 text-violet-300'
                    : 'border-cyan-300/20 bg-[#070b14] text-cyan-200'
                }`}
              >
                {message.role === 'user' ? (
                  <UserRound className="size-5" />
                ) : (
                  <Bot className="size-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="markdown-content text-[15px] leading-7 text-slate-50">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.role === 'assistant' && message.id !== 'welcome' && (
                  <div className="mt-3 flex gap-1">
                    <button
                      aria-label="Respuesta útil"
                      className={`icon-button ${message.feedback === 'up' ? 'active' : ''}`}
                      onClick={() => onFeedback(message.id, 'up')}
                      type="button"
                    >
                      <ThumbsUp className="size-5" />
                    </button>
                    <button
                      aria-label="Respuesta no útil"
                      className={`icon-button ${message.feedback === 'down' ? 'active' : ''}`}
                      onClick={() => onFeedback(message.id, 'down')}
                      type="button"
                    >
                      <ThumbsDown className="size-5" />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-cyan-300/15 bg-[#0d1830] p-4 text-sm text-slate-300">
              <Bot className="size-5 text-cyan-300" />
              <span>Consultando el conocimiento documental</span>
              <span className="loading-dots" aria-label="Cargando">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {suggestions.map((suggestion) => (
          <button
            className="rounded-xl border border-slate-800 bg-[#07111f] px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:text-cyan-200 disabled:opacity-50"
            disabled={loading}
            key={suggestion}
            onClick={() => void send(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex items-center gap-3 border-t border-cyan-300/10 bg-[#09132a] p-4"
        onSubmit={(event) => {
          event.preventDefault()
          void send(question)
        }}
      >
        <label className="sr-only" htmlFor="chat-question">
          Escribe tu pregunta
        </label>
        <textarea
          className="min-h-12 flex-1 resize-none bg-transparent px-2 py-3 text-base text-white outline-none placeholder:text-[#83a0c3]"
          disabled={loading}
          id="chat-question"
          maxLength={4000}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void send(question)
            }
          }}
          placeholder="Escribe tu pregunta aquí..."
          rows={1}
          value={question}
        />
        <button
          aria-label="Enviar pregunta"
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-cyan-300 text-[#04101d] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={loading || !question.trim()}
          type="submit"
        >
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </section>
  )
}
