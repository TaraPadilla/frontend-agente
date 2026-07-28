import {
  Bot,
  Building2,
  ChevronDown,
  FilePlus2,
  FileText,
  Globe2,
  HelpCircle,
  LockKeyhole,
  Menu,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type {
  DocumentItem,
  IndexStatus,
  ModelTestResponse,
  Profile,
  Settings as ApiSettings,
  Visibility,
} from '../types/api'

type Tab = 'general' | 'Public' | 'Private'

interface SidebarProps {
  open: boolean
  companies: string[]
  company: string
  profile: Profile
  settings: ApiSettings | null
  documents: Record<Visibility, DocumentItem[]>
  indexStatus: Record<Visibility, IndexStatus | null>
  busyAction: string | null
  modelTest: ModelTestResponse | null
  onClose: () => void
  onCompanyChange: (company: string) => void
  onProfileChange: (profile: Profile) => void
  onSaveModel: (model: string) => Promise<void>
  onTestModel: () => Promise<void>
  onUpload: (visibility: Visibility, files: File[]) => Promise<void>
  onDelete: (visibility: Visibility, name: string) => Promise<void>
  onSync: (visibility: Visibility) => Promise<void>
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 ** 2).toFixed(1)} MB`
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Sin indexación registrada'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

interface DocumentLibraryProps {
  visibility: Visibility
  documents: DocumentItem[]
  status: IndexStatus | null
  extensions: string[]
  busyAction: string | null
  onUpload: (visibility: Visibility, files: File[]) => Promise<void>
  onDelete: (visibility: Visibility, name: string) => Promise<void>
  onSync: (visibility: Visibility) => Promise<void>
}

function DocumentLibrary({
  visibility,
  documents,
  status,
  extensions,
  busyAction,
  onUpload,
  onDelete,
  onSync,
}: DocumentLibraryProps) {
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const isBusy = busyAction !== null
  const inputAccept = extensions.join(',')

  return (
    <div className="px-5 pb-7 pt-5">
      <p className="section-label">Documentos {visibility}</p>
      <p className="mt-2 text-sm leading-6 text-[#96a9c5]">
        {visibility === 'Public'
          ? 'Documentación versionable y apta para demostraciones.'
          : 'Documentación reservada para el perfil interno.'}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="metric-card">
          <strong>{documents.length}</strong>
          <span>Documentos</span>
        </div>
        <div className="metric-card">
          <strong>{status?.fragment_count ?? 0}</strong>
          <span>Fragmentos</span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#8ea2bf]">
        Última indexación completa: {formatDate(status?.last_complete_indexing)}
      </p>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-600/70">
        <button
          className="flex w-full items-center gap-2 border-b border-slate-600/60 px-4 py-3 text-left text-sm font-semibold text-slate-100"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <ChevronDown className="size-4" />
          <FilePlus2 className="size-4" />
          Agregar documentos a {visibility}
        </button>
        <div className="p-4">
          <p className="text-sm leading-6 text-[#9babc3]">
            Formatos disponibles: {extensions.join(', ')}.
          </p>
          <input
            accept={inputAccept}
            className="hidden"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            ref={inputRef}
            type="file"
          />
          <button
            className="mt-3 flex min-h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-[#050b17] px-3 text-sm text-[#9eb4ce] hover:border-cyan-300/40"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <FilePlus2 className="size-5" />
            {files.length
              ? `${files.length} archivo${files.length === 1 ? '' : 's'} seleccionado${files.length === 1 ? '' : 's'}`
              : 'Seleccionar archivos'}
          </button>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((file) => (
                <div
                  className="flex items-center justify-between gap-2 rounded-lg bg-[#0d1830] px-3 py-2 text-xs"
                  key={`${file.name}-${file.size}`}
                >
                  <span className="truncate text-slate-200">{file.name}</span>
                  <span className="shrink-0 text-slate-400">{formatBytes(file.size)}</span>
                </div>
              ))}
            </div>
          )}
          <button
            className="secondary-button mt-4 w-full"
            disabled={!files.length || isBusy}
            onClick={async () => {
              await onUpload(visibility, files)
              setFiles([])
              if (inputRef.current) inputRef.current.value = ''
            }}
            type="button"
          >
            {busyAction === `upload-${visibility}` ? 'Guardando…' : `Guardar en ${visibility}`}
          </button>
        </div>
      </div>

      <button
        className="primary-button mt-4 w-full"
        disabled={isBusy}
        onClick={() => void onSync(visibility)}
        type="button"
      >
        <RefreshCw
          className={`size-4 ${busyAction === `sync-${visibility}` ? 'animate-spin' : ''}`}
        />
        {busyAction === `sync-${visibility}` ? 'Sincronizando…' : 'Sincronizar índices'}
      </button>

      <div className="mt-5">
        <p className="section-label">Biblioteca actual</p>
        {documents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No hay documentos cargados.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {documents.map((document) => (
              <div
                className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-[#091329] p-3"
                key={document.name}
              >
                <FileText className="size-4 shrink-0 text-cyan-200" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-100" title={document.name}>
                    {document.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatBytes(document.size_bytes)}
                  </p>
                </div>
                <button
                  aria-label={`Eliminar ${document.name}`}
                  className="icon-button shrink-0 hover:text-rose-300"
                  disabled={isBusy}
                  onClick={() => void onDelete(visibility, document.name)}
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar({
  open,
  companies,
  company,
  profile,
  settings,
  documents,
  indexStatus,
  busyAction,
  modelTest,
  onClose,
  onCompanyChange,
  onProfileChange,
  onSaveModel,
  onTestModel,
  onUpload,
  onDelete,
  onSync,
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>('general')
  const [model, setModel] = useState('')

  useEffect(() => {
    setModel(settings?.llm_model ?? '')
  }, [settings?.llm_model])

  const tabItems: Array<{ value: Tab; label: string; icon: typeof Settings }> = [
    { value: 'general', label: 'General', icon: Settings },
    { value: 'Public', label: 'Public', icon: Globe2 },
    { value: 'Private', label: 'Private', icon: LockKeyhole },
  ]

  return (
    <>
      <button
        aria-label="Abrir configuración"
        className="fixed left-4 top-4 z-30 grid size-11 place-items-center rounded-xl border border-cyan-300/20 bg-[#0b152c] text-cyan-200 shadow-xl lg:hidden"
        onClick={onClose}
        type="button"
      >
        <Menu className="size-5" />
      </button>
      {open && (
        <button
          aria-label="Cerrar configuración"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-40 flex w-[330px] max-w-[88vw] flex-col border-r border-cyan-300/10 bg-[#0b152d] transition-transform lg:static lg:z-auto lg:w-[340px] lg:max-w-none lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 pb-5 pt-6">
          <div className="brand-orb">A</div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold text-white">Agente de Conocimiento</h1>
            <p className="mt-1 text-[11px] font-bold tracking-[0.14em] text-cyan-300">
              Chatbot Empresarial IA
            </p>
          </div>
          <button
            aria-label="Cerrar configuración"
            className="icon-button lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="grid grid-cols-3 border-b border-slate-700/60 px-4" aria-label="Configuración">
          {tabItems.map((item) => {
            const Icon = item.icon
            const active = tab === item.value
            return (
              <button
                className={`flex items-center justify-center gap-1.5 border-b-2 px-1 py-3 text-sm font-semibold transition ${
                  active
                    ? 'border-cyan-300 text-cyan-300'
                    : 'border-transparent text-slate-200 hover:text-cyan-200'
                }`}
                key={item.value}
                onClick={() => setTab(item.value)}
                type="button"
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-scroll flex-1 overflow-y-auto">
          {tab === 'general' ? (
            <div className="px-5 pb-7 pt-5">
              <p className="section-label">Contexto del chat</p>
              <label className="field-label" htmlFor="company">
                Empresa
              </label>
              <div className="select-wrap">
                <Building2 className="size-4" />
                <select
                  id="company"
                  onChange={(event) => onCompanyChange(event.target.value)}
                  value={company}
                >
                  {companies.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="size-4" />
              </div>

              <label className="field-label flex items-center justify-between" htmlFor="profile">
                <span>Acceso del agente</span>
                <HelpCircle className="size-4 text-slate-400" />
              </label>
              <div className="select-wrap">
                <Bot className="size-4" />
                <select
                  id="profile"
                  onChange={(event) => onProfileChange(event.target.value as Profile)}
                  value={profile}
                >
                  <option value="public">Public</option>
                  <option value="internal">Internal</option>
                </select>
                <ChevronDown className="size-4" />
              </div>

              <p className="section-label mt-7">Configuración LLM</p>
              <label className="field-label flex items-center justify-between" htmlFor="llm-model">
                <span>LLM_MODEL</span>
                <HelpCircle className="size-4 text-slate-400" />
              </label>
              <div className="flex gap-2">
                <input
                  className="text-input min-w-0 flex-1"
                  id="llm-model"
                  maxLength={160}
                  onChange={(event) => setModel(event.target.value)}
                  value={model}
                />
                <button
                  aria-label="Guardar modelo"
                  className="grid size-[52px] shrink-0 place-items-center rounded-xl border border-slate-600/80 bg-[#0c1730] text-cyan-200 hover:border-cyan-300/40 disabled:opacity-40"
                  disabled={!model.trim() || busyAction !== null}
                  onClick={() => void onSaveModel(model.trim())}
                  type="button"
                >
                  <Save className="size-5" />
                </button>
              </div>
              {settings?.reindex_pending && (
                <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
                  La configuración cambió. Sincroniza los índices antes de consultar.
                </div>
              )}
              <button
                className="secondary-button mt-4 w-full"
                disabled={busyAction !== null}
                onClick={() => void onTestModel()}
                type="button"
              >
                <Bot className="size-4" />
                {busyAction === 'test-model' ? 'Probando…' : 'Probar modelo'}
              </button>
              {modelTest && (
                <div
                  className={`mt-3 rounded-xl border p-3 text-xs leading-5 ${
                    modelTest.success
                      ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
                      : 'border-rose-300/30 bg-rose-300/10 text-rose-100'
                  }`}
                >
                  <strong>{modelTest.success ? 'Modelo disponible' : 'Prueba fallida'}</strong>
                  <p className="mt-1">{modelTest.response}</p>
                </div>
              )}
            </div>
          ) : (
            <DocumentLibrary
              busyAction={busyAction}
              documents={documents[tab]}
              extensions={settings?.supported_upload_extensions ?? []}
              onDelete={onDelete}
              onSync={onSync}
              onUpload={onUpload}
              status={indexStatus[tab]}
              visibility={tab}
            />
          )}
        </div>
      </aside>
    </>
  )
}
