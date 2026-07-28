import { CheckCircle2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ChatHeader } from './components/ChatHeader'
import { ChatPanel } from './components/ChatPanel'
import type { ChatMessageData } from './components/ChatMessage'
import { Sidebar, type AppView } from './components/Sidebar'
import { TechnicalPanel } from './components/TechnicalPanel'
import { WorkspaceView } from './components/WorkspaceView'
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

function createWelcomeMessage(): ChatMessageData {
  return {
    id: 'welcome',
    role: 'assistant',
    content:
      '¡Hola! Soy el asistente documental de la empresa.\n\n¿En qué puedo ayudarte?',
    timestamp: new Date().toISOString(),
  }
}

type Notice = { tone: 'success' | 'error'; text: string } | null

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<AppView>('chat')
  const [technicalPanelOpen, setTechnicalPanelOpen] = useState(false)
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
  const [messages, setMessages] = useState<ChatMessageData[]>([
    createWelcomeMessage(),
  ])
  const [sources, setSources] = useState<Source[]>([])
  const [lastQuery, setLastQuery] = useState<QueryResponse | null>(null)

  const resetConversation = useCallback(() => {
    setMessages([createWelcomeMessage()])
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
        const availableCompanies = companyResponse.companies.map(
          (item) => item.name,
        )
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
      setNotice({
        tone: 'success',
        text: `Modelo actualizado a ${updated.llm_model}.`,
      })
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
      if (!result.success) setNotice({ tone: 'error', text: result.response })
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
      if (settings?.reindex_pending) setSettings(await api.settings())
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
    setMessages((current) => [
      ...current,
      {
        id: `user-${crypto.randomUUID()}`,
        role: 'user',
        content: question,
        timestamp: new Date().toISOString(),
      },
    ])
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
          timestamp: new Date().toISOString(),
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
          timestamp: new Date().toISOString(),
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

  return (
    <div className="min-h-dvh bg-[#020813] p-0 text-slate-100 lg:h-dvh lg:p-3">
      <div className="app-frame mx-auto flex min-h-dvh max-w-[1780px] overflow-hidden border-slate-700/60 bg-[#07111f] lg:h-full lg:min-h-0 lg:rounded-2xl lg:border">
        <Sidebar
          activeView={activeView}
          companies={companies}
          company={company}
          onClose={() => setSidebarOpen(false)}
          onCompanyChange={(value) => void changeCompany(value)}
          onNavigate={setActiveView}
          onProfileChange={changeProfile}
          onToggle={() => setSidebarOpen((current) => !current)}
          open={sidebarOpen}
          profile={profile}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          {notice && (
            <div
              aria-live="polite"
              className={`fixed right-4 top-4 z-[60] flex max-w-md items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl ${
                notice.tone === 'success'
                  ? 'border-emerald-300/30 bg-[#102a25] text-emerald-100'
                  : 'border-rose-300/30 bg-[#2b1520] text-rose-100'
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

          {activeView === 'chat' ? (
            <>
              <ChatHeader
                company={company}
                connected={connected}
                onNewConversation={resetConversation}
                onOpenTechnicalPanel={() => setTechnicalPanelOpen(true)}
              />
              <div className="flex min-h-0 flex-1">
                {booting ? (
                  <div className="grid flex-1 place-items-center bg-[#ebe8e1] text-sm text-slate-500">
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
                <TechnicalPanel
                  onClose={() => setTechnicalPanelOpen(false)}
                  open={technicalPanelOpen}
                  query={lastQuery}
                  settings={settings}
                  sources={sources}
                />
              </div>
            </>
          ) : (
            <WorkspaceView
              busyAction={busyAction}
              company={company}
              documents={documents}
              indexStatus={indexStatus}
              modelTest={modelTest}
              onDelete={deleteDocument}
              onProfileChange={changeProfile}
              onSaveModel={saveModel}
              onSync={syncIndexes}
              onTestModel={testModel}
              onUpload={uploadDocuments}
              profile={profile}
              settings={settings}
              view={activeView}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
