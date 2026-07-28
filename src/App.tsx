import { CheckCircle2, Server, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ChatPanel, type ChatMessage } from './components/ChatPanel'
import { DiagnosticsBar } from './components/DiagnosticsBar'
import { Sidebar } from './components/Sidebar'
import { SourcesPanel } from './components/SourcesPanel'
import { api, ApiError } from './services/api'
import type {
  DocumentItem,
  IndexStatus,
  ModelTestResponse,
  Profile,
  QueryResponse,
  Settings,
  Source,
  Visibility,
} from './types/api'

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy el asistente documental de la empresa.\n\n¿En qué puedo ayudarte?',
}

type Notice = { tone: 'success' | 'error'; text: string } | null

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companies, setCompanies] = useState<string[]>([])
  const [company, setCompany] = useState('')
  const [profile, setProfile] = useState<Profile>('public')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [booting, setBooting] = useState(true)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [modelTest, setModelTest] = useState<ModelTestResponse | null>(null)
  const [documents, setDocuments] = useState<Record<Visibility, DocumentItem[]>>({
    Public: [],
    Private: [],
  })
  const [indexStatus, setIndexStatus] = useState<
    Record<Visibility, IndexStatus | null>
  >({
    Public: null,
    Private: null,
  })
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [sources, setSources] = useState<Source[]>([])
  const [showSources, setShowSources] = useState(true)
  const [lastQuery, setLastQuery] = useState<QueryResponse | null>(null)

  const resetConversation = useCallback(() => {
    setMessages([welcomeMessage])
    setSources([])
    setLastQuery(null)
  }, [])

  const refreshLibraries = useCallback(async (selectedCompany: string) => {
    if (!selectedCompany) return
    const [publicDocuments, privateDocuments, publicStatus, privateStatus] =
      await Promise.all([
        api.documents(selectedCompany, 'Public'),
        api.documents(selectedCompany, 'Private'),
        api.indexStatus(selectedCompany, 'public', 'Public'),
        api.indexStatus(selectedCompany, 'internal', 'Private'),
      ])

    setDocuments({
      Public: publicDocuments.documents,
      Private: privateDocuments.documents,
    })
    setIndexStatus({
      Public: publicStatus,
      Private: privateStatus,
    })
  }, [])

  useEffect(() => {
    let active = true
    async function bootstrap() {
      try {
        const [companyResponse, settingsResponse] = await Promise.all([
          api.companies(),
          api.settings(),
        ])
        if (!active) return
        const availableCompanies = companyResponse.companies.map((item) => item.name)
        const selectedCompany =
          companyResponse.active_company ||
          settingsResponse.active_company ||
          availableCompanies[0] ||
          ''
        setCompanies(availableCompanies)
        setCompany(selectedCompany)
        setSettings(settingsResponse)

        await refreshLibraries(selectedCompany)
        if (!active) return
        setConnected(true)
      } catch (error) {
        if (!active) return
        setConnected(false)
        setNotice({ tone: 'error', text: errorMessage(error) })
      } finally {
        if (active) setBooting(false)
      }
    }
    void bootstrap()
    return () => {
      active = false
    }
  }, [refreshLibraries])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function changeCompany(nextCompany: string) {
    setCompany(nextCompany)
    resetConversation()
    setModelTest(null)
    setBusyAction('company')
    try {
      await refreshLibraries(nextCompany)
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  function changeProfile(nextProfile: Profile) {
    setProfile(nextProfile)
    resetConversation()
  }

  async function saveModel(model: string) {
    setBusyAction('save-model')
    try {
      const updated = await api.updateLlm(model)
      setSettings(updated)
      setModelTest(null)
      resetConversation()
      setNotice({ tone: 'success', text: `Modelo actualizado a ${updated.llm_model}.` })
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  async function testModel() {
    setBusyAction('test-model')
    try {
      const result = await api.testModel()
      setModelTest(result)
      if (!result.success) {
        setNotice({ tone: 'error', text: result.response })
      }
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  async function uploadDocuments(visibility: Visibility, files: File[]) {
    setBusyAction(`upload-${visibility}`)
    try {
      let result
      try {
        result = await api.uploadDocuments(company, visibility, files)
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 409 &&
          window.confirm(
            'Uno o más archivos ya existen. ¿Deseas reemplazarlos de forma explícita?',
          )
        ) {
          result = await api.uploadDocuments(company, visibility, files, true)
        } else {
          throw error
        }
      }
      await refreshLibraries(company)
      setNotice({
        tone: 'success',
        text: `${result.saved_count} documento${result.saved_count === 1 ? '' : 's'} guardado${result.saved_count === 1 ? '' : 's'} en ${visibility}.`,
      })
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  async function deleteDocument(visibility: Visibility, name: string) {
    setBusyAction(`delete-${visibility}`)
    try {
      await api.deleteDocument(company, visibility, name)
      await refreshLibraries(company)
      setNotice({ tone: 'success', text: `${name} fue eliminado.` })
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  async function syncIndexes(visibility: Visibility) {
    setBusyAction(`sync-${visibility}`)
    try {
      const response = await api.syncIndexes(company, visibility)
      await refreshLibraries(company)
      if (settings?.reindex_pending) {
        setSettings(await api.settings())
      }
      setNotice({
        tone: 'success',
        text: `Sincronización completada para ${response.results.length} índice${response.results.length === 1 ? '' : 's'}.`,
      })
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  async function submitQuestion(question: string) {
    const userMessage: ChatMessage = {
      id: `user-${crypto.randomUUID()}`,
      role: 'user',
      content: question,
    }
    setMessages((current) => [...current, userMessage])
    setBusyAction('query')
    try {
      const response = await api.query({
        question,
        company,
        profile,
        top_k: 5,
      })
      setLastQuery(response)
      setSources(response.sources)
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${crypto.randomUUID()}`,
          role: 'assistant',
          content: response.answer.text,
        },
      ])
    } catch (error) {
      const text = errorMessage(error)
      setNotice({ tone: 'error', text })
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${crypto.randomUUID()}`,
          role: 'assistant',
          content: `No pude completar la consulta. ${text}`,
        },
      ])
    } finally {
      setBusyAction(null)
    }
  }

  function setFeedback(messageId: string, feedback: 'up' | 'down') {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              feedback: message.feedback === feedback ? undefined : feedback,
            }
          : message,
      ),
    )
  }

  const currentFragments =
    lastQuery?.diagnostics.retrieved_fragments ??
    (profile === 'public'
      ? indexStatus.Public?.fragment_count
      : (indexStatus.Public?.fragment_count ?? 0) +
        (indexStatus.Private?.fragment_count ?? 0)) ??
    0

  return (
    <div className="min-h-screen bg-[#030711] text-slate-100 lg:flex">
      <Sidebar
        busyAction={busyAction}
        companies={companies}
        company={company}
        documents={documents}
        indexStatus={indexStatus}
        modelTest={modelTest}
        onClose={() => setSidebarOpen((current) => !current)}
        onCompanyChange={(value) => void changeCompany(value)}
        onDelete={deleteDocument}
        onProfileChange={changeProfile}
        onSaveModel={saveModel}
        onSync={syncIndexes}
        onTestModel={testModel}
        onUpload={uploadDocuments}
        open={sidebarOpen}
        profile={profile}
        settings={settings}
      />

      <main className="min-w-0 flex-1 px-4 pb-5 pt-20 sm:px-6 lg:h-screen lg:overflow-hidden lg:px-7 lg:py-5">
        <div className="mx-auto flex h-full max-w-[1600px] flex-col">
          <header className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7ea4cf]">
                Empresa activa
              </p>
              <h2 className="mt-1 text-lg font-extrabold text-white">
                {company || 'Sin empresa seleccionada'}
              </h2>
            </div>
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                connected === true
                  ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'
                  : connected === null
                    ? 'border-slate-400/25 bg-slate-400/10 text-slate-300'
                  : 'border-rose-300/25 bg-rose-300/10 text-rose-200'
              }`}
            >
              <Server className="size-3.5" />
              {connected === true
                ? 'Servicio conectado'
                : connected === null
                  ? 'Conectando…'
                  : 'Servicio no disponible'}
            </div>
          </header>

          <DiagnosticsBar
            company={company}
            elapsedSeconds={lastQuery?.diagnostics.elapsed_seconds ?? null}
            embeddingModel={settings?.embedding_model ?? ''}
            fragments={currentFragments}
            model={lastQuery?.model ?? settings?.llm_model ?? ''}
            profile={profile}
          />

          <div className="mb-3 mt-4 flex items-center justify-between gap-4">
            <h2 className="text-base font-bold uppercase text-slate-400">
              Conversación documental
            </h2>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-white">
              <input
                checked={showSources}
                className="peer sr-only"
                onChange={(event) => setShowSources(event.target.checked)}
                type="checkbox"
              />
              <span className="relative h-6 w-12 rounded-full bg-slate-700 transition peer-checked:bg-cyan-300 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-6" />
              Mostrar fuentes
            </label>
          </div>

          {notice && (
            <div
              aria-live="polite"
              className={`mb-3 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                notice.tone === 'success'
                  ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
                  : 'border-rose-300/30 bg-rose-300/10 text-rose-100'
              }`}
            >
              {notice.tone === 'success' ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0" />
              )}
              {notice.text}
            </div>
          )}

          <div
            className={`min-h-0 flex-1 gap-5 lg:grid ${
              showSources ? 'lg:grid-cols-[minmax(0,1fr)_310px]' : 'lg:grid-cols-1'
            }`}
          >
            {booting ? (
              <div className="grid min-h-[430px] place-items-center rounded-2xl border border-cyan-300/15 bg-[#07111f] text-sm text-slate-400">
                Cargando configuración del agente…
              </div>
            ) : (
              <ChatPanel
                loading={busyAction === 'query'}
                messages={messages}
                onFeedback={setFeedback}
                onSubmit={submitQuestion}
              />
            )}
            {showSources && (
              <div className="mt-5 min-h-0 lg:mt-0">
                <SourcesPanel sources={sources} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
