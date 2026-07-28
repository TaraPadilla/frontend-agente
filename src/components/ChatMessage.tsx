import { CheckCheck, ThumbsDown, ThumbsUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export interface ChatMessageData {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: string
  feedback?: 'up' | 'down'
}

interface ChatMessageProps {
  message: ChatMessageData
  onFeedback: (messageId: string, feedback: 'up' | 'down') => void
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
}

export function ChatMessage({ message, onFeedback }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <article className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`message-bubble group ${
          isUser ? 'message-bubble-user' : 'message-bubble-assistant'
        }`}
      >
        <div className="markdown-content text-[13px] leading-5 text-[#17202a] sm:text-sm sm:leading-6">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        <div
          className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
            isUser ? 'text-emerald-900/60' : 'text-slate-500'
          }`}
        >
          <time dateTime={message.timestamp}>{formatTime(message.timestamp)}</time>
          {isUser && <CheckCheck className="size-3.5 text-cyan-600" />}
        </div>

        {!isUser && message.id !== 'welcome' && (
          <div className="message-feedback absolute -bottom-8 left-0 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              aria-label="Respuesta útil"
              className={`message-feedback-button ${
                message.feedback === 'up' ? 'active' : ''
              }`}
              onClick={() => onFeedback(message.id, 'up')}
              type="button"
            >
              <ThumbsUp className="size-3.5" />
            </button>
            <button
              aria-label="Respuesta no útil"
              className={`message-feedback-button ${
                message.feedback === 'down' ? 'active' : ''
              }`}
              onClick={() => onFeedback(message.id, 'down')}
              type="button"
            >
              <ThumbsDown className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
