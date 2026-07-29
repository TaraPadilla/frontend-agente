import { CheckCircle2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChatHeader } from './components/ChatHeader'
import { ChatPanel } from './components/ChatPanel'
import type { ChatMessageData } from './components/ChatMessage'
import { Sidebar, type AppView } from './components/Sidebar'
import { TechnicalPanel } from './components/TechnicalPanel'
import { WorkspaceView } from './components/WorkspaceView'
import { api, ApiError } from './services/api'
import { getSupabaseClient, startOAuth } from './services/supabase'
import type {
  Company,
  DocumentItem,
  GlobalSettings,
  IndexStatus,
  ModelTestResponse,
  QueryResponse,
  Source,
  SyncResult,
  UserEnvironment,
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
type AuthIntent = 'login' | 'register'

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<AppView>('chat')
  const [technicalPanelOpen, setTechnicalPanelOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [company, setCompany] = useState('')
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [environment, setEnvironment] = useState<UserEnvironment | null>(null)
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(
    null,
  )
  const [registrationRequired, setRegistrationRequired] = useState(false)
  const [registrationName, setRegistrationName] = useState('')
  const [registrationPublic, setRegistrationPublic] = useState(false)
  const [authenticatedError, setAuthenticatedError] = useState<string | null>(
    null,
  )
  const [sessionExpired, setSessionExpired] = useState(false)
  const [authRevision, setAuthRevision] = useState(0)
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
  >({ Public: null, Private: null })
  const [syncResults, setSyncResults] = useState<
    Record<Visibility, SyncResult[] | null>
  >({ Public: null, Private: null })
  const [messages, setMessages] = useState<ChatMessageData[]>([
    createWelcomeMessage(),
  ])
  const [sources, setSources] = useState<Source[]>([])
  const [lastQuery, setLastQuery] = useState<QueryResponse | null>(null)
  const supabase = useMemo(() => getSupabaseClient(), [])

  const companyName = useMemo(
    () =>
      environment?.company_name ??
      companies.find((item) => item.knowledge_key === company)?.name ??
      '',
    [companies, company, environment],
  )

  const resetConversation = useCallback(() => {
    setMessages([createWelcomeMessage()])
    setSources([])
    setLastQuery(null)
  }, [])

  const refreshLibraries = useCallback(async () => {
    const [publicDocuments, privateDocuments, publicStatus, privateStatus] =
      await Promise.all([
        api.documents('Public'),
        api.documents('Private'),
        api.indexStatus('Public'),
        api.indexStatus('Private'),
      ])
    setDocuments({
      Public: publicDocuments.documents,
      Private: privateDocuments.documents,
    })
    setIndexStatus({ Public: publicStatus, Private: privateStatus })
  }, [])

  const loadPublicCatalog = useCallback(async () => {
    try {
      const catalog = await api.companies()
      const defaultExists = catalog.companies.some(
        (item) => item.knowledge_key === catalog.default_company,
      )
      if (!defaultExists) {
        throw new Error(
          'La empresa pública predeterminada no aparece en el catálogo.',
        )
      }
      setCompanies(catalog.companies)
      setCompany(catalog.default_company)
      setCatalogError(null)
      setConnected(true)
    } catch (error) {
      setCompanies([])
      setCompany('')
      setCatalogError(errorMessage(error))
      setConnected(false)
    }
  }, [])

  const reportActionError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.sessionExpired) {
      setSessionExpired(true)
    }
    setNotice({ tone: 'error', text: errorMessage(error) })
  }, [])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => setAuthRevision((value) => value + 1), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    let active = true
    async function bootstrap() {
      setBooting(true)
      setAuthenticatedError(null)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!active) return
        if (!session) {
          setEnvironment(null)
          setGlobalSettings(null)
          setRegistrationRequired(false)
          setActiveView('chat')
          await loadPublicCatalog()
        } else {
          try {
            const resolved = await api.environment()
            if (!active) return
            setEnvironment(resolved)
            setCompany(resolved.knowledge_key)
            setCompanies([])
            setCatalogError(null)
            setRegistrationRequired(false)
            sessionStorage.removeItem('auth-intent')
            setConnected(true)
            if (resolved.platform_role === 'superadmin') {
              try {
                setGlobalSettings(await api.settings())
              } catch (error) {
                reportActionError(error)
              }
            } else {
              setGlobalSettings(null)
            }
          } catch (error) {
            if (
              error instanceof ApiError &&
              error.code === 'usuario_sin_empresa'
            ) {
              setEnvironment(null)
              setGlobalSettings(null)
              setCompanies([])
              setCompany('')
              setRegistrationRequired(true)
              setConnected(true)
            } else if (
              error instanceof ApiError &&
              error.sessionExpired
            ) {
              setSessionExpired(true)
              setEnvironment(null)
              setGlobalSettings(null)
              setRegistrationRequired(false)
              setActiveView('chat')
              await loadPublicCatalog()
            } else {
              setAuthenticatedError(errorMessage(error))
              setConnected(false)
            }
          }
        }
      } catch (error) {
        if (!active) return
        setAuthenticatedError(errorMessage(error))
        setConnected(false)
      } finally {
        if (active) setBooting(false)
      }
    }
    void bootstrap()
    return () => {
      active = false
    }
  }, [
    authRevision,
    loadPublicCatalog,
    reportActionError,
    supabase,
  ])

  useEffect(() => {
    if (
      activeView !== 'files' ||
      environment?.membership_role !== 'admin'
    ) {
      return
    }
    void refreshLibraries().catch(reportActionError)
  }, [activeView, environment?.membership_role, refreshLibraries, reportActionError])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('error_description')
    if (!oauthError) return
    setNotice({ tone: 'error', text: oauthError })
    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function authenticate(intent: AuthIntent, provider: 'google' | 'github') {
    sessionStorage.setItem('auth-intent', intent)
    try {
      await startOAuth(provider)
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error) })
    }
  }

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      sessionStorage.removeItem('auth-intent')
      setAuthenticatedError(null)
      setRegistrationRequired(false)
      resetConversation()
    } catch (error) {
      reportActionError(error)
    }
  }

  async function completeRegistration() {
    setBusyAction('register-company')
    try {
      await api.registerCompany({
        name: registrationName,
        public_access_enabled: registrationPublic,
      })
      sessionStorage.removeItem('auth-intent')
      setAuthRevision((value) => value + 1)
      setNotice({ tone: 'success', text: 'La empresa fue creada correctamente.' })
    } catch (error) {
      reportActionError(error)
    } finally {
      setBusyAction(null)
    }
  }

  function changeCompany(nextCompany: string) {
    if (environment) return
    setCompany(nextCompany)
    resetConversation()
  }

  async function saveModel(model: string) {
    setBusyAction('save-model')
    try {
      const updated = await api.updateLlm(model)
      setGlobalSettings(updated)
      setModelTest(null)
      setNotice({ tone: 'success', text: `Modelo actualizado a ${updated.llm_model}.` })
    } catch (error) {
      reportActionError(error)
    } finally {
      setBusyAction(null)
    }
  }

  async function saveEmbeddings(model: string, dimensions: number) {
    setBusyAction('save-embeddings')
    try {
      const updated = await api.updateEmbeddings({ model, dimensions })
      setGlobalSettings(updated)
      setEnvironment(await api.environment())
      setNotice({
        tone: 'success',
        text: 'Embeddings actualizados. Las empresas quedaron pendientes de reindexación.',
      })
    } catch (error) {
      reportActionError(error)
    } finally {
      setBusyAction(null)
    }
  }

  async function savePublicAccess(enabled: boolean) {
    setBusyAction('save-company-settings')
    try {
      const updated = await api.updateCompanySettings(enabled)
      setEnvironment((current) =>
        current ? { ...current, company_settings: updated } : current,
      )
      setNotice({
        tone: 'success',
        text: enabled
          ? 'El acceso público quedó habilitado.'
          : 'La empresa fue retirada del catálogo público.',
      })
    } catch (error) {
      reportActionError(error)
    } finally {
      setBusyAction(null)
    }
  }

  async function testModel() {
    setBusyAction('test-model')
    try {
      setModelTest(await api.testModel())
    } catch (error) {
      reportActionError(error)
    } finally {
      setBusyAction(null)
    }
  }

  async function uploadDocuments(
    visibility: Visibility,
    files: File[],
  ): Promise<boolean> {
    setBusyAction(`upload-${visibility}`)
    try {
      let result
      try {
        result = await api.uploadDocuments(visibility, files)
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.code === 'documento_existente' &&
          window.confirm('Uno o más archivos ya existen. ¿Deseas reemplazarlos?')
        ) {
          result = await api.uploadDocuments(visibility, files, true)
        } else {
          throw error
        }
      }
      await refreshLibraries()
      setNotice({ tone: 'success', text: `${result.saved_count} documento(s) guardado(s).` })
      return true
    } catch (error) {
      reportActionError(error)
      return false
    } finally {
      setBusyAction(null)
    }
  }

  async function deleteDocument(
    visibility: Visibility,
    name: string,
  ): Promise<boolean> {
    setBusyAction(`delete-${visibility}`)
    try {
      await api.deleteDocument(visibility, name)
      await refreshLibraries()
      setNotice({ tone: 'success', text: `${name} fue eliminado.` })
      return true
    } catch (error) {
      reportActionError(error)
      return false
    } finally {
      setBusyAction(null)
    }
  }

  async function syncIndexes(visibility: Visibility) {
    setBusyAction(`sync-${visibility}`)
    try {
      const response = await api.syncIndexes(visibility)
      setSyncResults((current) => ({
        ...current,
        [visibility]: response.results,
      }))
      await refreshLibraries()
      setEnvironment(await api.environment())
      setNotice({
        tone: 'success',
        text: `Sincronización completada para ${response.results.length} índice(s).`,
      })
    } catch (error) {
      reportActionError(error)
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
      const response = await api.query(
        {
          question,
          company: environment ? undefined : company,
          top_k: 5,
        },
        !!environment,
      )
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
      reportActionError(error)
    } finally {
      setBusyAction(null)
    }
  }

  function setFeedback(messageId: string, feedback: 'up' | 'down') {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, feedback: message.feedback === feedback ? undefined : feedback }
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
          environment={environment}
          onAuthenticate={authenticate}
          onClose={() => setSidebarOpen(false)}
          onCompanyChange={changeCompany}
          onLogout={() => void logout()}
          onNavigate={setActiveView}
          onToggle={() => setSidebarOpen((current) => !current)}
          open={sidebarOpen}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          {notice && (
            <div
              aria-live="polite"
              className={`fixed right-4 top-4 z-[70] flex max-w-md items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl ${
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

          {activeView === 'chat' || !environment ? (
            <>
              <ChatHeader
                company={companyName}
                connected={connected}
                onNewConversation={resetConversation}
                onOpenTechnicalPanel={() => setTechnicalPanelOpen(true)}
              />
              <div className="flex min-h-0 flex-1">
                {booting ? (
                  <div className="grid flex-1 place-items-center bg-[#ebe8e1] text-sm text-slate-500">
                    Cargando entorno…
                  </div>
                ) : (
                  <ChatPanel
                    loading={busyAction === 'query'}
                    messages={messages}
                    onFeedback={setFeedback}
                    onSubmit={submitQuestion}
                    unavailableMessage={
                      environment ? undefined : catalogError ?? undefined
                    }
                  />
                )}
                <TechnicalPanel
                  onClose={() => setTechnicalPanelOpen(false)}
                  open={technicalPanelOpen}
                  query={lastQuery}
                  sources={sources}
                />
              </div>
            </>
          ) : (
            <WorkspaceView
              busyAction={busyAction}
              company={environment.company_name}
              companySettings={environment.company_settings}
              documents={documents}
              extensions={environment.supported_upload_extensions}
              globalSettings={globalSettings}
              indexStatus={indexStatus}
              modelTest={modelTest}
              onDelete={deleteDocument}
              onPublicAccessChange={savePublicAccess}
              onSaveEmbeddings={saveEmbeddings}
              onSaveModel={saveModel}
              onSync={syncIndexes}
              onTestModel={testModel}
              onUpload={uploadDocuments}
              superadmin={environment.platform_role === 'superadmin'}
              syncResults={syncResults}
              view={activeView}
            />
          )}
        </main>
      </div>

      {authenticatedError && (
        <div className="fixed inset-0 z-[85] grid place-items-center bg-[#02060d]/90 p-4">
          <section
            className="w-full max-w-lg rounded-2xl border border-rose-300/25 bg-[#2b1520] p-6 shadow-2xl"
            role="alert"
          >
            <h2 className="text-xl font-bold">No fue posible abrir tu entorno</h2>
            <p className="mt-3 text-sm leading-6 text-rose-100">
              {authenticatedError}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                className="primary-button flex-1"
                onClick={() => setAuthRevision((value) => value + 1)}
                type="button"
              >
                Reintentar
              </button>
              <button
                className="secondary-button flex-1"
                onClick={() => void logout()}
                type="button"
              >
                Cerrar sesión
              </button>
            </div>
          </section>
        </div>
      )}

      {sessionExpired && (
        <div className="fixed inset-x-4 bottom-4 z-[90] mx-auto flex max-w-xl items-center justify-between gap-3 rounded-xl border border-amber-300/30 bg-[#2b2415] px-4 py-3 text-sm text-amber-100 shadow-2xl">
          <span>Tu sesión venció. Inicia sesión nuevamente para volver al área administrativa.</span>
          <button
            className="secondary-button shrink-0"
            onClick={() => setSessionExpired(false)}
            type="button"
          >
            Entendido
          </button>
        </div>
      )}

      {registrationRequired && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#02060d]/85 p-4">
          <form
            className="w-full max-w-lg rounded-2xl border border-cyan-300/20 bg-[#0a1727] p-6 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault()
              void completeRegistration()
            }}
          >
            <h2 className="text-xl font-bold">Registra tu empresa gratis</h2>
            <label className="field-label" htmlFor="registration-name">
              Nombre de la empresa
            </label>
            <input
              className="text-input w-full"
              id="registration-name"
              maxLength={200}
              onChange={(event) => setRegistrationName(event.target.value)}
              required
              value={registrationName}
            />
            <label className="mt-5 flex items-start gap-3 text-sm text-slate-200">
              <input
                checked={registrationPublic}
                className="mt-1"
                onChange={(event) => setRegistrationPublic(event.target.checked)}
                type="checkbox"
              />
              <span>
                Habilitar acceso público. Los visitantes podrán seleccionar la
                empresa y consultar documentos públicos; los privados seguirán
                protegidos. Podrás cambiarlo posteriormente.
              </span>
            </label>
            <button
              className="primary-button mt-6 w-full"
              disabled={busyAction !== null}
              type="submit"
            >
              {busyAction === 'register-company' ? 'Creando…' : 'Crear empresa'}
            </button>
            <button
              className="secondary-button mt-3 w-full"
              onClick={() => void logout()}
              type="button"
            >
              Cancelar y cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default App
