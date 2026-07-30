import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleAnalytics } from './components/GoogleAnalytics'
import { getPublicConfig } from './config'

const root = createRoot(document.getElementById('root')!)

try {
  getPublicConfig()
  root.render(
    <StrictMode>
      <GoogleAnalytics />
      <App />
    </StrictMode>,
  )
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : 'La configuración pública del frontend no es válida.'
  root.render(
    <main className="grid min-h-dvh place-items-center bg-[#020813] p-6 text-slate-100">
      <section className="max-w-lg rounded-2xl border border-rose-300/25 bg-[#2b1520] p-6 shadow-2xl">
        <h1 className="text-lg font-bold">Frontend sin configurar</h1>
        <p className="mt-2 text-sm leading-6 text-rose-100">{message}</p>
        {import.meta.env.DEV && (
          <p className="mt-3 text-xs text-rose-200/75">
            Revisa las variables VITE_API_BASE_URL, VITE_SUPABASE_URL y
            VITE_SUPABASE_PUBLISHABLE_KEY.
          </p>
        )}
      </section>
    </main>,
  )
}
