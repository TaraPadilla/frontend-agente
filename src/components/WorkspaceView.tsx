import {
  Bot,
  FilePlus2,
  FileText,
  Globe2,
  LockKeyhole,
  RefreshCw,
  Save,
  TriangleAlert,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ConfirmationOptions } from '../hooks/useConfirmationDialog'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import type {
  DocumentItem,
  CompanySettings,
  GlobalSettings,
  IndexStatus,
  ModelTestResponse,
  SyncResult,
  Visibility,
} from '../types/api'
import { ConfirmationDialog } from './ConfirmationDialog'

interface WorkspaceViewProps {
  view: 'files' | 'settings'
  company: string
  companySettings: CompanySettings
  globalSettings: GlobalSettings | null
  extensions: string[]
  superadmin: boolean
  onPublicAccessChange: (enabled: boolean) => Promise<void>
  documents: Record<Visibility, DocumentItem[]>
  indexStatus: Record<Visibility, IndexStatus | null>
  busyAction: string | null
  modelTest: ModelTestResponse | null
  syncResults: Record<Visibility, SyncResult[] | null>
  onSaveModel: (model: string) => Promise<void>
  onSaveEmbeddings: (model: string, dimensions: number) => Promise<void>
  onTestModel: () => Promise<void>
  onUpload: (visibility: Visibility, files: File[]) => Promise<boolean>
  onDelete: (visibility: Visibility, name: string) => Promise<boolean>
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
  reindexPending: boolean
  syncResults: SyncResult[] | null
  onUpload: (visibility: Visibility, files: File[]) => Promise<boolean>
  onDelete: (visibility: Visibility, name: string) => Promise<boolean>
  onSync: (visibility: Visibility) => Promise<void>
  requestConfirmation: (
    options: ConfirmationOptions,
  ) => Promise<boolean>
}

