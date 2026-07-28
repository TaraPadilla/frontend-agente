import {
  Bot,
  FilePlus2,
  FileText,
  Globe2,
  LockKeyhole,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type {
  DocumentItem,
  IndexStatus,
  ModelTestResponse,
  Profile,
  Settings,
  Visibility,
} from '../types/api'

interface WorkspaceViewProps {
  view: 'files' | 'settings'
  company: string
  profile: Profile
  settings: Settings | null
  onProfileChange: (profile: Profile) => void
  documents: Record<Visibility, DocumentItem[]>
  indexStatus: Record<Visibility, IndexStatus | null>
  busyAction: string | null
  modelTest: ModelTestResponse | null
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

interface LibraryProps {
  visibility: Visibility
  documents: DocumentItem[]
  status: IndexStatus | null
  extensions: string[]
  busyAction: string | null
  onUpload: (visibility: Visibility, files: File[]) => Promise<void>
  onDelete: (visibility: Visibility, name: string) => Promise<void>
  onSync: (visibility: Visibility) => Promise<void>
}

function Library({
  visibility,
  documents,
  status,
  extensions,
  busyAction,
  onUpload,
  onDelete,
  onSync,
}: LibraryProps) {
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const isBusy = busyAction !== null

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-h-0 overflow-hidden rounded-xl border border-slate-700/60 bg-[#0a1727]">
        <header className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              Biblioteca {visibility}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {documents.length} documento{documents.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            className="header-action"
            disabled={isBusy}
            onClick={() => void onSync(visibility)}
            type="button"
          >
            <RefreshCw
              className={`size-4 ${
                busyAction === `sync-${visibility}` ? 'animate-spin' : ''
              }`}
            />
            Sincronizar
          </button>
        </header>

        <div className="max-h-[calc(100vh-230px)] overflow-y-auto p-4">
          {documents.length === 0 ? (
            <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-slate-600/60 text-sm text-slate-500">
              No hay documentos cargados.
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((document) => (
                <article
                  className="flex items-center gap-3 rounded-xl border border-slate-700/55 bg-[#101f32] p-3"
                  key={document.name}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-semibold text-slate-100"
                      title={document.name}
                    >
                      {document.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {formatBytes(document.size_bytes)}
                    </p>
                  </div>
                  <button
                    aria-label={`Eliminar ${document.name}`}
                    className="icon-button hover:text-rose-300"
                    disabled={isBusy}
                    onClick={() => void onDelete(visibility, document.name)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="metric-card">
            <strong>{documents.length}</strong>
            <span>Documentos</span>
          </div>
          <div className="metric-card">
            <strong>{status?.fragment_count ?? 0}</strong>
            <span>Fragmentos</span>
          </div>
        </div>
        <p className="rounded-xl border border-slate-700/60 bg-[#0a1727] p-4 text-xs leading-5 text-slate-400">
          Última indexación completa:
          <strong className="mt-1 block text-slate-200">
            {formatDate(status?.last_complete_indexing)}
          </strong>
        </p>

        <div className="rounded-xl border border-slate-700/60 bg-[#0a1727] p-4">
          <p className="text-xs font-bold text-white">
            Agregar documentos a {visibility}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            Formatos: {extensions.join(', ')}.
          </p>
          <input
            accept={extensions.join(',')}
            className="hidden"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            ref={inputRef}
            type="file"
          />
          <button
            className="mt-3 flex min-h-24 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-[#07111f] px-3 text-xs text-slate-300 hover:border-cyan-300/40"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <FilePlus2 className="size-5 text-cyan-200" />
            {files.length
              ? `${files.length} archivo${files.length === 1 ? '' : 's'} seleccionado${files.length === 1 ? '' : 's'}`
              : 'Seleccionar archivos'}
          </button>
          <button
            className="primary-button mt-3 w-full"
            disabled={!files.length || isBusy}
            onClick={async () => {
              await onUpload(visibility, files)
              setFiles([])
              if (inputRef.current) inputRef.current.value = ''
            }}
            type="button"
          >
            {busyAction === `upload-${visibility}` ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </aside>
    </div>
  )
}

function SettingsWorkspace({
  company,
  profile,
  settings,
  onProfileChange,
  busyAction,
  modelTest,
  onSaveModel,
  onTestModel,
}: Pick<
  WorkspaceViewProps,
  | 'company'
  | 'profile'
  | 'settings'
  | 'onProfileChange'
  | 'busyAction'
  | 'modelTest'
  | 'onSaveModel'
  | 'onTestModel'
>) {
  const [model, setModel] = useState('')

  useEffect(() => {
    setModel(settings?.llm_model ?? '')
  }, [settings?.llm_model])

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-700/60 bg-[#0a1727] p-5">
        <h3 className="text-sm font-bold text-white">Configuración general</h3>
        <p className="mt-1 text-xs text-slate-400">
          Parámetros operativos disponibles en la API actual.
        </p>

        <label className="field-label" htmlFor="settings-company">
          Empresa
        </label>
        <input
          className="text-input w-full text-slate-400"
          disabled
          id="settings-company"
          value={company}
        />

        <label className="field-label" htmlFor="knowledge-profile">
          Conocimiento documental
        </label>
        <div className="flex h-[52px] items-center gap-3 rounded-xl border border-slate-600/80 bg-[#07111f] px-3">
          {profile === 'public' ? (
            <Globe2 className="size-4 shrink-0 text-cyan-300" />
          ) : (
            <LockKeyhole className="size-4 shrink-0 text-cyan-300" />
          )}
          <select
            aria-label="Perfil documental"
            className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-semibold text-white outline-none"
            id="knowledge-profile"
            onChange={(event) =>
              onProfileChange(event.target.value as Profile)
            }
            value={profile}
          >
            <option className="bg-[#15263a]" value="public">
              Público
            </option>
            <option className="bg-[#15263a]" value="internal">
              Privado
            </option>
          </select>
        </div>

        <label className="field-label" htmlFor="llm-model">
          Modelo LLM
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
          <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            La configuración cambió. Sincroniza los índices antes de consultar.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-700/60 bg-[#0a1727] p-5">
        <h3 className="text-sm font-bold text-white">Diagnóstico del modelo</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Comprueba el modelo configurado sin ejecutar el pipeline RAG.
        </p>
        <button
          className="secondary-button mt-5 w-full"
          disabled={busyAction !== null}
          onClick={() => void onTestModel()}
          type="button"
        >
          <Bot className="size-4" />
          {busyAction === 'test-model' ? 'Probando…' : 'Probar modelo'}
        </button>
        {modelTest && (
          <div
            className={`mt-4 rounded-xl border p-4 text-xs leading-5 ${
              modelTest.success
                ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
                : 'border-rose-300/30 bg-rose-300/10 text-rose-100'
            }`}
          >
            <strong>
              {modelTest.success ? 'Modelo disponible' : 'Prueba fallida'}
            </strong>
            <p className="mt-1">{modelTest.response}</p>
          </div>
        )}
      </section>
    </div>
  )
}

export function WorkspaceView(props: WorkspaceViewProps) {
  const [visibility, setVisibility] = useState<Visibility>('Public')

  return (
    <section className="flex min-h-0 flex-1 flex-col p-4 pt-20 sm:p-6 lg:pt-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-700/60 pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
            {props.view === 'files' ? 'Base de conocimiento' : 'Configuración'}
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">
            {props.view === 'files'
              ? 'Gestión documental'
              : 'Ajustes del agente'}
          </h2>
        </div>

        {props.view === 'files' && (
          <div className="flex rounded-xl border border-slate-700/60 bg-[#0a1727] p-1">
            {(['Public', 'Private'] as Visibility[]).map((item) => {
              const Icon = item === 'Public' ? Globe2 : LockKeyhole
              return (
                <button
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    visibility === item
                      ? 'bg-cyan-300/15 text-cyan-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  key={item}
                  onClick={() => setVisibility(item)}
                  type="button"
                >
                  <Icon className="size-4" />
                  {item === 'Public' ? 'Públicos' : 'Privados'}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {props.view === 'files' ? (
        <Library
          busyAction={props.busyAction}
          documents={props.documents[visibility]}
          extensions={props.settings?.supported_upload_extensions ?? []}
          onDelete={props.onDelete}
          onSync={props.onSync}
          onUpload={props.onUpload}
          status={props.indexStatus[visibility]}
          visibility={visibility}
        />
      ) : (
        <SettingsWorkspace {...props} />
      )}
    </section>
  )
}