function Library({
  visibility,
  documents,
  status,
  extensions,
  busyAction,
  reindexPending,
  syncResults,
  onUpload,
  onDelete,
  onSync,
  requestConfirmation,
}: LibraryProps) {
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const isBusy = busyAction !== null

  async function confirmSync() {
    const confirmed = await requestConfirmation({
      title: 'Sincronizar biblioteca',
      description: `Se actualizará la biblioteca ${visibility} y su índice de conocimiento con los documentos disponibles.`,
      confirmLabel: 'Sincronizar',
    })
    if (confirmed) await onSync(visibility)
  }

  async function confirmDelete(name: string) {
    const confirmed = await requestConfirmation({
      title: 'Eliminar documento',
      description: `Se eliminará “${name}” de la biblioteca ${visibility}. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar documento',
      tone: 'danger',
    })
    if (confirmed) await onDelete(visibility, name)
  }

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      {status?.sync_pending && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-300/50 bg-amber-300/15 p-4 text-amber-50 shadow-lg shadow-amber-950/20 sm:flex-row sm:items-center sm:justify-between xl:col-span-2"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-300" />
            <div>
              <strong className="block text-sm">Sincronización pendiente</strong>
              <p className="mt-1 text-xs leading-5 text-amber-100/85">
                La biblioteca {visibility} cambió. Sincronízala para que el
                agente utilice la versión actual de sus documentos.
              </p>
            </div>
          </div>
          <button
            className="secondary-button shrink-0 border-amber-200/40 text-amber-50"
            disabled={isBusy}
            onClick={() => void confirmSync()}
            type="button"
          >
            <RefreshCw
              className={`size-4 ${
                busyAction === `sync-${visibility}` ? 'animate-spin' : ''
              }`}
            />
            Sincronizar ahora
          </button>
        </div>
      )}

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
            onClick={() => void confirmSync()}
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
                    onClick={() => void confirmDelete(document.name)}
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

        {reindexPending && (
          <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-xs leading-5 text-amber-100">
            Los embeddings cambiaron. Esta empresa requiere una reconstrucción
            completa de sus índices.
          </div>
        )}

        {syncResults && (
          <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-xs text-emerald-100">
            <strong>Última sincronización</strong>
            {syncResults.map((result) => (
              <p className="mt-2 leading-5" key={result.profile}>
                {result.profile}: {result.new} nuevos, {result.updated}{' '}
                actualizados, {result.deleted} eliminados y {result.unchanged}{' '}
                sin cambios.
              </p>
            ))}
          </div>
        )}

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
              const saved = await onUpload(visibility, files)
              if (saved) {
                setFiles([])
                if (inputRef.current) inputRef.current.value = ''
              }
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
  companySettings,
  globalSettings,
  superadmin,
  onPublicAccessChange,
  busyAction,
  modelTest,
  onSaveModel,
  onSaveEmbeddings,
  onTestModel,
  requestConfirmation,
}: Pick<
  WorkspaceViewProps,
  | 'company'
  | 'companySettings'
  | 'globalSettings'
  | 'superadmin'
  | 'onPublicAccessChange'
  | 'busyAction'
  | 'modelTest'
  | 'onSaveModel'
  | 'onSaveEmbeddings'
  | 'onTestModel'
> & {
  requestConfirmation: (
    options: ConfirmationOptions,
  ) => Promise<boolean>
}) {
  const [llmModel, setLlmModel] = useState('')
  const [embeddingModel, setEmbeddingModel] = useState('')
  const [embeddingDimensions, setEmbeddingDimensions] = useState(0)

  useEffect(() => {
    setLlmModel(globalSettings?.llm_model ?? '')
    setEmbeddingModel(globalSettings?.embedding_model ?? '')
    setEmbeddingDimensions(globalSettings?.embedding_dimensions ?? 0)
  }, [globalSettings])

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-700/60 bg-[#0a1727] p-5">
        <h3 className="text-sm font-bold text-white">Configuración empresarial</h3>
        <p className="mt-1 text-xs text-slate-400">
          Estos ajustes afectan únicamente a {company}.
        </p>

        <label className="mt-6 flex items-start gap-3 rounded-xl border border-slate-600/70 bg-[#07111f] p-4 text-sm text-slate-200">
          <input
            checked={companySettings.public_access_enabled}
            className="mt-1"
            disabled={busyAction !== null}
            onChange={(event) =>
              void onPublicAccessChange(event.target.checked)
            }
            type="checkbox"
          />
          <span>
            <strong className="block text-white">Acceso público</strong>
            <span className="mt-1 block text-xs leading-5 text-slate-400">
              Al deshabilitarlo, la empresa desaparece del selector público. El
              administrador conserva el acceso autenticado y los documentos
              privados permanecen protegidos.
            </span>
          </span>
        </label>

        {companySettings.reindex_pending && (
          <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            Esta empresa requiere reindexación porque cambió la configuración
            global de embeddings.
          </div>
        )}
      </section>

      {superadmin && globalSettings && (
        <section className="rounded-xl border border-cyan-300/20 bg-[#0a1727] p-5">
          <h3 className="text-sm font-bold text-white">
            Configuración global de plataforma
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Disponible únicamente para superadmin y aplicable a todas las
            empresas.
          </p>

          <label className="field-label" htmlFor="llm-model">
            Modelo LLM
          </label>
          <div className="flex gap-2">
            <input
              className="text-input min-w-0 flex-1"
              id="llm-model"
              maxLength={200}
              onChange={(event) => setLlmModel(event.target.value)}
              value={llmModel}
            />
            <button
              aria-label="Guardar modelo LLM"
              className="grid size-[52px] shrink-0 place-items-center rounded-xl border border-slate-600/80 bg-[#0c1730] text-cyan-200 hover:border-cyan-300/40 disabled:opacity-40"
              disabled={!llmModel.trim() || busyAction !== null}
              onClick={() => void onSaveModel(llmModel.trim())}
              type="button"
            >
              <Save className="size-5" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Cambiar el LLM no requiere reindexación.
          </p>

          <label className="field-label" htmlFor="embedding-model">
            Modelo de embeddings
          </label>
          <input
            className="text-input w-full"
            id="embedding-model"
            maxLength={200}
            onChange={(event) => setEmbeddingModel(event.target.value)}
            value={embeddingModel}
          />
          <label className="field-label" htmlFor="embedding-dimensions">
            Dimensiones
          </label>
          <input
            className="text-input w-full"
            id="embedding-dimensions"
            min={1}
            onChange={(event) =>
              setEmbeddingDimensions(Number(event.target.value))
            }
            type="number"
            value={embeddingDimensions}
          />
          <button
            className="primary-button mt-4 w-full"
            disabled={
              !embeddingModel.trim() ||
              embeddingDimensions < 1 ||
              busyAction !== null
            }
            onClick={() =>
              void (async () => {
                const confirmed = await requestConfirmation({
                  title: 'Actualizar embeddings',
                  description:
                    'Cambiar el modelo o sus dimensiones marcará todas las empresas para reindexación.',
                  confirmLabel: 'Actualizar embeddings',
                  tone: 'warning',
                })
                if (confirmed) {
                  await onSaveEmbeddings(
                    embeddingModel.trim(),
                    embeddingDimensions,
                  )
                }
              })()
            }
            type="button"
          >
            {busyAction === 'save-embeddings'
              ? 'Actualizando…'
              : 'Actualizar embeddings'}
          </button>
        </section>
      )}

      {superadmin && (
        <section className="rounded-xl border border-slate-700/60 bg-[#0a1727] p-5">
          <h3 className="text-sm font-bold text-white">Diagnóstico del modelo</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Comprueba el LLM configurado sin ejecutar el pipeline RAG.
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
      )}
    </div>
  )
}

export function WorkspaceView(props: WorkspaceViewProps) {
  const [visibility, setVisibility] = useState<Visibility>('Public')
  const confirmation = useConfirmationDialog()

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
          extensions={props.extensions}
          onDelete={props.onDelete}
          onSync={props.onSync}
          onUpload={props.onUpload}
          requestConfirmation={confirmation.requestConfirmation}
          reindexPending={props.companySettings.reindex_pending}
          status={props.indexStatus[visibility]}
          syncResults={props.syncResults[visibility]}
          visibility={visibility}
        />
      ) : (
        <SettingsWorkspace
          {...props}
          requestConfirmation={confirmation.requestConfirmation}
        />
      )}

      {confirmation.options && (
        <ConfirmationDialog
          {...confirmation.options}
          onCancel={confirmation.cancelConfirmation}
          onConfirm={confirmation.confirm}
        />
      )}
    </section>
  )
}
